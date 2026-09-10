import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  MessageCircle,
  Send,
  Sparkles,
  QrCode,
  FileText,
  Save,
  Plus,
  Minus,
  AlertCircle,
  ChevronRight,
  Phone,
  DollarSign,
  Waves,
  ShieldCheck,
  X,
  Megaphone,
  Pencil,
  PlusCircle,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwimmingCourse, CourseProgress, User, EnrollmentRequest } from '../../types';
import { CourseFormModal } from './CourseFormModal';

export const CoachDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    swimmingCourses,
    courseProgress,
    chatMessages,
    enrollmentRequests,
    confirmEnrollmentRequest,
    rejectEnrollmentRequest,
    sendChatMessage,
    updateMilestone,
    updateCoachNotes,
    recordAttendance,
    addSwimmingCourse,
    updateSwimmingCourse,
    deleteSwimmingCourse,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'classes' | 'requests' | 'attendance' | 'milestones' | 'chat' | 'honorarium'>('classes');
  
  // Request management state
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<EnrollmentRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [confirmingRequest, setConfirmingRequest] = useState<EnrollmentRequest | null>(null);
  const [confirmNoteInput, setConfirmNoteInput] = useState('');

  // Course modal state for adding and editing classes
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState<'add' | 'edit'>('add');
  const [editingCourse, setEditingCourse] = useState<SwimmingCourse | null>(null);

  // Delete course confirmation modal state
  const [courseToDelete, setCourseToDelete] = useState<SwimmingCourse | null>(null);
  const [deleteSuccessAlert, setDeleteSuccessAlert] = useState<string>('');

  // Filter between "Kelas Saya" vs "Semua Kelas"
  const [classFilter, setClassFilter] = useState<'my' | 'all'>('my');

  // Filter courses taught by this coach (or all courses if not strictly mapped)
  const myCourses = swimmingCourses.filter(c => {
    if (!currentUser) return false;
    // Match by teachingCourseIds
    if (currentUser.teachingCourseIds?.includes(c.id)) {
      return true;
    }
    // Match by coachName substring
    if (currentUser.name && c.coachName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0].toLowerCase())) {
      return true;
    }
    return false;
  });

  // Enrollment requests related to this coach's classes (or all requests)
  const coachRequests = enrollmentRequests.filter(req => {
    if (!currentUser) return false;
    if (req.coachId && req.coachId === currentUser.id) return true;
    if (currentUser.teachingCourseIds?.includes(req.courseId)) return true;
    if (currentUser.name && req.coachName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0].toLowerCase())) return true;
    if (!currentUser.teachingCourseIds || currentUser.teachingCourseIds.length === 0) return true;
    return false;
  });

  const pendingRequestsCount = coachRequests.filter(r => r.status === 'pending').length;

  // Effective courses to display
  const effectiveCourses = classFilter === 'all'
    ? swimmingCourses
    : (myCourses.length > 0 ? myCourses : swimmingCourses);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    effectiveCourses[0]?.id || swimmingCourses[0]?.id || ''
  );
  const selectedCourse = swimmingCourses.find(c => c.id === selectedCourseId) || effectiveCourses[0];

  const handleOpenAddCourse = () => {
    setCourseModalMode('add');
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: SwimmingCourse) => {
    setCourseModalMode('edit');
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (data: Omit<SwimmingCourse, 'id' | 'currentParticipants'>) => {
    if (courseModalMode === 'add') {
      const res = addSwimmingCourse(data);
      if (res.success && res.course) {
        setSelectedCourseId(res.course.id);
      }
    } else if (courseModalMode === 'edit' && editingCourse) {
      updateSwimmingCourse(editingCourse.id, data);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    const res = deleteSwimmingCourse(courseId);
    if (selectedCourseId === courseId) {
      const remaining = swimmingCourses.filter(c => c.id !== courseId);
      setSelectedCourseId(remaining[0]?.id || '');
    }
    if (res.success) {
      setDeleteSuccessAlert(res.message);
      setTimeout(() => setDeleteSuccessAlert(''), 4000);
    }
  };

  // Students enrolled in selected course
  const enrolledStudents = users.filter(
    u => u.role === 'member' && u.enrolledCourseIds?.includes(selectedCourse?.id || '')
  );

  // Selected student for milestone evaluation
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    enrolledStudents[0]?.id || 'usr-member-01'
  );
  const selectedStudent = users.find(u => u.id === selectedStudentId);

  // Student progress for selected student and course
  const studentProgress = courseProgress.find(
    p => p.userId === selectedStudentId && p.courseId === selectedCourse?.id
  );

  // Note editing state
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Chat message state
  const [chatText, setChatText] = useState('');
  const [isAnnouncementMsg, setIsAnnouncementMsg] = useState(false);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  // Synchronize initial notes when student changes
  React.useEffect(() => {
    if (studentProgress) {
      setEditingNotes(studentProgress.coachNotes || '');
    } else {
      setEditingNotes('');
    }
  }, [selectedStudentId, selectedCourse?.id, studentProgress]);

  if (!currentUser) return null;

  // Handle Note Save
  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent) return;
    updateCoachNotes(selectedStudent.id, selectedCourse.id, editingNotes);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 3000);
  };

  // Handle Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !chatText.trim()) return;
    sendChatMessage(selectedCourse.id, chatText.trim(), isAnnouncementMsg);
    setChatText('');
    setIsAnnouncementMsg(false);
  };

  // Messages for selected course
  const courseMessages = chatMessages.filter(m => selectedCourse && m.courseId === selectedCourse.id);

  // Total students taught
  const allTaughtStudentIds = users
    .filter(u => u.role === 'member' && u.enrolledCourseIds?.some(id => effectiveCourses.some(c => c.id === id)))
    .map(u => u.id);
  const totalStudentsCount = Array.from(new Set(allTaughtStudentIds)).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Header Banner Guru Les */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-10 h-10 text-blue-600" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Guru Les / Instruktur Resmi
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                  {currentUser.memberNumber || 'GURU-LES-01'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentUser.name}
              </h2>

              <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xl">
                {currentUser.coachSpecialty || 'Instruktur Akuatik & Keselamatan Renang Bersertifikat'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {currentUser.phone}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Waves className="w-3.5 h-3.5 text-blue-600" />
                  Samarai Aquatic Academy
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & QR Guru */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAddCourse}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelas Renang
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              ID Badge Guru (QR)
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-blue-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              Presensi Siswa Hari Ini
            </button>
          </div>

        </div>

        {/* Mini Stat Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-medium block text-[11px]">Kelas Diampu</span>
            <span className="text-lg font-black text-slate-900">{effectiveCourses.length} Kelas Aktif</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-medium block text-[11px]">Total Murid Aktif</span>
            <span className="text-lg font-black text-blue-600">{totalStudentsCount} Siswa</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-medium block text-[11px]">Rating Evaluasi</span>
            <span className="text-lg font-black text-amber-600 flex items-center gap-1">
              ★ 4.9 <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-medium block text-[11px]">Status Lisensi</span>
            <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Terverifikasi
            </span>
          </div>
        </div>
      </div>

      {/* Notification Banner when a course is deleted */}
      {deleteSuccessAlert && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{deleteSuccessAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccessAlert('')}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs Dasbor Guru Les */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'classes'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Waves className="w-4 h-4" />
          Kelas & Jadwal Saya ({effectiveCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 relative ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Konfirmasi Pendaftaran</span>
          {pendingRequestsCount > 0 ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'requests' ? 'bg-amber-400 text-slate-950' : 'bg-rose-500 text-white animate-pulse'
            }`}>
              {pendingRequestsCount} Baru
            </span>
          ) : (
            <span className="text-[10px] opacity-70">({coachRequests.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Presensi & Daftar Siswa
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'milestones'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Penilaian Skill & Catatan Guru
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Diskusi & Pengumuman Kelas
        </button>
        <button
          onClick={() => setActiveTab('honorarium')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'honorarium'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Honor Mengajar
        </button>
      </div>

      {/* 3. TAB 1: KELAS & JADWAL SAYA */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Daftar Kelas Pelatihan Renang
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Kelola program kursus, tarif, kuota peserta, dan jadwal sesi latihan renang
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setClassFilter('my')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    classFilter === 'my'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Kelas Saya ({myCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClassFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    classFilter === 'all'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua Kelas ({swimmingCourses.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAddCourse}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Kelas
              </button>
            </div>
          </div>

          {effectiveCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Waves className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Kelas Renang</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Anda belum memiliki kelas yang diampu. Buat kelas renang baru sekarang untuk mulai menerima pendaftaran peserta!
              </p>
              <button
                type="button"
                onClick={handleOpenAddCourse}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                Buat Kelas Baru Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {effectiveCourses.map(course => {
                const studentsInThisCourse = users.filter(
                  u => u.role === 'member' && u.enrolledCourseIds?.includes(course.id)
                );

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            {course.category}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            Rp {course.price.toLocaleString('id-ID')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (course.paymentScheme || 'upfront') === 'postpaid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {(course.paymentScheme || 'upfront') === 'postpaid'
                              ? '💳 Setelah Berjalan (Tanpa Potong Saldo)'
                              : '⚡ Di Awal (Potong Saldo)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCourse(course)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold text-[11px] transition-all flex items-center gap-1 border border-slate-200 hover:border-blue-200 cursor-pointer"
                            title="Edit Kelas Renang"
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseToDelete(course)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all flex items-center gap-1 border border-rose-200 cursor-pointer"
                            title="Hapus Kelas Renang"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            Hapus
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-black text-slate-900 tracking-tight mb-2">
                        {course.title}
                      </h4>

                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {course.description}
                      </p>

                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-600 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            Hari Latihan:
                          </span>
                          <span className="font-bold text-slate-800">{course.scheduleDays.join(', ')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Waktu Sesi:
                          </span>
                          <span className="font-bold text-slate-800">{course.scheduleTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            Durasi & Sesi:
                          </span>
                          <span className="font-bold text-slate-800">
                            {course.totalSessions} Sesi ({course.durationWeeks} Minggu)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            Peserta Terdaftar:
                          </span>
                          <span className="font-bold text-blue-600">
                            {studentsInThisCourse.length} / {course.maxParticipants} Murid
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-400">Instruktur:</span>
                          <span className="font-bold text-slate-700 truncate max-w-[180px]">{course.coachName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCourse(course)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Edit Kelas"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveTab('attendance');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Presensi Murid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveTab('milestones');
                        }}
                        className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        Evaluasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Hapus Kelas Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1B: KONFIRMASI PENDAFTARAN & PERMOHONAN MASUK KELAS */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header & Policy Explanation Banner */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Konfirmasi Pendaftaran & Izin Masuk Kelas
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Murid yang mendaftar ke kelas renang Anda hanya dapat resmi masuk setelah disetujui dan dikonfirmasi oleh Guru Les.
                </p>
              </div>

              {pendingRequestsCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {pendingRequestsCount} Permohonan Menunggu Konfirmasi Anda
                </span>
              )}
            </div>

            {/* Dua Skema Pembayaran Info Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Skema 1: Pembayaran di Awal</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Saat Guru Renang menekan <strong>Konfirmasi & Terima</strong>, saldo tiket member <strong>langsung dipotong otomatis</strong> sebesar tarif kelas dan murid resmi masuk kelas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Skema 2: Pembayaran Setelah Berjalan</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Member dapat <strong>langsung masuk kelas setelah dikonfirmasi Guru tanpa potong saldo</strong> di awal. Pembayaran diatur setelah sesi latihan berjalan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Alert */}
          {actionAlert && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs ${
                actionAlert.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{actionAlert.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionAlert(null)}
                className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter Status Permohonan */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setRequestStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                requestStatusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              Semua ({coachRequests.length})
            </button>
            <button
              onClick={() => setRequestStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                requestStatusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Menunggu Konfirmasi ({coachRequests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setRequestStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                requestStatusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Dikonfirmasi / Masuk Kelas ({coachRequests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setRequestStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                requestStatusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              Ditolak ({coachRequests.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          {/* List Requests */}
          {(() => {
            const filtered = coachRequests.filter(r => {
              if (requestStatusFilter === 'all') return true;
              return r.status === requestStatusFilter;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    Tidak Ada Permohonan Pendaftaran
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {requestStatusFilter === 'pending'
                      ? 'Hebat! Semua permohonan pendaftaran murid telah Anda konfirmasi.'
                      : 'Belum ada data permohonan pendaftaran dengan status ini.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(req => {
                  const member = users.find(u => u.id === req.userId);
                  const course = swimmingCourses.find(c => c.id === req.courseId);
                  const scheme = req.paymentScheme || course?.paymentScheme || 'upfront';
                  const isUpfront = scheme === 'upfront';
                  const isPostpaid = scheme === 'postpaid';
                  const memberBalance = member?.balance || 0;
                  const hasEnoughBalance = memberBalance >= req.price;

                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                        req.status === 'pending'
                          ? 'border-amber-200/80 ring-2 ring-amber-100/50'
                          : req.status === 'approved'
                          ? 'border-emerald-200/80'
                          : 'border-slate-200 opacity-80'
                      }`}
                    >
                      {/* Top: Murid Info & Status Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-blue-200">
                              {req.userAvatar ? (
                                <img
                                  src={req.userAvatar}
                                  alt={req.userName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                req.userName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-slate-900 leading-tight">
                                  {req.userName}
                                </h4>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                  {req.userMemberNumber || 'MEMBER'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <Phone className="w-3 h-3 text-blue-600" />
                                  {req.userPhone}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(req.requestedAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {req.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              Menunggu Konfirmasi
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Resmi Masuk Kelas
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 shrink-0 flex items-center gap-1">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              Ditolak
                            </span>
                          )}
                        </div>

                        {/* Kelas Info */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                              Kelas yang Diajukan
                            </span>
                            <span className="font-black text-slate-900 text-xs">
                              Rp {req.price.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <Waves className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{req.courseTitle}</span>
                          </div>
                          {course && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                {course.scheduleDays.join(', ')} ({course.scheduleTime})
                              </span>
                              <span>•</span>
                              <span>Kuota: {course.currentParticipants}/{course.maxParticipants}</span>
                            </div>
                          )}
                        </div>

                        {/* Skema Pembayaran Detail Card */}
                        <div className="mt-3 p-3 rounded-2xl border text-xs space-y-2 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                              Skema Pembayaran Kelas:
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPostpaid
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {isPostpaid ? 'Setelah Berjalan' : 'Di Awal (Potong Saldo)'}
                            </span>
                          </div>

                          {isUpfront && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Saldo Tiket Member Saat Ini:</span>
                                <span className={`font-mono font-bold ${hasEnoughBalance ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  Rp {memberBalance.toLocaleString('id-ID')}
                                </span>
                              </div>
                              {hasEnoughBalance ? (
                                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Saldo murid mencukupi. Saldo akan otomatis dipotong Rp {req.price.toLocaleString('id-ID')} saat Anda konfirmasi.</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl flex items-start gap-1.5 font-medium">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold block">Saldo Murid Kurang Rp {(req.price - memberBalance).toLocaleString('id-ID')}</span>
                                    <span>Ingatkan murid untuk top up saldo terlebih dahulu agar konfirmasi berhasil memotong saldo.</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {isPostpaid && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Murid dapat <strong>langsung masuk kelas tanpa potong saldo di awal</strong>. Pembayaran diatur setelah sesi latihan berjalan.</span>
                            </div>
                          )}
                        </div>

                        {/* Detail Penolakan jika rejected */}
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div className="mt-3 p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900">
                            <span className="font-bold block text-[11px]">Alasan Penolakan:</span>
                            <span className="text-[11px]">{req.rejectionReason}</span>
                          </div>
                        )}

                        {/* Catatan Guru saat dikonfirmasi jika approved */}
                        {req.status === 'approved' && req.processedAt && (
                          <div className="mt-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
                            <span className="font-bold block text-[11px]">
                              ✓ Dikonfirmasi oleh {req.processedByCoachName || 'Guru Les'}
                            </span>
                            <span className="text-[11px] text-emerald-800">
                              {isUpfront
                                ? `Saldo member Rp ${req.price.toLocaleString('id-ID')} telah dipotong lunas.`
                                : 'Murid resmi terdaftar masuk kelas tanpa potong saldo di awal.'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Buttons for Pending */}
                      {req.status === 'pending' && (
                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectReasonInput('');
                            }}
                            className="py-2.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                            Tolak
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingRequest(req);
                              setConfirmNoteInput('');
                            }}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                              isUpfront && !hasEnoughBalance
                                ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isUpfront && !hasEnoughBalance
                                ? 'Cek & Konfirmasi (Saldo Kurang)'
                                : 'Konfirmasi & Terima Masuk Kelas'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* Class Selector Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Pilih Kelas:</span>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {effectiveCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.scheduleDays.join(', ')} - {c.scheduleTime})
                  </option>
                ))}
              </select>

              {selectedCourse && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCourse(selectedCourse)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Edit Kelas Ini"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(selectedCourse)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                    title="Hapus Kelas Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-slate-500 font-medium">
              Total Murid Terdaftar: <span className="font-black text-slate-900">{enrolledStudents.length} Siswa</span>
            </div>
          </div>

          {/* Student Attendance Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-black text-slate-800">
                Lembar Presensi Peserta • {selectedCourse?.title}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Target: {selectedCourse?.totalSessions} Sesi Pertemuan
              </span>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Belum ada murid yang mendaftar di kelas ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrolledStudents.map(student => {
                  const progress = courseProgress.find(
                    p => p.userId === student.id && p.courseId === selectedCourse?.id
                  );
                  const count = progress?.attendanceCount || 0;
                  const maxSessions = selectedCourse?.totalSessions || 8;
                  const percent = Math.min(100, Math.round((count / maxSessions) * 100));

                  return (
                    <div
                      key={student.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            student.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            {student.name}
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                              {student.memberNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {student.phone} • Terdaftar sejak {progress?.enrolledDate || student.joinDate}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar Sesi */}
                      <div className="flex-1 max-w-xs px-2">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium">Kehadiran:</span>
                          <span className="font-bold text-slate-900">
                            {count} / {maxSessions} Sesi ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Attendance Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (selectedCourse) recordAttendance(student.id, selectedCourse.id, 1);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 shadow-2xs transition-all"
                          title="Tambah 1 Kehadiran Sesi"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Hadir Sesi Ini
                        </button>
                        <button
                          onClick={() => {
                            if (selectedCourse) recordAttendance(student.id, selectedCourse.id, -1);
                          }}
                          disabled={count <= 0}
                          className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Kurangi 1 Sesi (Koreksi)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab('milestones');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200 transition-all"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Nilai
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: PENILAIAN SKILL & CATATAN GURU */}
      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Student Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Kelas:</label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {effectiveCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Murid Renang:</label>
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {enrolledStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left p-2.5 rounded-2xl text-xs flex items-center justify-between transition-all border ${
                      selectedStudentId === student.id
                        ? 'bg-blue-50 border-blue-200 font-bold text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <span className="truncate">{student.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center & Right: Milestone Evaluation & Coach Notes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Student Header */}
            {selectedStudent ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Evaluasi Keterampilan Renang
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Kelas: <strong className="text-slate-800">{selectedCourse?.title}</strong> • Level: <strong className="text-blue-600">{studentProgress?.level || 'Tahap Dasar'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      Kehadiran: {studentProgress?.attendanceCount || 0} Sesi
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Update: {studentProgress?.lastUpdated || '-'}
                    </span>
                  </div>
                </div>

                {/* Milestone Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Checklist Pencapaian Materi Renang:</span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      *Klik item untuk memperbarui status lulus/selesai
                    </span>
                  </div>

                  {studentProgress?.milestones && studentProgress.milestones.length > 0 ? (
                    <div className="space-y-2">
                      {studentProgress.milestones.map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (selectedCourse) {
                              updateMilestone(selectedStudent.id, selectedCourse.id, m.id, !m.isCompleted);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            m.isCompleted
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0">
                              {m.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </span>
                            <div>
                              <p className={`text-xs font-bold ${m.isCompleted ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                                {m.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {m.description}
                              </p>
                            </div>
                          </div>

                          {m.isCompleted && m.completedDate && (
                            <span className="text-[10px] font-mono bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                              Lulus {m.completedDate}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Belum ada milestone tercatat untuk murid ini.
                    </div>
                  )}
                </div>

                {/* Form Catatan Evaluasi Guru */}
                <form onSubmit={handleSaveNotes} className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Catatan Evaluasi Guru untuk Murid:
                    </label>
                    {noteSavedFeedback && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan & Terkirim!
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    placeholder="Tulis feedback teknik (misal: posisi kayuhan tangan, irama pernapasan, ketahanan stamina)..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />

                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Simpan Catatan Guru
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
                Pilih murid di sebelah kiri untuk melihat dan mengisi evaluasi.
              </div>
            )}

          </div>
        </div>
      )}

      {/* 6. TAB 4: DISKUSI & PENGUMUMAN KELAS */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[560px]">
          
          {/* Chat Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Pilih Grup Diskusi:</span>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="bg-white border border-slate-200 font-bold text-slate-900 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {effectiveCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              {selectedCourse && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCourse(selectedCourse)}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                    title="Edit Kelas Ini"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(selectedCourse)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                    title="Hapus Kelas Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-slate-500 font-medium">
              Grup Komunikasi Langsung dengan Seluruh Peserta Kelas
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {courseMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Belum ada percakapan di grup ini. Kirim pesan sapaan pertama!
              </div>
            ) : (
              courseMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-700">{msg.senderName}</span>
                      {msg.senderRole === 'coach' && (
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          GURU LES
                        </span>
                      )}
                      {msg.senderRole === 'admin' && (
                        <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          ADMIN
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.isAnnouncement
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 font-medium shadow-2xs'
                          : isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {msg.isAnnouncement && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">
                          <Megaphone className="w-3 h-3 text-amber-600" />
                          Pengumuman Instruktur
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={isAnnouncementMsg}
                  onChange={e => setIsAnnouncementMsg(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                  Kirim sebagai Pengumuman Resmi Kelas
                </span>
              </label>
              <span className="text-[10px] text-slate-400">Tekan Enter untuk kirim</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                placeholder={`Tulis pesan atau arahan latihan ke kelas ${selectedCourse?.title || ''}...`}
                className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!chatText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim
              </button>
            </div>
          </form>

        </div>
      )}

      {/* 7. TAB 5: HONORARIUM GURU */}
      {activeTab === 'honorarium' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Rekap Transparansi Honorarium Guru Les
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Perhitungan kompensasi mengajar berdasarkan sesi pelatihan yang telah selesai diselenggarakan.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                Periode Berjalan: September 2025
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium block">Tarif per Sesi Mengajar</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">Rp 150.000</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Standar Akademi Samarai</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[11px] text-blue-700 font-medium block">Total Sesi Terlaksana</span>
                <span className="text-xl font-black text-blue-900 mt-1 block">12 Sesi</span>
                <span className="text-[10px] text-blue-600 mt-0.5 block">Akumulasi seluruh kelas</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-medium block">Estimasi Honor Siap Cair</span>
                <span className="text-xl font-black text-emerald-800 mt-1 block">Rp 1.800.000</span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">Transfer tgl 28 setiap bulan</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Rekening Pencairan Honor:
              </div>
              <p className="text-[11px] text-slate-500">
                Bank Central Asia (BCA) • No. Rekening: 8820-192-4819 (A.n {currentUser.name})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. QR BADGE MODAL GURU */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>

            <h4 className="text-base font-black text-slate-900">
              Badge ID Instruktur Renang
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tunjukkan QR ini pada karyawan untuk verifikasi akses kolam instruktur.
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=COACH:${currentUser.id}:${currentUser.memberNumber}`}
                alt="QR Code Coach"
                className="w-44 h-44 mx-auto rounded-lg shadow-2xs"
              />
            </div>

            <div className="text-xs font-black text-slate-900">
              {currentUser.name}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {currentUser.memberNumber || 'GURU-LES-01'}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL TAMBAH & EDIT KELAS RENANG */}
      <CourseFormModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        mode={courseModalMode}
        initialCourse={editingCourse}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        currentCoachName={currentUser.name}
        currentCoachPhone={currentUser.phone}
      />

      {/* 10. MODAL KONFIRMASI HAPUS KELAS RENANG */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Hapus Kelas Renang</h4>
                  <span className="text-[11px] text-slate-400 font-medium">Konfirmasi penghapusan program kursus</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus kelas renang ini? Seluruh jadwal sesi dan data pelatihan terkait akan dihapus secara permanen.
              </p>

              {/* Course Detail Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    {courseToDelete.category}
                  </span>
                  <span className="font-black text-slate-900 text-xs">
                    Rp {courseToDelete.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="font-black text-slate-900 text-sm">
                  {courseToDelete.title}
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{courseToDelete.scheduleDays.join(', ')} ({courseToDelete.scheduleTime})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{courseToDelete.totalSessions} Sesi ({courseToDelete.durationWeeks} Minggu)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      {users.filter(u => u.role === 'member' && u.enrolledCourseIds?.includes(courseToDelete.id)).length} / {courseToDelete.maxParticipants} Murid Terdaftar
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning if students are enrolled */}
              {(() => {
                const enrolledCount = users.filter(u => u.role === 'member' && u.enrolledCourseIds?.includes(courseToDelete.id)).length;
                if (enrolledCount > 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-900 text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Peringatan: Ada {enrolledCount} Murid Terdaftar!</span>
                        <span>
                          Menghapus kelas ini akan membatalkan program renang bagi murid-murid tersebut dan menghapus progres penilaian mereka.
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI PENDAFTARAN OLEH GURU */}
      {confirmingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-tight">Konfirmasi Masuk Kelas</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Persetujuan pendaftaran oleh Guru Renang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingRequest(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const member = users.find(u => u.id === confirmingRequest.userId);
              const course = swimmingCourses.find(c => c.id === confirmingRequest.courseId);
              const scheme = confirmingRequest.paymentScheme || course?.paymentScheme || 'upfront';
              const isUpfront = scheme === 'upfront';
              const memberBalance = member?.balance || 0;
              const hasEnoughBalance = memberBalance >= confirmingRequest.price;

              return (
                <div className="space-y-3 text-xs">
                  {/* Info Murid & Kelas */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Nama Murid:</span>
                      <strong className="text-slate-900">{confirmingRequest.userName}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>No. Anggota / HP:</span>
                      <span className="font-mono">{confirmingRequest.userMemberNumber || '-'} ({confirmingRequest.userPhone})</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Kelas Renang:</span>
                      <strong className="text-blue-700">{confirmingRequest.courseTitle}</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/70 text-slate-900 font-bold">
                      <span>Tarif Kursus:</span>
                      <span className="text-blue-600 font-black">Rp {confirmingRequest.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Skema Penjelasan */}
                  {isUpfront ? (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-blue-950">
                      <div className="flex items-center gap-1.5 font-black text-xs text-blue-900">
                        <CreditCard className="w-4 h-4 text-blue-700" />
                        <span>Skema Pembayaran di Awal</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Saldo Tiket Member Saat Ini:</span>
                        <strong className={`font-mono ${hasEnoughBalance ? 'text-emerald-700' : 'text-rose-600'}`}>
                          Rp {memberBalance.toLocaleString('id-ID')}
                        </strong>
                      </div>

                      {hasEnoughBalance ? (
                        <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                          ✓ Saldo member cukup. Saat dikonfirmasi, saldo member akan <strong>langsung dipotong Rp {confirmingRequest.price.toLocaleString('id-ID')}</strong> dan murid resmi masuk kelas.
                        </p>
                      ) : (
                        <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded-xl text-rose-900 text-[11px] flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Saldo Member Tidak Mencukupi!</span>
                            <span>Kurang Rp {(confirmingRequest.price - memberBalance).toLocaleString('id-ID')}. Anda tidak dapat mengonfirmasi sampai member melakukan top up saldo terlebih dahulu.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-emerald-950">
                      <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>Skema Pembayaran Setelah Berjalan</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                        ✓ Member dapat <strong>langsung masuk kelas setelah dikonfirmasi Guru tanpa potong saldo</strong> di awal. Pembayaran diatur setelah program kelas berjalan.
                      </p>
                    </div>
                  )}

                  {/* Input Catatan Opsional */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Catatan Guru Les untuk Murid (Opsional):
                    </label>
                    <input
                      type="text"
                      value={confirmNoteInput}
                      onChange={e => setConfirmNoteInput(e.target.value)}
                      placeholder="Contoh: Bawa kacamata renang dan baju renang standar..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingRequest(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isUpfront && !hasEnoughBalance}
                      onClick={() => {
                        const res = confirmEnrollmentRequest(confirmingRequest.id, confirmNoteInput);
                        if (res.success) {
                          setActionAlert({ type: 'success', text: res.message });
                          setConfirmingRequest(null);
                        } else {
                          setActionAlert({ type: 'error', text: res.message });
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isUpfront && !hasEnoughBalance
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUpfront ? 'Konfirmasi & Potong Saldo' : 'Konfirmasi Masuk Kelas'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: TOLAK PENDAFTARAN */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-tight">Tolak Pendaftaran Murid</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Beri penjelasan kepada calon murid</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-slate-700 space-y-1">
                <div>Murid: <strong>{rejectingRequest.userName}</strong></div>
                <div>Kelas: <strong>{rejectingRequest.courseTitle}</strong></div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={e => setRejectReasonInput(e.target.value)}
                  placeholder="Contoh: Kuota jadwal ini sudah penuh, mohon pilih kelas hari lain..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = rejectEnrollmentRequest(rejectingRequest.id, rejectReasonInput);
                    if (res.success) {
                      setActionAlert({ type: 'success', text: res.message });
                      setRejectingRequest(null);
                      setRejectReasonInput('');
                    } else {
                      setActionAlert({ type: 'error', text: res.message });
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs shadow-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                  <span>Tolak Permohonan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
