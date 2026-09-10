import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  QrCode,
  Download,
  AlertCircle,
  UserCheck,
  UserX,
  BadgeCheck,
} from 'lucide-react';
import { User } from '../../types';
import { useApp } from '../../context/AppContext';

export const EmployeeDatabaseSection: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, updateUserStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);
  const [viewingQrEmployee, setViewingQrEmployee] = useState<{ employee: User; qrUrl: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    memberNumber: '',
    status: 'active' as 'active' | 'suspended',
  });
  const [formError, setFormError] = useState('');

  // All gate employees
  const employees = useMemo(() => {
    return users.filter(u => u.role === 'gate');
  }, [users]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        emp.memberNumber.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Metrics
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'active').length;
  const suspendedCount = employees.filter(e => e.status === 'suspended').length;

  const handleOpenAddModal = () => {
    // Generate next employee ID
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setFormData({
      name: '',
      email: '',
      phone: '',
      memberNumber: `STF-KARYAWAN-${randomSuffix}`,
      status: 'active',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      memberNumber: emp.memberNumber,
      status: emp.status,
    });
    setFormError('');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama lengkap karyawan wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email karyawan wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon / WhatsApp wajib diisi.');
      return;
    }

    // Check duplicate email
    const exists = users.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
    if (exists) {
      setFormError('Email sudah terdaftar pada pengguna lain.');
      return;
    }

    addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      memberNumber: formData.memberNumber.trim() || `STF-KARYAWAN-${Math.floor(10 + Math.random() * 90)}`,
      role: 'gate',
      status: formData.status,
      balance: 0,
      enrolledCourseIds: [],
    });

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!formData.name.trim()) {
      setFormError('Nama lengkap karyawan wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email karyawan wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon / WhatsApp wajib diisi.');
      return;
    }

    updateUser(editingEmployee.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      memberNumber: formData.memberNumber.trim(),
      status: formData.status,
    });

    setEditingEmployee(null);
  };

  const handleConfirmDelete = () => {
    if (deletingEmployee) {
      deleteUser(deletingEmployee.id);
      setDeletingEmployee(null);
    }
  };

  const handleViewEmployeeQr = async (emp: User) => {
    try {
      const qrData = `STAFF:${emp.id}:${emp.memberNumber}:${emp.name}`;
      const url = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setViewingQrEmployee({ employee: emp, qrUrl: url });
    } catch {
      // Fallback
      alert('Gagal menghasilkan QR Code Karyawan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Cards */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Database Karyawan (Petugas Gate & Loket)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Kelola data akun staf operasional, akses pemindai tiket gerbang, dan nomor induk karyawan SAMARAI PARK.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan Baru
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Petugas Karyawan
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">Operator loket & pemindai</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Karyawan Aktif
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{activeCount}</span>
            <span className="text-[11px] text-emerald-700 font-medium">Memiliki izin validasi tiket</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dinonaktifkan / Suspended
            </span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{suspendedCount}</span>
            <span className="text-[11px] text-rose-700 font-medium">Akses login & gate dikunci</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, ID karyawan, email, HP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="all">Semua Status ({totalCount})</option>
            <option value="active">Aktif ({activeCount})</option>
            <option value="suspended">Nonaktif ({suspendedCount})</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">Daftar Karyawan Terdaftar</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredEmployees.length} Data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/70">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">ID Staf</th>
                <th className="py-3 px-4">Kontak (Email / WA)</th>
                <th className="py-3 px-4">Tgl Bergabung</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{emp.name}</span>
                          <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                            <BadgeCheck className="w-3 h-3" />
                            Petugas Gate & Loket
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-[11px]">
                        {emp.memberNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{emp.joinDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {emp.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" /> Nonaktif
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewEmployeeQr(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Lihat Kartu ID QR Staf"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Data Karyawan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateUserStatus(emp.id, emp.status === 'active' ? 'suspended' : 'active')
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            emp.status === 'active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {emp.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEmployee(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data karyawan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TAMBAH KARYAWAN BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base tracking-tight">Tambah Karyawan Baru</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Daftarkan staf operasional gate scanner & loket tiket
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Karyawan / Staf</label>
                  <input
                    type="text"
                    required
                    value={formData.memberNumber}
                    onChange={e => setFormData({ ...formData, memberNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081987654321"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Karyawan *</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi.staff@samaraipark.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-900 leading-relaxed font-medium">
                Akun karyawan ini dapat digunakan untuk login ke portal <strong>Gate Scanner & Loket</strong> guna memindai tiket pengunjung serta melakukan top up saldo member di lapangan.
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 transition-all cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT KARYAWAN */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base tracking-tight">Edit Data Karyawan</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Perbarui rincian informasi dan status akun staf
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Karyawan</label>
                  <input
                    type="text"
                    required
                    value={formData.memberNumber}
                    onChange={e => setFormData({ ...formData, memberNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KARTU QR ID KARYAWAN */}
      {viewingQrEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Kartu Akses Staf Gate
              </span>
              <button
                type="button"
                onClick={() => setViewingQrEmployee(null)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="font-black text-base text-slate-900">{viewingQrEmployee.employee.name}</h4>
              <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                {viewingQrEmployee.employee.memberNumber}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Petugas Gerbang & Loket Resmi
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 inline-block mx-auto shadow-inner">
              <img
                src={viewingQrEmployee.qrUrl}
                alt="QR Code Karyawan"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Gunakan barcode/QR ini untuk autentikasi cepat pergantian operator gate atau pencatatan presensi staf.
            </p>

            <div className="pt-2">
              <a
                href={viewingQrEmployee.qrUrl}
                download={`Badge-${viewingQrEmployee.employee.memberNumber}.png`}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh Kartu ID (PNG)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KONFIRMASI HAPUS KARYAWAN */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-base">Hapus Data Karyawan?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin menghapus akun karyawan <strong>{deletingEmployee.name}</strong> ({deletingEmployee.memberNumber})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-200 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
