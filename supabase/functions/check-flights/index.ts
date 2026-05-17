import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const REGISTRATIONS = ["N787FZ", "VPCZS"];

type AdsbAircraft = {
  hex?: string;
  flight?: string;
  alt_baro?: number | "ground";
  gs?: number;
  lat?: number;
  lon?: number;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function fetchAircraft(reg: string): Promise<AdsbAircraft | null> {
  try {
    const res = await fetch(`https://api.adsb.lol/v2/registration/${reg}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ac?: AdsbAircraft[] };
    return data.ac && data.ac.length > 0 ? data.ac[0] : null;
  } catch (e) {
    console.error("ADS-B fetch failed", reg, e);
    return null;
  }
}

async function sendTelegram(chatId: string, text: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !tgKey) return;
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) console.error("Telegram send failed", res.status, await res.text());
  } catch (e) {
    console.error("Telegram error", e);
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !resendKey) {
    console.log("Email skipped — RESEND_API_KEY not configured");
    return;
  }
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Flight Tracker <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("Email send failed", res.status, await res.text());
  } catch (e) {
    console.error("Email error", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { data: recipients } = await supabase
    .from("alert_recipients")
    .select("kind,value");
  const telegrams = (recipients ?? []).filter((r) => r.kind === "telegram").map((r) => r.value);
  const emails = (recipients ?? []).filter((r) => r.kind === "email").map((r) => r.value);

  const results: unknown[] = [];

  for (const reg of REGISTRATIONS) {
    const ac = await fetchAircraft(reg);
    const now = new Date().toISOString();
    const { data: prev } = await supabase
      .from("aircraft_state")
      .select("*")
      .eq("registration", reg)
      .maybeSingle();

    if (!ac) {
      await supabase.from("aircraft_state").upsert({
        registration: reg,
        ...(prev ?? {}),
        last_checked: now,
      });
      results.push({ reg, seen: false });
      continue;
    }

    const onGround =
      ac.alt_baro === "ground" || (typeof ac.alt_baro === "number" && ac.alt_baro < 100);
    const altitude = typeof ac.alt_baro === "number" ? ac.alt_baro : 0;

    await supabase.from("aircraft_state").upsert({
      registration: reg,
      hex: ac.hex ?? null,
      flight: ac.flight?.trim() ?? null,
      on_ground: onGround,
      altitude,
      ground_speed: ac.gs ?? null,
      lat: ac.lat ?? null,
      lon: ac.lon ?? null,
      last_seen: now,
      last_checked: now,
      raw: ac as never,
    });

    const alerts: Array<{ kind: string; message: string }> = [];
    if (prev?.on_ground === true && onGround === false) {
      alerts.push({
        kind: "liftoff",
        message: `🛫 <b>${reg}</b> just lifted off! Altitude ${altitude} ft, speed ${ac.gs ?? "?"} kt.`,
      });
    } else if (!prev || prev.last_seen === null) {
      alerts.push({
        kind: "activity",
        message: onGround
          ? `📡 <b>${reg}</b> is now visible on ADS-B (on ground).`
          : `✈️ <b>${reg}</b> is now visible on ADS-B at ${altitude} ft.`,
      });
    } else if (prev.on_ground === false && onGround === true) {
      alerts.push({ kind: "landing", message: `🛬 <b>${reg}</b> has landed.` });
    }

    for (const a of alerts) {
      const plain = a.message.replace(/<[^>]+>/g, "");
      await supabase.from("alert_log").insert({
        registration: reg,
        kind: a.kind,
        message: plain,
      });
      for (const cid of telegrams) await sendTelegram(cid, a.message);
      for (const em of emails) await sendEmail(em, `Flight alert: ${reg} ${a.kind}`, `<p>${a.message}</p>`);
    }

    results.push({ reg, seen: true, onGround, altitude, alerts: alerts.length });
  }

  return new Response(
    JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
