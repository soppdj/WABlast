import { X, QrCode } from 'lucide-react';

interface QrScanModalProps {
  deviceName: string;
  open: boolean;
  onClose: () => void;
}

export default function QrScanModal({
  deviceName,
  open,
  onClose,
}: QrScanModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Scan QR Code
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Arahkan kamera WhatsApp ke QR code di bawah ini untuk menyambungkan{' '}
          <span className="font-medium text-slate-700">{deviceName}</span>.
        </p>

        {/* QR Placeholder */}
        <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <QrCode className="mx-auto mb-2 h-16 w-16 text-slate-300" />
            <p className="text-xs text-slate-400">QR Code akan muncul di sini</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          QR code berlaku 60 detik. Klik &quot;Refresh&quot; jika kadaluarsa.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Refresh QR
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
