// ============================================================================
// WABlast Pro — TypeScript Type Definitions
// Matches the PostgreSQL schema exactly
// ============================================================================

// Enums
export type DonorSalutation = 'Ayah' | 'Bunda';
export type DonorSegment =
  | 'donatur_tetap'
  | 'zakat'
  | 'wakaf'
  | 'wakaf_infaq'
  | 'sedekah_subuh'
  | 'donatur_baru'
  | 'umum';
export type DeviceStatus = 'connected' | 'disconnected' | 'qr_ready';
export type CampaignScheduleType = 'immediate' | 'one_time' | 'recurring';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
export type RecurringPattern = 'daily' | 'weekly' | 'monthly';
export type QueueStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ForwardStatus = 'pending' | 'forwarded' | 'failed';

// Segment display labels
export const SEGMENT_LABELS: Record<DonorSegment, string> = {
  donatur_tetap: 'Donatur Tetap',
  zakat: 'Zakat',
  wakaf: 'Wakaf',
  wakaf_infaq: 'Wakaf & Infaq',
  sedekah_subuh: 'Sedekah Subuh',
  donatur_baru: 'Donatur Baru',
  umum: 'Umum',
};

export const SEGMENT_COLORS: Record<DonorSegment, string> = {
  donatur_tetap: 'bg-emerald-100 text-emerald-800',
  zakat: 'bg-purple-100 text-purple-800',
  wakaf: 'bg-blue-100 text-blue-800',
  wakaf_infaq: 'bg-blue-100 text-blue-800',
  sedekah_subuh: 'bg-amber-100 text-amber-800',
  donatur_baru: 'bg-rose-100 text-rose-800',
  umum: 'bg-gray-100 text-gray-800',
};

// Database Table Types
export interface AppSettings {
  id: 1;
  app_name: string;
  gowa_base_url: string;
  gowa_basic_auth_user: string;
  gowa_basic_auth_pass: string;
  gowa_webhook_secret: string;
  main_cs_whatsapp: string;
  cs_forward_device_id: string;
  auto_forward_enabled: boolean;
  default_min_delay_sec: number;
  default_max_delay_sec: number;
  timezone: string;
  updated_at: string;
}

export interface WaDevice {
  id: string;
  device_name: string;
  admin_name?: string;
  device_id: string;
  phone_number: string;
  locked_segment: DonorSegment;
  status: DeviceStatus;
  daily_sent_count: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  salutation: DonorSalutation;
  full_name: string;
  whatsapp_number: string;
  segment: DonorSegment;
  is_active: boolean;
  notes: string;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  target_segment: DonorSegment;
  opening_greeting: string;
  message_body: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  target_segment: DonorSegment;
  sender_device_id: string;
  opening_greeting: string;
  message_template: string;
  media_url: string | null;
  schedule_type: CampaignScheduleType;
  scheduled_at: string | null;
  recurring_pattern: RecurringPattern | null;
  recurring_days: number[];
  recurring_day_of_month: number | null;
  recurring_time: string;
  min_delay_sec: number;
  max_delay_sec: number;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  sender_device?: WaDevice;
}

export interface BroadcastQueueItem {
  id: string;
  campaign_id: string;
  donor_id: string;
  sender_device_id: string;
  recipient_number: string;
  rendered_message: string;
  media_url: string | null;
  delay_applied_sec: number;
  scheduled_send_at: string;
  status: QueueStatus;
  gowa_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  // Joined
  donor?: Donor;
  campaign?: Campaign;
}

export interface IncomingReplyLog {
  id: string;
  receiving_device_id: string;
  receiving_device_label: string | null;
  donor_id: string | null;
  donor_salutation: string | null;
  donor_name: string | null;
  donor_segment: string | null;
  donor_number: string;
  incoming_message: string;
  forwarded_to_cs_number: string;
  forward_status: ForwardStatus;
  error_message: string | null;
  received_at: string;
}

// Dashboard KPI types
export interface DashboardStats {
  totalDonorsActive: number;
  donorsBySegment: Record<DonorSegment, number>;
  messageSentToday: number;
  queueRunning: number;
  repliesForwarded: number;
}

// CSV Import types
export interface CsvDonorRow {
  sapaan?: string;
  salutation?: string;
  nama?: string;
  full_name?: string;
  nomor_wa?: string;
  whatsapp_number?: string;
  segmen?: string;
  segment?: string;
}
