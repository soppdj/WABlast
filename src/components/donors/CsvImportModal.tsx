import { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DonorSalutation, DonorSegment } from '../../types/database';
import { SEGMENT_LABELS } from '../../types/database';
import { normalizePhoneNumber, isValidWANumber } from '../../lib/utils';
import { createDonor } from '../../services/campaignService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  existingNumbers: Set<string>;
}

interface ParsedRow {
  raw: Record<string, string>;
  sapaan: DonorSalutation;
  nama: string;
  nomor_wa: string;
  normalized_number: string;
  segmen: DonorSegment;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

type ColumnMapping = {
  sapaan: string;
  nama: string;
  nomor_wa: string;
  segmen: string;
};

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });

  return { headers, rows };
}

function guessMapping(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (keywords: string[]) =>
    headers[lower.findIndex((h) => keywords.some((k) => h.includes(k)))] || '';

  return {
    sapaan: find(['sapaan', 'salutation', 'gelar']),
    nama: find(['nama', 'name', 'full_name']),
    nomor_wa: find(['nomor', 'whatsapp', 'wa', 'phone', 'hp', 'telp']),
    segmen: find(['segmen', 'segment', 'grup', 'group']),
  };
}

function resolveSegment(val: string): DonorSegment {
  const lower = val.toLowerCase().trim();
  if (lower.includes('tetap')) return 'donatur_tetap';
  if (lower.includes('zakat')) return 'zakat';
  if (lower.includes('wakaf')) return 'wakaf';
  if (lower.includes('infaq')) return 'wakaf_infaq';
  if (lower.includes('subuh') || lower.includes('sedekah')) return 'sedekah_subuh';
  if (lower.includes('asuh') || lower.includes('wali')) return 'wali_asuh';
  if (lower.includes('baru')) return 'donatur_baru';
  if (
    lower === 'donatur_tetap' ||
    lower === 'zakat' ||
    lower === 'wakaf' ||
    lower === 'wakaf_infaq' ||
    lower === 'sedekah_subuh' ||
    lower === 'wali_asuh' ||
    lower === 'donatur_baru' ||
    lower === 'umum'
  )
    return lower as DonorSegment;
  return 'umum';
}

function resolveSalutation(val: string): DonorSalutation {
  const lower = val.toLowerCase().trim();
  if (lower === 'bunda' || lower === 'ibu' || lower === 'bu') return 'Bunda';
  return 'Ayah';
}

export default function CsvImportModal({ isOpen, onClose, onImported, existingNumbers }: CsvImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ sapaan: '', nama: '', nomor_wa: '', segmen: '' });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCsvText(text);
      setHeaders(h);
      setRawRows(r);
      const autoMapping = guessMapping(h);
      setMapping(autoMapping);
      applyMapping(r, autoMapping);
      setImportDone(false);
    };
    reader.readAsText(file);
  }

  function applyMapping(rows: Record<string, string>[], m: ColumnMapping) {
    const seen = new Set<string>();
    const parsed: ParsedRow[] = rows.map((row) => {
      const nomor = m.nomor_wa ? row[m.nomor_wa] || '' : '';
      const normalized = nomor ? normalizePhoneNumber(nomor) : '';
      const nama = m.nama ? row[m.nama] || '' : '';
      const sapaanStr = m.sapaan ? row[m.sapaan] || '' : '';
      const segmenStr = m.segmen ? row[m.segmen] || '' : '';

      const errors: string[] = [];
      if (!nama.trim()) errors.push('Nama kosong');
      if (!nomor.trim()) errors.push('Nomor kosong');
      else if (!isValidWANumber(nomor)) errors.push('Nomor tidak valid');

      const isDuplicate = existingNumbers.has(normalized) || seen.has(normalized);
      if (isDuplicate) errors.push('Duplikat');
      if (normalized) seen.add(normalized);

      return {
        raw: row,
        sapaan: resolveSalutation(sapaanStr),
        nama: nama.trim(),
        nomor_wa: nomor,
        normalized_number: normalized,
        segmen: resolveSegment(segmenStr),
        isValid: errors.length === 0,
        isDuplicate,
        errors,
      };
    });
    setParsedRows(parsed);
  }

  function handleMappingChange(field: keyof ColumnMapping, value: string) {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
    applyMapping(rawRows, newMapping);
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await createDonor({
          salutation: row.sapaan,
          full_name: row.nama,
          whatsapp_number: row.nomor_wa,
          segment: row.segmen,
          notes: '',
          is_active: true,
        });
        success++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    setImportDone(true);
    setImportResults({ success, failed });
    if (success > 0) onImported();
  }

  function handleClose() {
    setHeaders([]);
    setRawRows([]);
    setParsedRows([]);
    setImportDone(false);
    setProgress(0);
    onClose();
  }

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Import Donatur dari CSV</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File CSV</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {rawRows.length > 0
                  ? `${rawRows.length} baris ditemukan`
                  : 'Klik untuk pilih file .csv'}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Column Mapping */}
          {headers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pemetaan Kolom</label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['sapaan', 'Sapaan'],
                    ['nama', 'Nama'],
                    ['nomor_wa', 'Nomor WA'],
                    ['segmen', 'Segmen'],
                  ] as [keyof ColumnMapping, string][]
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <select
                      value={mapping[field]}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">— Tidak dipetakan —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Preview ({parsedRows.length} baris)
                </label>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <span className="text-red-500 font-medium">{invalidCount} bermasalah</span>
                  )}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sapaan</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nomor WA</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Segmen</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.slice(0, 50).map((row, i) => (
                        <tr
                          key={i}
                          className={row.isValid ? '' : 'bg-red-50'}
                        >
                          <td className="px-3 py-2 text-gray-700">{row.sapaan}</td>
                          <td className="px-3 py-2 text-gray-700">{row.nama || '—'}</td>
                          <td className="px-3 py-2 text-gray-700 font-mono text-xs">
                            {row.normalized_number || row.nomor_wa || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{SEGMENT_LABELS[row.segmen]}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <span className="text-emerald-600 text-xs">✓ OK</span>
                            ) : (
                              <span className="text-red-500 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {row.errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Mengimpor...</span>
                <span className="text-emerald-600 font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Results */}
          {importDone && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <span className="text-emerald-700 font-medium">
                  {importResults.success} donatur berhasil diimpor
                </span>
                {importResults.failed > 0 && (
                  <span className="text-red-500 ml-2">({importResults.failed} gagal)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {importDone ? 'Tutup' : 'Batal'}
          </button>
          {!importDone && (
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Mengimpor...' : `Import ${validCount} Donatur`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
