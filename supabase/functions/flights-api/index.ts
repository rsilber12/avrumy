import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-site-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function checkPassword(req: Request): boolean {
  const expected = Deno.env.get("SITE_PASSWORD");
  if (!expected) return false;
  const provided = req.headers.get("x-site-password");
  return !!provided && provided === expected;
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
    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "flight-alert",
        recipientEmail: to,
        idempotencyKey: `flight-alert-${to}-${Date.now()}`,
        templateData: { subject, message },
      },
    });
    if (error) return { ok: false, error: error.message ?? String(error) };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  if (action === "verify") {
    const body = await req.json().catch(() => ({}));
    const expected = Deno.env.get("SITE_PASSWORD");
    const ok = !!expected && body?.password === expected;
    return json({ ok }, ok ? 200 : 401);
  }

  if (!checkPassword(req)) return json({ error: "Unauthorized" }, 401);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

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
      const out = await sendEmail(r.value, subject, html);
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
