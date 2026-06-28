import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  LogIn,
  LogOut,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  ShieldCheck,
  Inbox,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fetchTickets, clearToken, getStoredToken } from "./api";
import type { PaginatedTickets, Priority, SortBy, SortDir, Status, Ticket, TicketFilters } from "./types";
import { PRIORITY_LABELS, STATUS_LABELS } from "./types";
import LoginModal from "./components/LoginModal";
import CreateTicketModal from "./components/CreateTicketModal";
import TicketRow from "./components/TicketRow";
import Pagination from "./components/Pagination";

const DEFAULT_FILTERS: TicketFilters = {
  search: "",
  status: "",
  priority: "",
  sort_by: "created_at",
  sort_dir: "desc",
  page: 1,
  page_size: 20,
};

function parseSortOption(value: string): Pick<TicketFilters, "sort_by" | "sort_dir"> {
  if (value.endsWith("_asc")) {
    return { sort_by: value.slice(0, -4) as SortBy, sort_dir: "asc" };
  }
  return { sort_by: value.slice(0, -5) as SortBy, sort_dir: "desc" };
}

export default function App() {
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<PaginatedTickets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(Boolean(getStoredToken()));
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const loadTickets = useCallback(async (f: TicketFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTickets(f);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets(filters);
  }, [filters, loadTickets]);

  function setFilter<K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilter("search", value);
    }, 400);
  }

  function toggleSort(by: SortBy) {
    if (filters.sort_by === by) {
      setFilters((prev) => ({ ...prev, sort_dir: prev.sort_dir === "asc" ? "desc" : "asc", page: 1 }));
    } else {
      setFilters((prev) => ({ ...prev, sort_by: by, sort_dir: "desc", page: 1 }));
    }
  }

  function handleTicketUpdated(updated: Ticket) {
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((t) => (t.id === updated.id ? updated : t)) } : prev
    );
  }

  function handleTicketDeleted(id: number) {
    setData((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((t) => t.id !== id);
      const total = prev.total - 1;
      const pages = Math.max(1, Math.ceil(total / prev.page_size));
      const page = Math.min(prev.page, pages);
      return { ...prev, items, total, pages, page };
    });
  }

  function handleTicketCreated() {
    setShowCreate(false);
    loadTickets(filters);
  }

  function handleLoginSuccess() {
    setIsAdmin(true);
    setShowLogin(false);
  }

  function handleLogout() {
    clearToken();
    setIsAdmin(false);
  }

  function SortIcon({ by }: { by: SortBy }) {
    if (filters.sort_by !== by) return <Minus size={12} className="text-gray-300" />;
    return filters.sort_dir === "asc" ? (
      <ChevronUp size={12} className="text-indigo-600" />
    ) : (
      <ChevronDown size={12} className="text-indigo-600" />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Трекер заявок</h1>
              <p className="text-xs text-gray-400 leading-tight hidden sm:block">Система учёта внутренних заявок</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={14} />
                  Администратор
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-full transition-colors font-medium"
              >
                <LogIn size={14} />
                Войти как админ
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Новая заявка</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filters bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-52">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Поиск</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="По заголовку или описанию..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value as Status | "")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Все статусы</option>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Приоритет</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilter("priority", e.target.value as Priority | "")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Все приоритеты</option>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Сортировка</label>
            <select
              value={`${filters.sort_by}_${filters.sort_dir}`}
              onChange={(e) => {
                const { sort_by, sort_dir } = parseSortOption(e.target.value);
                setFilters((prev) => ({ ...prev, sort_by, sort_dir, page: 1 }));
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="created_at_desc">Дата (новые)</option>
              <option value="created_at_asc">Дата (старые)</option>
              <option value="priority_desc">Приоритет (высокий)</option>
              <option value="priority_asc">Приоритет (низкий)</option>
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setSearchInput("");
              setFilters(DEFAULT_FILTERS);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
            title="Сбросить фильтры"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Сбросить</span>
          </button>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700">Заявки</h2>
              {data && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {data.total}
                </span>
              )}
              {loading && <Loader2 size={14} className="text-indigo-500 animate-spin" />}
            </div>
          </div>

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Ошибка загрузки</p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              </div>
              <button
                onClick={() => loadTickets(filters)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !data && (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-4 w-8 bg-gray-100 rounded" />
                  <div className="h-4 flex-1 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 bg-gray-100 rounded-full">
                <Inbox className="text-gray-400" size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Заявок не найдено</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filters.search || filters.status || filters.priority
                    ? "Попробуйте изменить фильтры"
                    : "Создайте первую заявку"}
                </p>
              </div>
              {!filters.search && !filters.status && !filters.priority && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  Создать заявку
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {data && data.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-16">
                      ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Заявка
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-36">
                      Статус
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-32 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => toggleSort("priority")}
                    >
                      <span className="flex items-center gap-1">
                        Приоритет <SortIcon by="priority" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-36 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => toggleSort("created_at")}
                    >
                      <span className="flex items-center gap-1">
                        Создана <SortIcon by="created_at" />
                      </span>
                    </th>
                    <th className="px-4 py-2.5 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      isAdmin={isAdmin}
                      onUpdated={handleTicketUpdated}
                      onDeleted={handleTicketDeleted}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              pageSize={data.page_size}
              onChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
      )}
      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={handleTicketCreated} />
      )}
    </div>
  );
}
