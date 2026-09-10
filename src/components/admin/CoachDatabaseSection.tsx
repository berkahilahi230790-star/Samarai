import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  AlertCircle,
  ExternalLink,
  DollarSign,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import { User, SwimmingCourse } from '../../types';
import { useApp } from '../../context/AppContext';

export const CoachDatabaseSection: React.FC = () => {
  const { users, swimmingCourses, addUser, updateUser, deleteUser, updateUserStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<User | null>(null);
  const [deletingCoach, setDeletingCoach] = useState<User | null>(null);
  const [viewingCoursesCoach, setViewingCoursesCoach] = useState<{ coach: User; courses: SwimmingCourse[] } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    memberNumber: '',
    coachSpecialty: '',
    avatarUrl: '',
    status: 'active' as 'active' | 'suspended',
  });
  const [formError, setFormError] = useState('');

  // All coaches
  const coaches = useMemo(() => {
    return users.filter(u => u.role === 'coach');
  }, [users]);

  // Filtered coaches
  const filteredCoaches = useMemo(() => {
    return coaches.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.memberNumber.toLowerCase().includes(q) ||
        (c.coachSpecialty && c.coachSpecialty.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [coaches, searchQuery, statusFilter]);

  // Calculations
  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter(c => c.status === 'active').length;
  const totalClassesTaught = swimmingCourses.length;
  const totalStudentsEnrolled = swimmingCourses.reduce(
    (sum, course) => sum + (course.currentParticipants || 0),
    0
  );

  const getCoachCourses = (coach: User) => {
    return swimmingCourses.filter(
      c => c.coachId === coach.id || c.coachName.toLowerCase() === coach.name.toLowerCase()
    );
  };

  const handleOpenAddModal = () => {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setFormData({
      name: '',
      email: '',
      phone: '',
      memberNumber: `GURU-LES-${randomSuffix}`,
      coachSpecialty: 'Instruktur Renang Bersertifikat PRSI',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80',
      status: 'active',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (coach: User) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      email: coach.email,
      phone: coach.phone,
      memberNumber: coach.memberNumber,
      coachSpecialty: coach.coachSpecialty || '',
      avatarUrl: coach.avatarUrl || '',
      status: coach.status,
    });
    setFormError('');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama lengkap Guru Les wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon / WhatsApp wajib diisi.');
      return;
    }
    if (!formData.coachSpecialty.trim()) {
      setFormError('Keahlian / Spesialisasi wajib diisi.');
      return;
    }

    const exists = users.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
    if (exists) {
      setFormError('Email sudah terdaftar pada pengguna lain.');
      return;
    }

    addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      memberNumber: formData.memberNumber.trim() || `GURU-LES-${Math.floor(10 + Math.random() * 90)}`,
      coachSpecialty: formData.coachSpecialty.trim(),
      avatarUrl: formData.avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80',
      role: 'coach',
      status: formData.status,
      balance: 0,
      enrolledCourseIds: [],
      teachingCourseIds: [],
    });

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;

    if (!formData.name.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon / WhatsApp wajib diisi.');
      return;
    }

    updateUser(editingCoach.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      memberNumber: formData.memberNumber.trim(),
      coachSpecialty: formData.coachSpecialty.trim(),
      avatarUrl: formData.avatarUrl.trim(),
      status: formData.status,
    });

    setEditingCoach(null);
  };

  const handleConfirmDelete = () => {
    if (deletingCoach) {
      deleteUser(deletingCoach.id);
      setDeletingCoach(null);
    }
  };

  const handleOpenCoachCourses = (coach: User) => {
    const courses = getCoachCourses(coach);
    setViewingCoursesCoach({ coach, courses });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Database Guru Les (Instruktur Renang)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Pusat data instruktur renang resmi, sertifikasi kepelatihan, monitoring kelas, dan jumlah murid terdaftar.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Guru Les Baru
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Guru Les</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{totalCoaches}</span>
          <span className="text-[11px] text-slate-500 font-medium">Instruktur terdaftar</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Guru Les Aktif</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 block">{activeCoaches}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Siap mengampu kelas</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Kelas Renang</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-600 block">{totalClassesTaught}</span>
          <span className="text-[11px] text-slate-500 font-medium">Program kursus aktif</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Murid Terdaftar</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-purple-600 block">{totalStudentsEnrolled}</span>
          <span className="text-[11px] text-slate-500 font-medium">Peserta kursus aktif</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, spesialisasi, email, ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Semua Status ({totalCoaches})</option>
            <option value="active">Aktif ({activeCoaches})</option>
            <option value="suspended">Nonaktif ({totalCoaches - activeCoaches})</option>
          </select>
        </div>
      </div>

      {/* Coaches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCoaches.length > 0 ? (
          filteredCoaches.map(coach => {
            const coachCourses = getCoachCourses(coach);
            const totalStudents = coachCourses.reduce((s, c) => s + (c.currentParticipants || 0), 0);

            return (
              <div
                key={coach.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          coach.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80'
                        }
                        alt={coach.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div>
                        <h3 className="font-black text-sm text-slate-900 leading-snug">{coach.name}</h3>
                        <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {coach.memberNumber}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        coach.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {coach.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Specialty badge */}
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Keahlian / Lisensi
                    </span>
                    <p className="text-xs font-semibold text-slate-800 flex items-start gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{coach.coachSpecialty || 'Instruktur Renang Umum'}</span>
                    </p>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`https://wa.me/${coach.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-600 transition-colors font-medium flex items-center gap-1"
                      >
                        {coach.phone}
                        <ExternalLink className="w-3 h-3 text-slate-300" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate">{coach.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bergabung sejak {coach.joinDate}</span>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                        Kelas Diampu
                      </span>
                      <span className="text-sm font-black text-indigo-700">
                        {coachCourses.length} Program
                      </span>
                    </div>
                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                        Total Murid
                      </span>
                      <span className="text-sm font-black text-purple-700">
                        {totalStudents} Peserta
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCoachCourses(coach)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Lihat Kelas ({coachCourses.length})
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(coach)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Profil Guru Les"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateUserStatus(coach.id, coach.status === 'active' ? 'suspended' : 'active')
                      }
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        coach.status === 'active'
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={coach.status === 'active' ? 'Nonaktifkan Guru' : 'Aktifkan Guru'}
                    >
                      {coach.status === 'active' ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCoach(coach)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Guru Les"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100 p-8">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Tidak ada Guru Les yang sesuai pencarian.</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Ubah kata kunci pencarian atau daftarkan guru les baru melalui tombol di atas.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH GURU LES BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base tracking-tight">Tambah Guru Les Baru</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Daftarkan instruktur renang profesional SAMARAI PARK
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
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Coach Randy Siregar, S.Or"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Guru Les</label>
                  <input
                    type="text"
                    required
                    value={formData.memberNumber}
                    onChange={e => setFormData({ ...formData, memberNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700"
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
                <label className="block font-bold text-slate-700 mb-1">Spesialisasi / Keahlian *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Spesialis Gaya Bebas & Dada (Lisensi PRSI)"
                  value={formData.coachSpecialty}
                  onChange={e => setFormData({ ...formData, coachSpecialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081288776655"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Guru Les *</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: coach.randy@samaraipark.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Profil (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatarUrl}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-600"
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                >
                  Simpan Guru Les
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GURU LES */}
      {editingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base tracking-tight">Edit Data Guru Les</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Perbarui profil, keahlian, dan status instruktur
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoach(null)}
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
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Guru Les</label>
                  <input
                    type="text"
                    required
                    value={formData.memberNumber}
                    onChange={e => setFormData({ ...formData, memberNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700"
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
                <label className="block font-bold text-slate-700 mb-1">Spesialisasi / Keahlian</label>
                <input
                  type="text"
                  required
                  value={formData.coachSpecialty}
                  onChange={e => setFormData({ ...formData, coachSpecialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Profil</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-600"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoach(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DAFTAR KELAS YANG DIAMPU GURU */}
      {viewingCoursesCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    viewingCoursesCoach.coach.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80'
                  }
                  alt={viewingCoursesCoach.coach.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="font-black text-base tracking-tight">{viewingCoursesCoach.coach.name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Daftar Program Kursus Renang yang Diampu ({viewingCoursesCoach.courses.length} Kelas)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCoursesCoach(null)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {viewingCoursesCoach.courses.length > 0 ? (
                viewingCoursesCoach.courses.map(course => (
                  <div
                    key={course.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {course.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              course.paymentScheme === 'postpaid'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {course.paymentScheme === 'postpaid'
                              ? 'Bayar Setelah Berjalan'
                              : 'Bayar Di Awal'}
                          </span>
                        </div>
                        <h5 className="font-black text-sm text-slate-900 mt-1">{course.title}</h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{course.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">Biaya Kursus:</span>
                        <span className="text-sm font-black text-emerald-600">
                          Rp {course.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.scheduleDays.join(', ')} ({course.scheduleTime})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.durationWeeks} Minggu ({course.totalSessions} Sesi)</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 font-bold">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-indigo-900">
                          {course.currentParticipants} / {course.maxParticipants} Murid
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-600">Guru ini belum memiliki kelas aktif.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kelas baru dapat dibuat melalui portal Guru Les (Instruktur).
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCoursesCoach(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KONFIRMASI HAPUS GURU LES */}
      {deletingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-base">Hapus Data Guru Les?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin menghapus data instruktur <strong>{deletingCoach.name}</strong> ({deletingCoach.memberNumber})? Data akses akun akan dihapus dari sistem.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCoach(null)}
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
