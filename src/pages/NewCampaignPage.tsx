import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import type {
  DonorSegment,
  WaDevice,
  CampaignScheduleType,
  RecurringPattern,
} from '../types/database';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '../types/database';
import {
  getDevices,
  getDeviceForSegment,
  getDonorCount,
  createCampaign,
} from '../services/campaignService';
import {
  estimateBroadcastDuration,
  getTimeBasedGreeting,
  renderMessagePreview,
} from '../lib/utils';
import VariableChips from '../components/campaigns/VariableChips';
import ScheduleSelector from '../components/campaigns/ScheduleSelector';
import WhatsAppPreview from '../components/campaigns/WhatsAppPreview';

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [targetSegment, setTargetSegment] = useState<DonorSegment>('sedekah_subuh');
  const [devices, setDevices] = useState<WaDevice[]>([]);
  const [senderDevice, setSenderDevice] = useState<WaDevice | null>(null);
  const [overrideDevice, setOverrideDevice] = useState(false);
  const [overrideDeviceId, setOverrideDeviceId] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);

  const [greetingOption, setGreetingOption] = useState<'standard' | 'wib' | 'custom'>('standard');
  const [customGreeting, setCustomGreeting] = useState("Assalamu'alaikum Warahmatullahi Wabarakatuh");
  const [messageTemplate, setMessageTemplate] = useState(
    '{{salam}}\n\nSemoga {{sapaan}} {{nama}} senantiasa dalam limpahan kesehatan dan keberkahan dari Allah SWT.\n\nMari kita awali hari penuh kemuliaan ini dengan menyisihkan sebagian rezeki terbaik dalam program {{segmen}}.\n\nJazakumullahu Khairan Katsiran.'
  );
  const [mediaUrl, setMediaUrl] = useState('');

  // Delay settings
  const [minDelay, setMinDelay] = useState(10);
  const [maxDelay, setMaxDelay] = useState(25);

  // Scheduling
  const [scheduleType, setScheduleType] = useState<CampaignScheduleType>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>('daily');
  const [recurringDays, setRecurringDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number | null>(1);
  const [recurringTime, setRecurringTime] = useState('04:30');

  // Preview donor preview switcher (Ayah vs Bunda)
  const [previewSalutation, setPreviewSalutation] = useState<'Ayah' | 'Bunda'>('Ayah');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load initial devices & donor count
  useEffect(() => {
    async function init() {
      const allDevices = await getDevices();
      setDevices(allDevices);
    }
    init();
  }, []);

  // Update locked sender device and donor count when segment changes
  useEffect(() => {
    async function updateSegmentData() {
      const dev = await getDeviceForSegment(targetSegment);
      setSenderDevice(dev);
      if (dev) {
        setOverrideDeviceId(dev.id);
      }
      const count = await getDonorCount(targetSegment);
      setRecipientCount(count);
    }
    updateSegmentData();
  }, [targetSegment]);

  // Compute opening greeting
  const resolvedGreeting = useMemo(() => {
    if (greetingOption === 'wib') {
      return getTimeBasedGreeting();
    }
    if (greetingOption === 'custom') {
      return customGreeting;
    }
    return "Assalamu'alaikum Warahmatullahi Wabarakatuh";
  }, [greetingOption, customGreeting]);

  // Insert variable chips at textarea cursor
  const handleInsertVariable = (varKey: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMessageTemplate((prev) => prev + ' ' + varKey);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = messageTemplate;
    const next = current.substring(0, start) + varKey + current.substring(end);
    setMessageTemplate(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 10);
  };

  // Duration calculation
  const durationEst = useMemo(() => {
    return estimateBroadcastDuration(recipientCount || 1, minDelay, maxDelay);
  }, [recipientCount, minDelay, maxDelay]);

  // Live rendered message preview
  const livePreviewText = useMemo(() => {
    const sampleName = previewSalutation === 'Ayah' ? 'Ahmad Fauzi' : 'Siti Aminah';
    return renderMessagePreview(
      messageTemplate,
      resolvedGreeting,
      previewSalutation,
      sampleName,
      SEGMENT_LABELS[targetSegment]
    );
  }, [messageTemplate, resolvedGreeting, previewSalutation, targetSegment]);

  const activeDeviceId = overrideDevice ? overrideDeviceId : senderDevice?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Harap isi judul kampanye');
      return;
    }
    if (!activeDeviceId) {
      setError('Belum ada perangkat WhatsApp yang dipilih atau terhubung untuk segmen ini');
      return;
    }
    if (!messageTemplate.trim()) {
      setError('Pesan kampanye tidak boleh kosong');
      return;
    }
    if (minDelay < 3) {
      setError('Jeda minimal tidak boleh kurang dari 3 detik');
      return;
    }
    if (maxDelay < minDelay) {
      setError('Jeda maksimal harus lebih besar atau sama dengan jeda minimal');
      return;
    }

    try {
      setSubmitting(true);

      let nextRun: string | null = null;
      let scheduledTime: string | null = null;

      if (scheduleType === 'immediate') {
        // Will start right now
        scheduledTime = new Date().toISOString();
      } else if (scheduleType === 'one_time') {
        if (!scheduledAt) {
          setError('Tentukan tanggal & jam pengiriman sekali jalan');
          setSubmitting(false);
          return;
        }
        scheduledTime = new Date(scheduledAt).toISOString();
      } else if (scheduleType === 'recurring') {
        // Build next run time based on recurringTime
        const [hour, minute] = recurringTime.split(':').map(Number);
        const next = new Date();
        next.setHours(hour, minute, 0, 0);
        if (next.getTime() <= Date.now()) {
          next.setDate(next.getDate() + 1);
        }
        nextRun = next.toISOString();
      }

      await createCampaign({
        title,
        target_segment: targetSegment,
        sender_device_id: activeDeviceId,
        opening_greeting: resolvedGreeting,
        message_template: messageTemplate,
        media_url: mediaUrl.trim() || null,
        schedule_type: scheduleType,
        scheduled_at: scheduledTime,
        recurring_pattern: scheduleType === 'recurring' ? recurringPattern : null,
        recurring_days: recurringDays,
        recurring_day_of_month: recurringDayOfMonth,
        recurring_time: `${recurringTime}:00`,
        min_delay_sec: minDelay,
        max_delay_sec: maxDelay,
        next_run_at: nextRun,
        status: scheduleType === 'immediate' ? 'running' : 'scheduled',
      });

      navigate('/campaigns');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kampanye broadcast';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          to="/campaigns"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat Kampanye Broadcast Baru
          </h1>
          <p className="text-xs text-slate-500">
            Routing otomatis nomor pengirim dikunci per segmen donatur dengan jeda kumulatif anti-blokir.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Form (7 cols), Right Preview (5 cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 1: Informasi Kampanye & Kunci Nomor */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">1. Target Segmen & Kunci Nomor</h2>

            {/* Judul Kampanye */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Judul Kampanye</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sapaan & Pengingat Sedekah Subuh"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Pilihan Segmen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Segmen Donatur Target
              </label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value as DonorSegment)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="sedekah_subuh">Sedekah Subuh (Pengingat Harian Subuh)</option>
                <option value="donatur_tetap">Donatur Tetap (Laporan & Sapaan Rutin)</option>
                <option value="wakaf_infaq">Wakaf & Infaq (Program Pembangunan)</option>
                <option value="umum">Umum (Donatur Publik)</option>
              </select>
            </div>

            {/* Segment-Locked Sender Banner */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-600 p-2 text-white">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Nomor Pengirim Terkunci
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        SEGMENT_COLORS[targetSegment]
                      }`}
                    >
                      {SEGMENT_LABELS[targetSegment]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {senderDevice ? senderDevice.device_name : 'Belum ada nomor yang dikunci ke segmen ini'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Nomor WhatsApp: {senderDevice?.phone_number || '-'} • Status:{' '}
                    <span
                      className={`font-semibold ${
                        senderDevice?.status === 'connected' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {senderDevice?.status === 'connected' ? 'Aktif Terhubung' : 'Terputus (Perlu Scan)'}
                    </span>
                  </p>
                  <p className="mt-2 text-xs font-medium text-emerald-800">
                    🎯 Total Donatur Aktif di Segmen Ini: <strong>{recipientCount} donatur</strong>
                  </p>
                </div>
              </div>

              {/* Manual Override Checkbox */}
              <div className="mt-3 border-t border-emerald-200/60 pt-2.5">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideDevice}
                    onChange={(e) => setOverrideDevice(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Gunakan nomor pengirim lain (override manual jika nomor sedang perawatan)</span>
                </label>

                {overrideDevice && (
                  <div className="mt-2">
                    <select
                      value={overrideDeviceId}
                      onChange={(e) => setOverrideDeviceId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.device_name} ({d.phone_number}) - Segmen: {SEGMENT_LABELS[d.locked_segment]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Editor Pesan & Personalisasi */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">2. Pesan & Variabel Personalisasi</h2>

            {/* Pembuka Salam */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Pembuka Salam</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGreetingOption('standard')}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border cursor-pointer ${
                    greetingOption === 'standard'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Salam Standar
                </button>
                <button
                  type="button"
                  onClick={() => setGreetingOption('wib')}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border cursor-pointer ${
                    greetingOption === 'wib'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✨ Otomatis Waktu WIB (Pagi/Siang/Sore/Malam)
                </button>
                <button
                  type="button"
                  onClick={() => setGreetingOption('custom')}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border cursor-pointer ${
                    greetingOption === 'custom'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Kustom
                </button>
              </div>

              {greetingOption === 'custom' && (
                <input
                  type="text"
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  placeholder="Ketik salam kustom..."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
              )}
            </div>

            {/* Variable Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Klik untuk Sisipkan Variabel:
                </span>
                <span className="text-[11px] text-slate-400">Otomatis personal per donatur</span>
              </div>
              <VariableChips onInsert={handleInsertVariable} />
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Isi Pesan WhatsApp</label>
              <textarea
                ref={textareaRef}
                required
                rows={8}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Tulis pesan dengan tag {{salam}}, {{sapaan}}, {{nama}}, {{segmen}}..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3.5 font-sans text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Optional Media URL */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                Lampirkan Gambar (Opsional)
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://contoh.com/poster-laporan.jpg"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Card 3: Pengaturan Jeda Acak Kumulatif Anti-Blokir */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                3. Jeda Acak Anti-Blokir (Random Delay)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Setiap pesan dijadwalkan dengan jeda kumulatif acak antar donatur untuk menghindari deteksi spam oleh WhatsApp.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Jeda Minimal (detik)</label>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={minDelay}
                  onChange={(e) => setMinDelay(Math.max(3, parseInt(e.target.value) || 3))}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Jeda Maksimal (detik)</label>
                <input
                  type="number"
                  min={minDelay}
                  max={120}
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(Math.max(minDelay, parseInt(e.target.value) || minDelay))}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Kalkulasi Estimasi Durasi */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Estimasi Durasi Pengiriman:</span>
              </div>
              <p className="mt-1">
                <strong>{recipientCount} donatur</strong> × rata-rata{' '}
                <strong>{((minDelay + maxDelay) / 2).toFixed(1)} detik</strong> ≈ perkiraan selesai{' '}
                dalam <span className="font-bold underline">{durationEst.displayText}</span>.
              </p>
            </div>
          </div>

          {/* Card 4: Penjadwalan */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">4. Waktu & Frekuensi Penjadwalan</h2>
            <ScheduleSelector
              scheduleType={scheduleType}
              onScheduleTypeChange={setScheduleType}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              recurringPattern={recurringPattern}
              onRecurringPatternChange={setRecurringPattern}
              recurringDays={recurringDays}
              onRecurringDaysChange={setRecurringDays}
              recurringDayOfMonth={recurringDayOfMonth}
              onRecurringDayOfMonthChange={setRecurringDayOfMonth}
              recurringTime={recurringTime}
              onRecurringTimeChange={setRecurringTime}
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/campaigns"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? 'Menyimpan...'
                : scheduleType === 'immediate'
                ? 'Mulai Broadcast Sekarang'
                : 'Simpan & Aktifkan Jadwal'}
            </button>
          </div>
        </div>

        {/* Right Panel: Sticky WhatsApp Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Live WhatsApp Preview</h2>
              </div>

              {/* Toggle Sapaan Donatur Demo */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewSalutation('Ayah')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    previewSalutation === 'Ayah'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Ayah
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSalutation('Bunda')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    previewSalutation === 'Bunda'
                      ? 'bg-pink-100 text-pink-800'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bunda
                </button>
              </div>
            </div>

            {/* WhatsApp Phone Mockup */}
            <div className="h-[580px] rounded-2xl shadow-lg overflow-hidden border border-slate-300">
              <WhatsAppPreview message={livePreviewText} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">ℹ️ Catatan Personalisasi:</p>
              <p>
                Variabel <code className="text-emerald-700">{'{{sapaan}}'}</code> dan{' '}
                <code className="text-emerald-700">{'{{nama}}'}</code> akan otomatis digantikan dengan
                data asli masing-masing donatur saat antrean dikirim ke WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
