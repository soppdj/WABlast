import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  RefreshCw,
} from 'lucide-react';
import type { Donor, DonorSegment, DonorSalutation } from '../types/database';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '../types/database';
import { getDonors, deleteDonor, updateDonor } from '../services/campaignService';
import { formatPhoneDisplay } from '../lib/utils';
import DonorFormModal from '../components/donors/DonorFormModal';
import CsvImportModal from '../components/donors/CsvImportModal';

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<DonorSegment | 'all'>('all');
  const [selectedSalutation, setSelectedSalutation] = useState<DonorSalutation | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const data = await getDonors();
      setDonors(data);
    } catch (err) {
      console.error('Failed to load donors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const existingNumbers = useMemo(() => {
    return new Set(donors.map((d) => d.whatsapp_number));
  }, [donors]);

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.full_name.toLowerCase().includes(q) ||
        d.whatsapp_number.includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q));

      // Segment
      const matchSegment = selectedSegment === 'all' || d.segment === selectedSegment;

      // Salutation
      const matchSalutation = selectedSalutation === 'all' || d.salutation === selectedSalutation;

      // Status
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && d.is_active) ||
        (selectedStatus === 'inactive' && !d.is_active);

      return matchSearch && matchSegment && matchSalutation && matchStatus;
    });
  }, [donors, search, selectedSegment, selectedSalutation, selectedStatus]);

  const stats = useMemo(() => {
    const total = donors.length;
    const tetap = donors.filter((d) => d.segment === 'donatur_tetap').length;
    const zakat = donors.filter((d) => d.segment === 'zakat').length;
    const wakaf = donors.filter((d) => d.segment === 'wakaf' || d.segment === 'wakaf_infaq').length;
    const subuh = donors.filter((d) => d.segment === 'sedekah_subuh').length;
    const waliAsuh = donors.filter((d) => d.segment === 'wali_asuh').length;
    const baru = donors.filter((d) => d.segment === 'donatur_baru').length;
    const active = donors.filter((d) => d.is_active).length;
    return { total, tetap, zakat, wakaf, subuh, waliAsuh, baru, active };
  }, [donors]);

  const handleOpenAdd = () => {
    setEditingDonor(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus donatur "${name}" dari database?`)) return;
    try {
      await deleteDonor(id);
      setDonors((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Gagal menghapus donatur');
    }
  };

  const handleToggleStatus = async (donor: Donor) => {
    try {
      const updated = await updateDonor(donor.id, { is_active: !donor.is_active });
      setDonors((prev) => prev.map((d) => (d.id === donor.id ? updated : d)));
    } catch (err) {
      alert('Gagal memperbarui status donatur');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Database Donatur</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data kontak donatur, sapaan Ayah/Bunda, serta segmentasi program pengiriman.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Donatur
          </button>
        </div>
      </div>

      {/* Segment Summary Badges (8 Kategori Termasuk Wali Asuh) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Total Donatur</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700">Donatur Tetap</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">{stats.tetap}</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-purple-700">Zakat</p>
          <p className="mt-1 text-xl font-bold text-purple-800">{stats.zakat}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-blue-700">Wakaf</p>
          <p className="mt-1 text-xl font-bold text-blue-800">{stats.wakaf}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-amber-700">Sedekah Subuh</p>
          <p className="mt-1 text-xl font-bold text-amber-800">{stats.subuh}</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-teal-700">Wali Asuh</p>
          <p className="mt-1 text-xl font-bold text-teal-800">{stats.waliAsuh}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-rose-700">Donatur Baru</p>
          <p className="mt-1 text-xl font-bold text-rose-800">{stats.baru}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700">Aktif Broadcast</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">{stats.active}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, nomor WhatsApp (628...), atau catatan..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segment Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value as DonorSegment | 'all')}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Segmen</option>
                <option value="donatur_tetap">Donatur Tetap</option>
                <option value="zakat">Zakat</option>
                <option value="wakaf">Wakaf</option>
                <option value="sedekah_subuh">Sedekah Subuh</option>
                <option value="wali_asuh">Wali Asuh</option>
                <option value="donatur_baru">Donatur Baru</option>
                <option value="umum">Umum</option>
              </select>
            </div>

            {/* Salutation Filter */}
            <select
              value={selectedSalutation}
              onChange={(e) => setSelectedSalutation(e.target.value as DonorSalutation | 'all')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Sapaan</option>
              <option value="Ayah">Ayah</option>
              <option value="Bunda">Bunda</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>

            <button
              onClick={fetchDonors}
              title="Refresh"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Sapaan & Nama
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Nomor WhatsApp
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Segmen
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Catatan
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-sm font-medium">Memuat data donatur...</p>
                  </td>
                </tr>
              ) : filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-600">Tidak ada donatur yang sesuai</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter segmen.</p>
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => {
                  return (
                    <tr key={donor.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              donor.salutation === 'Ayah'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {donor.salutation}
                          </span>
                          <span className="font-semibold text-slate-900">{donor.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatPhoneDisplay(donor.whatsapp_number)}</span>
                          <a
                            href={`https://wa.me/${donor.whatsapp_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-600"
                            title="Buka Chat WhatsApp"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            SEGMENT_COLORS[donor.segment]
                          }`}
                        >
                          {SEGMENT_LABELS[donor.segment]}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(donor)}
                          className="inline-flex items-center gap-1.5 cursor-pointer text-xs"
                          title="Klik untuk ubah status"
                        >
                          {donor.is_active ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium text-emerald-700">Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-400">Non-aktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {donor.notes || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(donor)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            title="Edit Donatur"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(donor.id, donor.full_name)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            title="Hapus Donatur"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredDonors.length}</strong> dari{' '}
            <strong className="text-slate-700">{donors.length}</strong> donatur
          </span>
          <span>Klik sapaan Ayah/Bunda untuk mengelompokkan</span>
        </div>
      </div>

      {/* Modals */}
      <DonorFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingDonor(null);
        }}
        onSaved={async () => {
          setIsFormModalOpen(false);
          setEditingDonor(null);
          await fetchDonors();
        }}
        donor={editingDonor}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImported={async () => {
          setIsCsvModalOpen(false);
          await fetchDonors();
        }}
        existingNumbers={existingNumbers}
      />
    </div>
  );
}
