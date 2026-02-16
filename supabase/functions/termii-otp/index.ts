// ════════════════════════════════════════════════════════════
// Supabase Edge Function — Termii OTP (SMS / WhatsApp)
//
// Deploy:  supabase functions deploy termii-otp
// Secret:  supabase secrets set TERMII_API_KEY=TLpAJd...
//
// Actions:
//   POST { action: 'send', phone: '+234...', channel: 'whatsapp' | 'generic' }
//   POST { action: 'verify', pinId: '...', pin: '123456' }
// ════════════════════════════════════════════════════════════

const TERMII_BASE = 'https://v3.api.termii.com/api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY');
    if (!TERMII_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Termii API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const { action } = body;

    // ── Send OTP ──────────────────────────────────────────
    if (action === 'send') {
      const { phone, channel = 'generic' } = body;

      if (!phone || !/^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''))) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid phone number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const cleanPhone = phone.replace(/[\s-]/g, '');

      const payload = {
        api_key: TERMII_API_KEY,
        message_type: 'NUMERIC',
        to: cleanPhone,
        from: 'Aurban',
        channel: channel === 'whatsapp' ? 'whatsapp' : 'generic',
        pin_attempts: 3,
        pin_time_in_minutes: 10,
        pin_length: 6,
        pin_placeholder: '< 1234 >',
        message_text: 'Your Aurban verification code is < 1234 >. Valid for 10 minutes. Do not share this code.',
        pin_type: 'NUMERIC',
      };

      const res = await fetch(`${TERMII_BASE}/sms/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.pinId) {
        return new Response(
          JSON.stringify({ success: true, pinId: data.pinId, phone: cleanPhone }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Failed to send OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Verify OTP ────────────────────────────────────────
    if (action === 'verify') {
      const { pinId, pin } = body;

      if (!pinId || !pin) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing pinId or pin' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const payload = {
        api_key: TERMII_API_KEY,
        pin_id: pinId,
        pin,
      };

      const res = await fetch(`${TERMII_BASE}/sms/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.verified === true || data.verified === 'True') {
        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: data.verified || 'Invalid or expired code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "send" or "verify".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
