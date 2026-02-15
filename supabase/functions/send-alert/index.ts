// Supabase Edge Function: Send SMS alerts via Twilio
// Triggered by pg_net when a notification with channel='sms' is inserted

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const { record } = await req.json();

    // Skip if not SMS or already sent
    if (record.channel !== "sms" || record.sent_at !== null) {
      return new Response("skip", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up recipient phone
    const { data: user } = await supabase.auth.admin.getUserById(
      record.recipient_id
    );
    const phone = user?.user?.phone;
    if (!phone) {
      return new Response("no phone number", { status: 200 });
    }

    // Send via Twilio
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER")!;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const body = new URLSearchParams({
      To: phone,
      From: twilioFrom,
      Body: record.payload?.message ?? "Quest Drive alert!",
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error("Twilio error:", errorText);
      return new Response("twilio error", { status: 500 });
    }

    // Mark notification as sent
    await supabase
      .from("notifications")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", record.id);

    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return new Response("error", { status: 500 });
  }
});
