import { useState } from 'react';
import { Save, QrCode, SendHorizonal, X, UserCheck } from 'lucide-react';
import type { WaDevice, DonorSegment } from '../../types/database';
import { upsertDevice } from '../../services/campaignService';
import { isValidWANumber } from '../../lib/utils';
import QrScanModal from './QrScanModal';

interface DeviceCardProps {
  device: WaDevice;
  onSaved: (updated: WaDevice) => void;
}

const SEGMENT_OPTIONS: { value: DonorSegment; label: string }[] = [
  { value: 'donatur_tetap', label: 'Donatur Tetap' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'wakaf', label: 'Wakaf' },
  { value: 'wakaf_infaq', label: 'Wakaf & Infaq' },
  { value: 'sedekah_subuh', label: 'Sedekah Subuh' },
  { value: 'donatur_baru', label: 'Donatur Baru' },
  { value: 'umum', label: 'Umum' },
];

const STATUS_DOT: Record<WaDevice['status'], string> = {
  connected: 'bg-emerald-500',
  disconnected: 'bg-red-500',
  qr_ready: 'bg-amber-400',
};

const STATUS_LABEL: Record<WaDevice['status'], string> = {
  connected: 'Terhubung',
  disconnected: 'Terputus',
  qr_ready: 'Siap Scan QR',
};

export default function DeviceCard({ device, onSaved }: DeviceCardProps) {
  // Determine fallback admin label based on device id
  const fallbackAdmin = device.admin_name || (
    device.id === 'dev-1' ? 'Admin 1: Nama Admin' :
    device.id === 'dev-2' ? 'Admin 2: Nama Admin' :
    'Admin 3: Nama Admin'
  );

  const [form, setForm] = useState({
    device_name: device.device_name,
    admin_name: device.admin_name || fallbackAdmin,
    phone_number: device.phone_number,
    device_id: device.device_id,
    locked_segment: device.locked_segment,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveMsg(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await upsertDevice({
        id: device.id,
        device_name: form.device_name,
        admin_name: form.admin_name,
        phone_number: form.phone_number,
        device_id: form.device_id,
        locked_segment: form.locked_segment as DonorSegment,
      });
      onSaved(updated);
      setSaveMsg('Tersimpan!');
    } catch (err) {
      console.error(err);
      setSaveMsg('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  function handleTestSend() {
    if (!isValidWANumber(testNumber)) {
      setTestResult('Nomor tidak valid. Gunakan format 08xxx atau 628xxx.');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    // Simulated test send
    setTimeout(() => {
      setTestSending(false);
      setTestResult('Pesan tes berhasil dikirim!');
    }, 1200);
  }

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {device.status === 'connected' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${STATUS_DOT[device.status]}`}
              />
            </span>
            <span className="text-sm font-medium text-slate-600">
              {STATUS_LABEL[device.status]}
            </span>
          </div>

          {/* Keterangan Admin (Sesuai Permintaan Gambar) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{form.admin_name}</span>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Keterangan Admin (PIC Pengelola)
            </label>
            <input
              name="admin_name"
              value={form.admin_name}
              onChange={handleChange}
              placeholder="Contoh: Admin 1: Nama Admin"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Label Nomor
            </label>
            <input
              name="device_name"
              value={form.device_name}
              onChange={handleChange}
              placeholder="WA 1 - Layanan Donatur Tetap"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nomor HP
            </label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="6281234567890"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Device ID (GOWA)
            </label>
            <input
              name="device_id"
              value={form.device_id}
              onChange={handleChange}
              placeholder="gowa-device-xxx"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Segmen Terkunci
            </label>
            <select
              name="locked_segment"
              value={form.locked_segment}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {SEGMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </button>
          <button
            type="button"
            onClick={() => {
              setTestOpen(true);
              setTestNumber('');
              setTestResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <SendHorizonal className="h-4 w-4" />
            Tes Kirim Pesan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>

        {saveMsg && (
          <p
            className={`mt-2 text-sm ${
              saveMsg === 'Tersimpan!' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {saveMsg}
          </p>
        )}
      </div>

      {/* QR Modal */}
      <QrScanModal
        deviceName={form.device_name || 'Perangkat'}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />

      {/* Test Send Modal */}
      {testOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Tes Kirim Pesan
              </h3>
              <button
                type="button"
                onClick={() => setTestOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-slate-500">
              Kirim pesan tes dari{' '}
              <span className="font-medium text-slate-700">
                {form.device_name}
              </span>{' '}
              ke nomor di bawah ini.
            </p>

            <input
              type="text"
              value={testNumber}
              onChange={(e) => {
                setTestNumber(e.target.value);
                setTestResult(null);
              }}
              placeholder="08123456789"
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />

            {testResult && (
              <p
                className={`mb-3 text-sm ${
                  testResult.includes('berhasil')
                    ? 'text-emerald-600'
                    : 'text-red-500'
                }`}
              >
                {testResult}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testSending || !testNumber.trim()}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {testSending ? 'Mengirim…' : 'Kirim Tes'}
              </button>
              <button
                type="button"
                onClick={() => setTestOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
