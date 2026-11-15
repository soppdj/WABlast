import { Plus } from 'lucide-react';

interface VariableChipsProps {
  onInsert: (variable: string) => void;
}

const VARIABLES = [
  { key: '{{salam}}', label: 'salam', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { key: '{{sapaan}}', label: 'sapaan', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { key: '{{nama}}', label: 'nama', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { key: '{{segmen}}', label: 'segmen', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
];

export default function VariableChips({ onInsert }: VariableChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.key)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${v.color}`}
        >
          <Plus className="w-3 h-3" />
          <span>{`{{${v.label}}}`}</span>
        </button>
      ))}
    </div>
  );
}
