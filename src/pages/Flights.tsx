import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plane, Radio, RefreshCw, Lock } from "lucide-react";

type Aircraft = {
  registration: string;
  hex: string | null;
  flight: string | null;
  on_ground: boolean | null;
  altitude: number | null;
  ground_speed: number | null;
  lat: number | null;
  lon: number | null;
  last_seen: string | null;
  last_checked: string;
};
type Alert = { id: string; registration: string; kind: string; message: string; created_at: string };
type TrackedFlight = { id: string; registration: string; label: string | null };

const SESSION_KEY = "flights_site_password";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callApi(action: string, body: unknown, password: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/flights-api?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-site-password": password,
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

function AuthGate({ children }: { children: (pw: string) => ReactNode }) {
  const [password, setPassword] = useState("");
  const [stored, setStored] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { ok } = await callApi("verify", { password }, password);
    setSubmitting(false);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, password);
      setStored(password);
    } else {
      setError("Wrong password");
    }
  };

  if (stored) return <>{children(stored)}</>;

  return (
    <div className="flight-tracker-theme grid min-h-screen place-items-center bg-background px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Protected</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Enter the site password to continue.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting || !password} className="w-full">
            {submitting ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Dashboard() {
  const [tracked, setTracked] = useState<TrackedFlight[]>([]);
  const [aircraft, setAircraft] = useState<Record<string, Aircraft | undefined>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    const [{ data: tf }, { data: ac }, { data: al }] = await Promise.all([
      supabase.from("tracked_flights").select("*").order("created_at"),
      supabase.from("aircraft_state").select("*"),
      supabase.from("alert_log").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setTracked((tf ?? []) as TrackedFlight[]);
    const map: Record<string, Aircraft> = {};
    (ac ?? []).forEach((a: any) => (map[a.registration] = a as Aircraft));
    setAircraft(map);
    setAlerts((al ?? []) as Alert[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("flight-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "aircraft_state" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alert_log" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tracked_flights" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const runCheckNow = async () => {
    setChecking(true);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/check-flights`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (res.ok) {
      toast.success("Check complete");
      await load();
    } else toast.error("Check failed");
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Flight Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Tracking {tracked.length} aircraft · Alerts every 5 min · Manage in admin
              </p>
            </div>
          </div>
          <Button onClick={runCheckNow} disabled={checking} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            Check now
          </Button>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {tracked.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground md:col-span-2">
              No flights tracked yet. Add some in the admin panel.
            </Card>
          ) : (
            tracked.map((t) => (
              <AircraftCard key={t.id} reg={t.registration} label={t.label} data={aircraft[t.registration]} />
            ))
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recent alerts</h2>
          </div>
          <Card className="divide-y">
            {alerts.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No alerts yet. They will appear here when any tracked aircraft lifts off or shows activity.
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{a.registration}</span>
                      <Badge variant="outline">{a.kind}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

function AircraftCard({ reg, label, data }: { reg: string; label: string | null; data?: Aircraft }) {
  const live =
    data && data.last_seen && Date.now() - new Date(data.last_seen).getTime() < 15 * 60_000;
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-xl font-bold">{reg}</h3>
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
          {data?.flight && <p className="text-sm text-muted-foreground">Flight {data.flight}</p>}
        </div>
        {live ? (
          data?.on_ground ? (
            <Badge variant="secondary">On ground</Badge>
          ) : (
            <Badge className="bg-green-600 hover:bg-green-600">In flight</Badge>
          )
        ) : (
          <Badge variant="outline">Not visible</Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Altitude" value={data?.altitude != null ? `${data.altitude} ft` : "—"} />
        <Field label="Speed" value={data?.ground_speed != null ? `${data.ground_speed} kt` : "—"} />
        <Field
          label="Position"
          value={
            data?.lat != null && data?.lon != null
              ? `${Number(data.lat).toFixed(2)}, ${Number(data.lon).toFixed(2)}`
              : "—"
          }
        />
        <Field label="Hex" value={data?.hex ?? "—"} />
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Last checked: {data ? new Date(data.last_checked).toLocaleString() : "never"}
      </p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default function Flights() {
  return <AuthGate>{() => <Dashboard />}</AuthGate>;
}
