"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { ChatSessionMeta } from "@/lib/chatSessions";

interface Props {
  sessions: ChatSessionMeta[];
  currentSessionId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function formatWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
}: Props) {
  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-gray-200 dark:border-soil-700 bg-white dark:bg-soil-800 transition-colors">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-soil-700">
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Chat
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare
              size={24}
              className="mx-auto text-gray-300 dark:text-soil-500 mb-2"
              strokeWidth={1.5}
            />
            <p className="text-xs text-gray-400 dark:text-soil-400">
              No conversations yet
            </p>
            <p className="text-[11px] text-gray-300 dark:text-soil-500 mt-0.5">
              Your chats will appear here
            </p>
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary-100 dark:bg-soil-700"
                    : "hover:bg-gray-50 dark:hover:bg-soil-700/60"
                }`}
                onClick={() => onSelect(s.id)}
              >
                <MessageSquare
                  size={14}
                  className={
                    isActive
                      ? "text-primary-700 dark:text-primary-300 shrink-0"
                      : "text-gray-400 dark:text-soil-400 shrink-0"
                  }
                  strokeWidth={2}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      isActive
                        ? "font-semibold text-primary-800 dark:text-soil-100"
                        : "text-gray-700 dark:text-soil-200"
                    }`}
                    title={s.title}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-soil-400">
                    {formatWhen(s.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${s.title}"?`)) onDelete(s.id);
                  }}
                  className="shrink-0 p-1.5 rounded text-gray-400 dark:text-soil-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-soil-700 space-y-2">
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete all ${sessions.length} conversations? This cannot be undone.`)) {
                onClearAll();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} />
            Clear All History
          </button>
        )}
        <p className="text-[10px] text-gray-400 dark:text-soil-400 text-center">
          History stored locally on this device
        </p>
      </div>
    </aside>
  );
}
