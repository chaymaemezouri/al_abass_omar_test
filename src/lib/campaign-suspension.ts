/** Campaign Avatar suspension — cutoff and optional env overrides (Vite build-time). */

const DEFAULT_SUSPENSION_AT = "2026-09-22T22:55:00+01:00";

function readSuspensionAt(): Date {
  const raw = import.meta.env.VITE_CAMPAIGN_SUSPENSION_AT;
  if (typeof raw === "string" && raw.trim().length > 0) {
    const parsed = new Date(raw.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(DEFAULT_SUSPENSION_AT);
}

/** Cutoff instant (Casablanca +01:00 by default). */
export const CAMPAIGN_SUSPENSION_AT = readSuspensionAt();

function isForceSuspended(): boolean {
  const raw = import.meta.env.VITE_CAMPAIGN_SUSPENDED;
  return raw === "true" || raw === "1";
}

export function isCampaignSuspended(now: Date = new Date()): boolean {
  if (isForceSuspended()) return true;
  return now.getTime() >= CAMPAIGN_SUSPENSION_AT.getTime();
}
