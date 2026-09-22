import { createFileRoute } from "@tanstack/react-router";
import { CampaignSuspendedPage } from "@/components/CampaignSuspendedPage";

/**
 * Official suspension notice after campaign end.
 * Activated for /avatar (and chat CTAs) from 2026-09-22 22:55 (+01).
 */
export const Route = createFileRoute("/suspension")({
  component: SuspensionPage,
  head: () => ({
    meta: [
      { title: "تعليق التطبيق — انتهاء الحملة الانتخابية" },
      {
        name: "description",
        content: "إشعار بتعليق الخدمة الرقمية بعد انتهاء الحملة الانتخابية",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SuspensionPage() {
  return <CampaignSuspendedPage />;
}
