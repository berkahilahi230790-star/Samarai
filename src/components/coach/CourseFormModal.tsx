import React, { useState, useEffect } from 'react';
import {
  X,
  Waves,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Award,
  FileText,
  Phone,
  UserCheck,
  Check,
  Plus,
  AlertCircle,
  Sparkles,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { SwimmingCourse, CoursePaymentScheme } from '../../types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialCourse?: SwimmingCourse | null;
  onSave: (courseData: Omit<SwimmingCourse, 'id' | 'currentParticipants'>) => void;
  onDelete?: (courseId: string) => void;
  currentCoachName: string;
  currentCoachPhone: string;
}

const CATEGORIES: ('Anak-Anak' | 'Dewasa' | 'Privat' | 'Prestasi')[] = [
  'Anak-Anak',
  'Dewasa',
  'Privat',
  'Prestasi',
];

const AVAILABLE_DAYS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
  'Fleksibel',
];

const TIME_PRESETS = [
  '08:00 - 09:30 WIB (Pagi)',
  '10:00 - 11:30 WIB (Pagi)',
  '15:30 - 17:00 WIB (Sore)',
  '16:00 - 17:30 WIB (Sore)',
  '18:30 - 20:00 WIB (Malam)',
  'Menyesuaikan Janji Temu',
];

const PRICE_PRESETS = [300000, 350000, 450000, 600000, 850000];

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialCourse,
  onSave,
  onDelete,
  currentCoachName,
  currentCoachPhone,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Anak-Anak' | 'Dewasa' | 'Privat' | 'Prestasi'>('Anak-Anak');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(350000);
  const [paymentScheme, setPaymentScheme] = useState<CoursePaymentScheme>('upfront');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [totalSessions, setTotalSessions] = useState<number>(8);
  const [maxParticipants, setMaxParticipants] = useState<number>(10);
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Selasa', 'Kamis']);
  const [scheduleTime, setScheduleTime] = useState('16:00 - 17:30 WIB');
  const [coachName, setCoachName] = useState(currentCoachName);
  const [coachPhone, setCoachPhone] = useState(currentCoachPhone);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form on open/change
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialCourse) {
        setTitle(initialCourse.title);
        setCategory(initialCourse.category);
        setDescription(initialCourse.description);
        setPrice(initialCourse.price);
        setPaymentScheme(initialCourse.paymentScheme || 'upfront');
        setDurationWeeks(initialCourse.durationWeeks);
        setTotalSessions(initialCourse.totalSessions);
        setMaxParticipants(initialCourse.maxParticipants);
        setScheduleDays(initialCourse.scheduleDays || ['Selasa', 'Kamis']);
        setScheduleTime(initialCourse.scheduleTime || '16:00 - 17:30 WIB');
        setCoachName(initialCourse.coachName || currentCoachName);
        setCoachPhone(initialCourse.coachPhone || currentCoachPhone);
      } else {
        // Default new course
        setTitle('');
        setCategory('Anak-Anak');
        setDescription('');
        setPrice(350000);
        setPaymentScheme('upfront');
        setDurationWeeks(4);
        setTotalSessions(8);
        setMaxParticipants(10);
        setScheduleDays(['Selasa', 'Kamis']);
        setScheduleTime('16:00 - 17:30 WIB');
        setCoachName(currentCoachName);
        setCoachPhone(currentCoachPhone);
      }
      setErrorMessage(null);
      setConfirmDelete(false);
    }
  }, [isOpen, mode, initialCourse, currentCoachName, currentCoachPhone]);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    if (day === 'Fleksibel') {
      setScheduleDays(['Fleksibel (Pilihan Peserta)']);
      return;
    }

    setScheduleDays(prev => {
      const filtered = prev.filter(d => !d.includes('Fleksibel'));
      if (filtered.includes(day)) {
        const next = filtered.filter(d => d !== day);
        return next.length > 0 ? next : [day];
      } else {
        return [...filtered, day];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Mohon isi nama / judul kelas renang.');
      return;
    }

    if (price <= 0) {
      setErrorMessage('Biaya kelas harus lebih besar dari Rp 0.');
      return;
    }

    if (totalSessions <= 0) {
      setErrorMessage('Total pertemuan sesi harus minimal 1 sesi.');
      return;
    }

    if (maxParticipants <= 0) {
      setErrorMessage('Kapasitas peserta maksimal minimal 1 murid.');
      return;
    }

    if (scheduleDays.length === 0) {
      setErrorMessage('Pilih minimal satu hari jadwal latihan.');
      return;
    }

    if (!scheduleTime.trim()) {
      setErrorMessage('Tentukan waktu sesi latihan.');
      return;
    }

    onSave({
      title: title.trim(),
      category,
      description: description.trim() || `Pelatihan renang kategori ${category} dengan bimbingan teknik terstruktur dan materi keselamatan air.`,
      price: Number(price),
      paymentScheme,
      durationWeeks: Number(durationWeeks),
      totalSessions: Number(totalSessions),
      maxParticipants: Number(maxParticipants),
      scheduleDays,
      scheduleTime: scheduleTime.trim(),
      coachName: coachName.trim() || currentCoachName,
      coachPhone: coachPhone.trim() || currentCoachPhone,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 relative my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {mode === 'add' ? 'Tambah Kelas Renang Baru' : 'Edit Kelas Renang'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'add'
                  ? 'Publikasikan jadwal dan program kursus renang baru untuk para member'
                  : `Perbarui informasi program dan jadwal untuk ${initialCourse?.title}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Nama Kelas & Kategori */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Nama / Judul Kelas Renang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Kelas Renang Gaya Bebas & Dada (Intermediate)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Kategori Program Renang
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      category === cat
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Biaya Kursus & Kapasitas Peserta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800">
                  Biaya Kursus (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="font-black text-blue-600">
                  Rp {Number(price || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="25000"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRICE_PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrice(p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                      price === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rp {(p / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Kapasitas Maksimal Peserta (Kuota Murid) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                  required
                />
                <span className="text-slate-500 font-medium shrink-0">Murid</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {mode === 'edit' && initialCourse
                  ? `Saat ini terisi ${initialCourse.currentParticipants} peserta`
                  : 'Saran: 6-10 murid untuk kelas grup, 1-3 murid untuk privat'}
              </span>
            </div>
          </div>

          {/* 2b. Pengaturan Skema Pembayaran Kelas (Di Awal vs Setelah Berjalan) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Pengaturan Skema Pembayaran Kelas <span className="text-rose-500">*</span>
                </label>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                paymentScheme === 'upfront' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {paymentScheme === 'upfront' ? 'Di Awal (Potong Saldo Saat Konfirmasi)' : 'Setelah Berjalan (Tanpa Potong Saldo)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1: Pembayaran di Awal */}
              <div
                onClick={() => setPaymentScheme('upfront')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paymentScheme === 'upfront'
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentScheme === 'upfront' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                  }`}>
                    {paymentScheme === 'upfront' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>Pembayaran di Awal</span>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-100/60 px-1.5 py-0.2 rounded">Standar</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Saat guru les mengonfirmasi pendaftaran member, <strong>saldo member langsung otomatis dipotong</strong> sebesar Rp {Number(price || 0).toLocaleString('id-ID')}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opsi 2: Pembayaran Setelah Berjalan */}
              <div
                onClick={() => setPaymentScheme('postpaid')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paymentScheme === 'postpaid'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentScheme === 'postpaid' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                  }`}>
                    {paymentScheme === 'postpaid' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>Pembayaran Setelah Berjalan</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100/60 px-1.5 py-0.2 rounded">Fleksibel</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Member dapat <strong>langsung masuk kelas setelah dikonfirmasi guru tanpa potong saldo</strong> di awal. Pembayaran diatur setelah sesi latihan berjalan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Durasi Minggu & Total Sesi Pertemuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Durasi Program (Minggu) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={durationWeeks}
                  onChange={e => setDurationWeeks(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                  required
                />
                <span className="text-slate-500 font-medium shrink-0">Minggu</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Total Pertemuan Sesi <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalSessions}
                  onChange={e => setTotalSessions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                  required
                />
                <span className="text-slate-500 font-medium shrink-0">Sesi Latihan</span>
              </div>
            </div>
          </div>

          {/* 4. Jadwal Hari Latihan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                Pilih Hari Latihan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-blue-600 font-bold">
                Terpilih: {scheduleDays.join(', ')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_DAYS.map(day => {
                const isSelected = scheduleDays.includes(day) || (day === 'Fleksibel' && scheduleDays.some(d => d.includes('Fleksibel')));
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Waktu Sesi Latihan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Waktu Sesi Latihan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              placeholder="Contoh: 16:00 - 17:30 WIB"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden mb-2"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setScheduleTime(preset.replace(/\s*\(.*?\)/, ''))}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Info Instruktur & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Nama Instruktur / Guru Les
              </label>
              <input
                type="text"
                value={coachName}
                onChange={e => setCoachName(e.target.value)}
                placeholder="Nama & Gelar Instruktur"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                No. WhatsApp / Kontak
              </label>
              <input
                type="text"
                value={coachPhone}
                onChange={e => setCoachPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* 7. Deskripsi & Silabus Pelatihan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Deskripsi & Target Pelatihan Renang
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Jelaskan sasaran materi, tingkatan peserta, teknik gaya yang dilatihkan, dan fasilitas yang didapat..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Delete Option if in edit mode */}
          {mode === 'edit' && onDelete && initialCourse && (
            <div className="pt-4 border-t border-slate-100">
              {!confirmDelete ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">Hapus Kelas Renang Ini</span>
                    <span className="text-[11px] text-slate-500">Kelas akan dihapus dari jadwal dan aplikasi member</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Hapus Kelas
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-rose-900 font-bold text-xs block">
                        Yakin ingin menghapus kelas "{initialCourse.title}"?
                      </span>
                      <span className="text-rose-600 text-[11px] block mt-0.5">
                        Tindakan ini tidak dapat dibatalkan.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialCourse.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Ya, Hapus Sekarang
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5"
            >
              {mode === 'add' ? (
                <>
                  <Plus className="w-4 h-4" />
                  Terbitkan Kelas Baru
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
