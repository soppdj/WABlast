import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListFilter,
  MessageSquare,
  Settings as SettingsIcon,
  Clock,
  CheckCircle,
  XCircle,
  Forward,
  ExternalLink,
  Save,
  RefreshCw,
  Smartphone,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';
import type {
  BroadcastQueueItem,
  IncomingReplyLog,
  AppSettings,
  Campaign,
  QueueStatus,
} from '../types/database';
import {
  getQueueItems,
  getReplies,
  getSettings,
  updateSettings,
  getCampaigns,
} from '../services/campaignService';
import { formatWIB, formatPhoneDisplay, timeAgo, normalizePhoneNumber } from '../lib/utils';

export default function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'queue' | 'replies' | 'settings') || 'queue';
  const campaignParam = searchParams.get('campaign') || 'all';

  const [activeTab, setActiveTab] = useState<'queue' | 'replies' | 'settings'>(initialTab);

  // Queue state
  const [queueItems, setQueueItems] = useState<BroadcastQueueItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignParam);
  const [queueFilterStatus, setQueueFilterStatus] = useState<QueueStatus | 'all'>('all');

  // Replies state
  const [replies, setReplies] = useState<IncomingReplyLog[]>([]);

  // Settings state
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [showGowaGuide, setShowGowaGuide] = useState(false);

  // Common loading
  const [loading, setLoading] = useState(true);

  // Load data based on active tab
  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueData, repliesData, campaignsData, settingsData] = await Promise.all([
        getQueueItems(selectedCampaignId === 'all' ? undefined : selectedCampaignId),
        getReplies(),
        getCampaigns(),
        getSettings(),
      ]);
      setQueueItems(queueData);
      setReplies(repliesData);
      setCampaigns(campaignsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCampaignId]);

  const handleTabChange = (tab: 'queue' | 'replies' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    if (queueFilterStatus === 'all') return queueItems;
    return queueItems.filter((q) => q.status === queueFilterStatus);
  }, [queueItems, queueFilterStatus]);

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSavingSettings(true);
      const updated = await updateSettings({
        ...settings,
        main_cs_whatsapp: normalizePhoneNumber(settings.main_cs_whatsapp),
      });
      setSettings(updated);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  // Simulation handler for Incoming Reply (Demo mode feature)
  const handleSimulateIncomingReply = () => {
    const dummyReplies: IncomingReplyLog[] = [
      {
        id: crypto.randomUUID(),
        receiving_device_id: '628333333333@s.whatsapp.net',
        receiving_device_label: 'WA 3 - Sedekah Subuh',
        donor_id: 'd5',
        donor_salutation: 'Ayah',
        donor_name: 'Usman Hakim',
        donor_segment: 'sedekah_subuh',
        donor_number: '6281234500005',
        incoming_message: 'Alhamdulillah barakallah, saya sudah transfer untuk sedekah subuh pagi ini ya.',
        forwarded_to_cs_number: settings?.main_cs_whatsapp || '6281234567890',
        forward_status: 'forwarded',
        error_message: null,
        received_at: new Date().toISOString(),
      },
    ];
    setReplies((prev) => [...dummyReplies, ...prev]);
    alert('Simulasi: Pesan balasan donatur diterima & otomatis diteruskan ke CS Utama!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Log Antrean, Balasan CS & Pengaturan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau status antrean pesan real-time, penerusan otomatis balasan donatur, dan integrasi GOWA.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleTabChange('queue')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'queue'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            <span>Monitor Antrean Pesan</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {queueItems.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('replies')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'replies'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Forward className="h-4 w-4 text-emerald-600" />
            <span>Auto-Forward CS Utama</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {replies.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Pengaturan Sistem & GOWA</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: MONITOR ANTREAN */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Filter Kampanye:</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">Semua Kampanye</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Status:</label>
              <select
                value={queueFilterStatus}
                onChange={(e) => setQueueFilterStatus(e.target.value as QueueStatus | 'all')}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">Semua</option>
                <option value="queued">Menunggu Jadwal (Queued)</option>
                <option value="sending">Sedang Dikirim</option>
                <option value="sent">Terkirim (Sent)</option>
                <option value="failed">Gagal (Failed)</option>
              </select>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Penerima</th>
                    <th className="px-5 py-3.5">Jadwal Kirim (WIB)</th>
                    <th className="px-5 py-3.5">Jeda Kumulatif</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Cuplikan Pesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                        <p className="mt-2 text-xs">Memuat antrean pesan...</p>
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Clock className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          Tidak ada antrean yang cocok
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {formatPhoneDisplay(item.recipient_number)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatWIB(item.scheduled_send_at)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                          +{item.delay_applied_sec} detik
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.status === 'queued' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                              <Clock className="h-3 w-3" />
                              Menunggu Waktu
                            </span>
                          )}
                          {item.status === 'sending' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Mengirim...
                            </span>
                          )}
                          {item.status === 'sent' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              Terkirim
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              <XCircle className="h-3 w-3" />
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 max-w-sm truncate">
                          {item.rendered_message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO-FORWARD CS UTAMA */}
      {activeTab === 'replies' && (
        <div className="space-y-6">
          {/* Explanation banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
                  <Forward className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Auto-Forward Balasan Donatur ke 1 Nomor CS Utama
                  </h3>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    Setiap balasan yang masuk ke Nomor A, B, atau C otomatis diteruskan ke:{' '}
                    <strong>{formatPhoneDisplay(settings?.main_cs_whatsapp || '6281234567890')}</strong>.
                    Admin cukup membalas lewat 1 ponsel utama.
                  </p>
                </div>
              </div>

              {/* Simulation button */}
              <button
                onClick={handleSimulateIncomingReply}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                Tes Simulasi Balasan Donatur
              </button>
            </div>
          </div>

          {/* Incoming Replies Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Waktu Masuk</th>
                    <th className="px-5 py-3.5">Donatur Pengirim</th>
                    <th className="px-5 py-3.5">Nomor Penerima (GOWA)</th>
                    <th className="px-5 py-3.5">Isi Pesan Donatur</th>
                    <th className="px-5 py-3.5">Status Forward ke CS</th>
                    <th className="px-5 py-3.5 text-right">Balas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {replies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm font-medium text-slate-600">Belum ada balasan donatur</p>
                        <p className="text-xs text-slate-400">
                          Klik tombol simulasi di atas untuk mencoba alur forwarding.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    replies.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                          {formatWIB(r.received_at)}
                          <p className="text-[10px] text-slate-400">{timeAgo(r.received_at)}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-slate-900">
                            {r.donor_salutation} {r.donor_name || 'Donatur'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {formatPhoneDisplay(r.donor_number)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                            <Smartphone className="h-3 w-3 text-slate-400" />
                            {r.receiving_device_label || 'WA Pengirim'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-800 max-w-xs">
                          <p className="rounded-lg bg-slate-50 p-2.5 italic border border-slate-100">
                            "{r.incoming_message}"
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Diteruskan ke CS
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <a
                            href={`https://wa.me/${r.donor_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <span>Chat</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENGATURAN SISTEM & GOWA */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          {settingsSavedSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}

          {/* GOWA Gateway Settings */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. Koneksi Gateway GOWA (WhatsApp Multi-Device Engine)
                </h2>
                <p className="text-xs text-slate-500">
                  Pengaturan alamat server GOWA yang terpasang di VPS / Mini PC Anda menggunakan Docker.
                </p>
              </div>

              {/* Tombol Buka Panduan Cara Mendapatkan GOWA */}
              <button
                type="button"
                onClick={() => setShowGowaGuide(!showGowaGuide)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shrink-0"
              >
                <HelpCircle className="h-4 w-4 text-emerald-600" />
                <span>{showGowaGuide ? 'Tutup Panduan' : 'Cara Mendapatkan GOWA'}</span>
                {showGowaGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Kotak Panduan Lengkap Mendapatkan & Menjalankan GOWA */}
            {showGowaGuide && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs text-slate-700 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <Terminal className="h-4 w-4 text-emerald-700" />
                  <span>Panduan Praktis Mendapatkan & Menjalankan Server GOWA (Gratis 100%)</span>
                </div>

                <p className="leading-relaxed">
                  <strong>GOWA (go-whatsapp-web-multidevice)</strong> adalah engine WhatsApp gateway open-source gratis (tanpa biaya langganan) berbasis bahasa Go yang ringan. GOWA bisa Anda pasang di <strong>VPS Murah</strong> (seperti Biznet GIO, DomaiNesia, IDCloudHost, DigitalOcean mulai ~Rp 50.000/bulan) atau di <strong>Laptop/PC Lokal</strong> menggunakan Docker.
                </p>

                <div className="space-y-3 rounded-xl bg-white p-4 border border-emerald-100">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="font-bold text-emerald-900 text-xs">🚀 CARA TERCEPAT DI LAPTOP (TANPA DOCKER):</p>
                    <p className="mt-1 text-slate-700 leading-relaxed text-[11px]">
                      GOWA untuk Windows sudah kami unduh dan siapkan di folder proyek Anda! Cukup klik ganda file:
                      <br />
                      📁 <strong className="text-slate-900 font-mono">jalankan-gowa.bat</strong> di folder <strong className="text-slate-900">wablast-pro</strong>.
                      <br />
                      Server GOWA akan langsung aktif di <code className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">http://localhost:3000</code> tanpa perlu menginstal Docker apapun!
                    </p>
                  </div>

                  <p className="font-bold text-slate-900">Atau Menggunakan Docker (Untuk Server VPS):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>
                      Gunakan file <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">docker-compose.gowa.yml</code> yang sudah ada di proyek.
                    </li>
                    <li>
                      Jalankan perintah berikut di terminal server:
                      <pre className="mt-1.5 rounded-lg bg-slate-900 p-2.5 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        docker compose -f docker-compose.gowa.yml up -d
                      </pre>
                    </li>
                    <li>
                      <strong>Isikan form pengaturan di bawah:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-600">
                        <li><strong>URL Server GOWA:</strong> <code className="font-mono text-emerald-700">http://localhost:3000</code> (atau IP VPS Anda)</li>
                        <li><strong>Username:</strong> <code className="font-mono text-emerald-700">admin</code></li>
                        <li><strong>Password:</strong> <code className="font-mono text-emerald-700">rahasia_wablast_pro</code></li>
                        <li><strong>Webhook Secret:</strong> <code className="font-mono text-emerald-700">rahasia_webhook_wablast</code></li>
                      </ul>
                    </li>
                    <li>
                      Setelah tersimpan, buka menu <strong>Perangkat</strong> dan klik <strong>Scan QR Code</strong> untuk menghubungkan nomor WhatsApp Anda.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">URL Server GOWA</label>
              <input
                type="url"
                required
                value={settings.gowa_base_url}
                onChange={(e) => setSettings({ ...settings, gowa_base_url: e.target.value })}
                placeholder="https://gowa.domain-anda.com"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Basic Auth Username
                </label>
                <input
                  type="text"
                  value={settings.gowa_basic_auth_user}
                  onChange={(e) =>
                    setSettings({ ...settings, gowa_basic_auth_user: e.target.value })
                  }
                  placeholder="admin"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Basic Auth Password
                </label>
                <input
                  type="password"
                  value={settings.gowa_basic_auth_pass}
                  onChange={(e) =>
                    setSettings({ ...settings, gowa_basic_auth_pass: e.target.value })
                  }
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Webhook Secret (Untuk Verifikasi Callback)
              </label>
              <input
                type="text"
                value={settings.gowa_webhook_secret}
                onChange={(e) => setSettings({ ...settings, gowa_webhook_secret: e.target.value })}
                placeholder="rahasia_webhook_wablast"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* CS Utama & Auto-Forward Settings */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              2. Nomor CS Utama & Penerusan Pesan
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Nomor WhatsApp CS Utama (Wajib Format 628...)
              </label>
              <input
                type="text"
                required
                value={settings.main_cs_whatsapp}
                onChange={(e) => setSettings({ ...settings, main_cs_whatsapp: e.target.value })}
                placeholder="6281234567890"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Semua balasan donatur yang masuk ke nomor pengirim A, B, atau C akan otomatis diteruskan ke nomor ini.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="autoForwardToggle"
                checked={settings.auto_forward_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, auto_forward_enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoForwardToggle" className="text-sm font-semibold text-slate-900 cursor-pointer">
                Aktifkan Auto-Forward Balasan Donatur ke CS Utama
              </label>
            </div>
          </div>

          {/* Anti-Block Delay Defaults */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              3. Nilai Standar Jeda Anti-Blokir
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Default Min Delay (detik)
                </label>
                <input
                  type="number"
                  min={3}
                  value={settings.default_min_delay_sec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_min_delay_sec: parseInt(e.target.value) || 10,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Default Max Delay (detik)
                </label>
                <input
                  type="number"
                  min={settings.default_min_delay_sec}
                  value={settings.default_max_delay_sec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_max_delay_sec: parseInt(e.target.value) || 25,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
