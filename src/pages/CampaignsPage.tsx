import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Plus,
  Clock,
  Calendar,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Smartphone,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { Campaign, CampaignStatus } from '../types/database';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '../types/database';
import { getCampaigns, updateCampaignStatus } from '../services/campaignService';
import { formatWIB, getCountdown } from '../lib/utils';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (filterStatus === 'all') return campaigns;
    return campaigns.filter((c) => c.status === filterStatus);
  }, [campaigns, filterStatus]);

  const handleTogglePause = async (campaign: Campaign) => {
    const nextStatus: CampaignStatus = campaign.status === 'running' ? 'paused' : 'running';
    try {
      await updateCampaignStatus(campaign.id, nextStatus);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      alert('Gagal memperbarui status kampanye');
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Sedang Berjalan
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <Clock className="h-3 w-3" />
            Terjadwal
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Selesai
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Pause className="h-3 w-3" />
            Dijeda
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            <AlertCircle className="h-3 w-3" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            Draf
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kampanye Broadcast</h1>
          <p className="mt-1 text-sm text-slate-500">
            Atur pengiriman pesan massal cerdas dengan jeda anti-blokir kumulatif 10–25 detik.
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Buat Broadcast Baru
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(
            [
              { key: 'all', label: 'Semua Kampanye' },
              { key: 'running', label: 'Sedang Berjalan' },
              { key: 'scheduled', label: 'Terjadwal' },
              { key: 'completed', label: 'Selesai' },
              { key: 'paused', label: 'Dijeda' },
            ] as const
          ).map((tab) => {
            const active = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={fetchCampaigns}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Campaign Cards List */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-sm text-slate-500">Memuat daftar kampanye...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Send className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">Belum ada kampanye</h3>
          <p className="mt-1 text-sm text-slate-500">
            Mulai buat pengumuman atau pengingat rutin untuk donatur Anda sekarang.
          </p>
          <Link
            to="/campaigns/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Buat Broadcast Sekarang
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((c) => {
            const pct =
              c.total_recipients > 0
                ? Math.min(100, Math.round((c.sent_count / c.total_recipients) * 100))
                : 0;

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          SEGMENT_COLORS[c.target_segment]
                        }`}
                      >
                        {SEGMENT_LABELS[c.target_segment]}
                      </span>
                      {getStatusBadge(c.status)}
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {c.schedule_type === 'recurring' ? (
                          <>
                            <Repeat className="h-3 w-3 text-emerald-600" />
                            Berulang ({c.recurring_pattern}) • {c.recurring_time?.slice(0, 5)} WIB
                          </>
                        ) : c.schedule_type === 'one_time' ? (
                          <>
                            <Calendar className="h-3 w-3 text-blue-600" />
                            Sekali Jalan ({c.scheduled_at ? formatWIB(c.scheduled_at) : '-'})
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 text-emerald-600" />
                            Kirim Langsung
                          </>
                        )}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{c.title}</h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                        <span>Kunci Pengirim: {c.sender_device?.device_name || 'Nomor Segmen'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Jeda: {c.min_delay_sec}–{c.max_delay_sec} dtk/pesan</span>
                      </div>
                      {c.next_run_at && (
                        <div className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Jadwal berikutnya: {getCountdown(c.next_run_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Progress Bar */}
                  <div className="w-full lg:w-64 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Progress Pengiriman</span>
                      <span className="font-bold text-slate-900">
                        {c.sent_count} / {c.total_recipients} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Terkirim: {c.sent_count}</span>
                      {c.failed_count > 0 && (
                        <span className="text-red-500 font-medium">Gagal: {c.failed_count}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                    {(c.status === 'running' || c.status === 'paused') && (
                      <button
                        onClick={() => handleTogglePause(c)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-xs transition cursor-pointer ${
                          c.status === 'running'
                            ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {c.status === 'running' ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            Jeda
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            Lanjutkan
                          </>
                        )}
                      </button>
                    )}

                    <Link
                      to={`/logs?tab=queue&campaign=${c.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>Lihat Antrean</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
