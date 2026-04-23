import { v4 as uuidv4 } from "uuid";

const SESSIONS_KEY = "krishibot_sessions";
const CURRENT_KEY = "krishibot_current_session";

export interface ChatSessionMeta {
  id: string;
  title: string;
  updatedAt: number;
}

function safeParse(raw: string | null): ChatSessionMeta[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s.id === "string" && typeof s.title === "string",
    );
  } catch {
    return [];
  }
}

export function loadSessions(): ChatSessionMeta[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(SESSIONS_KEY)).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
}

function saveSessions(sessions: ChatSessionMeta[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function upsertSession(meta: ChatSessionMeta): ChatSessionMeta[] {
  const sessions = loadSessions();
  const existingIdx = sessions.findIndex((s) => s.id === meta.id);
  if (existingIdx >= 0) {
    sessions[existingIdx] = { ...sessions[existingIdx], ...meta };
  } else {
    sessions.push(meta);
  }
  saveSessions(sessions);
  return loadSessions();
}

export function deleteSession(id: string): ChatSessionMeta[] {
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
  return sessions;
}

export function getCurrentSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  const id = localStorage.getItem(CURRENT_KEY);
  if (id) return id;
  const newId = uuidv4();
  localStorage.setItem(CURRENT_KEY, newId);
  return newId;
}

export function setCurrentSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_KEY, id);
}

export function newSessionId(): string {
  const id = uuidv4();
  setCurrentSessionId(id);
  return id;
}

export function deriveTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 40).trimEnd() + "…";
}
