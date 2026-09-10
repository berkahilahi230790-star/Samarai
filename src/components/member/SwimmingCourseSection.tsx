import React, { useState, useMemo } from 'react';
import {
  Waves,
  Calendar,
  Clock,
  UserCheck,
  Award,
  MessageCircle,
  CheckCircle,
  Circle,
  Send,
  Sparkles,
  Users,
  ChevronRight,
  Phone,
  BookmarkCheck,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Filter,
  Check,
  CreditCard,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwimmingCourse, CourseProgress, User, EnrollmentRequest } from '../../types';

export const SwimmingCourseSection: React.FC = () => {
  const {
    currentUser,
    users,
    swimmingCourses,
    courseProgress,
    chatMessages,
    enrollmentRequests,
    requestCourseEnrollment,
    cancelEnrollmentRequest,
    sendChatMessage,
    updateMilestone,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my_courses' | 'my_requests' | 'catalog'>('my_courses');
  const [selectedCourseForChat, setSelectedCourseForChat] = useState<SwimmingCourse | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [enrollingCourse, setEnrollingCourse] = useState<SwimmingCourse | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);

  // State untuk katalog: pemilihan Guru Renang ('all' atau ID guru tertentu)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!currentUser) return null;

  // Filter courses user is enrolled in
  const enrolledCourses = swimmingCourses.filter(c => currentUser.enrolledCourseIds?.includes(c.id));

  // Daftar Guru Renang aktif dari sistem
  const coachUsers = useMemo(() => {
    return users.filter(u => u.role === 'coach' && u.status === 'active');
  }, [users]);

  // Helper untuk mencocokkan kelas renang yang dibuat/diajar oleh Guru Renang tertentu
  const getCoursesByCoach = (coach: User) => {
    return swimmingCourses.filter(c => {
      // 1. Cocokkan berdasarkan coachId tersimpan
      if (c.coachId && c.coachId === coach.id) return true;
      // 2. Cocokkan berdasarkan teachingCourseIds milik guru
      if (coach.teachingCourseIds && coach.teachingCourseIds.includes(c.id)) return true;
      // 3. Cocokkan berdasarkan nama guru (case-insensitive substring)
      const coachKeywords = coach.name
        .toLowerCase()
        .replace(/coach|head|s\.or|,/gi, '')
        .trim()
        .split(' ')
        .filter(w => w.length > 2);
      if (coachKeywords.some(kw => c.coachName.toLowerCase().includes(kw))) return true;
      return false;
    });
  };

  // Guru yang sedang dipilih
  const selectedCoach = useMemo(() => {
    if (!selectedCoachId || selectedCoachId === 'all') return null;
    return coachUsers.find(c => c.id === selectedCoachId) || null;
  }, [selectedCoachId, coachUsers]);

  // Kelas yang ditampilkan berdasarkan Guru yang dipilih & filter kategori
  const displayedCourses = useMemo(() => {
    let list: SwimmingCourse[] = [];
    if (selectedCoachId === 'all') {
      list = swimmingCourses;
    } else if (selectedCoach) {
      list = getCoursesByCoach(selectedCoach);
    } else {
      list = [];
    }

    if (categoryFilter !== 'all') {
      list = list.filter(c => c.category === categoryFilter);
    }
    return list;
  }, [selectedCoachId, selectedCoach, swimmingCourses, categoryFilter]);

  // Permohonan pendaftaran milik member yang sedang login
  const myEnrollmentRequests = useMemo(() => {
    return enrollmentRequests.filter(r => r.userId === currentUser.id);
  }, [enrollmentRequests, currentUser.id]);

  const pendingRequestsCount = useMemo(() => {
    return myEnrollmentRequests.filter(r => r.status === 'pending').length;
  }, [myEnrollmentRequests]);

  const handleEnroll = (course: SwimmingCourse) => {
    setEnrollError(null);
    setEnrollSuccessMessage(null);
    const res = requestCourseEnrollment(currentUser.id, course.id);
    if (!res.success) {
      setEnrollError(res.message);
    } else {
      setEnrollSuccessMessage(res.message);
      setEnrollingCourse(null);
      setActiveTab('my_requests');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForChat || !chatInput.trim()) return;

    sendChatMessage(selectedCourseForChat.id, chatInput);
    setChatInput('');
  };

  // Get active chat messages for selected course
  const currentCourseMessages = chatMessages.filter(
    m => selectedCourseForChat && m.courseId === selectedCourseForChat.id
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Kursus & Akademi Renang SAMARAI
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Pelatihan renang berjenjang, jadwal latihan, pantau progres renang Anda, dan grup chat peserta.
          </p>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('my_courses')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'my_courses'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            Kelas Saya ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'my_requests'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pengajuan Kelas</span>
            {pendingRequestsCount > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'my_requests' ? 'bg-amber-300 text-slate-900' : 'bg-amber-500 text-white'
              }`}>
                {pendingRequestsCount}
              </span>
            ) : myEnrollmentRequests.length > 0 ? (
              <span className="text-[10px] opacity-70">({myEnrollmentRequests.length})</span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Katalog Pendaftaran
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {enrollSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{enrollSuccessMessage}</span>
          </div>
          <button
            onClick={() => setEnrollSuccessMessage(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: KELAS SAYA & PEMANTAUAN PROGRES */}
      {activeTab === 'my_courses' && (
        <div className="space-y-6">
          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Waves className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Belum Terdaftar di Kelas Renang
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                Tingkatkan kemampuan renang Anda dengan bimbingan pelatih bersertifikat. Daftarkan diri Anda pada katalog kelas renang SAMARAI PARK.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all inline-flex items-center gap-2"
              >
                Lihat Jadwal & Daftar Kelas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map(course => {
                const progress = courseProgress.find(
                  p => p.userId === currentUser.id && p.courseId === course.id
                );

                const totalMilestones = progress?.milestones.length || 1;
                const completedMilestones = progress?.milestones.filter(m => m.isCompleted).length || 0;
                const percentage = Math.round((completedMilestones / totalMilestones) * 100);

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5"
                  >
                    {/* Header Course Card */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                            {course.category}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif Berjalan
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1 tracking-tight">
                          {course.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {course.scheduleDays.join(', ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {course.scheduleTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {course.coachName}
                          </span>
                        </div>
                      </div>

                      {/* Open Chat Button */}
                      <button
                        onClick={() => setSelectedCourseForChat(course)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center gap-2 shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Grup Chat Peserta
                      </button>
                    </div>

                    {/* Real-time Progress Tracking Section */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            Pemantauan Progres Kemampuan (Real-Time)
                          </span>
                          <span className="text-[11px] font-medium text-blue-600">
                            {progress?.level || 'Tahap Dasar'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {completedMilestones} dari {totalMilestones} target tercapai
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Milestones Checklist */}
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Target Keterampilan (Milestones):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {progress?.milestones.map(m => (
                            <div
                              key={m.id}
                              onClick={() => updateMilestone(currentUser.id, course.id, m.id, !m.isCompleted)}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                                m.isCompleted
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                              title="Klik untuk simulasi verifikasi milestone"
                            >
                              <div className="mt-0.5 shrink-0">
                                {m.isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                              <div className="text-xs">
                                <div className={`font-semibold ${m.isCompleted ? 'line-through text-emerald-900' : ''}`}>
                                  {m.name}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  {m.description}
                                </div>
                                {m.completedDate && (
                                  <span className="text-[9px] font-mono text-emerald-700 block mt-0.5 font-bold">
                                    Lulus pada {m.completedDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coach Notes */}
                      {progress?.coachNotes && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs mt-2">
                          <span className="font-bold text-slate-800 block mb-0.5">
                            Catatan Pelatih (Coach Notes):
                          </span>
                          <p className="text-slate-500 italic font-medium">
                            "{progress.coachNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1B: STATUS PENGAJUAN PENDAFTARAN (MENUNGGU KONFIRMASI GURU LES) */}
      {activeTab === 'my_requests' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Policy Explanation Banner */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Status Pengajuan Pendaftaran Kelas Renang
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuai ketentuan, Anda dapat resmi masuk kelas setelah dikonfirmasi oleh Guru Les yang mengajar.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Daftar Kelas Lain
              </button>
            </div>

            {/* Skema Aturan Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Kelas Pembayaran di Awal
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                  Saldo tiket Anda baru akan <strong>dipotong otomatis saat Guru Les mengonfirmasi</strong> pendaftaran Anda.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Kelas Pembayaran Setelah Berjalan
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  Anda dapat <strong>langsung masuk kelas setelah dikonfirmasi Guru tanpa potong saldo</strong> di awal!
                </p>
              </div>
            </div>
          </div>

          {/* List Requests or Empty State */}
          {myEnrollmentRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  Belum Ada Pengajuan Pendaftaran
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium mt-1">
                  Anda belum mengajukan pendaftaran kelas renang. Silakan pilih guru renang dan jenis kelas renang di tab Katalog Pendaftaran.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('catalog')}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Pilih Guru Renang & Daftar Kelas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEnrollmentRequests.map(req => {
                const course = swimmingCourses.find(c => c.id === req.courseId);
                const scheme = req.paymentScheme || course?.paymentScheme || 'upfront';
                const isUpfront = scheme === 'upfront';
                const isPostpaid = scheme === 'postpaid';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                      req.status === 'pending'
                        ? 'border-amber-200/90 ring-2 ring-amber-100/50'
                        : req.status === 'approved'
                        ? 'border-emerald-200/90'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Status Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(req.requestedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {req.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Menunggu Konfirmasi Guru
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Resmi Masuk Kelas
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            Ditolak
                          </span>
                        )}
                      </div>

                      {/* Course Title & Details */}
                      <div>
                        <h4 className="font-black text-base text-slate-900 leading-tight">
                          {req.courseTitle}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Guru Les: <strong className="text-slate-900">{req.coachName}</strong></span>
                        </div>
                      </div>

                      {course && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Jadwal: <strong>{course.scheduleDays.join(', ')}</strong> ({course.scheduleTime})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Durasi: {course.durationWeeks} Minggu ({course.totalSessions} Pertemuan)</span>
                          </div>
                        </div>
                      )}

                      {/* Skema Pembayaran Info */}
                      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Biaya Kursus:</span>
                          <strong className="text-sm font-black text-blue-600">
                            Rp {req.price.toLocaleString('id-ID')}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Skema Pembayaran:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPostpaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isPostpaid ? '💳 Setelah Berjalan' : '⚡ Di Awal (Potong Saldo)'}
                          </span>
                        </div>
                      </div>

                      {/* Status Feedback Notes */}
                      {req.status === 'pending' && (
                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                          <span className="font-bold block flex items-center gap-1.5 text-amber-950">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Menunggu Konfirmasi Guru Les
                          </span>
                          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            Pengajuan telah diteruskan ke dasbor {req.coachName}. Anda dapat resmi masuk kelas setelah dikonfirmasi oleh guru lesnya.
                            {isUpfront
                              ? ` Saldo Anda akan otomatis dipotong Rp ${req.price.toLocaleString('id-ID')} saat disetujui.`
                              : ' Tanpa potong saldo di awal.'}
                          </p>
                        </div>
                      )}

                      {req.status === 'approved' && (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                          <span className="font-bold block flex items-center gap-1.5 text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Selamat! Anda Resmi Terdaftar Masuk Kelas
                          </span>
                          <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                            Dikonfirmasi oleh {req.processedByCoachName || 'Guru Les'}.
                            {isUpfront
                              ? ` Biaya pendaftaran Rp ${req.price.toLocaleString('id-ID')} telah dipotong lunas dari saldo tiket Anda.`
                              : ' Pendaftaran aktif tanpa potong saldo di awal (Pembayaran Setelah Berjalan).'}
                          </p>
                        </div>
                      )}

                      {req.status === 'rejected' && (
                        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 text-xs text-rose-900 space-y-1">
                          <span className="font-bold block flex items-center gap-1.5 text-rose-950">
                            <X className="w-4 h-4 text-rose-600" />
                            Pengajuan Ditolak oleh Guru Les
                          </span>
                          {req.rejectionReason && (
                            <p className="text-[11px] text-rose-800 leading-relaxed">
                              <strong>Alasan:</strong> {req.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      {req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => cancelEnrollmentRequest(req.id)}
                          className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Batalkan Pengajuan
                        </button>
                      )}

                      {req.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('my_courses')}
                          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookmarkCheck className="w-4 h-4" />
                          <span>Buka Kelas Renang Saya</span>
                        </button>
                      )}

                      {req.status === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('catalog')}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Pilih Kelas Lain
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === 'catalog' && (
        <div className="space-y-6">

          {/* Stepper Guide Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-blue-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  Alur Pendaftaran Kursus Renang
                </span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Pilih Guru Renang & Jenis Kelas yang Diinginkan
                </h3>
                <p className="text-xs text-blue-100/80 mt-1 max-w-xl font-medium leading-relaxed">
                  Pilih instruktur renang profesional SAMARAI PARK untuk melihat kurikulum, jadwal sesi, dan jenis kelas renang yang mereka buka.
                </p>
              </div>

              {/* Step indicator badges */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
                <div className={`flex items-center gap-1.5 font-bold ${selectedCoachId ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${selectedCoachId ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900 font-black'}`}>
                    1
                  </span>
                  <span>Pilih Guru</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                <div className={`flex items-center gap-1.5 font-bold ${selectedCoachId ? 'text-white' : 'text-white/50'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${selectedCoachId ? 'bg-blue-500 text-white font-black' : 'bg-white/20 text-white/60'}`}>
                    2
                  </span>
                  <span>Pilih Kelas</span>
                </div>
              </div>
            </div>
          </div>

          {/* LANGKAH 1: PILIH GURU RENANG */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    Pilih Guru Renang / Instruktur
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-8 font-medium">
                  Klik salah satu guru renang di bawah untuk memunculkan kelas renang yang beliau asuh.
                </p>
              </div>

              {/* Tombol Tampilkan Semua Guru */}
              <div className="flex items-center gap-2 ml-8 sm:ml-0">
                <button
                  onClick={() => setSelectedCoachId('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCoachId === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Semua Guru ({swimmingCourses.length} Kelas)
                </button>
              </div>
            </div>

            {/* Grid Kartu Guru Renang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {coachUsers.map(coach => {
                const isSelected = selectedCoachId === coach.id;
                const coachCourses = getCoursesByCoach(coach);

                return (
                  <div
                    key={coach.id}
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all border flex flex-col justify-between relative text-left group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                        : 'bg-slate-50/50 hover:bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header: Foto Guru & Status */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={coach.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80'}
                            alt={coach.name}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-xs"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <GraduationCap className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                              {coach.memberNumber || 'GURU-LES'}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Terpilih
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-black text-slate-900 tracking-tight mt-1 truncate">
                            {coach.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5 leading-snug">
                            {coach.coachSpecialty || 'Instruktur Renang Bersertifikat'}
                          </p>
                        </div>
                      </div>

                      {/* Info Tambahan */}
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-bold flex items-center gap-1 text-blue-700">
                          <Waves className="w-3.5 h-3.5" />
                          {coachCourses.length} Kelas Dibuat
                        </span>
                        {coach.phone && (
                          <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                            <Phone className="w-3 h-3" />
                            {coach.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol Pilih Guru */}
                    <div className="mt-3 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCoachId(coach.id);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Guru Terpilih
                          </>
                        ) : (
                          <>
                            Pilih Guru Ini
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LANGKAH 2: DAFTAR KELAS OLEH GURU TERPILIH */}
          <div className="space-y-4">
            
            {/* Header Guru yang Dipilih */}
            {selectedCoachId ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                        {selectedCoach ? (
                          <>
                            Kelas Renang oleh {selectedCoach.name}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {displayedCourses.length} Jenis Kelas
                            </span>
                          </>
                        ) : (
                          <>
                            Semua Kelas Renang dari Seluruh Guru
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {displayedCourses.length} Jenis Kelas
                            </span>
                          </>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {selectedCoach
                          ? `Berikut adalah seluruh jenis program dan jadwal kelas renang yang dibuat oleh ${selectedCoach.name}.`
                          : 'Menampilkan katalog seluruh kelas renang yang tersedia di SAMARAI PARK.'}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Ganti Guru / Reset */}
                  {selectedCoach && (
                    <button
                      onClick={() => setSelectedCoachId(null)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold self-start sm:self-auto py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ← Ganti Guru Renang
                    </button>
                  )}
                </div>

                {/* Filter Kategori Kelas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    Kategori:
                  </span>
                  {[
                    { id: 'all', label: 'Semua Kategori' },
                    { id: 'Anak-Anak', label: 'Anak-Anak' },
                    { id: 'Dewasa', label: 'Dewasa' },
                    { id: 'Privat', label: 'Privat (1-on-1)' },
                    { id: 'Prestasi', label: 'Prestasi' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        categoryFilter === cat.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* State saat member belum memilih Guru Renang */
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    Pilih Salah Satu Guru Renang di Atas
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                    Silakan klik salah satu kartu Guru Renang pada <strong>Langkah 1</strong> di atas untuk memunculkan jenis kelas renang yang beliau asuh beserta jadwal dan rincian biayanya.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (coachUsers.length > 0) {
                        setSelectedCoachId(coachUsers[0].id);
                      }
                    }}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Pilih {coachUsers[0]?.name || 'Guru Pertama'}
                  </button>
                  <button
                    onClick={() => setSelectedCoachId('all')}
                    className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Tampilkan Semua Kelas Tanpa Filter
                  </button>
                </div>
              </div>
            )}

            {/* Grid Kelas Renang */}
            {selectedCoachId && (
              <>
                {displayedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {displayedCourses.map(course => {
                      const isEnrolled = currentUser.enrolledCourseIds?.includes(course.id);
                      const isFull = course.currentParticipants >= course.maxParticipants;
                      const quotaPercent = Math.min(100, Math.round((course.currentParticipants / course.maxParticipants) * 100));

                      return (
                        <div
                          key={course.id}
                          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          <div>
                            {/* Kategori & Kuota Header */}
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                  course.category === 'Anak-Anak' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  course.category === 'Dewasa' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  course.category === 'Privat' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                  'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                  {course.category}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  (course.paymentScheme || 'upfront') === 'postpaid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  {(course.paymentScheme || 'upfront') === 'postpaid'
                                    ? '💳 Setelah Berjalan'
                                    : '⚡ Di Awal'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                Kuota: <strong className="text-slate-900">{course.currentParticipants}</strong> / {course.maxParticipants} peserta
                              </span>
                            </div>

                            {/* Bar Kuota Progress */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  quotaPercent >= 100 ? 'bg-rose-500' : quotaPercent >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${quotaPercent}%` }}
                              />
                            </div>

                            <h4 className="text-base font-black text-slate-900 tracking-tight">
                              {course.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                              {course.description}
                            </p>

                            <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Jadwal: <strong>{course.scheduleDays.join(', ')}</strong> ({course.scheduleTime})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Durasi: <strong>{course.durationWeeks} Minggu</strong> ({course.totalSessions} Sesi Pertemuan)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Guru / Pelatih: <strong className="text-slate-900">{course.coachName}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Biaya Kursus {course.paymentScheme === 'postpaid' ? '(Pasca-Berjalan)' : '(Di Awal)'}
                              </span>
                              <span className="text-lg font-black text-slate-900 tracking-tight">
                                Rp {course.price.toLocaleString('id-ID')}
                              </span>
                            </div>

                            {(() => {
                              const pendingReq = myEnrollmentRequests.find(
                                r => r.courseId === course.id && r.status === 'pending'
                              );

                              if (isEnrolled) {
                                return (
                                  <button
                                    disabled
                                    className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-default"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Sudah Masuk Kelas
                                  </button>
                                );
                              }

                              if (pendingReq) {
                                return (
                                  <button
                                    onClick={() => setActiveTab('my_requests')}
                                    className="py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    Menunggu Guru
                                  </button>
                                );
                              }

                              if (isFull) {
                                return (
                                  <button
                                    disabled
                                    className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                                  >
                                    Kuota Penuh
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => {
                                    setEnrollError(null);
                                    setEnrollingCourse(course);
                                  }}
                                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  Daftar Kelas Ini
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Waves className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-black text-slate-800">
                      Belum Ada Kelas Renang Ditemukan
                    </h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                      {categoryFilter !== 'all'
                        ? `Tidak ada kelas kategori "${categoryFilter}" untuk guru renang ini. Coba ganti filter kategori.`
                        : 'Guru renang ini belum membuka kelas renang aktif saat ini. Silakan pilih guru renang yang lain.'}
                    </p>
                    {categoryFilter !== 'all' && (
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        Reset Filter Kategori
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

      {/* MODAL 1: CONFIRM ENROLLMENT DIALOG */}
      {enrollingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base tracking-tight">Ajukan Pendaftaran Kelas</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Konfirmasi pengajuan ke Guru Les sebelum resmi masuk kelas
                </p>
              </div>
              <button
                onClick={() => setEnrollingCourse(null)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {enrollError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                {enrollError}
              </div>
            )}

            {/* Course Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-sm text-slate-900">{enrollingCourse.title}</div>
              <div className="flex justify-between text-slate-600">
                <span>Instruktur / Guru:</span>
                <span className="font-semibold">{enrollingCourse.coachName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Jadwal:</span>
                <span className="font-semibold">{enrollingCourse.scheduleDays.join(', ')} ({enrollingCourse.scheduleTime})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Durasi:</span>
                <span className="font-semibold">{enrollingCourse.durationWeeks} Minggu ({enrollingCourse.totalSessions} Pertemuan)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                <span>Biaya Kursus:</span>
                <span className="text-blue-600 font-black">Rp {enrollingCourse.price.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Scheme Specific Information */}
            {enrollingCourse.paymentScheme === 'postpaid' ? (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs text-emerald-950">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Skema: Pembayaran Setelah Berjalan
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  ✓ <strong>Tanpa Potong Saldo di Awal:</strong> Anda dapat langsung masuk kelas setelah dikonfirmasi oleh Guru Les ({enrollingCourse.coachName}) tanpa pemotongan saldo saat ini. Pembayaran dilakukan setelah kelas berjalan.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200/80 space-y-2 text-xs text-blue-950">
                <span className="font-bold flex items-center gap-1.5 text-blue-900">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Skema: Pembayaran di Awal (Potong Saldo)
                </span>
                <div className="flex justify-between text-xs font-medium pt-1 border-t border-blue-200/60">
                  <span className="text-blue-800">Saldo Tiket Anda Saat Ini:</span>
                  <span className={`font-bold ${currentUser.balance < enrollingCourse.price ? 'text-rose-600' : 'text-blue-900'}`}>
                    Rp {currentUser.balance.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                  Saldo Anda baru akan <strong>dipotong otomatis saat Guru Les mengonfirmasi</strong> pendaftaran Anda.
                </p>

                {currentUser.balance < enrollingCourse.price && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Saldo Tiket Belum Cukup</span>
                      <span className="text-[11px] text-rose-700">
                        Kurang Rp {(enrollingCourse.price - currentUser.balance).toLocaleString('id-ID')}. Silakan Top Up terlebih dahulu sebelum mengajukan.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              * Sesuai ketentuan SAMARAI, Anda resmi masuk kelas dan dapat mengakses materi serta grup chat setelah disetujui oleh Guru Les yang bersangkutan.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEnrollingCourse(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleEnroll(enrollingCourse)}
                disabled={enrollingCourse.paymentScheme !== 'postpaid' && currentUser.balance < enrollingCourse.price}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  enrollingCourse.paymentScheme !== 'postpaid' && currentUser.balance < enrollingCourse.price
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {enrollingCourse.paymentScheme !== 'postpaid' && currentUser.balance < enrollingCourse.price
                  ? 'Saldo Tidak Cukup'
                  : 'Kirim Pengajuan ke Guru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GRUP CHAT PESERTA KELAS LES RENANG */}
      {selectedCourseForChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[600px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            
            {/* Chat Room Header */}
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm leading-tight">
                    Grup {selectedCourseForChat.title}
                  </h4>
                  <p className="text-[11px] text-blue-100 flex items-center gap-2 mt-0.5 font-medium">
                    <span>{selectedCourseForChat.coachName}</span>
                    <span>•</span>
                    <span>{selectedCourseForChat.currentParticipants} Siswa Tergabung</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourseForChat(null)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick Info Bar */}
            <div className="bg-blue-50/60 px-4 py-2 border-b border-blue-100 text-[11px] text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Latihan: {selectedCourseForChat.scheduleDays.join(', ')} ({selectedCourseForChat.scheduleTime})
              </span>
              <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                Kolam Lintasan 1-2
              </span>
            </div>

            {/* Message Bubble List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {currentCourseMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                const isCoach = msg.senderRole === 'coach';
                const isAdmin = msg.senderRole === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-700">
                        {isMe ? 'Saya' : msg.senderName}
                      </span>
                      {isCoach && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-md border border-blue-100">
                          Instruktur
                        </span>
                      )}
                      {isAdmin && (
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md">
                          Admin Samarai
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : msg.isAnnouncement
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 font-medium rounded-tl-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ketik pesan atau tanyakan info jadwal ke pelatih..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white transition-colors"
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
