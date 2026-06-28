import type { PaginatedTickets, Priority, Status, Ticket, TicketFilters } from "./types";

const BASE = "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatApiError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return String(item);
      })
      .join("; ");
  }
  return "Неизвестная ошибка";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = formatApiError(body.detail ?? message);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse<{ access_token: string }>(res);
  return data.access_token;
}

export async function fetchTickets(filters: TicketFilters): Promise<PaginatedTickets> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  params.set("sort_by", filters.sort_by);
  params.set("sort_dir", filters.sort_dir);
  params.set("page", String(filters.page));
  params.set("page_size", String(filters.page_size));

  const res = await fetch(`${BASE}/tickets?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<PaginatedTickets>(res);
}

export async function createTicket(data: {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
}): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse<Ticket>(res);
}

export async function updateTicket(
  id: number,
  data: { status?: Status; priority?: Priority; title?: string; description?: string }
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse<Ticket>(res);
}

export async function deleteTicket(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

export function getStoredToken(): string | null {
  return localStorage.getItem("token");
}

export function storeToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export function isAdmin(): boolean {
  return Boolean(getStoredToken());
}
