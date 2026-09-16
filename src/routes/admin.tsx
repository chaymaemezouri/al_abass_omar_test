import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Lock } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearStoredAdminKey,
  getStoredAdminKey,
  setStoredAdminKey,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState(() => getStoredAdminKey());
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");

  function submitKey(event: React.FormEvent) {
    event.preventDefault();
    const key = inputKey.trim();
    if (!key) return;
    setStoredAdminKey(key);
    setAdminKey(key);
    setError("");
  }

  function logout() {
    clearStoredAdminKey();
    setAdminKey("");
    setInputKey("");
  }

  if (!adminKey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <CardTitle className="text-navy">Dashboard Analytics</CardTitle>
            <CardDescription>
              Statistiques campagne — visiteurs, questions IA, téléchargements PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitKey} className="space-y-4">
              <div>
                <label htmlFor="admin-key" className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  Clé admin
                </label>
                <Input
                  id="admin-key"
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="ADMIN_API_KEY du backend"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy/90">
                Accéder au dashboard
              </Button>
            </form>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      </main>
    );
  }

  return <AdminDashboard adminKey={adminKey} onLogout={logout} />;
}
