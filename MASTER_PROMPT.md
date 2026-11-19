# MASTER PROMPT: WABlast Pro — Otomasi Broadcast & Penjadwalan WhatsApp Multi-Device

> **Versi Dokumen:** 2.5 (Terbaru - 19 November 2026)  
> **Lembaga:** Yayasan Khoirur Rooziqiin Bandung  
> **Pengembang:** Powered by FatherLab © 2026  
> **Tagline:** *"Menebar kebaikan dalam satu klikan."*  
> **Repositori Resmi:** [https://github.com/soppdj/WABlast](https://github.com/soppdj/WABlast)

Salin seluruh isi dokumen ini ke dalam **Antigravity** atau *AI Coding Agent* untuk membangun, memperbarui, atau mereplikasi aplikasi **WABlast Pro** secara utuh (*end-to-end*).

---

## 1. Konteks & Tujuan Sistem

Bangun aplikasi web *Single-Page Application* (PWA-ready) bernama **WABlast Pro** untuk otomasi pengiriman pesan WhatsApp massal yang cerdas, aman, dan anti-blokir bagi **Yayasan Khoirur Rooziqiin Bandung**.

Aplikasi ini mengintegrasikan **3 nomor WhatsApp pengirim** yang dikunci berdasarkan segmen donatur (*Segment-Locked Multi-Device Routing*) serta dikelola oleh PIC Admin masing-masing, pengingat harian rutin (**Sedekah Subuh** pukul 04:30 WIB), laporan infaq & wakaf, dan fitur penerusan otomatis balasan donatur ke **1 Nomor WhatsApp CS Utama**.

### Pilihan Menjalankan Gateway WhatsApp (GOWA):
1. **Windows Native (Tanpa Docker - Direkomendasikan untuk Komputer Lokal):**
   - Menjalankan file binary resmi `gowa.exe` langsung di Windows via script `jalankan-gowa.bat`.
   - Berjalan pada port `3000` (`http://localhost:3000`) dengan Basic Auth `admin:rahasia_wablast_pro`.
2. **Docker Compose (Untuk VPS / Cloud Server 24/7):**
   - Menggunakan image `aldinokemal2104/go-whatsapp-web-multidevice:latest` via `docker-compose.gowa.yml`.

### Tech Stack Utama:
- **Frontend:** React 18, Vite, TypeScript (Strict), Tailwind CSS v4, Lucide React Icons.
- **Database & Backend:** Supabase (PostgreSQL, Supabase Auth, Supabase Edge Functions / Deno, `pg_cron`, `pg_net`, Realtime).
- **WhatsApp Engine:** GOWA (*Go WhatsApp Web Multi-Device*) v9.9.0.

---

## 2. Aturan Bisnis Utama (Core Business Rules)

### A. Kategori Segmen Donatur (8 Kategori Resmi)
Tabel donatur dan kartu statistik ringkasan di halaman `/donors` wajib menampilkan 8 metrik berikut:
1. **Total Donatur** (Semua kontak aktif)
2. **Donatur Tetap** (`donatur_tetap`)
3. **Zakat** (`zakat`)
4. **Wakaf** (`wakaf`)
5. **Sedekah Subuh** (`sedekah_subuh`)
6. **Wali Asuh** (`wali_asuh` - Orang tua asuh santri yatim)
7. **Donatur Baru** (`donatur_baru`)
8. **Aktif Broadcast** (Kontak berstatus aktif)

### B. Standardisasi Sapaan & Variabel Personalisasi
Setiap donatur disapa dengan panggilan takzim:
- Sapaan: **`Ayah`** atau **`Bunda`**.
- Variabel template yang didukung:
  - `{{salam}}` : Salam waktu otomatis (cth: *"Assalamu'alaikum Warahmatullahi Wabarakatuh"*).
  - `{{sapaan}}` : `Ayah` atau `Bunda`.
  - `{{nama}}` : Nama lengkap donatur.
  - `{{segmen}}` : Nama program / segmen donatur.

### C. Manajemen Perangkat & PIC Admin (Multi-Device)
Halaman `/devices` mengelola 3 nomor WhatsApp pengirim:
- **Header Label:**
  - `Admin 1: [Nama Admin PIC]`
  - `Admin 2: [Nama Admin PIC]`
  - `Admin 3: [Nama Admin PIC]`
- Setiap kartu memiliki field input **Nama PIC Admin** yang dapat diedit dan disimpan.
- Setiap nomor dikunci ke segmen donatur tertentu secara eksklusif.

### D. Algoritma Jeda Acak Anti-Blokir (Random Delay)
- Pengiriman massal menggunakan jeda acak **10 hingga 25 detik per nomor**.
- Jadwal pengiriman dihitung secara kumulatif:
  $$\text{scheduled\_send\_at}_{i} = \text{scheduled\_send\_at}_{i-1} + \text{random}(10, 25)$$
- Mencegah akun WhatsApp terdeteksi sebagai bot dan bebas dari kendala *timeout* serverless.

### E. Auto-Forward Balasan Donatur ke 1 Nomor CS Utama
- Semua pesan masuk dari donatur ke Nomor A, B, atau C diteruskan otomatis ke **1 Nomor WhatsApp CS Utama** (`main_cs_whatsapp`).
- Dilengkapi format informasi donatur dan link klik-untuk-balas langsung: `https://wa.me/628...`.

---

## 3. Spesifikasi UI/UX & Halaman Aplikasi

### 1. Halaman Welcoming & Login (`/login`)
- **Tampilan 1 Layar Penuh Tanpa Scroll** (`h-screen overflow-hidden`).
- **Skema Warna Serasi dengan Dashboard:** Background `#F8FAFC`, Teks Utama `#0F172A`, Aksen Hijau `#059669`.
- **Top Header Bar:** Bersih dan elegan (tanpa label status perangkat di pojok kanan atas).
- **Kolom Kiri (Welcoming & Identitas Lembaga):**
  - Teks Pengantar: **`WELCOME TO`** (huruf kapital tebal).
  - Nama Aplikasi: **`WABLAST PRO`** (ukuran besar proporsional setara dengan nama yayasan).
  - Nama Lembaga:
    - Baris 1 (Utuh satu baris tanpa terpotong): **`YAYASAN KHOIRUR ROOZIQIIN`**
    - Baris 2: **`BANDUNG`**
  - Slogan / Tagline (Cetak miring dengan titik):  
    *“Menebar kebaikan dalam satu klikan.”*
  - Deskripsi singkat tujuan aplikasi.
- **Kolom Kanan (Formulir Login):**
  - Kotak login bersih dengan ikon User & Password.
  - Nilai username dan password disembunyikan/dikosongkan secara default saat form pertama dibuka.
  - Akun login admin demo: Username `admin@wablast.ykr` dan Password **`Admin1@ykr`**.
  - Tombol utama: Hijau zamrud `bg-emerald-600 hover:bg-emerald-700`.
- **Footer Resmi di Bawah Layar:**
  ```text
  WABlast Yayasan Khoirur Rooziqiin . Powered by FatherLab © 2026
  ```

### 2. Dashboard (`/dashboard`)
- KPI ringkasan donatur, antrean berjalan (*live queue*), pesan terkirim, dan status penerusan CS.
- Live card status koneksi 3 nomor WhatsApp (Online/Offline) dan counter kirim harian.
- Hitung mundur jadwal otomatis berikutnya (cth: Pengingat Sedekah Subuh Besok 04:30 WIB).

### 3. Manajemen Perangkat (`/devices`)
- 3 Kartu perangkat WhatsApp dengan label Admin PIC (`Admin 1: ...`, `Admin 2: ...`, `Admin 3: ...`).
- Tombol Scan QR Code (terhubung ke endpoint GOWA `/app/login`) dan tombol Tes Kirim Pesan.
- Input editable untuk Label Nomor, Nomor HP, Device ID, Kunci Segmen, dan Nama PIC Admin.

### 4. Database Donatur (`/donors`)
- 7 Kartu statistik segmen di bagian atas.
- Pencarian multi-parameter (nama, nomor WA, catatan).
- Filter segmen (Donatur Tetap, Zakat, Wakaf, Sedekah Subuh, Donatur Baru, Umum) & filter sapaan (Ayah/Bunda).
- Modal Tambah/Edit Donatur dengan normalisasi otomatis format nomor `628...`.
- Modal Import CSV dengan pemetaan kolom otomatis.

### 5. Buat Broadcast & Jadwal (`/campaigns/new` & `/campaigns`)
- Kunci segmen otomatis ke nomor pengirim terkait.
- Editor pesan dengan chip variabel dinamis (`+ {{salam}}`, `+ {{sapaan}}`, `+ {{nama}}`, `+ {{segmen}}`).
- Pengaturan jeda acak anti-blokir (Min 10s - Max 25s) dengan kalkulator estimasi total durasi.
- Pilihan mode: Kirim Sekarang, Jadwal Sekali Jalan, atau Jadwal Berulang (Daily/Weekly/Monthly).
- Live Interactive WhatsApp Chat Preview di sisi kanan.

### 6. Monitor Antrean & Pengaturan (`/logs`)
- Progress bar pengiriman antrean real-time.
- Riwayat pesan balasan donatur dan status forward ke CS Utama.
- Form konfigurasi GOWA URL, Basic Auth, Webhook Secret, dan Nomor CS Utama.
- Panduan interaktif cara menjalankan GOWA secara lokal tanpa Docker.

---

## 4. Skema Database PostgreSQL (Supabase Migration)

```sql
-- Ekstensi
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Enums
CREATE TYPE public.donor_salutation AS ENUM ('Ayah', 'Bunda');
CREATE TYPE public.donor_segment AS ENUM (
    'donatur_tetap',
    'zakat',
    'wakaf',
    'wakaf_infaq',
    'sedekah_subuh',
    'wali_asuh',
    'donatur_baru',
    'umum'
);

-- 1. Pengaturan Aplikasi
CREATE TABLE public.app_settings (
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
    default_min_delay_sec INTEGER NOT NULL DEFAULT 10,
    default_max_delay_sec INTEGER NOT NULL DEFAULT 25,
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 2. Perangkat WhatsApp (3 Nomor Multi-Device)
CREATE TABLE public.wa_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_name TEXT NOT NULL DEFAULT 'Ustadz Ahmad',
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

-- 3. Kontak Donatur
CREATE TABLE public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salutation public.donor_salutation NOT NULL DEFAULT 'Ayah',
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE,
    segment public.donor_segment NOT NULL DEFAULT 'donatur_tetap',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT DEFAULT '',
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_donors_segment_active ON public.donors(segment, is_active);

-- 4. Kampanye Broadcast
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_segment public.donor_segment NOT NULL,
    sender_device_id UUID NOT NULL REFERENCES public.wa_devices(id),
    opening_greeting TEXT NOT NULL DEFAULT 'Assalamu''alaikum Warahmatullahi Wabarakatuh',
    message_template TEXT NOT NULL,
    media_url TEXT DEFAULT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'one_time', 'recurring')),
    scheduled_at TIMESTAMPTZ,
    recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly')),
    recurring_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    recurring_time TIME DEFAULT '04:30:00',
    min_delay_sec INTEGER NOT NULL DEFAULT 10,
    max_delay_sec INTEGER NOT NULL DEFAULT 25,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Antrean Pesan (Broadcast Queue)
CREATE TABLE public.broadcast_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    sender_device_id UUID NOT NULL REFERENCES public.wa_devices(id),
    recipient_number TEXT NOT NULL,
    rendered_message TEXT NOT NULL,
    media_url TEXT DEFAULT NULL,
    delay_applied_sec INTEGER NOT NULL DEFAULT 15,
    scheduled_send_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
    gowa_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_due ON public.broadcast_queue(status, scheduled_send_at) WHERE status = 'queued';

-- 6. Log Balasan & Penerusan CS
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
```

---

## 5. Keamanan & Kebijakan Berbagi Kode (*Security Rules*)

Demi menjaga keamanan privasi akun donatur dan integritas kredensial lembaga, aturan berikut **WAJIB** dipatuhi:
1. **DILARANG MENGUNGGAH:**
   - File konfigurasi variabel rahasia: `.env`, `.env.local`, `.env.*`.
   - File binary eksekusi: `gowa-bin/gowa.exe` atau binary lainnya.
   - Database sesi WhatsApp: `gowa-bin/storages/*.db` (berisi auth token, session WhatsApp aktif, dan riwayat chat).
   - Folder dependensi: `node_modules/` dan folder build `dist/`.
2. **FILE YANG DIBAGIKAN:**
   - Gunakan `.env.example` sebagai referensi struktur variabel environment tanpa data rahasia.
   - Script batch otomatis (`jalankan-gowa.bat` dan `jalankan-aplikasi.bat`) yang aman dan mandiri.
   - File dokumentasi panduan dan skema database migration.

---

## 6. Riwayat Pembaruan & Changelog

| Versi | Tanggal | Pembaruan Utama |
|---|---|---|
| **v1.0** | 12 Nov 2026 | Inisialisasi arsitektur WABlast Pro, Supabase schema, integrasi GOWA REST API, dan 5 modul antarmuka utama. |
| **v2.0** | 14 Nov 2026 | Desain ulang halaman Welcoming & Login 1 layar penuh, penyesuaian 7 kategori donatur di `/donors`, penambahan Admin PIC pada setiap nomor di `/devices`, penyediaan GOWA native Windows (`gowa.exe`) tanpa Docker. |
| **v2.1** | 15 Nov 2026 | Perbaikan tipografi & pemenggalan nama yayasan per baris, penghapusan animasi tengah sesuai sketsa revisi, penguatan `.gitignore` untuk mencegah kebocoran file sesi WhatsApp, dan penerbitan Master Prompt resmi. |
| **v2.2** | 15 Nov 2026 | Penyesuaian nama `YAYASAN KHOIRUR ROOZIQIIN` satu baris utuh, pembersihan banner demo & catatan akun, standarisasi username `admin@wablast.ykr`, pembaharuan footer dengan simbol `© 2026`, dan sinkronisasi otomatis ke GitHub. |
| **v2.3** | 15 Nov 2026 | Perombakan header sambutan menjadi `WELCOME TO` + `WABLAST PRO` berukuran setara nama yayasan, penghapusan status online di pojok kanan atas, penyembunyian default isi username & password di form, serta pengubahan password admin menjadi `Admin1@ykr`. |
| **v2.4** | 15 Nov 2026 | Penambahan kategori program donatur "Wali Asuh" (total 8 kotak metrik), perbaikan persistensi CRUD donatur (tambah/edit/hapus langsung tersimpan dan terupdate di tampilan), serta sinkronisasi skema SQL Supabase. |
| **v2.5** | 19 Nov 2026 | Koreksi tipografi nama pengembang pada footer dan metadata dokumen menjadi "FatherLab", serta sinkronisasi repositori GitHub. |
