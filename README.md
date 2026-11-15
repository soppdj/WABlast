# WABlast Pro — Otomatisasi Broadcast & Penjadwalan WhatsApp Donatur

> **Lembaga:** Yayasan Khoirur Rooziqiin Bandung  
> **Tagline:** *"Menebar kebaikan dalam satu klikan."*  
> **Pengembang:** Powered by FateherLab . 2026  
> **Dokumentasi Lengkap:** [MASTER_PROMPT.md](MASTER_PROMPT.md)

Aplikasi web modern (*Single-Page Application*) untuk mengelola pengumuman resmi, laporan program donasi, dan sapaan rutin (seperti pengingat **Sedekah Subuh**) kepada ribuan **Donatur** menggunakan **2–3 nomor WhatsApp pengirim** yang dikunci berdasarkan segmen donatur (*Segment-Locked Multi-Device Routing*) serta dilengkapi fitur **Auto-Forward Balasan Donatur ke 1 Nomor CS Utama**.

---

## 🌟 Fitur Utama

1. **Halaman Sambutan & Login Modern (1 Layar Penuh):**
   - Tampilan bersih tanpa scroll (`h-screen overflow-hidden`) serasi dengan tema dashboard.
   - Sambutan resmi lembaga *"WELCOME TO WABLAST"* dan *"YAYASAN KHOIRUR ROOZIQIIN BANDUNG"*.
   - Tombol cepat **"Isi Demo"** untuk pengujian langsung (`admin@wablast.demo` / `demo1234`).
2. **7 Kategori Segmen Donatur:**
   - Ringkasan metrik donatur di `/donors`: Total Donatur, Donatur Tetap, Zakat, Wakaf, Sedekah Subuh, Donatur Baru, dan Aktif Broadcast.
3. **Manajemen 3 Nomor & PIC Admin:**
   - Label header Admin pada setiap nomor: `Admin 1: [Nama]`, `Admin 2: [Nama]`, `Admin 3: [Nama]`.
   - Input PIC Admin yang dapat diedit langsung per perangkat.
4. **Mekanisme Jeda Acak Kumulatif Anti-Blokir (10–25 Detik):**
   - Jeda acak dihitung kumulatif pada antrean (`broadcast_queue`), mencegah pemblokiran dari WhatsApp dan bebas dari serverless timeout.
5. **Penjadwalan Otomatis Fleksibel:**
   - **Kirim Sekarang:** Langsung menyusun antrean mulai detik ini.
   - **Sekali Jalan:** Menentukan tanggal & jam spesifik (WIB).
   - **Berulang (Recurring):** Otomatis setiap hari (misal `04:30 WIB` untuk Sedekah Subuh) atau mingguan/bulanan.
6. **Auto-Forward Balasan Donatur ke 1 Nomor CS Utama:**
   - Setiap balasan yang masuk ke Nomor A, B, atau C otomatis diteruskan ke 1 Nomor CS Utama dengan tautan instan `wa.me` untuk membalas tanpa membuka 3 HP berbeda.
7. **Pilihan Gateway Fleksibel (Windows Native & Docker):**
   - Dapat dijalankan langsung di Windows menggunakan binary resmi GOWA (`gowa.exe`) tanpa Docker.
   - Mendukung deployment VPS Linux 24/7 menggunakan Docker Compose (`docker-compose.gowa.yml`).

---

## 🚀 Panduan Menjalankan Aplikasi di Windows (Tanpa Docker)

Untuk menjalankan di komputer Windows lokal secara cepat:

1. **Langkah 1 — Jalankan WhatsApp Gateway (GOWA):**
   - Klik dua kali file **`jalankan-gowa.bat`**.
   - Server GOWA akan aktif pada `http://localhost:3000` (User: `admin`, Pass: `rahasia_wablast_pro`).
   - *(Jika `gowa.exe` belum ada, script ini akan mengunduh dan mengekstraknya secara otomatis).*

2. **Langkah 2 — Jalankan Aplikasi Web:**
   - Klik dua kali file **`jalankan-aplikasi.bat`** (atau jalankan `npm run dev`).
   - Buka browser Anda pada alamat **`http://localhost:5173`**.

---

## 🐳 Menjalankan GOWA WhatsApp Gateway di VPS / Linux (Docker)

Gunakan file `docker-compose.gowa.yml` yang sudah disediakan:
```bash
docker compose -f docker-compose.gowa.yml up -d
```
GOWA akan aktif di port `3000` dan siap dipasangkan dengan 2–3 nomor WhatsApp melalui fitur scan QR di menu **Perangkat** WABlast Pro.

---

## 🗄️ Setup Supabase & Edge Functions (Produksi)

1. **Jalankan Skema Database:**  
   Buka **Supabase Dashboard → SQL Editor**, lalu jalankan file [supabase/migrations/00001_init.sql](supabase/migrations/00001_init.sql).

2. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy process-broadcast-queue --no-verify-jwt
   supabase functions deploy gowa-webhook --no-verify-jwt
   ```

3. **Aktifkan Cron Job Antrean di Supabase SQL Editor:**
   ```sql
   SELECT cron.schedule(
       'process-broadcast-queue',
       '* * * * *',
       $$SELECT net.http_post(
           url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-broadcast-queue',
           headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
           body := '{}'::jsonb
       )$$
   );
   ```

---

## 🔒 Keamanan & Perlindungan Data

File-file sensitif berikut diproteksi dan **tidak pernah diunggah** ke repositori publik:
- Kredensial rahasia (`.env`, `.env.local`, file kunci/sertifikat).
- Database sesi WhatsApp (`gowa-bin/storages/*.db`) yang memuat token autentikasi akun WA aktif.
- File binary eksekusi (`gowa-bin/*.exe`).

---

## 📁 Struktur Proyek

```text
wablast-pro/
├── MASTER_PROMPT.md                 # Master prompt & arsitektur lengkap sistem
├── jalankan-gowa.bat                # Script 1-klik engine GOWA Windows (tanpa Docker)
├── jalankan-aplikasi.bat            # Script 1-klik aplikasi web frontend
├── docker-compose.gowa.yml          # Konfigurasi GOWA multi-device untuk VPS
├── supabase/
│   ├── migrations/
│   │   └── 00001_init.sql           # Skema lengkap PostgreSQL, queue & cron
│   └── functions/
│       ├── process-broadcast-queue/ # Edge function pemroses antrean & cron
│       └── gowa-webhook/            # Edge function auto-forward balasan ke CS
├── src/
│   ├── types/database.ts            # Definisi tipe TypeScript & 7 segmen donatur
│   ├── lib/
│   │   ├── supabase.ts              # Client Supabase & pendeteksi Demo Mode
│   │   └── utils.ts                 # Normalisasi nomor, waktu WIB, jeda acak
│   ├── services/
│   │   ├── campaignService.ts       # Service data donatur, kampanye, antrean
│   │   └── gowaClient.ts            # Client API ke GOWA REST
│   ├── context/
│   │   └── AuthContext.tsx          # Autentikasi Admin tunggal
│   ├── components/
│   │   ├── layout/                  # Sidebar & AppLayout
│   │   ├── devices/                 # DeviceCard (Admin PIC) & QrScanModal
│   │   ├── donors/                  # DonorFormModal & CsvImportModal
│   │   └── campaigns/               # ScheduleSelector, VariableChips, WhatsAppPreview
│   ├── pages/
│   │   ├── LoginPage.tsx            # Welcoming & Login 1 layar penuh
│   │   ├── DashboardPage.tsx        # KPI, status nomor, hitung mundur
│   │   ├── DevicesPage.tsx          # Manajemen 3 nomor & kunci segmen
│   │   ├── DonorsPage.tsx           # Database donatur (7 kartu statistik) & import CSV
│   │   ├── CampaignsPage.tsx        # Daftar kampanye broadcast & progress
│   │   ├── NewCampaignPage.tsx      # Buat broadcast & live preview WhatsApp
│   │   └── LogsPage.tsx             # Monitor antrean, log balasan CS & pengaturan
│   ├── mock/data.ts                 # Data dummy realistis untuk mode demo
│   ├── App.tsx                      # Routing & rute terproteksi
│   └── main.tsx
└── package.json
```

---

*WABlast Pro — Yayasan Khoirur Rooziqiin Bandung . Powered by FateherLab . 2026*
