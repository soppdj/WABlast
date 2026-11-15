import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Donor, DonorSalutation, DonorSegment } from '../../types/database';
import { SEGMENT_LABELS } from '../../types/database';
import { normalizePhoneNumber, isValidWANumber } from '../../lib/utils';
import { createDonor, updateDonor } from '../../services/campaignService';

interface DonorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  donor?: Donor | null;
}

const SEGMENTS: DonorSegment[] = [
  'donatur_tetap',
  'zakat',
  'wakaf',
  'sedekah_subuh',
  'wali_asuh',
  'donatur_baru',
  'umum',
];

export default function DonorFormModal({ isOpen, onClose, onSaved, donor }: DonorFormModalProps) {
  const [salutation, setSalutation] = useState<DonorSalutation>('Ayah');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [segment, setSegment] = useState<DonorSegment>('umum');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!donor;

  useEffect(() => {
    if (donor) {
      setSalutation(donor.salutation);
      setFullName(donor.full_name);
      setWhatsappNumber(donor.whatsapp_number);
      setSegment(donor.segment);
      setNotes(donor.notes || '');
      setIsActive(donor.is_active);
    } else {
      setSalutation('Ayah');
      setFullName('');
      setWhatsappNumber('');
      setSegment('umum');
      setNotes('');
      setIsActive(true);
    }
    setError('');
  }, [donor, isOpen]);

  const normalizedPreview = whatsappNumber.trim()
    ? normalizePhoneNumber(whatsappNumber)
    : '';

  const isNumberValid = whatsappNumber.trim() ? isValidWANumber(whatsappNumber) : true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!whatsappNumber.trim() || !isValidWANumber(whatsappNumber)) {
      setError('Nomor WhatsApp tidak valid');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && donor) {
        await updateDonor(donor.id, {
          salutation,
          full_name: fullName.trim(),
          whatsapp_number: whatsappNumber.trim(),
          segment,
          notes: notes.trim(),
          is_active: isActive,
        });
      } else {
        await createDonor({
          salutation,
          full_name: fullName.trim(),
          whatsapp_number: whatsappNumber.trim(),
          segment,
          notes: notes.trim(),
          is_active: isActive,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan donatur');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Edit Donatur' : 'Tambah Donatur Baru'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Salutation Radio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sapaan</label>
            <div className="flex gap-4">
              {(['Ayah', 'Bunda'] as DonorSalutation[]).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="salutation"
                    checked={salutation === s}
                    onChange={() => setSalutation(s)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ahmad Fauzi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="08123456789"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                whatsappNumber.trim() && !isNumberValid
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {normalizedPreview && (
              <p className={`mt-1 text-xs ${isNumberValid ? 'text-emerald-600' : 'text-red-500'}`}>
                → {normalizedPreview}
                {!isNumberValid && ' (nomor tidak valid)'}
              </p>
            )}
          </div>

          {/* Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segmen</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as DonorSegment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              {SEGMENTS.map((seg) => (
                <option key={seg} value={seg}>
                  {SEGMENT_LABELS[seg]}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan tambahan (opsional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Status Aktif</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
