import { isCampaignSuspended } from "@/lib/campaign-suspension";

/** Routes that stay reachable while the public site shows only the suspension page. */
export function isSuspensionBypassPath(pathname: string): boolean {
  if (pathname === "/suspension") return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/admin")) return true;
  return false;
}

export function shouldRedirectToSuspension(pathname: string): boolean {
  return isCampaignSuspended() && !isSuspensionBypassPath(pathname);
}
