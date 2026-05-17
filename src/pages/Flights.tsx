import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plane, Radio, RefreshCw, Bell, Trash2, Send, Mail, Lock } from "lucide-react";

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
type Recipient = {
  id: string;
  kind: "telegram" | "email";
  value: string;
  label: string | null;
  created_at: string;
};

const TRACKED = ["N787FZ", "VPCZS"];
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
    <div className="grid min-h-screen place-items-center bg-background px-6">
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

function Dashboard({ password }: { password: string }) {
  const [aircraft, setAircraft] = useState<Record<string, Aircraft | undefined>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [checking, setChecking] = useState(false);
  const [kind, setKind] = useState<"telegram" | "email">("telegram");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const [{ data: ac }, { data: al }, { data: rec }] = await Promise.all([
      supabase.from("aircraft_state").select("*"),
      supabase.from("alert_log").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("alert_recipients").select("*").order("created_at", { ascending: true }),
    ]);
    const map: Record<string, Aircraft> = {};
    (ac ?? []).forEach((a: any) => (map[a.registration] = a as Aircraft));
    setAircraft(map);
    setAlerts((al ?? []) as Alert[]);
    setRecipients((rec ?? []) as Recipient[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("flight-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "aircraft_state" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alert_log" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alert_recipients" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addRecipient = async () => {
    if (!value.trim()) return toast.error("Enter a value");
    setAdding(true);
    const { ok, data } = await callApi(
      "add-recipient",
      { kind, value: value.trim(), label: label.trim() || null },
      password,
    );
    if (ok) {
      toast.success(kind === "telegram" ? "Added. Check Telegram for confirmation." : "Added.");
      setValue("");
      setLabel("");
      await load();
    } else {
      toast.error((data as any)?.error ?? "Failed to add");
    }
    setAdding(false);
  };

  const removeRecipient = async (id: string) => {
    const { ok } = await callApi("delete-recipient", { id }, password);
    if (ok) {
      toast.success("Removed");
      await load();
    } else toast.error("Failed to remove");
  };

  const telegrams = recipients.filter((r) => r.kind === "telegram");
  const emails = recipients.filter((r) => r.kind === "email");

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
                Watching N787FZ &amp; VPCZS · Alerts every 5 min via Telegram &amp; email
              </p>
            </div>
          </div>
          <Button onClick={runCheckNow} disabled={checking} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            Check now
          </Button>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {TRACKED.map((reg) => (
            <AircraftCard key={reg} reg={reg} data={aircraft[reg]} />
          ))}
        </section>

        <section className="mb-10">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Alert delivery</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
              <div>
                <Label htmlFor="kind">Type</Label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as "telegram" | "email")}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <Label htmlFor="value">
                  {kind === "telegram" ? "Chat ID (numeric)" : "Email address"}
                </Label>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={kind === "telegram" ? "e.g. 123456789" : "you@example.com"}
                />
              </div>
              <div>
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Abe's phone"
                />
              </div>
              <Button onClick={addRecipient} disabled={adding}>
                {adding ? "Adding…" : "Add"}
              </Button>
            </div>
            {kind === "telegram" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Get your chat ID by messaging{" "}
                <a href="https://t.me/userinfobot" target="_blank" rel="noopener" className="underline">
                  @userinfobot
                </a>
                . The user must also start a chat with the bot you connected.
              </p>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <RecipientList
                title="Telegram"
                icon={<Send className="h-4 w-4" />}
                items={telegrams}
                onRemove={removeRecipient}
                empty="No Telegram recipients yet."
              />
              <RecipientList
                title="Email"
                icon={<Mail className="h-4 w-4" />}
                items={emails}
                onRemove={removeRecipient}
                empty="No email recipients yet."
              />
            </div>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recent alerts</h2>
          </div>
          <Card className="divide-y">
            {alerts.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No alerts yet. They will appear here when either aircraft lifts off or shows activity.
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

function RecipientList({
  title,
  icon,
  items,
  onRemove,
  empty,
}: {
  title: string;
  icon: ReactNode;
  items: Recipient[];
  onRemove: (id: string) => void;
  empty: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="outline" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <div className="p-4 text-xs text-muted-foreground">{empty}</div>
      ) : (
        <div className="divide-y">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm">{r.value}</div>
                {r.label && <div className="text-xs text-muted-foreground">{r.label}</div>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemove(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AircraftCard({ reg, data }: { reg: string; data?: Aircraft }) {
  const live =
    data && data.last_seen && Date.now() - new Date(data.last_seen).getTime() < 15 * 60_000;
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-xl font-bold">{reg}</h3>
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
  return <AuthGate>{(pw) => <Dashboard password={pw} />}</AuthGate>;
}
