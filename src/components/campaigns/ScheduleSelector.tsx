import type { CampaignScheduleType, RecurringPattern } from '../../types/database';

interface ScheduleSelectorProps {
  scheduleType: CampaignScheduleType;
  onScheduleTypeChange: (type: CampaignScheduleType) => void;
  scheduledAt: string;
  onScheduledAtChange: (val: string) => void;
  recurringPattern: RecurringPattern;
  onRecurringPatternChange: (pattern: RecurringPattern) => void;
  recurringDays: number[];
  onRecurringDaysChange: (days: number[]) => void;
  recurringDayOfMonth: number | null;
  onRecurringDayOfMonthChange: (day: number | null) => void;
  recurringTime: string;
  onRecurringTimeChange: (time: string) => void;
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function ScheduleSelector({
  scheduleType,
  onScheduleTypeChange,
  scheduledAt,
  onScheduledAtChange,
  recurringPattern,
  onRecurringPatternChange,
  recurringDays,
  onRecurringDaysChange,
  recurringDayOfMonth,
  onRecurringDayOfMonthChange,
  recurringTime,
  onRecurringTimeChange,
}: ScheduleSelectorProps) {
  function toggleDay(day: number) {
    if (recurringDays.includes(day)) {
      onRecurringDaysChange(recurringDays.filter((d) => d !== day));
    } else {
      onRecurringDaysChange([...recurringDays, day].sort());
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Jadwal Pengiriman</label>

      {/* Schedule Type Radio Buttons */}
      <div className="space-y-2">
        {([
          { value: 'immediate' as CampaignScheduleType, label: 'Kirim Sekarang', desc: 'Broadcast langsung dimulai setelah submit' },
          { value: 'one_time' as CampaignScheduleType, label: 'Jadwal Sekali Jalan', desc: 'Kirim pada tanggal & waktu tertentu' },
          { value: 'recurring' as CampaignScheduleType, label: 'Jadwal Berulang', desc: 'Kirim otomatis secara berkala' },
        ]).map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              scheduleType === option.value
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="scheduleType"
              value={option.value}
              checked={scheduleType === option.value}
              onChange={() => onScheduleTypeChange(option.value)}
              className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{option.label}</p>
              <p className="text-xs text-gray-500">{option.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* One-time Schedule: Date/Time Picker */}
      {scheduleType === 'one_time' && (
        <div className="pl-7 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tanggal & Waktu (WIB)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Recurring Schedule */}
      {scheduleType === 'recurring' && (
        <div className="pl-7 space-y-4">
          {/* Frequency */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Frekuensi</label>
            <select
              value={recurringPattern}
              onChange={(e) => onRecurringPatternChange(e.target.value as RecurringPattern)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>

          {/* Weekly: Day selector */}
          {recurringPattern === 'weekly' && (
            <div>
              <label className="block text-xs text-gray-500 mb-2">Hari</label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                      recurringDays.includes(i)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Day of month */}
          {recurringPattern === 'monthly' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
              <select
                value={recurringDayOfMonth ?? 1}
                onChange={(e) => onRecurringDayOfMonthChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tanggal {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time picker */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Waktu (WIB)</label>
            <input
              type="time"
              value={recurringTime}
              onChange={(e) => onRecurringTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
