import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plane, Trash2, Send, Mail, Bell, Beaker, Lock } from "lucide-react";

type Flight = { id: string; registration: string; label: string | null };
type Recipient = {
  id: string;
  kind: "telegram" | "email";
  value: string;
  label: string | null;
};

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
  return { ok: res.ok, data: await res.json().catch(() => ({} as any)) };
}

const FlightsAdmin = () => {
  const [password, setPassword] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY),
  );
  const [pwInput, setPwInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [reg, setReg] = useState("");
  const [regLabel, setRegLabel] = useState("");
  const [recKind, setRecKind] = useState<"telegram" | "email">("email");
  const [recValue, setRecValue] = useState("");
  const [recLabel, setRecLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const [{ data: f }, { data: r }] = await Promise.all([
      supabase.from("tracked_flights").select("*").order("created_at"),
      supabase.from("alert_recipients").select("*").order("created_at"),
    ]);
    setFlights((f ?? []) as Flight[]);
    setRecipients((r ?? []) as Recipient[]);
  };

  useEffect(() => {
    if (password) load();
  }, [password]);

  const unlock = async () => {
    setVerifying(true);
    const { ok } = await callApi("verify", { password: pwInput }, pwInput);
    setVerifying(false);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, pwInput);
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
    else toast.warning(`Sent with ${failed.length} failure(s) — check edge function logs`);
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
