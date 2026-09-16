import { getAvatarApiUrl } from "@/lib/avatar-api";

export type AnalyticsEvent = "page_view" | "pdf_download";

export function trackEvent(
  event: AnalyticsEvent,
  detail?: { path?: string; source?: string; language?: string },
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    path: detail?.path,
    source: detail?.source,
    language: detail?.language,
  });

  const url = `${getAvatarApiUrl()}/api/v1/events`;

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fallback below */
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackPageView(path: string, language?: string) {
  trackEvent("page_view", { path, language });
}

export function trackPdfDownload(source: string, language?: string) {
  trackEvent("pdf_download", { path: "/", source, language });
}
