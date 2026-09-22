import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { AvatarExperience } from "@/components/avatar/AvatarExperience";
import { trackPageView } from "@/lib/analytics";
import { isCampaignSuspended } from "@/lib/campaign-suspension";
import { LangProvider } from "@/lib/i18n";

type AvatarSearch = {
  q?: string;
};

export const Route = createFileRoute("/avatar")({
  validateSearch: (search: Record<string, unknown>): AvatarSearch => {
    const q = search["q"];
    return typeof q === "string" && q.length > 0 ? { q } : {};
  },
  beforeLoad: () => {
    if (isCampaignSuspended()) {
      throw redirect({ to: "/suspension" });
    }
  },
  component: AvatarPage,
});

function AvatarPage() {
  const search = Route.useSearch();

  useEffect(() => {
    trackPageView("/avatar");
  }, []);

  return (
    <LangProvider>
      <AvatarExperience initialQuestion={search.q ?? ""} />
    </LangProvider>
  );
}
