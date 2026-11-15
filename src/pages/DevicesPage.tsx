import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { getDevices } from '../services/campaignService';
import type { WaDevice } from '../types/database';
import DeviceCard from '../components/devices/DeviceCard';

function SkeletonDeviceCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-slate-200" />
        <div className="h-4 w-20 rounded bg-slate-200" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-3 w-24 rounded bg-slate-200" />
            <div className="h-9 w-full rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 w-28 rounded-xl bg-slate-100" />
        <div className="h-9 w-28 rounded-xl bg-slate-100" />
        <div className="ml-auto h-9 w-24 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<WaDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const data = await getDevices();
        setDevices(data);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  function handleDeviceSaved(updated: WaDevice) {
    setDevices((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Smartphone className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Perangkat
          </h1>
          <p className="text-sm text-slate-500">
            Konfigurasi perangkat WhatsApp untuk broadcast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonDeviceCard key={i} />
            ))
          : devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onSaved={handleDeviceSaved}
              />
            ))}
        {!loading && devices.length === 0 && (
          <p className="col-span-3 text-sm text-slate-400">
            Belum ada perangkat terdaftar.
          </p>
        )}
      </div>
    </div>
  );
}
