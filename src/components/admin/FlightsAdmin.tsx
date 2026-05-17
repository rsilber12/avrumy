import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plane,
  Trash2,
  Send,
  Mail,
  Bell,
  Beaker,
  Lock,
  Monitor,
  MapPin,
  KeyRound,
} from "lucide-react";

type Flight = { id: string; registration: string; label: string | null };
type Recipient = {
  id: string;
  kind: "telegram" | "email";
  value: string;
  label: string | null;
};
type Session = {
  id: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen: string;
};

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

function friendlyUA(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua) && !/Chromium/.test(ua)
    ? "Chrome"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/.test(ua)
    ? "iOS"
    : /Linux/.test(ua)
    ? "Linux"
    : "Unknown";
  return `${browser} · ${os}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FlightsAdmin = () => {
  const [password, setPassword] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY),
  );
  const [pwInput, setPwInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [reg, setReg] = useState("");
  const [regLabel, setRegLabel] = useState("");
  const [recKind, setRecKind] = useState<"telegram" | "email">("email");
  const [recValue, setRecValue] = useState("");
  const [recLabel, setRecLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const loadSessions = async () => {
    const { ok, data } = await callApi("list-sessions", {}, password!);
    if (ok) {
      setSessions((data?.sessions ?? []) as Session[]);
      setCurrentSessionId(data?.current_id ?? null);
    } else if ((data as any)?.error === "Unauthorized") {
      // Session was revoked
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setPassword(null);
      toast.error("Your session was revoked. Please sign in again.");
    }
  };

  const load = async () => {
    const [{ data: f }, { data: r }] = await Promise.all([
      supabase.from("tracked_flights").select("*").order("created_at"),
      supabase.from("alert_recipients").select("*").order("created_at"),
    ]);
    setFlights((f ?? []) as Flight[]);
    setRecipients((r ?? []) as Recipient[]);
    await loadSessions();
  };

  useEffect(() => {
    if (password) load();
  }, [password]);

  const unlock = async () => {
    setVerifying(true);
    const { ok, data } = await callApi("verify", { password: pwInput }, pwInput, "");
    setVerifying(false);
    if (ok && data?.token) {
      sessionStorage.setItem(SESSION_KEY, pwInput);
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setPassword(pwInput);
    } else {
      toast.error("Wrong password");
    }
  };

  const addFlight = async () => {
    if (!reg.trim()) return toast.error("Enter a registration");
    setBusy(true);
    const { ok, data } = await callApi(
      "add-flight",
      { registration: reg.trim(), label: regLabel.trim() || null },
      password!,
    );
    setBusy(false);
    if (ok) {
      toast.success("Flight added");
      setReg("");
      setRegLabel("");
      await load();
    } else toast.error(data?.error ?? "Failed");
  };

  const removeFlight = async (id: string) => {
    const { ok } = await callApi("delete-flight", { id }, password!);
    if (ok) {
      toast.success("Flight removed");
      await load();
    } else toast.error("Failed");
  };

  const addRecipient = async () => {
    if (!recValue.trim()) return toast.error("Enter a value");
    setBusy(true);
    const { ok, data } = await callApi(
      "add-recipient",
      { kind: recKind, value: recValue.trim(), label: recLabel.trim() || null },
      password!,
    );
    setBusy(false);
    if (ok) {
      toast.success("Recipient added");
      setRecValue("");
      setRecLabel("");
      await load();
    } else toast.error(data?.error ?? "Failed");
  };

  const removeRecipient = async (id: string) => {
    const { ok } = await callApi("delete-recipient", { id }, password!);
    if (ok) {
      toast.success("Removed");
      await load();
    } else toast.error("Failed");
  };

  const testSystem = async () => {
    setTesting(true);
    const { ok, data } = await callApi("test-alert", {}, password!);
    setTesting(false);
    if (!ok) return toast.error(data?.error ?? "Test failed");
    const tg = data?.results?.telegram ?? [];
    const em = data?.results?.email ?? [];
    const failed = [...tg, ...em].filter((r: any) => !r.ok);
    if (failed.length === 0)
      toast.success(`Test sent to ${tg.length} Telegram + ${em.length} email recipient(s)`);
    else toast.error(failed.map((r: any) => r.error || `${r.value} failed`).join(" · "));
  };

  const revokeSession = async (id: string) => {
    const { ok, data } = await callApi("revoke-session", { id }, password!);
    if (!ok) return toast.error(data?.error ?? "Failed");
    if (id === currentSessionId) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setPassword(null);
      toast.success("Signed out on this device");
      return;
    }
    toast.success("Device signed out");
    await loadSessions();
  };

  const revokeAllOthers = async () => {
    const { ok, data } = await callApi("revoke-all-other-sessions", {}, password!);
    if (!ok) return toast.error(data?.error ?? "Failed");
    toast.success("All other devices signed out");
    await loadSessions();
  };

  const changePassword = async () => {
    if (newPw !== newPw2) return toast.error("New passwords don't match");
    if (newPw.length < 6) return toast.error("New password must be at least 6 characters");
    setChangingPw(true);
    const { ok, data } = await callApi(
      "change-password",
      { current: currentPw, next: newPw },
      password!,
    );
    setChangingPw(false);
    if (!ok) return toast.error(data?.error ?? "Failed");
    // Update locally so this session keeps working
    sessionStorage.setItem(SESSION_KEY, newPw);
    setPassword(newPw);
    setCurrentPw("");
    setNewPw("");
    setNewPw2("");
    toast.success("Password changed. All other devices were signed out.");
    await loadSessions();
  };

  if (!password) {
    return (
      <Card className="mx-auto max-w-sm p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Unlock flight controls</h2>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="pw">Site password</Label>
            <Input
              id="pw"
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
            />
          </div>
          <Button onClick={unlock} disabled={verifying || !pwInput} className="w-full">
            {verifying ? "Checking…" : "Unlock"}
          </Button>
        </div>
      </Card>
    );
  }

  const telegrams = recipients.filter((r) => r.kind === "telegram");
  const emails = recipients.filter((r) => r.kind === "email");

  return (
    <div className="space-y-6">
      {/* Flights */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Tracked flights</h2>
          <Badge variant="outline" className="ml-auto">{flights.length}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="reg">Registration</Label>
            <Input
              id="reg"
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
              placeholder="e.g. N787FZ"
            />
          </div>
          <div>
            <Label htmlFor="reglabel">Label (optional)</Label>
            <Input
              id="reglabel"
              value={regLabel}
              onChange={(e) => setRegLabel(e.target.value)}
              placeholder="e.g. Gulfstream G650"
            />
          </div>
          <Button onClick={addFlight} disabled={busy}>Add flight</Button>
        </div>
        <div className="mt-5 divide-y rounded-md border">
          {flights.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No flights tracked yet.</div>
          ) : (
            flights.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <div className="font-mono font-semibold">{f.registration}</div>
                  {f.label && <div className="text-xs text-muted-foreground">{f.label}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFlight(f.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recipients */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Alert recipients</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="kind">Type</Label>
            <select
              id="kind"
              value={recKind}
              onChange={(e) => setRecKind(e.target.value as "telegram" | "email")}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          <div>
            <Label htmlFor="rv">{recKind === "telegram" ? "Chat ID" : "Email address"}</Label>
            <Input
              id="rv"
              value={recValue}
              onChange={(e) => setRecValue(e.target.value)}
              placeholder={recKind === "telegram" ? "e.g. 123456789" : "you@example.com"}
            />
          </div>
          <div>
            <Label htmlFor="rl">Label (optional)</Label>
            <Input
              id="rl"
              value={recLabel}
              onChange={(e) => setRecLabel(e.target.value)}
              placeholder="e.g. Abe"
            />
          </div>
          <Button onClick={addRecipient} disabled={busy}>Add</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <RecipientList
            title="Email"
            icon={<Mail className="h-4 w-4" />}
            items={emails}
            onRemove={removeRecipient}
            empty="No email recipients yet."
          />
          <RecipientList
            title="Telegram"
            icon={<Send className="h-4 w-4" />}
            items={telegrams}
            onRemove={removeRecipient}
            empty="No Telegram recipients yet."
          />
        </div>
      </Card>

      {/* Test */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Test the system</h2>
              <p className="text-sm text-muted-foreground">
                Sends a test alert to every recipient. Verifies Telegram and email delivery end-to-end.
              </p>
            </div>
          </div>
          <Button onClick={testSystem} disabled={testing}>
            {testing ? "Sending…" : "Send test alert"}
          </Button>
        </div>
      </Card>

      {/* Devices / Sessions */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Signed-in devices</h2>
          <Badge variant="outline" className="ml-auto">{sessions.length}</Badge>
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No active devices.
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {sessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              const loc = [s.city, s.region, s.country].filter(Boolean).join(", ") || "Unknown location";
              return (
                <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{friendlyUA(s.user_agent)}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px]">This device</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{loc}</span>
                      {s.ip && <span className="font-mono">· {s.ip}</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Signed in {timeAgo(s.created_at)} · last active {timeAgo(s.last_seen)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(s.id)}
                    title={isCurrent ? "Sign out this device" : "Remove device"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {sessions.length > 1 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={revokeAllOthers}>
              Sign out all other devices
            </Button>
          </div>
        )}
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Change page password</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Changing the password will sign out every other device immediately.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="cur">Current password</Label>
            <Input
              id="cur"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="np1">New password</Label>
            <Input
              id="np1"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="np2">Confirm new password</Label>
            <Input
              id="np2"
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={changePassword}
            disabled={changingPw || !currentPw || !newPw || !newPw2}
          >
            {changingPw ? "Updating…" : "Update password"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

function RecipientList({
  title,
  icon,
  items,
  onRemove,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: Recipient[];
  onRemove: (id: string) => void;
  empty: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="outline" className="ml-auto">{items.length}</Badge>
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

export default FlightsAdmin;
