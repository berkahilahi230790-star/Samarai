export type UserRole = 'member' | 'coach' | 'admin' | 'gate';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  memberNumber: string;
  avatarUrl?: string;
  joinDate: string;
  status: 'active' | 'suspended';
  enrolledCourseIds: string[];
  coachSpecialty?: string;
  teachingCourseIds?: string[];
  qrToken?: string;
  qrTokenUpdatedAt?: string;
}

export type TransactionType = 'entry_ticket' | 'top_up' | 'course_fee' | 'refund';
export type PaymentMethod = 'saldo' | 'bank_transfer' | 'e_wallet' | 'cash';
export type TransactionStatus = 'success' | 'cancelled' | 'pending';

export interface Transaction {
  id: string;
  code: string;
  userId: string;
  userName: string;
  memberNumber: string;
  type: TransactionType;
  title: string;
  amount: number;
  quantity?: number; // e.g. number of tickets
  pricePerUnit?: number;
  paymentMethod: PaymentMethod;
  channelName?: string; // e.g. "BCA Virtual Account", "GoPay", "QRIS"
  status: TransactionStatus;
  timestamp: string; // ISO string
  securityHash: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface AdBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  badge?: string;
  targetUrl?: string;
}

export interface BusinessSettings {
  businessName: string;
  logoUrl: string;
  ticketPrice: number;
  dailyQuota: number;
  minTopUpEmployee?: number;
  openHours: string;
  contactPhone: string;
  address: string;
  banners?: AdBanner[];
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  eWallets: {
    walletName: string;
    accountNumber: string;
    qrImageUrl: string;
  }[];
}

export type CoursePaymentScheme = 'upfront' | 'postpaid'; // 'upfront' = Di Awal (potong saldo saat dikonfirmasi guru), 'postpaid' = Setelah Berjalan (masuk kelas dulu tanpa potong saldo)

export type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface EnrollmentRequest {
  id: string;
  courseId: string;
  courseTitle: string;
  coachId?: string;
  coachName: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userMemberNumber: string;
  userAvatar?: string;
  price: number;
  paymentScheme: CoursePaymentScheme;
  status: EnrollmentRequestStatus;
  requestedAt: string;
  processedAt?: string;
  processedByCoachName?: string;
  rejectionReason?: string;
}

export interface SwimmingCourse {
  id: string;
  title: string;
  category: 'Anak-Anak' | 'Dewasa' | 'Privat' | 'Prestasi';
  description: string;
  price: number;
  paymentScheme?: CoursePaymentScheme; // 'upfront' (Di Awal) | 'postpaid' (Setelah Berjalan)
  durationWeeks: number;
  totalSessions: number;
  coachId?: string;
  coachName: string;
  coachPhone: string;
  scheduleDays: string[];
  scheduleTime: string;
  maxParticipants: number;
  currentParticipants: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  completedDate?: string;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  enrolledDate: string;
  attendanceCount: number;
  level: string; // e.g., "Pemula 2", "Menengah"
  milestones: Milestone[];
  coachNotes: string;
  lastUpdated: string;
  paymentScheme?: CoursePaymentScheme;
  paymentStatus?: 'paid' | 'unpaid' | 'postpaid';
}

export interface ChatMessage {
  id: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'coach' | 'member' | 'admin';
  message: string;
  timestamp: string;
  isAnnouncement?: boolean;
}

export interface PushNotification {
  id: string;
  userId?: string; // empty means broadcast to all
  title: string;
  message: string;
  type: 'balance_update' | 'entry_success' | 'top_up' | 'refund' | 'schedule_alert' | 'system' | 'qris_coin_received';
  timestamp: string;
  isRead: boolean;
  data?: Record<string, any>;
}

export interface QRPayload {
  mId: string; // memberId
  mNum: string; // memberNumber
  ts: number; // timestamp created
  exp?: number; // expires timestamp (0 or omitted if static)
  nonce: string; // random cryptographic string / token
  sig: string; // digital signature hash
  isStatic?: boolean; // indicates static token QR
}
