import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clearStoredAdminKey,
  fetchAdminMessages,
  fetchAdminStats,
  getStoredAdminKey,
  setStoredAdminKey,
  type AdminMessage,
  type AdminStats,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardPage,
});

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (key: string, period: number) => {
    setLoading(true);
    setError("");
    try {
      const [statsData, msgData] = await Promise.all([
        fetchAdminStats(key, period),
        fetchAdminMessages(key, 100, 0),
      ]);
      setStats(statsData);
      setMessages(msgData.items);
      setTotalMessages(msgData.total);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized") {
        clearStoredAdminKey();
        setAdminKey("");
        setError("Clé admin invalide.");
      } else {
        setError("Impossible de charger les statistiques.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredAdminKey();
    if (stored) {
      setAdminKey(stored);
      void load(stored, days);
    }
  }, [days, load]);

  function submitKey(event: React.FormEvent) {
    event.preventDefault();
    const key = inputKey.trim();
    if (!key) return;
    setStoredAdminKey(key);
    setAdminKey(key);
    void load(key, days);
  }

  if (!adminKey) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-xl font-bold text-navy">Dashboard campagne</h1>
        <p className="mt-2 text-sm text-slate-600">
          Entrez la clé admin (ADMIN_API_KEY du backend Avatar).
        </p>
        <form onSubmit={submitKey} className="mt-6 space-y-3">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Clé admin"
            autoComplete="off"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Accéder
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  const chartData =
    stats?.questions_by_day.map((row) => ({
      date: row.date.slice(5),
      questions: row.count,
    })) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics — campagne</h1>
          <p className="text-sm text-slate-600">
            Visiteurs, questions IA, téléchargements PDF ({stats?.period_days ?? days} jours)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <button
            type="button"
            onClick={() => void load(adminKey, days)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => {
              clearStoredAdminKey();
              setAdminKey("");
              setStats(null);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Chargement…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {stats && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Visiteurs uniques (approx.)" value={stats.unique_visitors} />
            <StatCard label="Pages vues" value={stats.page_views} />
            <StatCard label="Page /avatar" value={stats.avatar_page_views} />
            <StatCard label="Téléchargements PDF" value={stats.pdf_downloads} />
            <StatCard label="Sessions IA" value={stats.avatar_sessions} />
            <StatCard label="Questions posées" value={stats.questions_asked} />
            <StatCard label="Réponses fallback" value={stats.fallback_answers} />
            <StatCard label="Questions archivées" value={totalMessages} />
          </div>

          {Object.keys(stats.questions_by_language).length > 0 && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-bold text-navy">Questions par langue</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.questions_by_language).map(([language, count]) => (
                  <div
                    key={language}
                    className="rounded-lg bg-slate-50 px-4 py-2 text-sm"
                  >
                    <span className="font-semibold text-navy">{language}</span>
                    <span className="ml-2 text-slate-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-bold text-navy">Questions par jour</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="questions" fill="#143a66" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-navy">
              Dernières questions ({messages.length} / {totalMessages})
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Question</th>
                    <th className="py-2 pr-4">Réponse</th>
                    <th className="py-2">Lang.</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((row) => (
                    <tr key={row.id} className="border-b align-top">
                      <td className="py-3 pr-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 pr-4 max-w-xs" dir="auto">
                        {row.question}
                      </td>
                      <td className="py-3 pr-4 max-w-md text-slate-700" dir="auto">
                        {row.answer.slice(0, 280)}
                        {row.answer.length > 280 ? "…" : ""}
                        {row.used_fallback && (
                          <span className="ml-1 text-xs text-amber-600">(fallback)</span>
                        )}
                      </td>
                      <td className="py-3 text-xs">{row.language ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
