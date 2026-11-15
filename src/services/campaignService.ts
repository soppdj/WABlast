// ============================================================================
// WABlast Pro — Campaign Service
// Handles campaign CRUD, queue management, donor segment mapping
// ============================================================================

import { supabase, isDemo } from '../lib/supabase';
import {
  mockDevices, mockDonors, mockCampaigns, mockQueueItems,
  mockReplies, mockSettings, mockDashboardStats, mockTemplates,
} from '../mock/data';
import type {
  AppSettings, WaDevice, Donor, Campaign, BroadcastQueueItem,
  IncomingReplyLog, DashboardStats, DonorSegment, MessageTemplate,
} from '../types/database';
import { normalizePhoneNumber } from '../lib/utils';

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  if (isDemo) return mockSettings;
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as AppSettings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  if (isDemo) return { ...mockSettings, ...updates };
  const { data, error } = await supabase
    .from('app_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data as AppSettings;
}

// ─── Devices ────────────────────────────────────────────────────────────────

export async function getDevices(): Promise<WaDevice[]> {
  if (isDemo) return mockDevices;
  const { data, error } = await supabase
    .from('wa_devices')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as WaDevice[];
}

export async function getDeviceForSegment(segment: DonorSegment): Promise<WaDevice | null> {
  if (isDemo) return mockDevices.find((d) => d.locked_segment === segment) || null;
  const { data, error } = await supabase
    .from('wa_devices')
    .select('*')
    .eq('locked_segment', segment)
    .single();
  if (error) return null;
  return data as WaDevice;
}

export async function upsertDevice(device: Partial<WaDevice> & { id?: string }): Promise<WaDevice> {
  if (isDemo) {
    const idx = mockDevices.findIndex((d) => d.id === device.id);
    if (idx !== -1) {
      mockDevices[idx] = { ...mockDevices[idx], ...device } as WaDevice;
      return mockDevices[idx];
    }
    const newDev = { ...mockDevices[0], ...device, id: crypto.randomUUID() } as WaDevice;
    mockDevices.push(newDev);
    return newDev;
  }
  const { data, error } = await supabase
    .from('wa_devices')
    .upsert({ ...device, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as WaDevice;
}

// ─── Donors ─────────────────────────────────────────────────────────────────

const DONORS_STORAGE_KEY = 'wablast_donors_v1';

function getStoredDonors(): Donor[] {
  try {
    const raw = localStorage.getItem(DONORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read donors from localStorage', err);
  }
  return [...mockDonors];
}

function setStoredDonors(list: Donor[]): void {
  try {
    localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to write donors to localStorage', err);
  }
}

export async function getDonors(filters?: {
  segment?: DonorSegment;
  is_active?: boolean;
  search?: string;
}): Promise<Donor[]> {
  if (isDemo) {
    let result = getStoredDonors();
    if (filters?.segment) result = result.filter((d) => d.segment === filters.segment);
    if (filters?.is_active !== undefined) result = result.filter((d) => d.is_active === filters.is_active);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) => d.full_name.toLowerCase().includes(q) || d.whatsapp_number.includes(q)
      );
    }
    return result;
  }
  let query = supabase.from('donors').select('*').order('created_at', { ascending: true });
  if (filters?.segment) query = query.eq('segment', filters.segment);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Donor[];
}

export async function getDonorCount(segment: DonorSegment): Promise<number> {
  if (isDemo) return getStoredDonors().filter((d) => d.segment === segment && d.is_active).length;
  const { count, error } = await supabase
    .from('donors')
    .select('*', { count: 'exact', head: true })
    .eq('segment', segment)
    .eq('is_active', true);
  if (error) throw error;
  return count ?? 0;
}

export async function createDonor(donor: Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at'>): Promise<Donor> {
  const normalized = { ...donor, whatsapp_number: normalizePhoneNumber(donor.whatsapp_number) };
  if (isDemo) {
    const newDonor: Donor = {
      ...normalized,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_contacted_at: null,
    };
    const current = getStoredDonors();
    const updated = [newDonor, ...current];
    setStoredDonors(updated);
    mockDonors.length = 0;
    mockDonors.push(...updated);
    return newDonor;
  }
  const { data, error } = await supabase.from('donors').insert(normalized).select().single();
  if (error) throw error;
  return data as Donor;
}

export async function updateDonor(id: string, updates: Partial<Donor>): Promise<Donor> {
  if (updates.whatsapp_number) {
    updates.whatsapp_number = normalizePhoneNumber(updates.whatsapp_number);
  }
  if (isDemo) {
    const current = getStoredDonors();
    const idx = current.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Donor not found');
    const updatedItem: Donor = {
      ...current[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    current[idx] = updatedItem;
    setStoredDonors(current);
    mockDonors.length = 0;
    mockDonors.push(...current);
    return updatedItem;
  }
  const { data, error } = await supabase
    .from('donors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Donor;
}

export async function deleteDonor(id: string): Promise<void> {
  if (isDemo) {
    const current = getStoredDonors();
    const filtered = current.filter((d) => d.id !== id);
    setStoredDonors(filtered);
    mockDonors.length = 0;
    mockDonors.push(...filtered);
    return;
  }
  const { error } = await supabase.from('donors').delete().eq('id', id);
  if (error) throw error;
}

// ─── Templates ──────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<MessageTemplate[]> {
  if (isDemo) return mockTemplates;
  const { data, error } = await supabase.from('message_templates').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as MessageTemplate[];
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  if (isDemo) return mockCampaigns;
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, sender_device:wa_devices(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'total_recipients' | 'sent_count' | 'failed_count' | 'last_run_at' | 'sender_device'>): Promise<Campaign> {
  if (isDemo) return { ...campaign, id: crypto.randomUUID(), total_recipients: 0, sent_count: 0, failed_count: 0, last_run_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Campaign;
  const { data, error } = await supabase.from('campaigns').insert(campaign).select().single();
  if (error) throw error;

  // If immediate, call enqueue RPC
  if (campaign.schedule_type === 'immediate') {
    await supabase.rpc('enqueue_campaign_jobs', { p_campaign_id: data.id });
  }

  return data as Campaign;
}

export async function updateCampaignStatus(id: string, status: Campaign['status']): Promise<void> {
  if (isDemo) return;
  const { error } = await supabase
    .from('campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Queue ──────────────────────────────────────────────────────────────────

export async function getQueueItems(campaignId?: string): Promise<BroadcastQueueItem[]> {
  if (isDemo) {
    return campaignId ? mockQueueItems.filter((q) => q.campaign_id === campaignId) : mockQueueItems;
  }
  let query = supabase.from('broadcast_queue').select('*').order('scheduled_send_at', { ascending: true }).limit(200);
  if (campaignId) query = query.eq('campaign_id', campaignId);
  const { data, error } = await query;
  if (error) throw error;
  return data as BroadcastQueueItem[];
}

// ─── Replies ────────────────────────────────────────────────────────────────

export async function getReplies(): Promise<IncomingReplyLog[]> {
  if (isDemo) return mockReplies;
  const { data, error } = await supabase
    .from('incoming_replies_log')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as IncomingReplyLog[];
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isDemo) return mockDashboardStats;

  const [donorsRes, queueRes, repliesRes] = await Promise.all([
    supabase.from('donors').select('segment, is_active'),
    supabase.from('broadcast_queue').select('status').eq('status', 'queued'),
    supabase.from('incoming_replies_log').select('id').gte('received_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
  ]);

  const activeDonors = (donorsRes.data || []).filter((d: { is_active: boolean }) => d.is_active);
  const segments: Record<DonorSegment, number> = {
    donatur_tetap: 0,
    zakat: 0,
    wakaf: 0,
    wakaf_infaq: 0,
    sedekah_subuh: 0,
    wali_asuh: 0,
    donatur_baru: 0,
    umum: 0,
  };
  activeDonors.forEach((d: { segment: DonorSegment }) => { segments[d.segment]++; });

  return {
    totalDonorsActive: activeDonors.length,
    donorsBySegment: segments,
    messageSentToday: 0, // Would require more complex query
    queueRunning: (queueRes.data || []).length,
    repliesForwarded: (repliesRes.data || []).length,
  };
}
