-- ============================================================================
-- WABlast Pro — Supabase PostgreSQL Schema Migration
-- Otomatisasi Broadcast & Penjadwalan WhatsApp Donatur Multi-Device
-- ============================================================================

-- Ekstensi untuk UUID, Cron, dan HTTP Request dari dalam PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 1. Tabel Pengaturan Global Aplikasi (Single Row Configuration)
CREATE TABLE public.app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    app_name TEXT NOT NULL DEFAULT 'WABlast Pro',
    gowa_base_url TEXT NOT NULL DEFAULT 'https://gowa.domain-anda.com',
    gowa_basic_auth_user TEXT DEFAULT '',
    gowa_basic_auth_pass TEXT DEFAULT '',
    gowa_webhook_secret TEXT DEFAULT '',
    main_cs_whatsapp TEXT NOT NULL DEFAULT '6281234567890',
    cs_forward_device_id TEXT DEFAULT '',
    auto_forward_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_min_delay_sec INTEGER NOT NULL DEFAULT 10 CHECK (default_min_delay_sec >= 3),
    default_max_delay_sec INTEGER NOT NULL DEFAULT 25 CHECK (default_max_delay_sec >= default_min_delay_sec),
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 2. Enum untuk Segmen Donatur & Sapaan
CREATE TYPE public.donor_salutation AS ENUM ('Ayah', 'Bunda');
CREATE TYPE public.donor_segment AS ENUM ('donatur_tetap', 'wakaf_infaq', 'sedekah_subuh', 'umum');

-- 3. Tabel Perangkat Pengirim WhatsApp (2-3 Nomor di GOWA, Dikunci per Segmen)
CREATE TABLE public.wa_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT NOT NULL,
    device_id TEXT NOT NULL UNIQUE, -- Contoh: '628111111111@s.whatsapp.net' atau ID device di GOWA
    phone_number TEXT NOT NULL,     -- Format normalisasi: '628111111111'
    locked_segment public.donor_segment NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_ready')),
    daily_sent_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Kontak Donatur
CREATE TABLE public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salutation public.donor_salutation NOT NULL DEFAULT 'Ayah',
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE, -- Wajib format '628xxxxxxxxxx'
    segment public.donor_segment NOT NULL DEFAULT 'donatur_tetap',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT DEFAULT '',
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donors_segment_active ON public.donors(segment, is_active);
CREATE INDEX idx_donors_whatsapp ON public.donors(whatsapp_number);

-- 5. Tabel Template Pesan
CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_segment public.donor_segment NOT NULL DEFAULT 'donatur_tetap',
    opening_greeting TEXT NOT NULL DEFAULT 'Assalamu''alaikum Warahmatullahi Wabarakatuh',
    message_body TEXT NOT NULL, -- Contoh: '{{salam}} {{sapaan}} {{nama}}, semoga senantiasa dalam keberkahan...'
    media_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Kampanye & Jadwal Broadcast (One-Time & Recurring)
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_segment public.donor_segment NOT NULL,
    sender_device_id UUID NOT NULL REFERENCES public.wa_devices(id) ON DELETE RESTRICT,
    opening_greeting TEXT NOT NULL DEFAULT 'Assalamu''alaikum Warahmatullahi Wabarakatuh',
    message_template TEXT NOT NULL,
    media_url TEXT DEFAULT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'one_time', 'recurring')),
    scheduled_at TIMESTAMPTZ,
    recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly')),
    recurring_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Minggu .. 6=Sabtu (untuk daily/weekly)
    recurring_day_of_month INTEGER CHECK (recurring_day_of_month BETWEEN 1 AND 31),
    recurring_time TIME DEFAULT '04:30:00', -- Contoh: 04:30 WIB untuk Sedekah Subuh
    min_delay_sec INTEGER NOT NULL DEFAULT 10 CHECK (min_delay_sec >= 3),
    max_delay_sec INTEGER NOT NULL DEFAULT 25 CHECK (max_delay_sec >= min_delay_sec),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabel Antrean Pengiriman Pesan (Broadcast Queue)
CREATE TABLE public.broadcast_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    sender_device_id UUID NOT NULL REFERENCES public.wa_devices(id) ON DELETE RESTRICT,
    recipient_number TEXT NOT NULL,
    rendered_message TEXT NOT NULL,
    media_url TEXT DEFAULT NULL,
    delay_applied_sec INTEGER NOT NULL DEFAULT 15,
    scheduled_send_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'read', 'failed')),
    gowa_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queue_due ON public.broadcast_queue(status, scheduled_send_at) WHERE status = 'queued';
CREATE INDEX idx_queue_campaign ON public.broadcast_queue(campaign_id, status);

-- 8. Tabel Log Balasan Donatur & Auto-Forward ke CS Utama
CREATE TABLE public.incoming_replies_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_device_id TEXT NOT NULL,
    receiving_device_label TEXT,
    donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL,
    donor_salutation TEXT,
    donor_name TEXT,
    donor_segment TEXT,
    donor_number TEXT NOT NULL,
    incoming_message TEXT NOT NULL,
    forwarded_to_cs_number TEXT NOT NULL,
    forward_status TEXT NOT NULL DEFAULT 'pending' CHECK (forward_status IN ('pending', 'forwarded', 'failed')),
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Fungsi SQL untuk Menyusun Antrean dengan Jeda Acak Kumulatif (10-25 detik)
CREATE OR REPLACE FUNCTION public.enqueue_campaign_jobs(p_campaign_id UUID, p_base_start_time TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign RECORD;
    v_donor RECORD;
    v_cursor_time TIMESTAMPTZ;
    v_random_delay INTEGER;
    v_rendered_text TEXT;
    v_segment_label TEXT;
    v_inserted_count INTEGER := 0;
BEGIN
    SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign % tidak ditemukan', p_campaign_id;
    END IF;

    v_cursor_time := GREATEST(p_base_start_time, NOW());

    v_segment_label := CASE v_campaign.target_segment
        WHEN 'donatur_tetap' THEN 'Donatur Tetap'
        WHEN 'wakaf_infaq' THEN 'Wakaf & Infaq'
        WHEN 'sedekah_subuh' THEN 'Sedekah Subuh'
        ELSE 'Program Kebaikan'
    END;

    FOR v_donor IN
        SELECT * FROM public.donors
        WHERE segment = v_campaign.target_segment
          AND is_active = TRUE
        ORDER BY created_at ASC
    LOOP
        -- Hitung jeda acak antara min_delay_sec dan max_delay_sec (misal 10 - 25 detik)
        v_random_delay := floor(random() * (v_campaign.max_delay_sec - v_campaign.min_delay_sec + 1) + v_campaign.min_delay_sec)::INTEGER;
        v_cursor_time := v_cursor_time + make_interval(secs => v_random_delay);

        -- Render variabel personalisasi Ayah/Bunda
        v_rendered_text := v_campaign.message_template;
        v_rendered_text := replace(v_rendered_text, '{{salam}}', v_campaign.opening_greeting);
        v_rendered_text := replace(v_rendered_text, '{{sapaan}}', v_donor.salutation::TEXT);
        v_rendered_text := replace(v_rendered_text, '{{nama}}', v_donor.full_name);
        v_rendered_text := replace(v_rendered_text, '{{segmen}}', v_segment_label);

        INSERT INTO public.broadcast_queue (
            campaign_id,
            donor_id,
            sender_device_id,
            recipient_number,
            rendered_message,
            media_url,
            delay_applied_sec,
            scheduled_send_at,
            status
        ) VALUES (
            v_campaign.id,
            v_donor.id,
            v_campaign.sender_device_id,
            v_donor.whatsapp_number,
            v_rendered_text,
            v_campaign.media_url,
            v_random_delay,
            v_cursor_time,
            'queued'
        );

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    UPDATE public.campaigns
    SET status = CASE WHEN v_inserted_count > 0 THEN 'running' ELSE 'completed' END,
        total_recipients = total_recipients + v_inserted_count,
        last_run_at = NOW(),
        updated_at = NOW()
    WHERE id = p_campaign_id;

    RETURN v_inserted_count;
END;
$$;

-- 10. Jadwalkan pg_cron untuk Menjalankan Edge Function Antrean Setiap Menit
-- Sesuaikan URL Project Supabase dan Service Role Key Anda
/*
SELECT cron.schedule(
    'process-broadcast-queue-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-broadcast-queue',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
        ),
        body := '{}'::jsonb
    );
    $$
);
*/
