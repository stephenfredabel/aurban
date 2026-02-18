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

// Restrict CORS to known Aurban origins only — never wildcard in production
const ALLOWED_ORIGINS = [
  'https://aurban.com',
  'https://www.aurban.com',
  // Add Render preview URL here if needed, e.g.:
  // 'https://aurban-web.onrender.com',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY');
    if (!TERMII_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'OTP service is not available' }),
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
        JSON.stringify({ success: false, error: 'Failed to send verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Verify OTP ────────────────────────────────────────
    if (action === 'verify') {
      const { pinId, pin } = body;

      if (!pinId || !pin) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing verification data' }),
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
        JSON.stringify({ success: false, error: 'Invalid or expired code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Service error. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
