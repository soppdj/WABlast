// ============================================================================
// Supabase Edge Function: process-broadcast-queue
// Triggered every minute by pg_cron or HTTP POST
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // 1. Fetch Global Settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'App settings not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gowaBaseUrl = settings.gowa_base_url.replace(/\/+$/, '');
    let gowaAuthHeader: string | null = null;
    if (settings.gowa_basic_auth_user && settings.gowa_basic_auth_pass) {
      const creds = btoa(`${settings.gowa_basic_auth_user}:${settings.gowa_basic_auth_pass}`);
      gowaAuthHeader = `Basic ${creds}`;
    }

    // 2. Check and Enqueue Due Scheduled / Recurring Campaigns
    const { data: dueCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .or(`scheduled_at.lte.${nowIso},next_run_at.lte.${nowIso}`);

    const enqueuedCampaigns: string[] = [];

    if (dueCampaigns && dueCampaigns.length > 0) {
      for (const camp of dueCampaigns) {
        // Enqueue donor jobs
        await supabase.rpc('enqueue_campaign_jobs', {
          p_campaign_id: camp.id,
          p_base_start_time: nowIso,
        });
        enqueuedCampaigns.push(camp.title);

        // If recurring, calculate next run time
        if (camp.schedule_type === 'recurring') {
          const nextRun = new Date();
          const [hour, minute] = (camp.recurring_time || '04:30:00').split(':').map(Number);
          nextRun.setHours(hour, minute, 0, 0);

          if (camp.recurring_pattern === 'daily') {
            nextRun.setDate(nextRun.getDate() + 1);
          } else if (camp.recurring_pattern === 'weekly') {
            nextRun.setDate(nextRun.getDate() + 7);
          } else if (camp.recurring_pattern === 'monthly') {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }

          await supabase
            .from('campaigns')
            .update({
              status: 'scheduled',
              next_run_at: nextRun.toISOString(),
              last_run_at: nowIso,
            })
            .eq('id', camp.id);
        }
      }
    }

    // 3. Process Due Queue Items (Batch of up to 6 items per minute)
    const { data: queueItems, error: queueError } = await supabase
      .from('broadcast_queue')
      .select('*, sender_device:wa_devices(*)')
      .eq('status', 'queued')
      .lte('scheduled_send_at', nowIso)
      .order('scheduled_send_at', { ascending: true })
      .limit(6);

    let sentCount = 0;
    let failedCount = 0;

    if (queueItems && queueItems.length > 0) {
      for (const item of queueItems) {
        const deviceId = item.sender_device?.device_id;
        if (!deviceId) {
          await supabase
            .from('broadcast_queue')
            .update({
              status: 'failed',
              error_message: 'Perangkat pengirim tidak ditemukan',
            })
            .eq('id', item.id);
          failedCount++;
          continue;
        }

        // Mark as sending
        await supabase
          .from('broadcast_queue')
          .update({ status: 'sending' })
          .eq('id', item.id);

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId,
          };
          if (gowaAuthHeader) {
            headers['Authorization'] = gowaAuthHeader;
          }

          // Format target phone: 628xxx@s.whatsapp.net
          const phoneJid = `${item.recipient_number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

          let gowaRes;
          if (item.media_url) {
            // Send with image
            gowaRes = await fetch(`${gowaBaseUrl}/send/image`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                phone: phoneJid,
                caption: item.rendered_message,
                image_url: item.media_url,
              }),
            });
          } else {
            // Send text
            gowaRes = await fetch(`${gowaBaseUrl}/send/message`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                phone: phoneJid,
                message: item.rendered_message,
              }),
            });
          }

          const resJson = await gowaRes.json();

          if (gowaRes.ok && (resJson.code === 200 || resJson.status === 'success' || resJson.results)) {
            const messageId = resJson.results?.id || resJson.results?.message_id || 'OK';

            await supabase
              .from('broadcast_queue')
              .update({
                status: 'sent',
                gowa_message_id: String(messageId),
                sent_at: new Date().toISOString(),
              })
              .eq('id', item.id);

            // Increment campaign sent count
            await supabase.rpc('increment_campaign_sent', {
              p_campaign_id: item.campaign_id,
            }).catch(async () => {
              // Fallback manual update if RPC is missing
              const { data: c } = await supabase.from('campaigns').select('sent_count').eq('id', item.campaign_id).single();
              if (c) {
                await supabase.from('campaigns').update({ sent_count: c.sent_count + 1 }).eq('id', item.campaign_id);
              }
            });

            // Increment daily count on device
            const { data: dev } = await supabase.from('wa_devices').select('daily_sent_count').eq('id', item.sender_device_id).single();
            if (dev) {
              await supabase.from('wa_devices').update({ daily_sent_count: dev.daily_sent_count + 1 }).eq('id', item.sender_device_id);
            }

            sentCount++;
          } else {
            const errMsg = resJson.message || `GOWA error ${gowaRes.status}`;
            await supabase
              .from('broadcast_queue')
              .update({
                status: 'failed',
                error_message: errMsg,
              })
              .eq('id', item.id);

            const { data: c } = await supabase.from('campaigns').select('failed_count').eq('id', item.campaign_id).single();
            if (c) {
              await supabase.from('campaigns').update({ failed_count: c.failed_count + 1 }).eq('id', item.campaign_id);
            }

            failedCount++;
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Network error to GOWA';
          await supabase
            .from('broadcast_queue')
            .update({
              status: 'failed',
              error_message: errMsg,
            })
            .eq('id', item.id);
          failedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enqueuedCampaigns,
        processed: queueItems?.length || 0,
        sent: sentCount,
        failed: failedCount,
        timestamp: nowIso,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (globalErr: unknown) {
    const errorMsg = globalErr instanceof Error ? globalErr.message : 'Internal worker error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
