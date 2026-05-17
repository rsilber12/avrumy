import { useEffect, useState, useRef, type FormEvent, type ReactNode, type MouseEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plane,
  Radio,
  RefreshCw,
  Lock,
  Activity,
  Gauge,
  MapPin,
  Hash,
  Clock,
  ArrowUpRight,
  Signal,
  ShieldCheck,
} from "lucide-react";

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
const TOKEN_KEY = "flights_session_token";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callApi(action: string, body: unknown, password: string, token?: string | null) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/flights-api?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-site-password": password,
      "x-session-token": token ?? sessionStorage.getItem(TOKEN_KEY) ?? "",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({} as any)) };
}

/* ──────────────────────────── AUTH GATE ──────────────────────────── */

function AuthGate({ children }: { children: (pw: string) => ReactNode }) {
  const [password, setPassword] = useState("");
  const [stored, setStored] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { ok, data } = await callApi("verify", { password }, password, "");
    setSubmitting(false);
    if (ok && data?.token) {
      sessionStorage.setItem(SESSION_KEY, password);
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setStored(password);
    } else {
      setError("Wrong password");
    }
  };

  if (stored) return <>{children(stored)}</>;

  return (
    <div className="flight-tracker-theme relative grid min-h-screen place-items-center px-6">
      <div className="ft-backdrop" />
      <div className="ft-in w-full max-w-md">
        <div className="ft-glass rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--ft-accent) / 0.2), hsl(var(--ft-accent-2) / 0.2))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="ft-chip">Restricted</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">Flight Operations</h1>
            </div>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter the operator passcode to access live tracking.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="pw" className="text-xs uppercase tracking-wider text-muted-foreground">
                Passcode
              </Label>
              <Input
                id="pw"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-11 font-mono"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              disabled={submitting || !password}
              className="ft-cta h-11 w-full font-medium"
            >
              {submitting ? "Authenticating…" : "Unlock console"}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Flight Tracker · v2
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────── DASHBOARD ──────────────────────────── */

function Dashboard() {
  const [tracked, setTracked] = useState<TrackedFlight[]>([]);
  const [aircraft, setAircraft] = useState<Record<string, Aircraft | undefined>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

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
    setLastSync(new Date());
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
      toast.success("Sync complete");
      await load();
    } else toast.error("Sync failed");
    setChecking(false);
  };

  const liveCount = Object.values(aircraft).filter(
    (a) => a && a.last_seen && Date.now() - new Date(a.last_seen).getTime() < 15 * 60_000,
  ).length;
  const airborneCount = Object.values(aircraft).filter(
    (a) => a && a.on_ground === false && a.last_seen,
  ).length;

  return (
    <div className="flight-tracker-theme relative min-h-screen">
      <div className="ft-backdrop" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* HEADER */}
        <header className="ft-in mb-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="ft-chip">
              <span className="ft-pulse" /> Live · ADS-B
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Synced {lastSync.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                <span className="ft-gradient-text">Flight Operations</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Real-time aircraft telemetry with takeoff &amp; landing alerts pushed every 5 minutes
                via Telegram and email.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden gap-2 sm:flex">
                <StatPill label="Tracked" value={tracked.length} />
                <StatPill label="Visible" value={liveCount} accent />
                <StatPill label="Airborne" value={airborneCount} />
              </div>
              <Button
                onClick={runCheckNow}
                disabled={checking}
                className="ft-cta h-10 px-4 font-medium"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Syncing" : "Sync now"}
              </Button>
            </div>
          </div>
        </header>

        {/* AIRCRAFT */}
        <section className="ft-in ft-in-d1 mb-14">
          <SectionTitle icon={<Plane className="h-3.5 w-3.5" />} label="Fleet" count={tracked.length} />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {tracked.length === 0 ? (
              <div className="ft-glass md:col-span-2 rounded-2xl p-10 text-center text-sm text-muted-foreground">
                No flights tracked. Add aircraft from the admin panel.
              </div>
            ) : (
              tracked.map((t) => (
                <AircraftCard
                  key={t.id}
                  reg={t.registration}
                  label={t.label}
                  data={aircraft[t.registration]}
                />
              ))
            )}
          </div>
        </section>

        {/* ALERTS */}
        <section className="ft-in ft-in-d2">
          <SectionTitle icon={<Radio className="h-3.5 w-3.5" />} label="Activity log" count={alerts.length} />
          <div className="ft-glass mt-6 overflow-hidden rounded-2xl">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                All quiet. Alerts will surface here on takeoff, landing, or new activity.
              </div>
            ) : (
              <ul>
                {alerts.map((a, i) => (
                  <li
                    key={a.id}
                    className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
                    style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                  >
                    <KindIcon kind={a.kind} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold tracking-tight">
                          {a.registration}
                        </span>
                        <span className="ft-chip">{a.kind}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {formatRelative(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Source · adsb.lol</span>
          <span className="flex items-center gap-2">
            <Signal className="h-3 w-3" /> Realtime channel active
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ──────────────────────────── PIECES ──────────────────────────── */

function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="ft-glass flex items-center gap-3 rounded-full px-4 py-2"
      style={accent ? { borderColor: "hsl(var(--ft-accent) / 0.4)" } : undefined}
    >
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

function SectionTitle({ icon, label, count }: { icon: ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.25em]">{label}</span>
      </div>
      <span className="ft-rule" />
      <span className="font-mono text-xs text-muted-foreground">{String(count).padStart(2, "0")}</span>
    </div>
  );
}

function KindIcon({ kind }: { kind: string }) {
  const k = kind.toLowerCase();
  const color =
    k.includes("liftoff") || k.includes("takeoff")
      ? "hsl(var(--ft-success))"
      : k.includes("land")
      ? "hsl(var(--ft-accent))"
      : k.includes("test")
      ? "hsl(var(--ft-accent-2))"
      : "hsl(var(--muted-foreground))";
  return (
    <div
      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
      style={{ background: `${color.replace(")", " / 0.12)")}`, border: `1px solid ${color.replace(")", " / 0.3)")}` }}
    >
      <Activity className="h-3.5 w-3.5" style={{ color }} />
    </div>
  );
}

function AircraftCard({
  reg,
  label,
  data,
}: {
  reg: string;
  label: string | null;
  data?: Aircraft;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const live =
    !!data && !!data.last_seen && Date.now() - new Date(data.last_seen).getTime() < 15 * 60_000;
  const airborne = live && data?.on_ground === false;

  const [place, setPlace] = useState<string | null>(null);
  useEffect(() => {
    if (data?.lat == null || data?.lon == null) {
      setPlace(null);
      return;
    }
    const lat = Number(data.lat).toFixed(2);
    const lon = Number(data.lon).toFixed(2);
    const cacheKey = `geo:${lat},${lon}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setPlace(cached);
      return;
    }
    let cancelled = false;
    fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        const parts = [j.city || j.locality, j.principalSubdivision, j.countryName].filter(Boolean);
        const seen = new Set<string>();
        const text =
          parts.filter((p: string) => (seen.has(p) ? false : (seen.add(p), true))).join(", ") ||
          "Over open water";
        sessionStorage.setItem(cacheKey, text);
        setPlace(text);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [data?.lat, data?.lon]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="ft-glass ft-glass-hover ft-flight-card rounded-2xl p-6"
    >
      {/* Top row */}
      <div className="mb-6 flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plane className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-[0.25em]">Aircraft</span>
          </div>
          <h3 className="mt-1 font-mono text-2xl font-bold tracking-tight">{reg}</h3>
          {(label || data?.flight) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {label}
              {label && data?.flight ? " · " : ""}
              {data?.flight && <>Flight {data.flight}</>}
            </p>
          )}
        </div>
        <StatusBadge live={live} airborne={airborne} />
      </div>

      {/* Telemetry grid */}
      <div className="grid grid-cols-2 gap-3">
        <Tile
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Altitude"
          value={data?.altitude != null ? data.altitude.toLocaleString() : "—"}
          unit={data?.altitude != null ? "ft" : ""}
        />
        <Tile
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Ground speed"
          value={data?.ground_speed != null ? Math.round(data.ground_speed).toString() : "—"}
          unit={data?.ground_speed != null ? "kt" : ""}
        />
        <Tile
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Position"
          value={
            data?.lat != null && data?.lon != null
              ? `${Number(data.lat).toFixed(2)}, ${Number(data.lon).toFixed(2)}`
              : "—"
          }
        />
        <Tile
          icon={<Hash className="h-3.5 w-3.5" />}
          label="ICAO hex"
          value={data?.hex?.toUpperCase() ?? "—"}
        />
      </div>

      {/* Last known location */}
      {data?.lat != null && data?.lon != null && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs"
          style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--secondary) / 0.3)" }}>
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Last known location
            </div>
            <div className="mt-0.5 truncate text-foreground">
              {place ?? "Locating…"}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-mono">
            {data ? formatRelative(data.last_checked) : "never"}
          </span>
        </div>
        {data?.lat != null && data?.lon != null && (
          <a
            href={`https://globe.adsbexchange.com/?lat=${data.lat}&lon=${data.lon}&zoom=8&icao=${data.hex ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary transition-colors hover:underline"
          >
            View on map <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ live, airborne }: { live: boolean; airborne: boolean }) {
  if (!live) {
    return (
      <span className="ft-badge-offline inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
        <span className="ft-pulse ft-pulse-muted" /> Not visible
      </span>
    );
  }
  if (airborne) {
    return (
      <span className="ft-badge-air inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
        <span className="ft-pulse" /> In flight
      </span>
    );
  }
  return (
    <span className="ft-badge-ground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
      <span className="ft-pulse ft-pulse-muted" /> On ground
    </span>
  );
}

function Tile({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="ft-tile">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold tabular-nums">{value}</span>
        {unit && <span className="font-mono text-[11px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Flights() {
  return <AuthGate>{() => <Dashboard />}</AuthGate>;
}
