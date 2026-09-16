import { getAvatarApiUrl } from "@/lib/avatar-api";

const ADMIN_KEY_STORAGE = "campaign-admin-key";

export function getStoredAdminKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function setStoredAdminKey(key: string) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
}

export function clearStoredAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

export type AdminStats = {
  period_days: number;
  unique_visitors: number;
  avatar_sessions: number;
  questions_asked: number;
  answers_given: number;
  fallback_answers: number;
  pdf_downloads: number;
  page_views: number;
  avatar_page_views: number;
  questions_by_language: Record<string, number>;
  events_by_day: { date: string; count: number }[];
  questions_by_day: { date: string; count: number }[];
};

export type AdminMessage = {
  id: string;
  session_id: string;
  question: string;
  answer: string;
  language: string | null;
  similarity_score: number | null;
  used_fallback: boolean;
  created_at: string;
};

async function adminFetch<T>(path: string, adminKey: string): Promise<T> {
  const res = await fetch(`${getAvatarApiUrl()}/api/v1/admin${path}`, {
    headers: { "X-Admin-Key": adminKey },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`admin_fetch_failed_${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchAdminStats(adminKey: string, days = 7) {
  return adminFetch<AdminStats>(`/stats?days=${days}`, adminKey);
}

export function fetchAdminMessages(adminKey: string, limit = 50, offset = 0) {
  return adminFetch<{ total: number; items: AdminMessage[] }>(
    `/messages?limit=${limit}&offset=${offset}`,
    adminKey,
  );
}
