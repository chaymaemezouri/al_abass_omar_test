/** Campaign Avatar suspension cutoff — Casablanca local time. */
export const CAMPAIGN_SUSPENSION_AT = new Date("2026-09-22T22:55:00+01:00");

export function isCampaignSuspended(now: Date = new Date()): boolean {
  return now.getTime() >= CAMPAIGN_SUSPENSION_AT.getTime();
}
