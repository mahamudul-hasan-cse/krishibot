"use client";

import { useEffect, useState, useCallback } from "react";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";
import { clearChatSession } from "@/lib/api";
import {
  loadSessions,
  upsertSession,
  deleteSession as removeSession,
  getCurrentSessionId,
  setCurrentSessionId,
  newSessionId,
  deriveTitle,
  type ChatSessionMeta,
} from "@/lib/chatSessions";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);
  const [currentId, setCurrentId] = useState<string>("");

  useEffect(() => {
    const id = getCurrentSessionId();
    setCurrentId(id);
    setSessions(loadSessions());
  }, []);

  const handleSelect = useCallback((id: string) => {
    setCurrentSessionId(id);
    setCurrentId(id);
  }, []);

  const handleNew = useCallback(() => {
    const id = newSessionId();
    setCurrentId(id);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await clearChatSession(id);
      } catch {
        // ignore — backend may not have it
      }
      const remaining = removeSession(id);
      setSessions(remaining);
      if (id === currentId) {
        const nextId = remaining[0]?.id ?? newSessionId();
        setCurrentSessionId(nextId);
        setCurrentId(nextId);
      }
    },
    [currentId],
  );

  const handleFirstUserMessage = useCallback(
    (sessionId: string, text: string) => {
      const updated = upsertSession({
        id: sessionId,
        title: deriveTitle(text),
        updatedAt: Date.now(),
      });
      setSessions(updated);
    },
    [],
  );

  const handleClearAll = useCallback(async () => {
    await Promise.all(
      sessions.map((s) => clearChatSession(s.id).catch(() => {})),
    );
    sessions.forEach((s) => removeSession(s.id));
    setSessions([]);
    const nextId = newSessionId();
    setCurrentId(nextId);
  }, [sessions]);

  const handleActivity = useCallback(
    (sessionId: string) => {
      const existing = sessions.find((s) => s.id === sessionId);
      if (!existing) return;
      const updated = upsertSession({
        id: sessionId,
        title: existing.title,
        updatedAt: Date.now(),
      });
      setSessions(updated);
    },
    [sessions],
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-soil-900 transition-colors">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="shrink-0 bg-white dark:bg-soil-800 border-b border-gray-100 dark:border-soil-700 px-4 sm:px-6 py-3 transition-colors">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-base font-semibold text-gray-900 dark:text-soil-100">
              Agriculture Chat Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-soil-400 mt-0.5">
              Ask anything about crops, diseases, irrigation, fertilizer or pest control — in English or Bangla.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto">
          {currentId && (
            <ChatInterface
              sessionId={currentId}
              onFirstUserMessage={handleFirstUserMessage}
              onActivity={handleActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
}
