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

function checkPassword(req: Request): boolean {
  const expected = Deno.env.get("SITE_PASSWORD");
  if (!expected) return false;
  const provided = req.headers.get("x-site-password");
  return !!provided && provided === expected;
}

async function sendTelegramHello(chatId: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !tgKey) return;
  await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: "✅ You're now subscribed to flight alerts for N787FZ and VPCZS.",
    }),
  }).catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  // Verify password endpoint
  if (action === "verify") {
    const body = await req.json().catch(() => ({}));
    const expected = Deno.env.get("SITE_PASSWORD");
    const ok = !!expected && body?.password === expected;
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!checkPassword(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "add-recipient" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind;
    const value = typeof body?.value === "string" ? body.value.trim() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : null;
    if (!["telegram", "email"].includes(kind) || !value || value.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (kind === "telegram" && !/^-?\d+$/.test(value)) {
      return new Response(JSON.stringify({ error: "Telegram chat ID must be numeric" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data, error } = await supabase
      .from("alert_recipients")
      .insert({ kind, value, label: label || null })
      .select()
      .single();
    if (error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (kind === "telegram") await sendTelegramHello(value);
    return new Response(JSON.stringify({ ok: true, recipient: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "delete-recipient" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { error } = await supabase.from("alert_recipients").delete().eq("id", id);
    if (error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
