import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clearStoredAdminKey,
  fetchAdminEvents,
  fetchAdminMessages,
  fetchAdminStats,
  type AdminEvent,
  type AdminMessage,
  type AdminStats,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Section = "overview" | "visitors" | "questions" | "downloads" | "journal";

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "visitors", label: "Visiteurs", icon: Users },
  { id: "questions", label: "Questions IA", icon: MessageSquare },
  { id: "downloads", label: "Téléchargements", icon: Download },
  { id: "journal", label: "Journal", icon: Activity },
];

const SOURCE_LABELS: Record<string, string> = {
  "hero-mobile": "Hero mobile",
  "hero-desktop": "Hero desktop",
  footer: "Pied de page",
  unknown: "Inconnu",
};

function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function formatHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHourOfDay(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function fillHourOfDay(data: { hour: number; count: number }[]) {
  const map = new Map(data.map((row) => [row.hour, row.count]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour: formatHourOfDay(hour),
    count: map.get(hour) ?? 0,
  }));
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "morocco" | "navy";
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p
          className={cn(
            "mt-2 text-3xl font-bold tabular-nums",
            accent === "morocco" ? "text-morocco" : "text-navy",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-navy">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MessageRow({ row }: { row: AdminMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="cursor-pointer border-b transition-colors hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="py-3 pr-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </td>
        <td className="py-3 pr-4 whitespace-nowrap text-xs text-slate-500">
          {new Date(row.created_at).toLocaleString("fr-FR")}
        </td>
        <td className="py-3 pr-4 max-w-xs font-medium" dir="auto">
          {row.question}
        </td>
        <td className="py-3 pr-4 max-w-sm text-slate-600" dir="auto">
          {row.answer.slice(0, 120)}
          {row.answer.length > 120 ? "…" : ""}
        </td>
        <td className="py-3 pr-4 text-xs">{row.language ?? "—"}</td>
        <td className="py-3 text-xs tabular-nums">
          {row.similarity_score != null ? row.similarity_score.toFixed(2) : "—"}
        </td>
        <td className="py-3">
          {row.used_fallback ? (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              fallback
            </Badge>
          ) : (
            <Badge variant="secondary">KB</Badge>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b bg-slate-50/80">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Question complète</p>
                <p className="mt-2 text-sm leading-relaxed" dir="auto">
                  {row.question}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Réponse complète</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700" dir="auto">
                  {row.answer}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Session : {row.session_id}</p>
          </td>
        </tr>
      )}
    </>
  );
}

function eventLabel(type: string) {
  if (type === "page_view") return "Visite page";
  if (type === "pdf_download") return "Téléchargement PDF";
  if (type === "avatar_question") return "Question avatar";
  return type;
}

export function AdminDashboard({
  adminKey,
  onLogout,
}: {
  adminKey: string;
  onLogout: () => void;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (key: string, period: number) => {
    setLoading(true);
    setError("");
    try {
      const [statsData, msgData, evtData] = await Promise.all([
        fetchAdminStats(key, period),
        fetchAdminMessages(key, 150, 0),
        fetchAdminEvents(key, 150, 0),
      ]);
      setStats(statsData);
      setMessages(msgData.items);
      setTotalMessages(msgData.total);
      setEvents(evtData.items);
      setTotalEvents(evtData.total);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized") {
        clearStoredAdminKey();
        onLogout();
        setError("Clé admin invalide.");
      } else {
        setError("Impossible de charger les statistiques.");
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void load(adminKey, days);
  }, [adminKey, days, load]);

  const dailyChart = useMemo(
    () =>
      stats?.daily_activity.map((row) => ({
        date: formatDay(row.date),
        Visites: row.page_views,
        Questions: row.questions,
        PDF: row.pdf_downloads,
      })) ?? [],
    [stats],
  );

  const hourlyQuestions = useMemo(
    () =>
      stats?.questions_by_hour.map((row) => ({
        label: formatHour(row.hour),
        count: row.count,
      })) ?? [],
    [stats],
  );

  const hourlyVisits = useMemo(
    () =>
      stats?.page_views_by_hour.map((row) => ({
        label: formatHour(row.hour),
        count: row.count,
      })) ?? [],
    [stats],
  );

  const peakQuestions = useMemo(
    () => fillHourOfDay(stats?.questions_by_hour_of_day ?? []),
    [stats],
  );

  const peakVisits = useMemo(
    () => fillHourOfDay(stats?.page_views_by_hour_of_day ?? []),
    [stats],
  );

  const fallbackRate =
    stats && stats.questions_asked > 0
      ? Math.round((stats.fallback_answers / stats.questions_asked) * 100)
      : 0;

  const sectionTitle = NAV.find((n) => n.id === section)?.label ?? "";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-morocco" />
            <div>
              <p className="text-sm font-bold">Analytics Campagne</p>
              <p className="text-xs text-white/60">Al Abass Omar 2026</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                section === id
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-navy">{sectionTitle}</h1>
              <p className="text-sm text-slate-500">
                Période : {stats?.period_days ?? days} jours
                {loading && " · Actualisation…"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value={1}>Aujourd'hui (24h)</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load(adminKey, days)}
                disabled={loading}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Actualiser
              </Button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  section === id
                    ? "bg-navy text-white"
                    : "bg-slate-200 text-slate-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {stats && section === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Aujourd'hui — questions" value={stats.questions_today} accent="morocco" />
                <StatCard label="Aujourd'hui — visites" value={stats.page_views_today} />
                <StatCard label="Aujourd'hui — PDF" value={stats.pdf_downloads_today} accent="morocco" />
                <StatCard label="Visiteurs uniques" value={stats.unique_visitors} hint="Empreinte anonyme" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Questions (période)" value={stats.questions_asked} />
                <StatCard label="Sessions IA" value={stats.avatar_sessions} />
                <StatCard label="Téléchargements PDF" value={stats.pdf_downloads} accent="morocco" />
                <StatCard
                  label="Taux fallback IA"
                  value={`${fallbackRate}%`}
                  hint={`${stats.fallback_answers} réponses sans KB`}
                />
              </div>

              {dailyChart.length > 0 && (
                <ChartCard
                  title="Activité par jour"
                  description="Visites, questions et téléchargements combinés"
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Visites" stackId="1" stroke="#143a66" fill="#143a66" fillOpacity={0.35} />
                        <Area type="monotone" dataKey="Questions" stackId="1" stroke="#c1272d" fill="#c1272d" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="PDF" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.35} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard title="Heures de pointe — questions" description="Répartition 0h–23h (UTC)">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakQuestions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#c1272d" radius={[3, 3, 0, 0]} name="Questions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Heures de pointe — visites" description="Répartition 0h–23h (UTC)">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakVisits}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#143a66" radius={[3, 3, 0, 0]} name="Visites" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {stats && section === "visitors" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Pages vues" value={stats.page_views} />
                <StatCard label="Page /avatar" value={stats.avatar_page_views} />
                <StatCard label="Visiteurs uniques" value={stats.unique_visitors} />
              </div>

              <ChartCard title="Visites par jour">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.page_views_by_day.map((r) => ({
                        date: formatDay(r.date),
                        count: r.count,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#143a66" radius={[4, 4, 0, 0]} name="Visites" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {hourlyVisits.length > 0 && (
                <ChartCard
                  title="Visites par heure"
                  description="Timeline horaire (3 derniers jours max.)"
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyVisits}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#143a66" strokeWidth={2} dot={false} name="Visites" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
            </div>
          )}

          {stats && section === "questions" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Questions posées" value={stats.questions_asked} accent="morocco" />
                <StatCard label="Réponses données" value={stats.answers_given} />
                <StatCard label="Fallback" value={stats.fallback_answers} />
                <StatCard label="Archivées (total)" value={totalMessages} />
              </div>

              {Object.keys(stats.questions_by_language).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Par langue</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {Object.entries(stats.questions_by_language).map(([lang, count]) => (
                      <Badge key={lang} variant="secondary" className="px-3 py-1 text-sm">
                        {lang} · {count}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard title="Questions par jour">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.questions_by_day.map((r) => ({
                          date: formatDay(r.date),
                          count: r.count,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#c1272d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {hourlyQuestions.length > 0 && (
                  <ChartCard title="Questions par heure" description="Timeline horaire récente">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyQuestions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#c1272d" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Détail des questions ({messages.length} / {totalMessages})
                  </CardTitle>
                  <CardDescription>Cliquez sur une ligne pour voir la réponse complète</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0 pb-2">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                        <th className="w-8 py-3 pl-4" />
                        <th className="py-3 pr-4">Date & heure</th>
                        <th className="py-3 pr-4">Question</th>
                        <th className="py-3 pr-4">Réponse (aperçu)</th>
                        <th className="py-3 pr-4">Langue</th>
                        <th className="py-3 pr-4">Score KB</th>
                        <th className="py-3 pr-4">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((row) => (
                        <MessageRow key={row.id} row={row} />
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {stats && section === "downloads" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="Total PDF (période)" value={stats.pdf_downloads} accent="morocco" />
                <StatCard label="Aujourd'hui" value={stats.pdf_downloads_today} accent="morocco" />
              </div>

              {Object.keys(stats.pdf_downloads_by_source).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Par emplacement sur le site</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(stats.pdf_downloads_by_source).map(([source, count]) => (
                      <div key={source} className="rounded-lg border bg-slate-50 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          {SOURCE_LABELS[source] ?? source}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-navy">{count}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard title="Téléchargements par jour">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.pdf_downloads_by_day.map((r) => ({
                          date: formatDay(r.date),
                          count: r.count,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#c1272d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {stats.pdf_downloads_by_hour.length > 0 && (
                  <ChartCard title="Téléchargements par heure">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={stats.pdf_downloads_by_hour.map((r) => ({
                            label: formatHour(r.hour),
                            count: r.count,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#c1272d" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                )}
              </div>
            </div>
          )}

          {stats && section === "journal" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Journal d'activité ({events.length} / {totalEvents})
                </CardTitle>
                <CardDescription>Toutes les actions enregistrées sur le site</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0 pb-2">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="py-3 pl-4 pr-4">Date & heure</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Page / source</th>
                      <th className="py-3 pr-4">Langue</th>
                      <th className="py-3 pr-4">Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((row) => (
                      <tr key={row.id} className="border-b align-top hover:bg-slate-50">
                        <td className="py-3 pl-4 pr-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(row.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{eventLabel(row.event_type)}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          {row.path ?? "—"}
                          {row.source && (
                            <span className="block text-slate-500">
                              {SOURCE_LABELS[row.source] ?? row.source}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs">{row.language ?? "—"}</td>
                        <td className="py-3 pr-4 max-w-md text-xs" dir="auto">
                          {row.question ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
