import { useEffect, useState } from 'react';
import {
  Users,
  Send,
  Loader,
  Forward,
  Smartphone,
  CalendarClock,
  Clock,
} from 'lucide-react';
import { getDashboardStats, getDevices, getCampaigns } from '../services/campaignService';
import { formatPhoneDisplay, formatWIB, getCountdown } from '../lib/utils';
import type { DashboardStats, WaDevice, Campaign } from '../types/database';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '../types/database';

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
      <div className="mb-2 h-8 w-16 rounded bg-slate-200" />
      <div className="h-3 w-32 rounded bg-slate-200" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<WaDevice[]>([]);
  const [nextCampaign, setNextCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, devicesData, campaignsData] = await Promise.all([
          getDashboardStats(),
          getDevices(),
          getCampaigns(),
        ]);
        setStats(statsData);
        setDevices(devicesData);

        // Find the next scheduled campaign (earliest next_run_at in the future)
        const upcoming = campaignsData
          .filter(
            (c) =>
              c.next_run_at &&
              new Date(c.next_run_at).getTime() > Date.now() &&
              (c.status === 'scheduled' || c.status === 'running')
          )
          .sort(
            (a, b) =>
              new Date(a.next_run_at!).getTime() -
              new Date(b.next_run_at!).getTime()
          );
        setNextCampaign(upcoming[0] ?? null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        {/* KPI skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Device skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-36" />
          ))}
        </div>
        {/* Campaign skeleton */}
        <SkeletonCard className="h-24" />
      </div>
    );
  }

  const kpiCards = stats
    ? [
        {
          label: 'Total Donatur Aktif',
          value: stats.totalDonorsActive,
          icon: Users,
          iconColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          detail: (Object.keys(stats.donorsBySegment) as Array<keyof typeof stats.donorsBySegment>)
            .filter((seg) => stats.donorsBySegment[seg] > 0)
            .map(
              (seg) => `${SEGMENT_LABELS[seg]}: ${stats.donorsBySegment[seg]}`
            )
            .join(' · '),
        },
        {
          label: 'Pesan Terkirim Hari Ini',
          value: stats.messageSentToday,
          icon: Send,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          detail: 'Total broadcast hari ini',
        },
        {
          label: 'Antrean Berjalan',
          value: stats.queueRunning,
          icon: Loader,
          iconColor: 'text-amber-600',
          bgColor: 'bg-amber-50',
          detail: 'Pesan menunggu dikirim',
        },
        {
          label: 'Balasan Diteruskan ke CS',
          value: stats.repliesForwarded,
          icon: Forward,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          detail: 'Diteruskan hari ini',
        },
      ]
    : [];

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* ── A) KPI Summary Cards ───────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {card.value.toLocaleString('id-ID')}
                  </p>
                  {card.detail && (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {card.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── B) Device Status Live Cards ────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Status Perangkat
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {devices.map((device) => {
            const isConnected = device.status === 'connected';
            const segmentClasses =
              SEGMENT_COLORS[device.locked_segment] ?? 'bg-gray-100 text-gray-800';
            return (
              <div
                key={device.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-slate-500" />
                    <span className="font-semibold text-slate-800">
                      {device.device_name}
                    </span>
                  </div>
                  <span className="relative flex h-3 w-3">
                    {isConnected && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {formatPhoneDisplay(device.phone_number)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {device.daily_sent_count}
                  </span>{' '}
                  pesan hari ini
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${segmentClasses}`}
                  >
                    {SEGMENT_LABELS[device.locked_segment]}
                  </span>
                </div>
              </div>
            );
          })}
          {devices.length === 0 && (
            <p className="col-span-3 text-sm text-slate-400">
              Belum ada perangkat terdaftar.
            </p>
          )}
        </div>
      </section>

      {/* ── C) Next Scheduled Campaign ─────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Broadcast Terjadwal Berikutnya
        </h2>
        {nextCampaign ? (
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CalendarClock className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">
                {nextCampaign.title}
              </p>
              <p className="text-sm text-slate-500">
                {formatWIB(nextCampaign.next_run_at!)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <Clock className="h-4 w-4" />
              {getCountdown(nextCampaign.next_run_at!)}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
            Tidak ada broadcast terjadwal.
          </div>
        )}
      </section>
    </div>
  );
}
