export type Status = "new" | "in_progress" | "done";
export type Priority = "low" | "normal" | "high";
export type SortBy = "created_at" | "priority";
export type SortDir = "asc" | "desc";

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TicketFilters {
  search: string;
  status: Status | "";
  priority: Priority | "";
  sort_by: SortBy;
  sort_dir: SortDir;
  page: number;
  page_size: number;
}

export const STATUS_LABELS: Record<Status, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнено",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Низкий",
  normal: "Нормальный",
  high: "Высокий",
};
