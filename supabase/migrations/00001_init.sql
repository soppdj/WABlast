-- ============================================================================
-- WABlast Pro — Supabase PostgreSQL Schema Migration (Lengkap & Siap Pakai)
-- Yayasan Khoirur Rooziqiin Bandung
-- Powered by FateherLab © 2026
-- ============================================================================
-- Petunjuk:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard) -> Pilih Project Anda.
-- 2. Masuk ke menu "SQL Editor" di bilah navigasi kiri.
-- 3. Buat "New Query", salin seluruh isi file ini, lalu klik "Run".
-- ============================================================================

-- Ekstensi PostgreSQL yang Dibutuhkan
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.donor_salutation AS ENUM ('Ayah', 'Bunda');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.donor_segment AS ENUM (
        'donatur_tetap',
        'zakat',
        'wakaf',
        'wakaf_infaq',
        'sedekah_subuh',
        'donatur_baru',
        'umum'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABEL PENGATURAN GLOBAL (Single Row Configuration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    app_name TEXT NOT NULL DEFAULT 'WABlast Pro',
    foundation_name TEXT NOT NULL DEFAULT 'Yayasan Khoirur Rooziqiin Bandung',
    gowa_base_url TEXT NOT NULL DEFAULT 'http://localhost:3000',
    gowa_basic_auth_user TEXT DEFAULT 'admin',
    gowa_basic_auth_pass TEXT DEFAULT 'rahasia_wablast_pro',
    gowa_webhook_secret TEXT DEFAULT 'rahasia_webhook_wablast',
    main_cs_whatsapp TEXT NOT NULL DEFAULT '6281234567890',
    cs_forward_device_id TEXT DEFAULT '',
    auto_forward_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_min_delay_sec INTEGER NOT NULL DEFAULT 10 CHECK (default_min_delay_sec >= 3),
    default_max_delay_sec INTEGER NOT NULL DEFAULT 25 CHECK (default_max_delay_sec >= default_min_delay_sec),
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inisialisasi baris pengaturan awal jika belum ada
INSERT INTO public.app_settings (id, app_name, foundation_name, gowa_base_url, gowa_basic_auth_user, gowa_basic_auth_pass)
VALUES (1, 'WABlast Pro', 'Yayasan Khoirur Rooziqiin Bandung', 'http://localhost:3000', 'admin', 'rahasia_wablast_pro')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. TABEL PERANGKAT WHATSAPP (3 Nomor Multi-Device dengan Admin PIC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wa_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_name TEXT NOT NULL DEFAULT 'Admin',
    device_name TEXT NOT NULL,
    device_id TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    locked_segment public.donor_segment NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_ready')),
    daily_sent_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 3 Perangkat Default untuk Yayasan Khoirur Rooziqiin
INSERT INTO public.wa_devices (admin_name, device_name, device_id, phone_number, locked_segment, status)
VALUES 
    ('Ustadz Ahmad Fauzi', 'WA 1 - Layanan Donatur Tetap', '628111111111@s.whatsapp.net', '628111111111', 'donatur_tetap', 'disconnected'),
    ('Ustadzah Fatimah', 'WA 2 - Wakaf & Infaq Program', '628222222222@s.whatsapp.net', '628222222222', 'wakaf_infaq', 'disconnected'),
    ('Kang Ridwan', 'WA 3 - Sedekah Subuh & Umum', '628333333333@s.whatsapp.net', '628333333333', 'sedekah_subuh', 'disconnected')
ON CONFLICT (device_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. TABEL KONTAK DONATUR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salutation public.donor_salutation NOT NULL DEFAULT 'Ayah',
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE, -- Format standar normal: '628xxxxxxxxxx'
    segment public.donor_segment NOT NULL DEFAULT 'donatur_tetap',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT DEFAULT '',
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_segment_active ON public.donors(segment, is_active);
CREATE INDEX IF NOT EXISTS idx_donors_whatsapp ON public.donors(whatsapp_number);

-- Seed Data Contoh Donatur
INSERT INTO public.donors (salutation, full_name, whatsapp_number, segment, is_active, notes)
VALUES
    ('Ayah', 'Ahmad Fauzi', '6281234500001', 'donatur_tetap', TRUE, 'Donatur rutin operasional yatim'),
    ('Bunda', 'Siti Aminah', '6281234500002', 'donatur_tetap', TRUE, 'Donatur tetap sejak 2021'),
    ('Ayah', 'Haji Mahmud Syakir', '6281234500003', 'zakat', TRUE, 'Zakat Maal tahunan'),
    ('Bunda', 'Hajjah Mariam', '6281234500004', 'wakaf', TRUE, 'Wakaf pembangunan asrama santri'),
    ('Ayah', 'Muhammad Rizki', '6281234500005', 'wakaf_infaq', TRUE, 'Infaq pembebasan lahan tahfidz'),
    ('Ayah', 'Usman Hakim', '6281234500006', 'sedekah_subuh', TRUE, 'Sedekah subuh harian aktif'),
    ('Bunda', 'Aisyah Putri', '6281234500007', 'sedekah_subuh', TRUE, 'Rutinitas subuh bersama keluarga'),
    ('Bunda', 'Dewi Lestari', '6281234500008', 'donatur_baru', TRUE, 'Mendaftar via landing page'),
    ('Ayah', 'Budi Santoso', '6281234500009', 'umum', TRUE, 'Program santunan dhuafa berkala')
ON CONFLICT (whatsapp_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. TABEL TEMPLATE PESAN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_segment public.donor_segment NOT NULL DEFAULT 'donatur_tetap',
    opening_greeting TEXT NOT NULL DEFAULT 'Assalamu''alaikum Warahmatullahi Wabarakatuh',
    message_body TEXT NOT NULL,
    media_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.message_templates (title, target_segment, opening_greeting, message_body)
VALUES 
    (
        'Pengingat & Doa Sedekah Subuh',
        'sedekah_subuh',
        'Assalamu''alaikum Warahmatullahi Wabarakatuh',
        '{{salam}}\n\nSemoga {{sapaan}} {{nama}} sekeluarga senantiasa berada dalam lindungan dan keberkahan Allah SWT.\n\nMemulai fajar penuh berkah ini, mari bersama mengalirkan doa dan kebaikan melalui Sedekah Subuh untuk para santri yatim penghafal Al-Qur''an Yayasan Khoirur Rooziqiin Bandung.\n\nJazakumullah khairan katsiran atas istiqomah {{sapaan}}.'
    ),
    (
        'Laporan Penyaluran Donatur Tetap',
        'donatur_tetap',
        'Assalamu''alaikum Warahmatullahi Wabarakatuh',
        '{{salam}}\n\nYth. {{sapaan}} {{nama}} yang kami muliakan,\n\nAlhamdulillah, titipan donasi {{segmen}} telah kami salurkan untuk kebutuhan beras dan nutrisi santri pekan ini. Terima kasih atas ketulusan {{sapaan}} yang senantiasa menemani langkah dakwah kami.'
    )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. TABEL KAMPANYE BROADCAST (One-Time & Recurring)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
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
    recurring_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    recurring_day_of_month INTEGER CHECK (recurring_day_of_month BETWEEN 1 AND 31),
    recurring_time TIME DEFAULT '04:30:00',
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

-- ----------------------------------------------------------------------------
-- 7. TABEL ANTREAN PENGIRIMAN PESAN (Broadcast Queue)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broadcast_queue (
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

CREATE INDEX IF NOT EXISTS idx_queue_due ON public.broadcast_queue(status, scheduled_send_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_queue_campaign ON public.broadcast_queue(campaign_id, status);

-- ----------------------------------------------------------------------------
-- 8. TABEL LOG BALASAN DONATUR & AUTO-FORWARD CS UTAMA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incoming_replies_log (
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

-- ----------------------------------------------------------------------------
-- 9. FUNGSI SQL: Menyusun Antrean dengan Jeda Acak Kumulatif (Anti-Blokir)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_campaign_jobs(
    p_campaign_id UUID,
    p_base_start_time TIMESTAMPTZ DEFAULT NOW()
)
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
        WHEN 'zakat' THEN 'Zakat'
        WHEN 'wakaf' THEN 'Wakaf'
        WHEN 'wakaf_infaq' THEN 'Wakaf & Infaq'
        WHEN 'sedekah_subuh' THEN 'Sedekah Subuh'
        WHEN 'donatur_baru' THEN 'Donatur Baru'
        ELSE 'Program Kebaikan'
    END;

    FOR v_donor IN
        SELECT * FROM public.donors
        WHERE segment = v_campaign.target_segment
          AND is_active = TRUE
        ORDER BY created_at ASC
    LOOP
        -- Hitung jeda acak kumulatif 10 - 25 detik
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

-- ----------------------------------------------------------------------------
-- 10. KEAMANAN & ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Mengaktifkan RLS pada seluruh tabel
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_replies_log ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Mengizinkan akses baca & tulis untuk Anon (frontend client) dan Authenticated
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow anon all" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow authenticated all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 11. SUPABASE REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
-- Memungkinkan update live progress antrean dan status perangkat ke browser
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_queue;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_devices;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incoming_replies_log;
EXCEPTION
    WHEN others THEN null;
END $$;

-- ============================================================================
-- Selesai! Skema Supabase siap digunakan untuk menghubungkan aplikasi WABlast Pro.
-- ============================================================================
