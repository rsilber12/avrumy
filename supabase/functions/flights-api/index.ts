import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-site-password, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const functionInvokeKey =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;

const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getStoredPasswordHash(): Promise<string | null> {
  const { data } = await supabase
    .from("flight_site_settings")
    .select("password_hash")
    .eq("id", 1)
    .maybeSingle();
  return (data?.password_hash as string | null) ?? null;
}

async function verifyPassword(provided: string): Promise<boolean> {
  if (!provided) return false;
  const stored = await getStoredPasswordHash();
  if (stored) return (await sha256(provided)) === stored;
  const env = Deno.env.get("SITE_PASSWORD");
  return !!env && provided === env;
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "";
}

async function geolocate(ip: string) {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("::")) return {};
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return {};
    const j = await res.json();
    return { country: j.country_name as string | undefined, city: j.city as string | undefined, region: j.region as string | undefined };
  } catch {
    return {};
  }
}

async function authedSession(req: Request) {
  // Returns the session row if both password + session token are valid; null otherwise.
  const provided = req.headers.get("x-site-password") ?? "";
  const token = req.headers.get("x-session-token") ?? "";
  if (!(await verifyPassword(provided))) return null;
  if (!token) return null;
  const { data: session } = await supabase
    .from("flight_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!session || session.revoked_at) return null;
  // Touch last_seen (fire-and-forget)
  supabase
    .from("flight_sessions")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", session.id)
    .then(() => {});
  return session;
}

async function sendTelegram(chatId: string, text: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !tgKey) return { ok: false, error: "telegram not configured" };
  const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return { ok: res.ok, error: res.ok ? null : await res.text() };
}

async function sendEmail(to: string, subject: string, message: string) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${functionInvokeKey}`,
        apikey: functionInvokeKey,
        "x-internal-function-key": serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateName: "flight-alert",
        recipientEmail: to,
        idempotencyKey: `flight-alert-${to}-${Date.now()}`,
        templateData: { subject, message },
      }),
    });
    if (!res.ok) return { ok: false, error: `Email sender ${res.status}: ${await res.text()}` };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  // -------- Verify (creates a session) --------
  if (action === "verify") {
    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    const ok = await verifyPassword(password);
    if (!ok) return json({ ok: false }, 401);
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const ip = getIp(req);
    const geo = await geolocate(ip);
    await supabase.from("flight_sessions").insert({
      token,
      ip: ip || null,
      country: geo.country ?? null,
      city: geo.city ?? null,
      region: geo.region ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });
    return json({ ok: true, token });
  }

  // -------- All other actions require a valid session --------
  const session = await authedSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  // -------- Sessions / devices --------
  if (action === "list-sessions") {
    const { data, error } = await supabase
      .from("flight_sessions")
      .select("id, ip, country, city, region, user_agent, created_at, last_seen")
      .is("revoked_at", null)
      .order("last_seen", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, sessions: data, current_id: session.id });
  }

  if (action === "revoke-session") {
    const id = body?.id;
    if (typeof id !== "string") return json({ error: "Invalid id" }, 400);
    const { error } = await supabase
      .from("flight_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "revoke-all-other-sessions") {
    const { error } = await supabase
      .from("flight_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .is("revoked_at", null)
      .neq("id", session.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // -------- Change password --------
  if (action === "change-password") {
    const current = typeof body?.current === "string" ? body.current : "";
    const next = typeof body?.next === "string" ? body.next : "";
    if (!(await verifyPassword(current))) return json({ error: "Current password is incorrect" }, 400);
    if (next.length < 6) return json({ error: "New password must be at least 6 characters" }, 400);
    const hash = await sha256(next);
    const { error } = await supabase
      .from("flight_site_settings")
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return json({ error: error.message }, 500);
    // Revoke every other session so they have to re-enter the new password
    await supabase
      .from("flight_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .is("revoked_at", null)
      .neq("id", session.id);
    return json({ ok: true });
  }

  // -------- Recipients --------
  if (action === "add-recipient") {
    const kind = body?.kind;
    const value = typeof body?.value === "string" ? body.value.trim() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : null;
    if (!["telegram", "email"].includes(kind) || !value || value.length > 255)
      return json({ error: "Invalid input" }, 400);
    if (kind === "telegram" && !/^-?\d+$/.test(value))
      return json({ error: "Telegram chat ID must be numeric" }, 400);
    if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return json({ error: "Invalid email" }, 400);
    const { data, error } = await supabase
      .from("alert_recipients")
      .insert({ kind, value, label: label || null })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    if (kind === "telegram")
      await sendTelegram(value, "✅ You're now subscribed to flight alerts.").catch(() => undefined);
    return json({ ok: true, recipient: data });
  }

  if (action === "delete-recipient") {
    const id = body?.id;
    if (typeof id !== "string") return json({ error: "Invalid id" }, 400);
    const { error } = await supabase.from("alert_recipients").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // -------- Tracked flights --------
  if (action === "add-flight") {
    const registration = typeof body?.registration === "string" ? body.registration.trim().toUpperCase() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : null;
    if (!/^[A-Z0-9-]{2,10}$/.test(registration))
      return json({ error: "Invalid registration" }, 400);
    const { data, error } = await supabase
      .from("tracked_flights")
      .insert({ registration, label: label || null })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, flight: data });
  }

  if (action === "delete-flight") {
    const id = body?.id;
    if (typeof id !== "string") return json({ error: "Invalid id" }, 400);
    const { error } = await supabase.from("tracked_flights").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // -------- Test alert --------
  if (action === "test-alert") {
    const { data: recipients } = await supabase.from("alert_recipients").select("kind,value");
    const tg = (recipients ?? []).filter((r) => r.kind === "telegram");
    const em = (recipients ?? []).filter((r) => r.kind === "email");
    const subject = "Flight Tracker — test alert";
    const text = `🧪 Test alert from your Flight Tracker. If you see this, delivery is working.`;
    const results = {
      telegram: [] as Array<{ value: string; ok: boolean; error: string | null }>,
      email: [] as Array<{ value: string; ok: boolean; error: string | null }>,
    };
    for (const r of tg) {
      const out = await sendTelegram(r.value, text);
      results.telegram.push({ value: r.value, ...out });
    }
    for (const r of em) {
      const out = await sendEmail(r.value, subject, text);
      results.email.push({ value: r.value, ...out });
    }
    await supabase.from("alert_log").insert({
      registration: "TEST",
      kind: "test",
      message: `Test alert dispatched to ${tg.length} Telegram and ${em.length} email recipient(s).`,
    });
    return json({ ok: true, results });
  }

  return json({ error: "Unknown action" }, 404);
});
