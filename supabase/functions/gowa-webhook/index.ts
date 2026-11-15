// ============================================================================
// Supabase Edge Function: gowa-webhook
// Handles incoming donor WhatsApp replies and auto-forwards to Main CS WhatsApp
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface GowaWebhookPayload {
  event?: string;
  device_id?: string;
  payload?: {
    id?: string;
    from?: string;
    from_me?: boolean;
    text?: string;
    conversation?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: GowaWebhookPayload = await req.json();

    const event = body.event;
    const deviceId = body.device_id;
    const msg = body.payload;

    // 1. Validation & Filter Loop
    if (!event || event !== 'message' || !msg) {
      return new Response(JSON.stringify({ message: 'Ignored: not a standard message event' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ignore if sent by ourselves
    if (msg.from_me === true) {
      return new Response(JSON.stringify({ message: 'Ignored: outgoing message from_me' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawFrom = msg.from || '';

    // Ignore group messages
    if (rawFrom.includes('@g.us')) {
      return new Response(JSON.stringify({ message: 'Ignored: group message' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean sender phone number: 6285678901234@s.whatsapp.net -> 6285678901234
    const senderNumber = rawFrom.replace(/[^0-9]/g, '');
    const messageText = msg.text || msg.conversation || '';

    if (!senderNumber || !messageText.trim()) {
      return new Response(JSON.stringify({ message: 'Ignored: empty sender or text' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch App Settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!settings) {
      return new Response(JSON.stringify({ error: 'App settings not found' }), { status: 500 });
    }

    const mainCsNumber = (settings.main_cs_whatsapp || '').replace(/[^0-9]/g, '');

    // Ignore if message is from the Main CS WhatsApp itself (avoid loop)
    if (senderNumber === mainCsNumber) {
      return new Response(JSON.stringify({ message: 'Ignored: message from main CS' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if sender is one of our own sender devices
    const { data: ownDevices } = await supabase.from('wa_devices').select('phone_number, device_id, device_name');
    const ownNumbers = (ownDevices || []).map((d: { phone_number: string }) => d.phone_number.replace(/[^0-9]/g, ''));

    if (ownNumbers.includes(senderNumber)) {
      return new Response(JSON.stringify({ message: 'Ignored: message from own sender device' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find label of the device that received the message
    const receivingDevice = (ownDevices || []).find(
      (d: { device_id: string }) => d.device_id === deviceId
    );
    const receivingDeviceLabel = receivingDevice?.device_name || deviceId || 'WhatsApp Pengirim';

    // 3. Lookup Donor in Database
    const { data: donor } = await supabase
      .from('donors')
      .select('*')
      .eq('whatsapp_number', senderNumber)
      .maybeSingle();

    const donorSalutation = donor?.salutation || 'Ayah/Bunda';
    const donorName = donor?.full_name || 'Donatur Baru';
    const donorSegment = donor?.segment ? donor.segment.toUpperCase().replace('_', ' ') : 'UMUM';

    // Format current WIB timestamp
    const nowWib = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 4. Send Forward Notification to Main CS WhatsApp
    let forwardStatus: 'forwarded' | 'failed' | 'pending' = 'pending';
    let errorMessage: string | null = null;

    if (settings.auto_forward_enabled && mainCsNumber) {
      const forwardText =
`📩 *BALASAN DONATUR — WABlast Pro*
────────────────────
👤 *Pengirim:* ${donorSalutation} ${donorName} (+${senderNumber})
🏷️ *Segmen:* ${donorSegment}
📱 *Masuk ke:* ${receivingDeviceLabel}
🕒 *Waktu:* ${nowWib} WIB

💬 *Isi Pesan:*
"${messageText}"
────────────────────
👉 *Balas Langsung dari CS Utama:*
https://wa.me/${senderNumber}`;

      const forwardDeviceId = settings.cs_forward_device_id || deviceId || ownDevices?.[0]?.device_id;
      const gowaBaseUrl = settings.gowa_base_url.replace(/\/+$/, '');

      let authHeader: string | null = null;
      if (settings.gowa_basic_auth_user && settings.gowa_basic_auth_pass) {
        authHeader = `Basic ${btoa(`${settings.gowa_basic_auth_user}:${settings.gowa_basic_auth_pass}`)}`;
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Device-Id': forwardDeviceId,
        };
        if (authHeader) headers['Authorization'] = authHeader;

        const forwardRes = await fetch(`${gowaBaseUrl}/send/message`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phone: `${mainCsNumber}@s.whatsapp.net`,
            message: forwardText,
          }),
        });

        if (forwardRes.ok) {
          forwardStatus = 'forwarded';
        } else {
          forwardStatus = 'failed';
          errorMessage = `HTTP ${forwardRes.status}: GOWA forward failed`;
        }
      } catch (err: unknown) {
        forwardStatus = 'failed';
        errorMessage = err instanceof Error ? err.message : 'Network error forwarding to CS';
      }
    }

    // 5. Save Record to incoming_replies_log
    await supabase.from('incoming_replies_log').insert({
      receiving_device_id: deviceId || 'unknown',
      receiving_device_label: receivingDeviceLabel,
      donor_id: donor?.id || null,
      donor_salutation: donorSalutation,
      donor_name: donorName,
      donor_segment: donorSegment,
      donor_number: senderNumber,
      incoming_message: messageText,
      forwarded_to_cs_number: mainCsNumber,
      forward_status: forwardStatus,
      error_message: errorMessage,
      received_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        senderNumber,
        forwardStatus,
        donorName,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal webhook error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
