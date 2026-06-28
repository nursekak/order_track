import { useState } from "react";
import { Trash2, Loader2, ChevronDown, Lock } from "lucide-react";
import { updateTicket, deleteTicket } from "../api";
import type { Status, Ticket } from "../types";
import { STATUS_LABELS } from "../types";
import { StatusBadge, PriorityBadge } from "./StatusBadge";

interface Props {
  ticket: Ticket;
  isAdmin: boolean;
  onUpdated: (ticket: Ticket) => void;
  onDeleted: (id: number) => void;
}

const NEXT_STATUSES: Record<Status, Status[]> = {
  new: ["in_progress"],
  in_progress: ["new", "done"],
  done: [],
};

export default function TicketRow({ ticket, isAdmin, onUpdated, onDeleted }: Props) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDone = ticket.status === "done";

  async function handleStatusChange(newStatus: Status) {
    setStatusLoading(true);
    setError(null);
    try {
      const updated = await updateTicket(ticket.id, { status: newStatus });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить заявку "${ticket.title}"?`)) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteTicket(ticket.id);
      onDeleted(ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
      setDeleteLoading(false);
    }
  }

  const formattedDate = new Date(ticket.created_at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors group">
        <td className="px-4 py-3 text-sm text-gray-400 font-mono">#{ticket.id}</td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900 text-sm leading-snug">{ticket.title}</div>
          {ticket.description && (
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-xs">{ticket.description}</div>
          )}
        </td>
        <td className="px-4 py-3">
          {isDone ? (
            <StatusBadge status={ticket.status} />
          ) : (
            <div className="relative inline-block">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                disabled={statusLoading}
                className="appearance-none pl-2 pr-7 py-0.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white
                  border-blue-200 text-blue-700
                  [&[data-status='in_progress']]:border-amber-200 [&[data-status='in_progress']]:text-amber-700"
                style={{
                  backgroundColor:
                    ticket.status === "new" ? "#dbeafe" :
                    ticket.status === "in_progress" ? "#fef3c7" : "#d1fae5",
                  color:
                    ticket.status === "new" ? "#1d4ed8" :
                    ticket.status === "in_progress" ? "#b45309" : "#047857",
                  borderColor:
                    ticket.status === "new" ? "#bfdbfe" :
                    ticket.status === "in_progress" ? "#fde68a" : "#a7f3d0",
                }}
              >
                <option value={ticket.status}>{STATUS_LABELS[ticket.status]}</option>
                {NEXT_STATUSES[ticket.status].map((s) => (
                  <option key={s} value={s}>
                    → {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                {statusLoading ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <ChevronDown size={10} />
                )}
              </div>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={ticket.priority} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formattedDate}</td>
        <td className="px-4 py-3">
          {isAdmin && isDone && (
            <span
              title="Заявки со статусом «Выполнено» нельзя удалить"
              className="inline-flex p-1.5 text-gray-300 cursor-help"
            >
              <Lock size={14} />
            </span>
          )}
          {isAdmin && !isDone && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              title="Удалить заявку"
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="px-4 py-1">
            <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</div>
          </td>
        </tr>
      )}
    </>
  );
}
