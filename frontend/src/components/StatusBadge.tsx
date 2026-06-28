import type { Priority, Status } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../types";

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600 border-gray-200",
  normal: "bg-sky-100 text-sky-700 border-sky-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
