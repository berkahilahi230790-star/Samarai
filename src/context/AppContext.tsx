import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Transaction,
  BusinessSettings,
  SwimmingCourse,
  CourseProgress,
  ChatMessage,
  PushNotification,
  UserRole,
  PaymentMethod,
  EnrollmentRequest,
} from '../types';
import {
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_USERS,
  INITIAL_TRANSACTIONS,
  INITIAL_SWIMMING_COURSES,
  INITIAL_COURSE_PROGRESS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_ENROLLMENT_REQUESTS,
} from '../data/initialData';
import { generateTransactionHash } from '../utils/encryption';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  settings: BusinessSettings;
  swimmingCourses: SwimmingCourse[];
  courseProgress: CourseProgress[];
  chatMessages: ChatMessage[];
  notifications: PushNotification[];
  enrollmentRequests: EnrollmentRequest[];
  activeToast: PushNotification | null;
  todayVisitorsCount: number;
  remainingQuota: number;
  
  // Auth methods
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  registerMember: (data: { name: string; email: string; phone: string; initialDeposit?: number; role?: UserRole; coachSpecialty?: string }) => { success: boolean; message: string; user?: User };
  resetPasswordRequest: (emailOrPhone: string) => { success: boolean; message: string };
  logout: () => void;
  
  // Gate Operations
  scanEntryTicket: (memberId: string, quantity: number) => {
    success: boolean;
    message: string;
    transaction?: Transaction;
    member?: User;
    remainingBalance?: number;
  };
  
  // Financial Operations
  topUpBalance: (userId: string, amount: number, method: PaymentMethod, channelName?: string) => {
    success: boolean;
    message: string;
    transaction?: Transaction;
  };
  cancelTransaction: (transactionId: string, reason: string) => {
    success: boolean;
    message: string;
  };

  // Course Operations
  addSwimmingCourse: (courseData: Omit<SwimmingCourse, 'id' | 'currentParticipants'>) => {
    success: boolean;
    message: string;
    course?: SwimmingCourse;
  };
  updateSwimmingCourse: (
    courseId: string,
    updatedData: Partial<Omit<SwimmingCourse, 'id' | 'currentParticipants'>>
  ) => {
    success: boolean;
    message: string;
    course?: SwimmingCourse;
  };
  deleteSwimmingCourse: (courseId: string) => {
    success: boolean;
    message: string;
  };
  enrollInCourse: (userId: string, courseId: string) => {
    success: boolean;
    message: string;
  };
  requestCourseEnrollment: (userId: string, courseId: string) => {
    success: boolean;
    message: string;
    request?: EnrollmentRequest;
  };
  confirmEnrollmentRequest: (requestId: string, coachNote?: string) => {
    success: boolean;
    message: string;
  };
  rejectEnrollmentRequest: (requestId: string, reason?: string) => {
    success: boolean;
    message: string;
  };
  cancelEnrollmentRequest: (requestId: string) => {
    success: boolean;
    message: string;
  };
  sendChatMessage: (courseId: string, messageText: string, isAnnouncement?: boolean) => void;
  updateMilestone: (userId: string, courseId: string, milestoneId: string, isCompleted: boolean) => void;
  updateCoachNotes: (userId: string, courseId: string, notes: string) => void;
  recordAttendance: (userId: string, courseId: string, delta: number) => void;

  // Settings & Admin
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  addUser: (userData: Partial<User> & { name: string; email: string; role: UserRole }) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  manualAdjustBalance: (userId: string, amount: number, reason: string) => void;
  
  // Member QR Token
  refreshMemberQRToken: (userId: string) => string;

  // Real-time QRIS Webhook & Instant Coin Animation
  qrisCoinAlert: {
    amount: number;
    userName: string;
    memberNumber: string;
    channelName: string;
    referenceId: string;
    timestamp: string;
  } | null;
  dismissCoinAlert: () => void;
  triggerCoinDropEffect: (amount: number) => void;
  simulateQrisWebhookPayment: (amount: number, targetUserId?: string) => Promise<{ success: boolean; message: string }>;

  // Notifications
  dismissToast: () => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'samarai_users_v1',
  TRANSACTIONS: 'samarai_transactions_v1',
  SETTINGS: 'samarai_settings_v1',
  COURSES: 'samarai_courses_v1',
  PROGRESS: 'samarai_progress_v1',
  CHATS: 'samarai_chats_v1',
  NOTIFS: 'samarai_notifications_v1',
  ENROLLMENT_REQUESTS: 'samarai_enrollment_requests_v1',
  CURRENT_USER_ID: 'samarai_current_user_id_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to normalize member numbers without dashes: e.g. SMP-2025-0811 -> SMP20250811
  const normalizeMemberNumber = (num: string, role?: string): string => {
    if (!num) return num;
    if (role === 'member' || num.toUpperCase().startsWith('SMP')) {
      // Remove any dashes after SMP prefix and keep numbers
      const cleanDigits = num.replace(/^SMP[-_]?/i, '').replace(/[^0-9]/g, '');
      return `SMP${cleanDigits}`;
    }
    return num;
  };

  // Load from local storage or fallback to initial
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      const parsed: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      return parsed.map(u => ({
        ...u,
        memberNumber: normalizeMemberNumber(u.memberNumber, u.role),
      }));
    } catch {
      return INITIAL_USERS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const parsed: Transaction[] = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
      return parsed.map(t => ({
        ...t,
        memberNumber: normalizeMemberNumber(t.memberNumber),
      }));
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_BUSINESS_SETTINGS,
          ...parsed,
          ticketPrice: parsed.ticketPrice || INITIAL_BUSINESS_SETTINGS.ticketPrice,
          minTopUpEmployee: parsed.minTopUpEmployee !== undefined ? parsed.minTopUpEmployee : (INITIAL_BUSINESS_SETTINGS.minTopUpEmployee || 100000),
          banners:
            parsed.banners && Array.isArray(parsed.banners) && parsed.banners.length >= 3
              ? parsed.banners
              : INITIAL_BUSINESS_SETTINGS.banners,
        };
      }
      return INITIAL_BUSINESS_SETTINGS;
    } catch {
      return INITIAL_BUSINESS_SETTINGS;
    }
  });

  const [swimmingCourses, setSwimmingCourses] = useState<SwimmingCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      return saved ? JSON.parse(saved) : INITIAL_SWIMMING_COURSES;
    } catch {
      return INITIAL_SWIMMING_COURSES;
    }
  });

  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return saved ? JSON.parse(saved) : INITIAL_COURSE_PROGRESS;
    } catch {
      return INITIAL_COURSE_PROGRESS;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif-welcome',
          title: 'Selamat Datang di SAMARAI PARK!',
          message: 'Tunjukkan QR Code Anda di pintu masuk untuk kemudahan akses.',
          type: 'system',
          timestamp: new Date().toISOString(),
          isRead: false,
        }
      ];
    } catch {
      return [];
    }
  });

  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENROLLMENT_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_ENROLLMENT_REQUESTS;
    } catch {
      return INITIAL_ENROLLMENT_REQUESTS;
    }
  });

  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);
  const [qrisCoinAlert, setQrisCoinAlert] = useState<{
    amount: number;
    userName: string;
    memberNumber: string;
    channelName: string;
    referenceId: string;
    timestamp: string;
  } | null>(null);

  const dismissCoinAlert = () => {
    setQrisCoinAlert(null);
  };

  // Current logged in user (default to member-01 for immediate live testing)
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const found = users.find(u => u.id === savedId);
      return found || users[0] || null;
    } catch {
      return users[0] || null;
    }
  });

  // Keep state synced to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(swimmingCourses));
  }, [swimmingCourses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(courseProgress));
  }, [courseProgress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENROLLMENT_REQUESTS, JSON.stringify(enrollmentRequests));
  }, [enrollmentRequests]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUser]);

  // Keep currentUser object updated if users array changes (e.g. balance deduction)
  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated && (updated.balance !== currentUser.balance || updated.status !== currentUser.status || updated.enrolledCourseIds.length !== currentUser.enrolledCourseIds.length)) {
        setCurrentUserState(updated);
      }
    }
  }, [users]);

  // Play sparkling coin cash register chime sound
  const playCoinChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      // Arpeggiated high frequency coins (C6 -> E6 -> G6 -> C7)
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.22, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // AudioContext not allowed without user interaction yet, ignore safely
    }
  };

  // Spectacular coin blast animation
  const triggerCoinDropEffect = (amount: number) => {
    playCoinChimeSound();
    try {
      // Golden coin bursts from both sides and center
      const count = Math.min(120, Math.max(50, Math.floor(amount / 5000)));
      confetti({
        particleCount: count,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#10b981'],
        shapes: ['circle'],
        scalar: 1.2,
      });
      confetti({
        particleCount: count,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#3b82f6'],
        shapes: ['circle'],
        scalar: 1.2,
      });
    } catch {
      // ignore
    }
  };

  // Trigger sound effect for push notification if supported
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext not allowed without interaction, ignore safely
    }
  };

  const dispatchPushNotification = (notif: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: PushNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    playNotificationSound();

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast(current => (current?.id === newNotif.id ? null : current));
    }, 6000);
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
  };

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUserState(found);
      dispatchPushNotification({
        userId: found.id,
        title: `Beralih Akun: ${found.name}`,
        message: `Anda sekarang masuk sebagai ${found.role === 'admin' ? 'Admin' : found.role === 'coach' ? 'Guru Les (Instruktur)' : found.role === 'gate' ? 'Karyawan' : 'Member'}.`,
        type: 'system',
      });
    }
  };

  const switchRole = (role: UserRole) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUserState(found);
    } else {
      const nowIso = new Date().toISOString().split('T')[0];
      const fallbackUser: User = {
        id: `usr-${role}-${Date.now().toString().slice(-4)}`,
        name:
          role === 'gate'
            ? 'Petugas Loket Samarai'
            : role === 'coach'
            ? 'Guru Les Samarai'
            : role === 'admin'
            ? 'Admin Samarai'
            : 'Pengunjung Samarai',
        email: `${role}@samaraipark.com`,
        phone: '081234567890',
        role,
        balance: role === 'member' ? 50000 : 0,
        memberNumber:
          role === 'gate'
            ? 'STF-KARYAWAN-01'
            : role === 'coach'
            ? 'GURU-LES-01'
            : role === 'admin'
            ? 'ADM-SAMARAI-01'
            : `SMP${new Date().getFullYear()}0001`,
        joinDate: nowIso,
        status: 'active',
        enrolledCourseIds: [],
        teachingCourseIds: [],
      };
      setUsers(prev => [fallbackUser, ...prev]);
      setCurrentUserState(fallbackUser);
    }
  };

  const logout = () => {
    setCurrentUserState(null);
  };

  // Calculate today's headcount & tickets
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntryTickets = transactions.filter(
    t => t.type === 'entry_ticket' && t.status === 'success' && t.timestamp.startsWith(todayStr)
  );
  const todayVisitorsCount = todayEntryTickets.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const remainingQuota = Math.max(0, settings.dailyQuota - todayVisitorsCount);

  // Scan Entry Ticket at gate
  const scanEntryTicket = (memberId: string, quantity: number = 1) => {
    const member = users.find(u => u.id === memberId || u.memberNumber === memberId);
    if (!member) {
      return { success: false, message: 'Data member tidak ditemukan dalam sistem!' };
    }

    if (member.status === 'suspended') {
      return { success: false, message: 'Kartu member sedang dinonaktifkan (Suspended). Hubungi Admin.' };
    }

    if (quantity <= 0) {
      return { success: false, message: 'Jumlah tiket tidak valid (minimal 1 tiket).' };
    }

    // Check daily quota
    if (todayVisitorsCount + quantity > settings.dailyQuota) {
      return {
        success: false,
        message: `Kuota harian (${settings.dailyQuota} orang) telah penuh! Sisa kuota saat ini: ${remainingQuota} orang.`,
      };
    }

    const totalCost = quantity * settings.ticketPrice;
    if (member.balance < totalCost) {
      return {
        success: false,
        message: `Saldo tidak mencukupi! Total biaya Rp ${totalCost.toLocaleString('id-ID')}, saldo saat ini Rp ${member.balance.toLocaleString('id-ID')}. Silakan top up saldo terlebih dahulu.`,
        member,
      };
    }

    // Deduct member balance
    const updatedBalance = member.balance - totalCost;
    const nowIso = new Date().toISOString();
    const txId = `tx-${Date.now()}`;
    const txCode = `TRX-${Date.now().toString().slice(-8)}`;

    const newTx: Transaction = {
      id: txId,
      code: txCode,
      userId: member.id,
      userName: member.name,
      memberNumber: member.memberNumber,
      type: 'entry_ticket',
      title: `Tiket Masuk Samarai Park (${quantity} Orang)`,
      amount: totalCost,
      quantity,
      pricePerUnit: settings.ticketPrice,
      paymentMethod: 'saldo',
      status: 'success',
      timestamp: nowIso,
      securityHash: generateTransactionHash(txId, member.id, totalCost, nowIso),
    };

    setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, balance: updatedBalance } : u)));
    setTransactions(prev => [newTx, ...prev]);

    // Dispatch real-time push notification
    dispatchPushNotification({
      userId: member.id,
      title: 'Tiket Masuk Berhasil Dipindai! 🏊‍♂️',
      message: `Selamat datang di SAMARAI PARK! Saldo Anda terpotong Rp ${totalCost.toLocaleString('id-ID')} (${quantity} tiket). Sisa saldo: Rp ${updatedBalance.toLocaleString('id-ID')}.`,
      type: 'entry_success',
      data: { txId, amount: totalCost, remainingBalance: updatedBalance },
    });

    return {
      success: true,
      message: `Pintu Masuk Terbuka! Berhasil memotong saldo Rp ${totalCost.toLocaleString('id-ID')} untuk ${quantity} orang.`,
      transaction: newTx,
      member,
      remainingBalance: updatedBalance,
    };
  };

  // Top-Up member balance
  const topUpBalance = (userId: string, amount: number, method: PaymentMethod, channelName?: string) => {
    const member = users.find(u => u.id === userId);
    if (!member) {
      return { success: false, message: 'Member tidak ditemukan.' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Nominal top up tidak valid.' };
    }

    const newBalance = member.balance + amount;
    const nowIso = new Date().toISOString();
    const txId = `tx-${Date.now()}`;
    const txCode = `TOP-${Date.now().toString().slice(-8)}`;

    const newTx: Transaction = {
      id: txId,
      code: txCode,
      userId: member.id,
      userName: member.name,
      memberNumber: member.memberNumber,
      type: 'top_up',
      title: `Top Up Saldo via ${channelName || method}`,
      amount,
      paymentMethod: method,
      channelName: channelName || 'Instant Transfer',
      status: 'success',
      timestamp: nowIso,
      securityHash: generateTransactionHash(txId, member.id, amount, nowIso),
    };

    setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, balance: newBalance } : u)));
    setTransactions(prev => [newTx, ...prev]);

    // Trigger sound and coin animation
    triggerCoinDropEffect(amount);

    // If payment method is QRIS or e-wallet, trigger instant Coin Alert Popup
    if (method === 'e_wallet' || channelName?.toUpperCase().includes('QRIS')) {
      setQrisCoinAlert({
        amount,
        userName: member.name,
        memberNumber: member.memberNumber,
        channelName: channelName || 'QRIS Instant Settlement',
        referenceId: txCode,
        timestamp: nowIso,
      });
    }

    dispatchPushNotification({
      userId: member.id,
      title: '🪙 Koin Saldo Masuk: Top Up QRIS Berhasil!',
      message: `Selamat! Koin saldo sebesar Rp ${amount.toLocaleString('id-ID')} telah diterima secara instan via ${channelName || method}. Saldo Anda sekarang: Rp ${newBalance.toLocaleString('id-ID')}.`,
      type: 'qris_coin_received',
      data: { amount, newBalance, txCode },
    });

    return {
      success: true,
      message: `Top up Rp ${amount.toLocaleString('id-ID')} berhasil! Koin saldo langsung aktif.`,
      transaction: newTx,
    };
  };

  // Cancel / Refund transaction
  const cancelTransaction = (transactionId: string, reason: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) {
      return { success: false, message: 'Transaksi tidak ditemukan.' };
    }

    if (tx.status === 'cancelled') {
      return { success: false, message: 'Transaksi ini sudah pernah dibatalkan sebelumnya.' };
    }

    const nowIso = new Date().toISOString();
    const member = users.find(u => u.id === tx.userId);

    // If it was an entry ticket or course fee paid by saldo, refund balance to member!
    let updatedBalance = member?.balance;
    if (member && (tx.type === 'entry_ticket' || tx.type === 'course_fee') && tx.paymentMethod === 'saldo') {
      updatedBalance = member.balance + tx.amount;
      setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, balance: updatedBalance! } : u)));
    } else if (member && tx.type === 'top_up') {
      // If a top-up was voided by admin due to error, deduct back
      updatedBalance = Math.max(0, member.balance - tx.amount);
      setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, balance: updatedBalance! } : u)));
    }

    // Update the transaction status
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? {
              ...t,
              status: 'cancelled' as const,
              cancelReason: reason || 'Koreksi input petugas/admin',
              cancelledAt: nowIso,
              cancelledBy: currentUser?.name || 'Admin',
            }
          : t
      )
    );

    // Add a corresponding refund record
    const refundTxId = `tx-refund-${Date.now()}`;
    const refundTx: Transaction = {
      id: refundTxId,
      code: `REF-${Date.now().toString().slice(-8)}`,
      userId: tx.userId,
      userName: tx.userName,
      memberNumber: tx.memberNumber,
      type: 'refund',
      title: `Pembatalan Transaksi: ${tx.title}`,
      amount: tx.amount,
      quantity: tx.quantity,
      paymentMethod: tx.paymentMethod,
      channelName: 'Pengembalian Dana ke Saldo',
      status: 'success',
      timestamp: nowIso,
      securityHash: generateTransactionHash(refundTxId, tx.userId, tx.amount, nowIso),
      cancelReason: reason,
    };
    setTransactions(prev => [refundTx, ...prev]);

    // Dispatch real-time push notification
    if (member) {
      dispatchPushNotification({
        userId: member.id,
        title: 'Transaksi Dibatalkan / Dana Dikembalikan 🔄',
        message: `Transaksi "${tx.title}" sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah dibatalkan oleh Admin. Alasan: ${reason || 'Koreksi input'}. Saldo Anda sekarang: Rp ${updatedBalance?.toLocaleString('id-ID')}.`,
        type: 'refund',
      });
    }

    return {
      success: true,
      message: `Transaksi ${tx.code} berhasil dibatalkan dan saldo telah disesuaikan.`,
    };
  };

  // Register new member or coach
  const registerMember = (data: {
    name: string;
    email: string;
    phone: string;
    initialDeposit?: number;
    role?: UserRole;
    coachSpecialty?: string;
  }) => {
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() || u.phone === data.phone);
    if (existing) {
      return { success: false, message: 'Email atau Nomor HP sudah terdaftar dalam sistem!' };
    }

    const assignedRole: UserRole = data.role || 'member';
    const memberNum = assignedRole === 'coach'
      ? `GURU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      : `SMP${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = assignedRole === 'coach' ? `usr-coach-${Date.now()}` : `usr-member-${Date.now()}`;
    const deposit = assignedRole === 'coach' ? 0 : (data.initialDeposit || 50000); // Free bonus for member

    const newUser: User = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: assignedRole,
      balance: deposit,
      memberNumber: memberNum,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.name}`,
      enrolledCourseIds: [],
      coachSpecialty: data.coachSpecialty,
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserState(newUser);

    // Initial deposit transaction for members
    if (deposit > 0 && assignedRole === 'member') {
      const txId = `tx-bonus-${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        code: `DEP-${Date.now().toString().slice(-8)}`,
        userId: newId,
        userName: data.name,
        memberNumber: memberNum,
        type: 'top_up',
        title: 'Saldo Awal Pendaftaran Member Baru',
        amount: deposit,
        paymentMethod: 'bank_transfer',
        channelName: 'Promo Registrasi Samarai Park',
        status: 'success',
        timestamp: new Date().toISOString(),
        securityHash: generateTransactionHash(txId, newId, deposit, new Date().toISOString()),
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    dispatchPushNotification({
      userId: newId,
      title: 'Selamat Datang Member Baru! 🌟',
      message: `Selamat bergabung di SAMARAI PARK, ${data.name}! Nomor Member Anda: ${memberNum}. Saldo awal Rp ${deposit.toLocaleString('id-ID')} siap digunakan.`,
      type: 'system',
    });

    return {
      success: true,
      message: `Pendaftaran berhasil! Nomor Member: ${memberNum}`,
      user: newUser,
    };
  };

  const resetPasswordRequest = (emailOrPhone: string) => {
    const found = users.find(u => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone);
    if (!found) {
      return { success: false, message: 'Akun dengan email atau nomor HP tersebut tidak ditemukan.' };
    }

    dispatchPushNotification({
      userId: found.id,
      title: 'Instruksi Reset Kata Sandi Terkirim 🔑',
      message: `Tautan pemulihan kata sandi telah dikirim ke ${found.email}. Periksa kotak masuk/spam Anda.`,
      type: 'system',
    });

    return {
      success: true,
      message: `Tautan verifikasi telah dikirimkan ke kontak terdaftar (${found.email}). Silakan periksa pesan Anda.`,
    };
  };

  // Course Management Operations
  const addSwimmingCourse = (courseData: Omit<SwimmingCourse, 'id' | 'currentParticipants'>) => {
    const newCourseId = `crs-${Date.now()}`;
    const newCourse: SwimmingCourse = {
      ...courseData,
      id: newCourseId,
      currentParticipants: 0,
      coachId: courseData.coachId || (currentUser?.role === 'coach' ? currentUser.id : undefined),
    };

    setSwimmingCourses(prev => [newCourse, ...prev]);

    // If currentUser is a coach, add this course to their teachingCourseIds
    if (currentUser && currentUser.role === 'coach') {
      const updatedTeachingIds = Array.from(new Set([...(currentUser.teachingCourseIds || []), newCourseId]));
      setUsers(prev =>
        prev.map(u => (u.id === currentUser.id ? { ...u, teachingCourseIds: updatedTeachingIds } : u))
      );
    }

    // Add initial announcement chat in this class
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId: newCourseId,
      senderId: currentUser?.id || 'system',
      senderName: currentUser?.name || 'Instruktur Renang',
      senderRole: 'coach',
      message: `🏊‍♂️ Selamat datang di grup kelas ${newCourse.title}! Jadwal latihan: ${newCourse.scheduleDays.join(', ')} (${newCourse.scheduleTime}). Silakan berdiskusi atau ajukan pertanyaan seputar pelatihan di sini.`,
      timestamp: new Date().toISOString(),
      isAnnouncement: true,
    };
    setChatMessages(prev => [...prev, welcomeMsg]);

    dispatchPushNotification({
      title: 'Kelas Renang Baru Berhasil Ditambahkan 🏊‍♂️',
      message: `Kelas "${newCourse.title}" kini aktif dan siap menerima pendaftaran peserta.`,
      type: 'system',
    });

    return {
      success: true,
      message: `Kelas "${newCourse.title}" berhasil dibuat!`,
      course: newCourse,
    };
  };

  const updateSwimmingCourse = (
    courseId: string,
    updatedData: Partial<Omit<SwimmingCourse, 'id' | 'currentParticipants'>>
  ) => {
    const target = swimmingCourses.find(c => c.id === courseId);
    if (!target) {
      return { success: false, message: 'Kelas renang tidak ditemukan.' };
    }

    let updatedCourse: SwimmingCourse = { ...target, ...updatedData };
    setSwimmingCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          updatedCourse = { ...c, ...updatedData };
          return updatedCourse;
        }
        return c;
      })
    );

    dispatchPushNotification({
      title: 'Kelas Renang Berhasil Diperbarui ✏️',
      message: `Informasi kelas "${updatedData.title || target.title}" telah diperbarui.`,
      type: 'system',
    });

    return {
      success: true,
      message: 'Perubahan kelas renang berhasil disimpan!',
      course: updatedCourse,
    };
  };

  const deleteSwimmingCourse = (courseId: string) => {
    const target = swimmingCourses.find(c => c.id === courseId);
    if (!target) {
      return { success: false, message: 'Kelas renang tidak ditemukan.' };
    }

    setSwimmingCourses(prev => prev.filter(c => c.id !== courseId));
    setCourseProgress(prev => prev.filter(p => p.courseId !== courseId));
    setChatMessages(prev => prev.filter(m => m.courseId !== courseId));
    setUsers(prev =>
      prev.map(u => ({
        ...u,
        enrolledCourseIds: u.enrolledCourseIds ? u.enrolledCourseIds.filter(id => id !== courseId) : [],
        teachingCourseIds: u.teachingCourseIds ? u.teachingCourseIds.filter(id => id !== courseId) : [],
      }))
    );

    dispatchPushNotification({
      title: 'Kelas Renang Dihapus 🗑️',
      message: `Kelas "${target.title}" telah dihapus.`,
      type: 'system',
    });

    return {
      success: true,
      message: `Kelas "${target.title}" berhasil dihapus.`,
    };
  };

  // Enroll in course
  const enrollInCourse = (userId: string, courseId: string) => {
    const member = users.find(u => u.id === userId);
    const course = swimmingCourses.find(c => c.id === courseId);

    if (!member || !course) {
      return { success: false, message: 'Data member atau kursus renang tidak ditemukan.' };
    }

    if (member.enrolledCourseIds?.includes(courseId)) {
      return { success: false, message: 'Anda sudah terdaftar di kelas renang ini.' };
    }

    if (course.currentParticipants >= course.maxParticipants) {
      return { success: false, message: 'Mohon maaf, kuota kelas renang ini sudah penuh.' };
    }

    if (member.balance < course.price) {
      return {
        success: false,
        message: `Saldo member tidak mencukupi untuk pendaftaran kelas (Biaya: Rp ${course.price.toLocaleString('id-ID')}, Saldo: Rp ${member.balance.toLocaleString('id-ID')}). Silakan top up terlebih dahulu.`,
      };
    }

    // Deduct course fee
    const newBalance = member.balance - course.price;
    const txId = `tx-crs-${Date.now()}`;
    const txCode = `CRS-${Date.now().toString().slice(-8)}`;
    const nowIso = new Date().toISOString();

    const newTx: Transaction = {
      id: txId,
      code: txCode,
      userId: member.id,
      userName: member.name,
      memberNumber: member.memberNumber,
      type: 'course_fee',
      title: `Pendaftaran Kursus: ${course.title}`,
      amount: course.price,
      paymentMethod: 'saldo',
      status: 'success',
      timestamp: nowIso,
      securityHash: generateTransactionHash(txId, member.id, course.price, nowIso),
    };

    // Update user enrolled courses & balance
    setUsers(prev =>
      prev.map(u =>
        u.id === member.id
          ? {
              ...u,
              balance: newBalance,
              enrolledCourseIds: [...(u.enrolledCourseIds || []), courseId],
            }
          : u
      )
    );

    // Update course participant count
    setSwimmingCourses(prev =>
      prev.map(c => (c.id === courseId ? { ...c, currentParticipants: c.currentParticipants + 1 } : c))
    );

    // Create initial student progress tracker
    const newProgress: CourseProgress = {
      userId: member.id,
      courseId,
      enrolledDate: nowIso.split('T')[0],
      attendanceCount: 1,
      level: 'Tahap 1: Pengenalan Air & Pernapasan',
      lastUpdated: nowIso.split('T')[0],
      coachNotes: 'Pendaftaran baru. Siap memulai sesi latihan pertama sesuai jadwal.',
      milestones: [
        { id: 'm-1', name: 'Adaptasi Air & Pernapasan Ritmik', description: 'Rileks di air dan menghembuskan napas di dalam air.', isCompleted: false },
        { id: 'm-2', name: 'Posisi Mengapung (Floating)', description: 'Telungkup dan telentang dengan seimbang.', isCompleted: false },
        { id: 'm-3', name: 'Meluncur Streamline 10 Meter', description: 'Dorongan dari dinding tanpa gerak kaki tambahan.', isCompleted: false },
        { id: 'm-4', name: 'Teknik Ayunan Kaki & Tangan', description: 'Kombinasi gerak propulsi di kolam dangkal.', isCompleted: false },
        { id: 'm-5', name: 'Berenang 25 Meter Tanpa Papan', description: 'Ujian kelulusan level dasar.', isCompleted: false },
      ],
    };

    setCourseProgress(prev => [...prev.filter(p => !(p.userId === userId && p.courseId === courseId)), newProgress]);
    setTransactions(prev => [newTx, ...prev]);

    // Send welcome chat message into course group
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId,
      senderId: 'system',
      senderName: 'Sistem SAMARAI PARK',
      senderRole: 'admin',
      message: `🎉 Selamat bergabung ${member.name} ke dalam grup kelas ${course.title}! Silakan perkenalkan diri Anda dan pantau info jadwal dari Coach ${course.coachName}.`,
      timestamp: nowIso,
      isAnnouncement: true,
    };
    setChatMessages(prev => [...prev, welcomeMsg]);

    dispatchPushNotification({
      userId: member.id,
      title: 'Pendaftaran Kelas Renang Berhasil! 🏊',
      message: `Anda resmi terdaftar di ${course.title}. Jadwal: ${course.scheduleDays.join(', ')} (${course.scheduleTime}).`,
      type: 'schedule_alert',
    });

    return {
      success: true,
      message: `Berhasil mendaftar di kelas ${course.title}!`,
    };
  };

  // Request enrollment by member (menunggu konfirmasi guru les)
  const requestCourseEnrollment = (userId: string, courseId: string) => {
    const member = users.find(u => u.id === userId);
    const course = swimmingCourses.find(c => c.id === courseId);

    if (!member || !course) {
      return { success: false, message: 'Data member atau kelas renang tidak ditemukan.' };
    }

    if (member.enrolledCourseIds?.includes(courseId)) {
      return { success: false, message: 'Anda sudah resmi terdaftar di kelas renang ini.' };
    }

    const existingPending = enrollmentRequests.find(
      r => r.userId === userId && r.courseId === courseId && r.status === 'pending'
    );
    if (existingPending) {
      return {
        success: false,
        message: 'Anda sudah mengajukan pendaftaran untuk kelas ini dan sedang menunggu konfirmasi Guru Les.',
      };
    }

    if (course.currentParticipants >= course.maxParticipants) {
      return { success: false, message: 'Mohon maaf, kuota kelas renang ini sudah penuh.' };
    }

    const paymentScheme = course.paymentScheme || 'upfront';

    if (paymentScheme === 'upfront' && member.balance < course.price) {
      return {
        success: false,
        message: `Saldo tiket Anda (Rp ${member.balance.toLocaleString('id-ID')}) belum mencukupi untuk biaya kelas ini (Rp ${course.price.toLocaleString('id-ID')}). Silakan top up saldo terlebih dahulu sebelum mendaftar.`,
      };
    }

    const nowIso = new Date().toISOString();
    const newReq: EnrollmentRequest = {
      id: `req-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      coachId: course.coachId,
      coachName: course.coachName,
      userId: member.id,
      userName: member.name,
      userPhone: member.phone,
      userMemberNumber: member.memberNumber,
      userAvatar: member.avatarUrl,
      price: course.price,
      paymentScheme: paymentScheme,
      status: 'pending',
      requestedAt: nowIso,
    };

    setEnrollmentRequests(prev => [newReq, ...prev]);

    dispatchPushNotification({
      userId: member.id,
      title: 'Pendaftaran Kelas Terkirim 🏊',
      message: `Pendaftaran ${course.title} telah dikirim ke Coach ${course.coachName}. Anda dapat masuk kelas setelah dikonfirmasi oleh guru lesnya. ${
        paymentScheme === 'upfront'
          ? 'Saldo tiket akan dipotong saat guru mengonfirmasi.'
          : 'Kelas ini menggunakan metode Pembayaran Setelah Berjalan (tanpa potong saldo di awal).'
      }`,
      type: 'schedule_alert',
    });

    return {
      success: true,
      message: `Pengajuan pendaftaran kelas "${course.title}" berhasil dikirim! Menunggu konfirmasi dari Coach ${course.coachName}.`,
      request: newReq,
    };
  };

  // Confirm enrollment by Coach
  const confirmEnrollmentRequest = (requestId: string, coachNote?: string) => {
    const req = enrollmentRequests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Data permohonan pendaftaran tidak ditemukan.' };
    }
    if (req.status !== 'pending') {
      return {
        success: false,
        message: `Permohonan pendaftaran ini sudah ${req.status === 'approved' ? 'dikonfirmasi' : 'ditolak'}.`,
      };
    }

    const member = users.find(u => u.id === req.userId);
    const course = swimmingCourses.find(c => c.id === req.courseId);

    if (!member || !course) {
      return { success: false, message: 'Data murid atau kelas renang tidak ditemukan.' };
    }

    if (course.currentParticipants >= course.maxParticipants) {
      return { success: false, message: 'Mohon maaf, kuota peserta kelas renang ini sudah penuh.' };
    }

    const paymentScheme = req.paymentScheme || course.paymentScheme || 'upfront';
    const nowIso = new Date().toISOString();

    // SKEMA 1: PEMBAYARAN DI AWAL (UPFRONT) -> Potong Saldo Langsung
    if (paymentScheme === 'upfront') {
      if (member.balance < course.price) {
        return {
          success: false,
          message: `Konfirmasi gagal: Saldo member ${member.name} tidak mencukupi (Saldo: Rp ${member.balance.toLocaleString('id-ID')}, Biaya: Rp ${course.price.toLocaleString('id-ID')}). Harap ingatkan member untuk melakukan top up saldo terlebih dahulu.`,
        };
      }

      const newBalance = member.balance - course.price;
      const txId = `tx-crs-${Date.now()}`;
      const txCode = `CRS-${Date.now().toString().slice(-8)}`;

      const newTx: Transaction = {
        id: txId,
        code: txCode,
        userId: member.id,
        userName: member.name,
        memberNumber: member.memberNumber,
        type: 'course_fee',
        title: `Pendaftaran Kursus (Di Awal): ${course.title}`,
        amount: course.price,
        paymentMethod: 'saldo',
        status: 'success',
        timestamp: nowIso,
        securityHash: generateTransactionHash(txId, member.id, course.price, nowIso),
      };

      setTransactions(prev => [newTx, ...prev]);

      setUsers(prev =>
        prev.map(u =>
          u.id === member.id
            ? {
                ...u,
                balance: newBalance,
                enrolledCourseIds: Array.from(new Set([...(u.enrolledCourseIds || []), course.id])),
              }
            : u
        )
      );
    } else {
      // SKEMA 2: PEMBAYARAN SETELAH BERJALAN (POSTPAID) -> Masuk kelas tanpa potong saldo!
      setUsers(prev =>
        prev.map(u =>
          u.id === member.id
            ? {
                ...u,
                enrolledCourseIds: Array.from(new Set([...(u.enrolledCourseIds || []), course.id])),
              }
            : u
        )
      );
    }

    // Tambah jumlah peserta kelas renang (+1)
    setSwimmingCourses(prev =>
      prev.map(c => (c.id === course.id ? { ...c, currentParticipants: c.currentParticipants + 1 } : c))
    );

    // Inisialisasi pelacak progres latihan siswa
    const newProgress: CourseProgress = {
      userId: member.id,
      courseId: course.id,
      enrolledDate: nowIso.split('T')[0],
      attendanceCount: 0,
      level: 'Tahap 1: Pengenalan Air & Pernapasan',
      lastUpdated: nowIso.split('T')[0],
      coachNotes:
        coachNote ||
        (paymentScheme === 'postpaid'
          ? 'Pendaftaran disetujui Guru Les (Skema Pembayaran: Setelah Berjalan, tanpa potong saldo di awal).'
          : 'Pendaftaran disetujui Guru Les (Skema Pembayaran: Di Awal, Saldo tiket telah dipotong lunas).'),
      paymentScheme: paymentScheme,
      paymentStatus: paymentScheme === 'upfront' ? 'paid' : 'postpaid',
      milestones: [
        { id: 'm-1', name: 'Adaptasi Air & Pernapasan Ritmik', description: 'Rileks di air dan menghembuskan napas di dalam air.', isCompleted: false },
        { id: 'm-2', name: 'Posisi Mengapung (Floating)', description: 'Telungkup dan telentang dengan seimbang.', isCompleted: false },
        { id: 'm-3', name: 'Meluncur Streamline 10 Meter', description: 'Dorongan dari dinding tanpa gerak kaki tambahan.', isCompleted: false },
        { id: 'm-4', name: 'Teknik Ayunan Kaki & Tangan', description: 'Kombinasi gerak propulsi di kolam dangkal.', isCompleted: false },
        { id: 'm-5', name: 'Berenang 25 Meter Tanpa Papan', description: 'Ujian kelulusan level dasar.', isCompleted: false },
      ],
    };

    setCourseProgress(prev => [...prev.filter(p => !(p.userId === member.id && p.courseId === course.id)), newProgress]);

    // Update status permohonan menjadi 'approved'
    setEnrollmentRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              processedAt: nowIso,
              processedByCoachName: currentUser?.name || course.coachName,
            }
          : r
      )
    );

    // Pesan sambutan di grup kelas
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId: course.id,
      senderId: 'system',
      senderName: 'Sistem SAMARAI PARK',
      senderRole: 'admin',
      message: `🎉 Pendaftaran ${member.name} telah dikonfirmasi oleh Coach ${course.coachName}! Resmi masuk kelas ${course.title} (${paymentScheme === 'upfront' ? 'Pembayaran Di Awal: Saldo Lunas' : 'Pembayaran Setelah Berjalan: Tanpa Potong Saldo Awal'}).`,
      timestamp: nowIso,
      isAnnouncement: true,
    };
    setChatMessages(prev => [...prev, welcomeMsg]);

    // Push notifikasi ke member
    dispatchPushNotification({
      userId: member.id,
      title: 'Pendaftaran Kelas Renang Dikonfirmasi! 🎉',
      message:
        paymentScheme === 'upfront'
          ? `Coach ${course.coachName} telah mengonfirmasi pendaftaran Anda di kelas "${course.title}". Saldo tiket telah dipotong Rp ${course.price.toLocaleString('id-ID')}. Anda sudah dapat masuk kelas!`
          : `Coach ${course.coachName} telah mengonfirmasi Anda masuk kelas "${course.title}" tanpa potong saldo di awal (Pembayaran Setelah Berjalan). Selamat berlatih!`,
      type: 'schedule_alert',
    });

    return {
      success: true,
      message:
        paymentScheme === 'upfront'
          ? `Pendaftaran ${member.name} berhasil dikonfirmasi! Saldo member otomatis dipotong sebesar Rp ${course.price.toLocaleString('id-ID')}. Murid resmi aktif di kelas.`
          : `Pendaftaran ${member.name} berhasil disetujui! Murid resmi aktif masuk kelas tanpa potong saldo di awal (Skema: Setelah Berjalan).`,
    };
  };

  // Reject enrollment request
  const rejectEnrollmentRequest = (requestId: string, reason?: string) => {
    const req = enrollmentRequests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Permintaan pendaftaran tidak ditemukan.' };
    }
    const nowIso = new Date().toISOString();
    setEnrollmentRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              processedAt: nowIso,
              processedByCoachName: currentUser?.name || req.coachName,
              rejectionReason: reason || 'Kapasitas kuota kelas belum tersedia atau jadwal bentrok.',
            }
          : r
      )
    );

    dispatchPushNotification({
      userId: req.userId,
      title: 'Pendaftaran Kelas Belum Disetujui',
      message: `Pengajuan kelas "${req.courseTitle}" belum dapat diterima oleh Coach ${req.coachName}. ${reason ? `Alasan: ${reason}` : ''}`,
      type: 'system',
    });

    return {
      success: true,
      message: `Permohonan pendaftaran ${req.userName} telah ditolak.`,
    };
  };

  // Cancel enrollment request by member
  const cancelEnrollmentRequest = (requestId: string) => {
    const req = enrollmentRequests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Permohonan tidak ditemukan.' };
    }
    setEnrollmentRequests(prev => prev.filter(r => r.id !== requestId));
    return {
      success: true,
      message: 'Pengajuan pendaftaran kelas renang telah dibatalkan.',
    };
  };

  // Send chat message in group
  const sendChatMessage = (courseId: string, messageText: string, isAnnouncement: boolean = false) => {
    if (!currentUser || !messageText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role === 'admin' ? 'admin' : currentUser.role === 'coach' ? 'coach' : 'member',
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      isAnnouncement: isAnnouncement || currentUser.role === 'coach' || currentUser.role === 'admin',
    };

    setChatMessages(prev => [...prev, newMsg]);
  };

  const updateMilestone = (userId: string, courseId: string, milestoneId: string, isCompleted: boolean) => {
    setCourseProgress(prev =>
      prev.map(p => {
        if (p.userId === userId && p.courseId === courseId) {
          const updatedMilestones = p.milestones.map(m =>
            m.id === milestoneId
              ? {
                  ...m,
                  isCompleted,
                  completedDate: isCompleted ? new Date().toISOString().split('T')[0] : undefined,
                }
              : m
          );
          return {
            ...p,
            milestones: updatedMilestones,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
  };

  const updateCoachNotes = (userId: string, courseId: string, notes: string) => {
    setCourseProgress(prev =>
      prev.map(p =>
        p.userId === userId && p.courseId === courseId
          ? {
              ...p,
              coachNotes: notes,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );
  };

  const recordAttendance = (userId: string, courseId: string, delta: number) => {
    setCourseProgress(prev =>
      prev.map(p => {
        if (p.userId === userId && p.courseId === courseId) {
          const newAttendance = Math.max(0, p.attendanceCount + delta);
          return {
            ...p,
            attendanceCount: newAttendance,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );

    const student = users.find(u => u.id === userId);
    if (student) {
      dispatchPushNotification({
        userId,
        title: 'Presensi Sesi Renang Dicatat 🏊',
        message: `Guru Les Anda telah memperbarui kehadiran sesi renang Anda (${delta >= 0 ? '+' : ''}${delta} sesi).`,
        type: 'schedule_alert',
      });
    }
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    dispatchPushNotification({
      title: 'Pengaturan Berhasil Disimpan',
      message: 'Perubahan tarif tiket, nama usaha, atau kuota telah diperbarui secara langsung.',
      type: 'system',
    });
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role } : u)));
    dispatchPushNotification({
      userId,
      title: 'Peran Pengguna Diperbarui',
      message: `Peran Anda telah diubah menjadi ${
        role === 'admin' ? 'Admin' : role === 'coach' ? 'Guru Les (Instruktur)' : role === 'gate' ? 'Karyawan' : 'Member'
      }.`,
      type: 'system',
    });
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status } : u)));
    dispatchPushNotification({
      userId,
      title: status === 'active' ? 'Akun Diaktifkan Kembali' : 'Akun Dinonaktifkan Sementara',
      message: status === 'active' ? 'Status keanggotaan Anda kembali aktif.' : 'Status keanggotaan ditangguhkan oleh Admin.',
      type: 'system',
    });
  };

  const addUser = (userData: Partial<User> & { name: string; email: string; role: UserRole }): User => {
    const newId = userData.id || `usr-${userData.role}-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString().split('T')[0];
    const newUser: User = {
      id: newId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '081200000000',
      role: userData.role,
      balance: userData.balance ?? 0,
      memberNumber: userData.memberNumber || (
        userData.role === 'coach'
          ? `GURU-LES-${Math.floor(10 + Math.random() * 90)}`
          : userData.role === 'gate'
          ? `STF-KARYAWAN-${Math.floor(10 + Math.random() * 90)}`
          : `SMP${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`
      ),
      joinDate: userData.joinDate || nowIso,
      status: userData.status || 'active',
      avatarUrl: userData.avatarUrl || (
        userData.role === 'coach'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80'
          : undefined
      ),
      coachSpecialty: userData.coachSpecialty,
      enrolledCourseIds: userData.enrolledCourseIds || [],
      teachingCourseIds: userData.teachingCourseIds || [],
    };

    setUsers(prev => [newUser, ...prev]);
    dispatchPushNotification({
      title: 'Pengguna Baru Ditambahkan',
      message: `${newUser.name} berhasil didaftarkan sebagai ${
        newUser.role === 'coach' ? 'Guru Les' : newUser.role === 'gate' ? 'Karyawan' : newUser.role === 'admin' ? 'Admin' : 'Member'
      }.`,
      type: 'system',
    });
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );
    dispatchPushNotification({
      userId,
      title: 'Profil Pengguna Diperbarui',
      message: 'Informasi data akun telah berhasil diperbarui oleh Administrator.',
      type: 'system',
    });
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    dispatchPushNotification({
      title: 'Akun Pengguna Dihapus',
      message: 'Data akun pengguna telah dihapus dari database sistem.',
      type: 'system',
    });
  };

  const manualAdjustBalance = (userId: string, amount: number, reason: string) => {
    const member = users.find(u => u.id === userId);
    if (!member) return;

    const newBalance = member.balance + amount;
    const nowIso = new Date().toISOString();
    const txId = `tx-adj-${Date.now()}`;

    const newTx: Transaction = {
      id: txId,
      code: `ADJ-${Date.now().toString().slice(-8)}`,
      userId: member.id,
      userName: member.name,
      memberNumber: member.memberNumber,
      type: amount >= 0 ? 'top_up' : 'entry_ticket',
      title: `Penyesuaian Saldo Admin: ${reason}`,
      amount: Math.abs(amount),
      paymentMethod: 'cash',
      status: 'success',
      timestamp: nowIso,
      securityHash: generateTransactionHash(txId, member.id, Math.abs(amount), nowIso),
    };

    setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, balance: newBalance } : u)));
    setTransactions(prev => [newTx, ...prev]);

    dispatchPushNotification({
      userId: member.id,
      title: 'Penyesuaian Saldo oleh Admin ℹ️',
      message: `Saldo disesuaikan ${amount >= 0 ? '+' : '-'}Rp ${Math.abs(amount).toLocaleString('id-ID')}. Alasan: ${reason}. Saldo: Rp ${newBalance.toLocaleString('id-ID')}.`,
      type: 'balance_update',
    });
  };

  const refreshMemberQRToken = (userId: string): string => {
    const newToken = `TKN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            qrToken: newToken,
            qrTokenUpdatedAt: nowIso,
          };
        }
        return u;
      })
    );
    dispatchPushNotification({
      userId,
      title: 'Token QR Code Diperbarui',
      message: 'Kode QR Anda telah diperbarui dengan token baru. Kode QR versi lama otomatis tidak berlaku.',
      type: 'system',
    });
    return newToken;
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  // Webhook SSE Listener: Listen to real-time incoming QRIS Webhook payments from server
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackPollInterval: any = null;
    let lastSeenTimestamp = Date.now();

    const handleIncomingWebhook = (payment: any) => {
      if (!payment || !payment.amount) return;
      const amount = Number(payment.amount);
      if (amount <= 0) return;

      // Find matching user by memberId or memberNumber (case & dash insensitive)
      const cleanMemberNum = payment.memberNumber ? String(payment.memberNumber).toUpperCase().replace(/-/g, '') : '';
      let targetUser = users.find(
        u =>
          (payment.memberId && u.id.toLowerCase() === payment.memberId.toLowerCase()) ||
          (cleanMemberNum && u.memberNumber.toUpperCase().replace(/-/g, '') === cleanMemberNum)
      );

      // If not found by ID/number, check by sender name from NotivGo / bank notification
      if (!targetUser && payment.sender) {
        const sName = String(payment.sender).toLowerCase();
        targetUser = users.find(
          u =>
            u.role === 'member' &&
            (u.name.toLowerCase().includes(sName) || sName.includes(u.name.toLowerCase().split(' ')[0]))
        );
      }

      // If still not matched, fallback to current logged-in member or first member
      if (!targetUser && currentUser && currentUser.role === 'member') {
        targetUser = currentUser;
      } else if (!targetUser) {
        targetUser = users.find(u => u.role === 'member') || users[0];
      }

      if (!targetUser) return;

      const newBalance = targetUser.balance + amount;
      const nowIso = payment.timestamp || new Date().toISOString();
      const txId = payment.id || `tx-qris-${Date.now()}`;
      const txCode = payment.referenceId || `QRIS-${Date.now().toString().slice(-8)}`;
      const channel = payment.channelName || 'QRIS Instant Settlement';

      const newTx: Transaction = {
        id: txId,
        code: txCode,
        userId: targetUser.id,
        userName: targetUser.name,
        memberNumber: targetUser.memberNumber,
        type: 'top_up',
        title: `Top Up QRIS (Webhook): ${channel}`,
        amount,
        paymentMethod: 'e_wallet',
        channelName: channel,
        status: 'success',
        timestamp: nowIso,
        securityHash: generateTransactionHash(txId, targetUser.id, amount, nowIso),
      };

      // 1. Update frontend state
      setUsers(prev => prev.map(u => (u.id === targetUser!.id ? { ...u, balance: newBalance } : u)));
      setTransactions(prev => [newTx, ...prev]);

      // 2. Trigger instant sparkling coin drop effect
      triggerCoinDropEffect(amount);

      // 3. Show instant Coin Alert Modal
      setQrisCoinAlert({
        amount,
        userName: targetUser.name,
        memberNumber: targetUser.memberNumber,
        channelName: channel,
        referenceId: txCode,
        timestamp: nowIso,
      });

      // 4. Send persistent push notification
      dispatchPushNotification({
        userId: targetUser.id,
        title: '🪙 Koin Diterima! Pembayaran QRIS Sukses',
        message: `Koin saldo sebesar Rp ${amount.toLocaleString('id-ID')} berhasil masuk secara instan via Webhook (${channel}). Saldo Anda sekarang: Rp ${newBalance.toLocaleString('id-ID')}.`,
        type: 'qris_coin_received',
        data: { amount, newBalance, txCode },
      });
    };

    try {
      eventSource = new EventSource('/api/webhook/qris/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.amount) {
            handleIncomingWebhook(data);
          }
        } catch {
          // ignore keep-alive
        }
      };
      eventSource.onerror = () => {
        // SSE error, fallback will handle
      };
    } catch {
      // EventSource not supported
    }

    // Polling fallback to guarantee reception across all environments
    fallbackPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/webhook/qris/recent?since=${lastSeenTimestamp}`);
        if (res.ok) {
          const json = await res.json();
          if (json.payments && Array.isArray(json.payments) && json.payments.length > 0) {
            for (const p of json.payments) {
              const pTime = new Date(p.timestamp).getTime();
              if (pTime > lastSeenTimestamp) {
                lastSeenTimestamp = pTime;
                handleIncomingWebhook(p);
              }
            }
          }
        }
      } catch {
        // quiet fallback
      }
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackPollInterval) clearInterval(fallbackPollInterval);
    };
  }, [users, currentUser]);

  // Client-side helper to simulate QRIS webhook payment by posting to /api/webhook/qris
  const simulateQrisWebhookPayment = async (amount: number, targetUserId?: string): Promise<{ success: boolean; message: string }> => {
    const targetMember = users.find(u => u.id === (targetUserId || currentUser?.id)) || currentUser || users[0];
    const payload = {
      amount,
      memberId: targetMember?.id,
      memberNumber: targetMember?.memberNumber,
      customer_name: targetMember?.name,
      channelName: 'QRIS Gopay / BCA / DANA Instant',
      referenceId: `QRIS-WH-${Date.now().toString().slice(-6)}`,
      transaction_status: 'PAID',
      status: 'SUCCESS',
    };

    try {
      const res = await fetch('/api/webhook/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return {
          success: true,
          message: `Webhook QRIS berhasil dikirim ke server! Rp ${amount.toLocaleString('id-ID')} masuk ke akun ${targetMember?.name}.`,
        };
      } else {
        // Fallback: If server endpoint isn't reached, handle directly on client
        topUpBalance(targetMember.id, amount, 'e_wallet', 'QRIS Webhook Simulator (Offline Fallback)');
        return {
          success: true,
          message: `Saldo diproses via fallback simulator: Rp ${amount.toLocaleString('id-ID')}`,
        };
      }
    } catch {
      // Direct local fallback
      topUpBalance(targetMember.id, amount, 'e_wallet', 'QRIS Webhook Simulator');
      return {
        success: true,
        message: `Saldo diproses via simulator: Rp ${amount.toLocaleString('id-ID')}`,
      };
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        transactions,
        settings,
        swimmingCourses,
        courseProgress,
        chatMessages,
        notifications,
        enrollmentRequests,
        activeToast,
        todayVisitorsCount,
        remainingQuota,
        setCurrentUser,
        switchUser,
        switchRole,
        registerMember,
        resetPasswordRequest,
        logout,
        scanEntryTicket,
        topUpBalance,
        cancelTransaction,
        addSwimmingCourse,
        updateSwimmingCourse,
        deleteSwimmingCourse,
        enrollInCourse,
        requestCourseEnrollment,
        confirmEnrollmentRequest,
        rejectEnrollmentRequest,
        cancelEnrollmentRequest,
        sendChatMessage,
        updateMilestone,
        updateCoachNotes,
        recordAttendance,
        updateSettings,
        updateUserStatus,
        updateUserRole,
        addUser,
        updateUser,
        deleteUser,
        manualAdjustBalance,
        refreshMemberQRToken,
        qrisCoinAlert,
        dismissCoinAlert,
        triggerCoinDropEffect,
        simulateQrisWebhookPayment,
        dismissToast,
        markNotificationAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
