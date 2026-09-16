import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AvatarExperience } from "@/components/avatar/AvatarExperience";
import { trackPageView } from "@/lib/analytics";
import { LangProvider } from "@/lib/i18n";

type AvatarSearch = {
  q?: string;
};

export const Route = createFileRoute("/avatar")({
  validateSearch: (search: Record<string, unknown>): AvatarSearch => {
    const q = search["q"];
    return typeof q === "string" && q.length > 0 ? { q } : {};
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
