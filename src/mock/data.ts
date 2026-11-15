// ============================================================================
// WABlast Pro — Mock Data for Demo Mode
// Provides realistic data when Supabase is not configured
// ============================================================================

import type {
  AppSettings, WaDevice, Donor, Campaign, BroadcastQueueItem,
  IncomingReplyLog, DashboardStats, MessageTemplate,
} from '../types/database';

export const mockSettings: AppSettings = {
  id: 1,
  app_name: 'WABlast Pro',
  gowa_base_url: 'https://gowa.example.com',
  gowa_basic_auth_user: 'admin',
  gowa_basic_auth_pass: '••••••',
  gowa_webhook_secret: 'rahasia_webhook',
  main_cs_whatsapp: '6281234567890',
  cs_forward_device_id: '',
  auto_forward_enabled: true,
  default_min_delay_sec: 10,
  default_max_delay_sec: 25,
  timezone: 'Asia/Jakarta',
  updated_at: new Date().toISOString(),
};

export const mockDevices: WaDevice[] = [
  {
    id: 'dev-1',
    device_name: 'WA 1 - Layanan Donatur Tetap',
    admin_name: 'Admin 1: Ustadz Fauzi',
    device_id: '628111111111@s.whatsapp.net',
    phone_number: '628111111111',
    locked_segment: 'donatur_tetap',
    status: 'connected',
    daily_sent_count: 127,
    last_seen_at: new Date().toISOString(),
    created_at: '2024-01-15T08:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-2',
    device_name: 'WA 2 - Wakaf & Infaq Program',
    admin_name: 'Admin 2: Ustadzah Fatimah',
    device_id: '628222222222@s.whatsapp.net',
    phone_number: '628222222222',
    locked_segment: 'wakaf',
    status: 'connected',
    daily_sent_count: 84,
    last_seen_at: new Date().toISOString(),
    created_at: '2024-01-15T08:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-3',
    device_name: 'WA 3 - Sedekah Subuh & Umum',
    admin_name: 'Admin 3: Kang Usman',
    device_id: '628333333333@s.whatsapp.net',
    phone_number: '628333333333',
    locked_segment: 'sedekah_subuh',
    status: 'disconnected',
    daily_sent_count: 0,
    last_seen_at: '2024-06-10T04:30:00Z',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

export const mockDonors: Donor[] = [
  { id: 'd1', salutation: 'Ayah', full_name: 'Ahmad Fauzi', whatsapp_number: '6281234500001', segment: 'donatur_tetap', is_active: true, notes: 'Donatur tetap sejak 2020', last_contacted_at: new Date().toISOString(), created_at: '2023-01-01T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd2', salutation: 'Bunda', full_name: 'Siti Aminah', whatsapp_number: '6281234500002', segment: 'donatur_tetap', is_active: true, notes: '', last_contacted_at: new Date().toISOString(), created_at: '2023-02-15T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd3', salutation: 'Ayah', full_name: 'Muhammad Rizki', whatsapp_number: '6281234500003', segment: 'wakaf', is_active: true, notes: 'Wakaf produktif pembangunan', last_contacted_at: null, created_at: '2023-03-10T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd4', salutation: 'Bunda', full_name: 'Fatimah Zahra', whatsapp_number: '6281234500004', segment: 'zakat', is_active: true, notes: 'Muzakki zakat maal rutin', last_contacted_at: null, created_at: '2023-04-20T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd5', salutation: 'Ayah', full_name: 'Usman Hakim', whatsapp_number: '6281234500005', segment: 'sedekah_subuh', is_active: true, notes: 'Aktif sedekah subuh harian', last_contacted_at: new Date().toISOString(), created_at: '2023-05-01T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd6', salutation: 'Bunda', full_name: 'Aisyah Putri', whatsapp_number: '6281234500006', segment: 'sedekah_subuh', is_active: true, notes: '', last_contacted_at: null, created_at: '2023-06-15T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd7', salutation: 'Ayah', full_name: 'Ibrahim Hasan', whatsapp_number: '6281234500007', segment: 'donatur_baru', is_active: true, notes: 'Baru mendaftar lewat website', last_contacted_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd8', salutation: 'Bunda', full_name: 'Khadijah Nur', whatsapp_number: '6281234500008', segment: 'zakat', is_active: true, notes: 'Zakat fitrah & infaq', last_contacted_at: null, created_at: '2023-08-01T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd9', salutation: 'Ayah', full_name: 'Salman Al-Farisi', whatsapp_number: '6281234500009', segment: 'donatur_baru', is_active: false, notes: 'Non-aktif sementara', last_contacted_at: null, created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString() },
  { id: 'd10', salutation: 'Bunda', full_name: 'Hj. Endang Rahayu', whatsapp_number: '6281234500010', segment: 'wali_asuh', is_active: true, notes: 'Orang tua asuh 2 santri yatim', last_contacted_at: new Date().toISOString(), created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString() },
];

export const mockTemplates: MessageTemplate[] = [
  {
    id: 't1', title: 'Pengingat Sedekah Subuh', target_segment: 'sedekah_subuh',
    opening_greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    message_body: "{{salam}} {{sapaan}} {{nama}},\n\nSemoga hari ini penuh keberkahan. Mari kita awali pagi dengan sedekah subuh, sekecil apa pun insya Allah bernilai besar di sisi Allah SWT.\n\n🤲 Program: {{segmen}}\n\nJazakumullahu Khairan.",
    media_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
  },
  {
    id: 't2', title: 'Laporan Bulanan Donatur Tetap', target_segment: 'donatur_tetap',
    opening_greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    message_body: "{{salam}} {{sapaan}} {{nama}},\n\nAlhamdulillah, berikut kami sampaikan laporan penyaluran donasi bulan ini. Terima kasih atas kepercayaan dan amanah yang {{sapaan}} berikan.\n\n🏷️ Program: {{segmen}}\n\nSemoga Allah membalas kebaikan {{sapaan}} berlipat ganda. Aamiin.",
    media_url: null, created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
  },
];

const now = new Date();
const tomorrow430 = new Date(now);
tomorrow430.setDate(tomorrow430.getDate() + 1);
tomorrow430.setHours(4, 30, 0, 0);

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1', title: 'Sapaan & Pengingat Sedekah Subuh', target_segment: 'sedekah_subuh',
    sender_device_id: 'dev-3', opening_greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    message_template: "{{salam}} {{sapaan}} {{nama}},\n\nMari awali pagi dengan sedekah subuh...",
    media_url: null, schedule_type: 'recurring', scheduled_at: null,
    recurring_pattern: 'daily', recurring_days: [0,1,2,3,4,5,6], recurring_day_of_month: null,
    recurring_time: '04:30:00', min_delay_sec: 10, max_delay_sec: 25,
    status: 'scheduled', total_recipients: 250, sent_count: 248, failed_count: 2,
    last_run_at: new Date(now.getTime() - 86400000).toISOString(),
    next_run_at: tomorrow430.toISOString(),
    created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString(),
  },
  {
    id: 'c2', title: 'Laporan Penyaluran Q3 2024', target_segment: 'donatur_tetap',
    sender_device_id: 'dev-1', opening_greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    message_template: "{{salam}} {{sapaan}} {{nama}},\n\nAlhamdulillah laporan Q3...",
    media_url: null, schedule_type: 'one_time', scheduled_at: '2024-10-05T09:00:00+07:00',
    recurring_pattern: null, recurring_days: [], recurring_day_of_month: null,
    recurring_time: '09:00:00', min_delay_sec: 10, max_delay_sec: 25,
    status: 'completed', total_recipients: 500, sent_count: 497, failed_count: 3,
    last_run_at: '2024-10-05T09:00:00+07:00', next_run_at: null,
    created_at: '2024-10-01T00:00:00Z', updated_at: new Date().toISOString(),
  },
];

export const mockQueueItems: BroadcastQueueItem[] = [
  { id: 'q1', campaign_id: 'c1', donor_id: 'd5', sender_device_id: 'dev-3', recipient_number: '6281234500005', rendered_message: "Assalamu'alaikum... Ayah Usman Hakim", media_url: null, delay_applied_sec: 12, scheduled_send_at: new Date(now.getTime() + 30000).toISOString(), status: 'queued', gowa_message_id: null, error_message: null, sent_at: null, created_at: now.toISOString() },
  { id: 'q2', campaign_id: 'c1', donor_id: 'd6', sender_device_id: 'dev-3', recipient_number: '6281234500006', rendered_message: "Assalamu'alaikum... Bunda Aisyah Putri", media_url: null, delay_applied_sec: 18, scheduled_send_at: new Date(now.getTime() + 48000).toISOString(), status: 'queued', gowa_message_id: null, error_message: null, sent_at: null, created_at: now.toISOString() },
  { id: 'q3', campaign_id: 'c1', donor_id: 'd1', sender_device_id: 'dev-3', recipient_number: '6281234500001', rendered_message: "Assalamu'alaikum... Ayah Ahmad Fauzi", media_url: null, delay_applied_sec: 15, scheduled_send_at: new Date(now.getTime() - 60000).toISOString(), status: 'sent', gowa_message_id: 'BAE5xxx', error_message: null, sent_at: new Date(now.getTime() - 55000).toISOString(), created_at: now.toISOString() },
];

export const mockReplies: IncomingReplyLog[] = [
  {
    id: 'r1', receiving_device_id: '628333333333@s.whatsapp.net', receiving_device_label: 'WA 3 - Sedekah Subuh',
    donor_id: 'd5', donor_salutation: 'Ayah', donor_name: 'Usman Hakim', donor_segment: 'sedekah_subuh',
    donor_number: '6281234500005', incoming_message: 'Alhamdulillah, sudah saya transfer untuk sedekah subuh hari ini ya.',
    forwarded_to_cs_number: '6281234567890', forward_status: 'forwarded', error_message: null,
    received_at: new Date(now.getTime() - 3600000).toISOString(),
  },
  {
    id: 'r2', receiving_device_id: '628111111111@s.whatsapp.net', receiving_device_label: 'WA 1 - Donatur Tetap',
    donor_id: 'd2', donor_salutation: 'Bunda', donor_name: 'Siti Aminah', donor_segment: 'donatur_tetap',
    donor_number: '6281234500002', incoming_message: 'Terima kasih laporannya, semoga berkah.',
    forwarded_to_cs_number: '6281234567890', forward_status: 'forwarded', error_message: null,
    received_at: new Date(now.getTime() - 7200000).toISOString(),
  },
];

export const mockDashboardStats: DashboardStats = {
  totalDonorsActive: 9,
  donorsBySegment: {
    donatur_tetap: 2,
    zakat: 2,
    wakaf: 1,
    wakaf_infaq: 0,
    sedekah_subuh: 2,
    wali_asuh: 1,
    donatur_baru: 1,
    umum: 0,
  },
  messageSentToday: 211,
  queueRunning: 2,
  repliesForwarded: 14,
};
