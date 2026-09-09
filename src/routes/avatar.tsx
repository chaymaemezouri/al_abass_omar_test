import { createFileRoute } from "@tanstack/react-router";
import { AvatarExperience } from "@/components/avatar/AvatarExperience";
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
  return (
    <LangProvider>
      <AvatarExperience initialQuestion={search.q ?? ""} />
    </LangProvider>
  );
}
