import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  TrendingUp,
  Ticket,
  Shield,
  FileSpreadsheet,
  Printer,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Undo2,
  DollarSign,
  Building2,
  Lock,
  Edit,
  Save,
  AlertTriangle,
  Clock,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  UserCog,
  GraduationCap,
  ScanLine,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, Transaction, BusinessSettings, UserRole } from '../../types';
import { exportToExcelCSV, printReportAsPDF } from '../../utils/export';
import { PrintableReport } from './PrintableReport';
import { generateMemberQRPayload } from '../../utils/encryption';
import { BannerSettingsCard } from './BannerSettingsCard';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    transactions,
    settings,
    todayVisitorsCount,
    remainingQuota,
    updateSettings,
    updateUserStatus,
    updateUserRole,
    manualAdjustBalance,
    cancelTransaction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'traffic' | 'customers' | 'transactions' | 'reports' | 'settings'>('settings');

  // Customer Management state
  const [searchCustomer, setSearchCustomer] = useState('');
  const [customerFilterStatus, setCustomerFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [customerFilterRole, setCustomerFilterRole] = useState<'all' | 'member' | 'coach' | 'admin'>('all');
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [roleChangingUser, setRoleChangingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('Bonus loyalitas member');
  const [viewingUserQR, setViewingUserQR] = useState<{ user: User; qrUrl: string } | null>(null);

  // Transaction Void / Cancel state
  const [voidingTx, setVoidingTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('Kesalahan input jumlah tiket');
  const [txSearch, setTxSearch] = useState('');

  // Daily Report state
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Settings form state
  const [formSettings, setFormSettings] = useState<BusinessSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Calculations for overview
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTx = transactions.filter(t => t.timestamp.startsWith(todayStr));
  const todayRevenue = todayTx
    .filter(t => t.status === 'success' && t.type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayRefunds = todayTx
    .filter(t => t.type === 'refund' || t.status === 'cancelled')
    .reduce((sum, t) => sum + t.amount, 0);

  const membersCount = users.filter(u => u.role === 'member').length;

  // Filtered customers
  const filteredCustomers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      u.memberNumber.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      u.email.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesStatus =
      customerFilterStatus === 'all' ? true : u.status === customerFilterStatus;
    const matchesRole =
      customerFilterRole === 'all' ? true : u.role === customerFilterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (!txSearch.trim()) return true;
    return (
      t.code.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.userName.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.memberNumber.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(txSearch.toLowerCase())
    );
  });

  const handleOpenQRModal = (user: User) => {
    const payload = generateMemberQRPayload(
      user.id,
      user.memberNumber,
      user.qrToken,
      user.qrTokenUpdatedAt ? new Date(user.qrTokenUpdatedAt).getTime() : undefined
    );
    QRCode.toDataURL(payload, { width: 300, margin: 1.5 })
      .then(url => {
        setViewingUserQR({ user, qrUrl: url });
      })
      .catch(console.error);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleExecuteBalanceAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !adjustAmount) return;

    const amountNum = parseInt(adjustAmount, 10);
    const finalAmount = adjustType === 'add' ? amountNum : -amountNum;

    manualAdjustBalance(selectedUserForBalance.id, finalAmount, adjustReason);
    setSelectedUserForBalance(null);
    setAdjustAmount('');
  };

  const handleExecuteVoidTransaction = () => {
    if (!voidingTx) return;
    cancelTransaction(voidingTx.id, voidReason);
    setVoidingTx(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Printable report component (hidden on screen, visible during window.print()) */}
      <PrintableReport
        transactions={transactions}
        settings={settings}
        reportDate={reportDate}
      />

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-100 gap-2 overflow-x-auto text-xs font-bold no-print">
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600 bg-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800 font-semibold'
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan Usaha & Tiket
        </button>
        <button
          onClick={() => setActiveTab('traffic')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'traffic'
              ? 'border-blue-600 text-blue-600 bg-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800 font-semibold'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Trafik & Kuota Pengunjung
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600 bg-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800 font-semibold'
          }`}
        >
          <Users className="w-4 h-4" />
          Database Pelanggan ({membersCount})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-blue-600 text-blue-600 bg-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800 font-semibold'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          Transaksi & Pembatalan / Refund
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600 bg-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800 font-semibold'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Laporan Penjualan Harian
        </button>
      </div>

      {/* SUB-TAB 1: TRAFFIC & QUOTA MONITOR */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          {/* Top Header & KPI Metric Cards */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                    Pusat Kendali & Dasbor Admin {settings.businessName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Pemantauan trafik, kuota harian tiket, database pelanggan, dan audit transaksi.
                  </p>
                </div>
              </div>
            </div>

            {/* Action button to export/print report quickly */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => exportToExcelCSV(transactions, settings, reportDate)}
                className="flex-1 md:flex-initial py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Excel
              </button>
              <button
                onClick={printReportAsPDF}
                className="flex-1 md:flex-initial py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak PDF
              </button>
            </div>
          </div>

          {/* Overview Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Visitors & Quota */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Trafik Pengunjung</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {todayVisitorsCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ {settings.dailyQuota} Kuota</span>
              </div>
              {/* Progress gauge */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    todayVisitorsCount / settings.dailyQuota > 0.9 ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, (todayVisitorsCount / settings.dailyQuota) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                Sisa Kuota: <strong>{remainingQuota}</strong> orang
              </span>
            </div>

            {/* Revenue Today */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Pendapatan Hari Ini</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900">
                Rp {todayRevenue.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                Penjualan tiket & transaksi masuk
              </span>
            </div>

            {/* Refunds / Voids */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Pembatalan</span>
                <Undo2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black tracking-tight text-amber-900">
                Rp {todayRefunds.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                Koreksi salah input tiket petugas
              </span>
            </div>

            {/* Total Members */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Database Member</span>
                <Ticket className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900">
                {membersCount} Member
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                Tarif: Rp {settings.ticketPrice.toLocaleString('id-ID')}/orang
              </span>
            </div>

          </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900">
                  Grafik Trafik Kunjungan Hari Ini
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Distribusi jam kedatangan member di kolam renang ({settings.openHours})
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pintu Masuk Terkendali
              </span>
            </div>

            {/* Hourly Traffic Bars */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 items-end h-44 border-b border-slate-100 pb-4">
              {[
                { hour: '07:00', count: 12 },
                { hour: '08:00', count: 28 },
                { hour: '09:00', count: 45 },
                { hour: '10:00', count: 62 },
                { hour: '11:00', count: 35 },
                { hour: '12:00', count: 20 },
                { hour: '13:00', count: 18 },
                { hour: '14:00', count: 40 },
                { hour: '15:00', count: 75 },
                { hour: '16:00', count: 95 },
                { hour: '17:00', count: 80 },
                { hour: '18:00', count: 25 },
              ].map(slot => (
                <div key={slot.hour} className="flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {slot.count}
                  </span>
                  <div
                    className="w-full bg-blue-600 rounded-t-lg transition-all group-hover:bg-blue-700"
                    style={{ height: `${(slot.count / 100) * 110}px` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                    {slot.hour.split(':')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Jam Buka: 07:00</span>
              <span className="font-semibold text-blue-800">Peak Hours: 15:00 - 17:00 WIB (Kelas Renang Sore)</span>
              <span>Jam Tutup: 18:00</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-black tracking-tight text-slate-900 border-b border-slate-100 pb-3">
              Status Kuota Harian
            </h3>
            
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-center space-y-1">
              <span className="text-xs text-blue-800 font-semibold block">Sisa Kuota Tersedia</span>
              <span className="text-3xl font-black tracking-tight text-blue-950">
                {remainingQuota} Tiket
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                dari batas maksimal {settings.dailyQuota} tiket/hari
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Tarif Masuk/Orang:</span>
                <span className="font-bold text-slate-900">Rp {settings.ticketPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Terisi Hari Ini:</span>
                <span className="font-bold text-emerald-700">{todayVisitorsCount} Orang ({Math.round((todayVisitorsCount / settings.dailyQuota) * 100)}%)</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Sistem Keamanan:</span>
                <span className="font-semibold text-blue-800">Dynamic QR + Anti-Duplikasi</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              <span className="font-bold block mb-0.5">Proteksi Over-Capacity:</span>
              Jika kuota habis, sistem pemindai karyawan akan menolak pemindaian tiket secara otomatis untuk menjaga kenyamanan kolam renang.
            </div>
          </div>

        </div>
        </div>
      )}

      {/* SUB-TAB 2: DATABASE PELANGGAN */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">
                Kelola Database Member SAMARAI PARK
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Daftar semua member, status keanggotaan, penyesuaian saldo, dan penerbitan QR unik.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, email, no member..."
                  value={searchCustomer}
                  onChange={e => setSearchCustomer(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <select
                value={customerFilterRole}
                onChange={e => setCustomerFilterRole(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white font-semibold"
              >
                <option value="all">Semua Peran (Role)</option>
                <option value="member">1. Member Pengunjung</option>
                <option value="coach">2. Guru Les (Instruktur)</option>
                <option value="gate">3. Karyawan (Loket/Pintu Masuk)</option>
                <option value="admin">4. Admin</option>
              </select>

              <select
                value={customerFilterStatus}
                onChange={e => setCustomerFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Pengguna</th>
                  <th className="pb-3">Peran (Role)</th>
                  <th className="pb-3">Kontak</th>
                  <th className="pb-3">Saldo Aktif</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada pengguna yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                            m.role === 'coach'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[10px] font-mono text-blue-700">{m.memberNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.role === 'coach'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : m.role === 'admin'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : m.role === 'gate'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {m.role === 'coach' && <GraduationCap className="w-3 h-3" />}
                            {m.role === 'gate' && <ScanLine className="w-3 h-3" />}
                            {m.role === 'coach' ? 'Guru Les' : m.role === 'admin' ? 'Admin' : m.role === 'gate' ? 'Karyawan' : 'Member'}
                          </span>
                          <button
                            onClick={() => setRoleChangingUser(m)}
                            className="text-[10px] text-slate-400 hover:text-blue-600 underline font-semibold"
                            title="Ganti peran pengguna ini"
                          >
                            Ubah
                          </button>
                        </div>
                        {m.role === 'coach' && m.coachSpecialty && (
                          <div className="text-[9px] text-slate-400 truncate max-w-[140px] mt-0.5 font-medium">
                            {m.coachSpecialty}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="text-slate-700 font-medium">{m.email}</div>
                        <div className="text-[10px] text-slate-400">{m.phone}</div>
                      </td>
                      <td className="py-3">
                        <span className="font-black tracking-tight text-slate-900 text-sm">
                          Rp {m.balance.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {m.status === 'active' ? 'Aktif' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 space-x-1">
                        <button
                          onClick={() => setRoleChangingUser(m)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ubah Peran (Role)"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenQRModal(m)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat QR Code Member"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedUserForBalance(m)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Sesuaikan Saldo"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateUserStatus(m.id, m.status === 'active' ? 'suspended' : 'active')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.status === 'active'
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={m.status === 'active' ? 'Tangguhkan Member' : 'Aktifkan Member'}
                        >
                          {m.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: TRANSAKSI & FITUR PEMBATALAN (VOID/REFUND) */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">
                Log Transaksi & Pembatalan Tiket
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Audit riwayat transaksi real-time dengan tombol pembatalan (Void) jika terjadi kesalahan input tiket.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode transaksi, nama member..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Kode</th>
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3">Pelanggan</th>
                  <th className="pb-3">Keterangan</th>
                  <th className="pb-3 text-center">Jumlah</th>
                  <th className="pb-3 text-right">Nominal</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Aksi Pembatalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-slate-800">
                        {t.code}
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-slate-900 block">{t.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.memberNumber}</span>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {t.title}
                        {t.cancelReason && (
                          <span className="block text-[10px] text-red-600 font-medium italic">
                            Alasan Batal: {t.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center font-medium">
                        {t.quantity ? `${t.quantity} Orang` : '-'}
                      </td>
                      <td className="py-3 text-right font-black tracking-tight text-slate-900">
                        Rp {t.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {t.status === 'success' ? 'Berhasil' : 'Dibatalkan'}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        {t.status === 'success' && t.type !== 'refund' ? (
                          <button
                            onClick={() => {
                              setVoidingTx(t);
                              setVoidReason('Kesalahan input jumlah tiket oleh petugas');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Undo2 className="w-3 h-3" />
                            Batalkan / Void
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-medium">Nonaktif</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: LAPORAN PENJUALAN HARIAN (PDF / EXCEL EXPORT) */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">
                Laporan Penjualan & Rekapitulasi Harian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Unduh rekap data transaksi resmi dalam format Excel (CSV) atau cetak langsung format PDF.
              </p>
            </div>

            {/* Date Picker & Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                onClick={() => exportToExcelCSV(transactions, settings, reportDate)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Format Excel
              </button>
              <button
                onClick={printReportAsPDF}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Format PDF
              </button>
            </div>
          </div>

          {/* Daily Report Preview Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Rekap Penjualan Tanggal: {reportDate}
              </span>
              <span className="text-xs font-mono text-blue-700 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Terverifikasi Sistem
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">Tiket Terjual</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  {transactions
                    .filter(t => t.timestamp.startsWith(reportDate) && t.type === 'entry_ticket' && t.status === 'success')
                    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)} Tiket
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">Penjualan Tiket Masuk</span>
                <span className="text-lg font-black text-blue-900 mt-1 block">
                  Rp {transactions
                    .filter(t => t.timestamp.startsWith(reportDate) && t.type === 'entry_ticket' && t.status === 'success')
                    .reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">Volume Top-Up Saldo</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  Rp {transactions
                    .filter(t => t.timestamp.startsWith(reportDate) && t.type === 'top_up' && t.status === 'success')
                    .reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">Total Pengembalian (Refund)</span>
                <span className="text-lg font-black text-red-600 mt-1 block">
                  Rp {transactions
                    .filter(t => t.timestamp.startsWith(reportDate) && (t.type === 'refund' || t.status === 'cancelled'))
                    .reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 5: PENGATURAN USAHA (LOGO, NAMA USAHA, HARGA TIKET, KUOTA) */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-3xl space-y-6">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">
                Pengaturan Usaha & Parameter Tiket
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Ubah logo, nama usaha, harga tiket masuk, kuota harian pengunjung kolam renang.
              </p>
            </div>
            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Pengaturan Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            
            {/* Logo Preview & Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Logo Usaha (URL Gambar)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {formSettings.logoUrl ? (
                    <img src={formSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    placeholder="https://... URL gambar logo"
                    value={formSettings.logoUrl}
                    onChange={e => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, logoUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=160&h=160&fit=crop&crop=faces&q=80' })}
                      className="text-[10px] text-blue-600 hover:underline font-medium"
                    >
                      Preset Kolam Renang 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, logoUrl: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=160&h=160&fit=crop&q=80' })}
                      className="text-[10px] text-blue-600 hover:underline font-medium"
                    >
                      Preset Kolam Renang 2
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nama Usaha */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Usaha / Tempat Wisata</label>
              <input
                type="text"
                required
                value={formSettings.businessName}
                onChange={e => setFormSettings({ ...formSettings, businessName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* HARGA TIKET MASUK / ORANG & KUOTA HARIAN */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      Pengaturan Harga Tiket Masuk / Orang
                    </h4>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Tarif Scan Gerbang
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Tarif per orang yang otomatis dipotong dari saldo member saat scan QR tiket di pintu masuk gerbang.
                  </p>
                </div>
                <div className="text-left sm:text-right bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-blue-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Tarif Aktif Saat Ini
                  </span>
                  <span className="text-lg font-black text-blue-600 tracking-tight">
                    Rp {(formSettings.ticketPrice || 0).toLocaleString('id-ID')}
                    <span className="text-xs text-slate-500 font-normal"> / orang</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <label className="block font-bold text-slate-800 text-xs">
                  Nominal Harga Tiket / Orang (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formSettings.ticketPrice || ''}
                    onChange={e => setFormSettings({ ...formSettings, ticketPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full pl-9 pr-3 py-2 bg-white text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="35000"
                  />
                </div>
              </div>

              {/* Kuota Harian */}
              <div className="border-t border-blue-100/70 pt-3">
                <label className="block font-bold text-slate-700 mb-1">
                  Pengaturan Kuota Harian Tiket Pengunjung (Orang)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="10"
                    required
                    value={formSettings.dailyQuota}
                    onChange={e => setFormSettings({ ...formSettings, dailyQuota: parseInt(e.target.value, 10) || 100 })}
                    className="w-44 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">
                    Maksimal pengunjung masuk per hari untuk mencegah kolam over-capacity.
                  </span>
                </div>
              </div>

              {/* Pengaturan Input Minimal Top Up */}
              <div className="border-t border-blue-100/70 pt-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Pengaturan Input Minimal Top Up (Rp)
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Batas nominal minimal top up saldo akun member (berlaku untuk top up mandiri member & loket kasir/gerbang).
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-blue-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Min. Top Up Aktif
                    </span>
                    <span className="text-base font-black text-emerald-600 tracking-tight">
                      Rp {(formSettings.minTopUpEmployee ?? 100000).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formSettings.minTopUpEmployee ?? 100000}
                      onChange={e => setFormSettings({ ...formSettings, minTopUpEmployee: parseInt(e.target.value, 10) || 0 })}
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="100000"
                    />
                  </div>

                  {/* Pilihan Cepat Preset Min Top Up Admin */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[50000, 75000, 100000, 150000, 200000, 250000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormSettings({ ...formSettings, minTopUpEmployee: amt })}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          (formSettings.minTopUpEmployee ?? 100000) === amt
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Rp {(amt / 1000).toLocaleString('id-ID')}k
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl flex items-center gap-2">
                  <span className="font-bold text-emerald-800 shrink-0">Simulasi Tombol Karyawan:</span>
                  <span className="text-emerald-900 font-medium">
                    6 Pilihan nominal di loket otomatis: Rp {((formSettings.minTopUpEmployee ?? 100000) * 1).toLocaleString('id-ID')}, Rp {Math.round(((formSettings.minTopUpEmployee ?? 100000) * 1.25) / 1000 * 1000).toLocaleString('id-ID')}, Rp {Math.round(((formSettings.minTopUpEmployee ?? 100000) * 1.5) / 1000 * 1000).toLocaleString('id-ID')}, Rp {((formSettings.minTopUpEmployee ?? 100000) * 2).toLocaleString('id-ID')}, Rp {Math.round(((formSettings.minTopUpEmployee ?? 100000) * 2.5) / 1000 * 1000).toLocaleString('id-ID')}, Rp {((formSettings.minTopUpEmployee ?? 100000) * 3).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* PENGATURAN 3 GAMBAR FOTO BANNER IKLAN DI DASHBOARD MEMBER */}
            <BannerSettingsCard
              banners={formSettings.banners || []}
              onChange={(newBanners) => setFormSettings({ ...formSettings, banners: newBanners })}
            />

            {/* Jam Operasional & Kontak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Operasional</label>
                <input
                  type="text"
                  value={formSettings.openHours}
                  onChange={e => setFormSettings({ ...formSettings, openHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Kontak / CS</label>
                <input
                  type="text"
                  value={formSettings.contactPhone}
                  onChange={e => setFormSettings({ ...formSettings, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan Pengaturan
              </button>
            </div>

          </form>

        </div>
      )}

      {/* MODAL 1: PEMBATALAN TRANSAKSI (VOID / REFUND) */}
      {voidingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-black tracking-tight text-base">Konfirmasi Pembatalan Transaksi</h4>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Transaksi:</span>
                <span className="font-mono font-bold">{voidingTx.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold">{voidingTx.userName} ({voidingTx.memberNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span>{voidingTx.title}</span>
              </div>
              <div className="flex justify-between font-bold text-red-600 pt-1 border-t border-slate-200">
                <span>Nominal Pengembalian:</span>
                <span>Rp {voidingTx.amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Pembatalan Transaksi:
              </label>
              <select
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Kesalahan input jumlah tiket oleh petugas">Kesalahan input jumlah tiket oleh petugas</option>
                <option value="Pemindaian ganda tanpa sengaja (Double Scan)">Pemindaian ganda tanpa sengaja (Double Scan)</option>
                <option value="Kendala teknis gate scanner">Kendala teknis gate scanner</option>
                <option value="Permintaan pembatalan langsung pelanggan">Permintaan pembatalan langsung pelanggan</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Saldo sebesar Rp {voidingTx.amount.toLocaleString('id-ID')} akan otomatis dikembalikan ke akun member dan notifikasi push pembatalan akan dikirimkan secara real-time.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidingTx(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleExecuteVoidTransaction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-200 transition-colors"
              >
                Ya, Batalkan & Kembalikan Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST MEMBER BALANCE */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black tracking-tight text-base">Penyesuaian Saldo Member</h4>
              <button onClick={() => setSelectedUserForBalance(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="text-xs space-y-1">
              <p>Member: <strong className="text-slate-900">{selectedUserForBalance.name}</strong></p>
              <p className="font-mono text-blue-700 font-bold">{selectedUserForBalance.memberNumber}</p>
              <p>Saldo Saat Ini: <strong className="text-emerald-700">Rp {selectedUserForBalance.balance.toLocaleString('id-ID')}</strong></p>
            </div>

            <form onSubmit={handleExecuteBalanceAdjustment} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-colors ${
                    adjustType === 'add' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Saldo (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-colors ${
                    adjustType === 'deduct' ? 'bg-red-50 border-red-300 text-red-800' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Kurangi Saldo (-)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="contoh: 50000"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForBalance(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 transition-colors"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW MEMBER QR CODE */}
      {viewingUserQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-slate-100">
            <h4 className="font-black tracking-tight text-base text-slate-900">
              QR Member {viewingUserQR.user.name}
            </h4>
            <div className="p-3 border border-slate-200 rounded-2xl inline-block bg-white shadow-xs">
              <img src={viewingUserQR.qrUrl} alt="Member QR" className="w-56 h-56 object-contain" />
            </div>
            <p className="font-mono text-xs text-blue-700 font-bold">{viewingUserQR.user.memberNumber}</p>
            <div className="flex items-center justify-center gap-2 text-[11px]">
              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Token: {viewingUserQR.user.qrToken || 'TKN-DEFAULT'}
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                QR Statis
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Saldo: Rp {viewingUserQR.user.balance.toLocaleString('id-ID')}
            </p>
            <button
              onClick={() => setViewingUserQR(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: UBAH PERAN (ROLE) PENGGUNA */}
      {roleChangingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight text-base text-slate-900">
                    Ubah Peran (Role) Pengguna
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Atur hak akses akun di sistem SAMARAI PARK
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
              <p>Nama: <strong className="text-slate-900">{roleChangingUser.name}</strong></p>
              <p>No. Member: <strong className="font-mono text-blue-700">{roleChangingUser.memberNumber}</strong></p>
              <p>Peran Saat Ini: <strong className="text-slate-900 capitalize">{roleChangingUser.role}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Pilih Peran Baru:</label>
              
              <button
                type="button"
                onClick={() => {
                  updateUserRole(roleChangingUser.id, 'member');
                  setRoleChangingUser(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  roleChangingUser.role === 'member'
                    ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Member Pengunjung / Murid</div>
                  <div className="text-[11px] text-slate-500">
                    Akses Kartu QR masuk, top-up saldo tiket, pendaftaran kelas renang, dan riwayat kunjungan.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateUserRole(roleChangingUser.id, 'coach');
                  setRoleChangingUser(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  roleChangingUser.role === 'coach'
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Guru Les (Instruktur Renang)</div>
                  <div className="text-[11px] text-slate-500">
                    Akses Dasbor Guru Les, presensi absensi murid per sesi, update milestone materi renang, dan rekap honorarium mengajar.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateUserRole(roleChangingUser.id, 'gate');
                  setRoleChangingUser(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  roleChangingUser.role === 'gate'
                    ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Karyawan (Petugas Loket / Scanner)</div>
                  <div className="text-[11px] text-slate-500">
                    Akses pemindai QR tiket masuk, validasi tiket pengunjung, dan pembatalan tiket salah input.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateUserRole(roleChangingUser.id, 'admin');
                  setRoleChangingUser(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  roleChangingUser.role === 'admin'
                    ? 'bg-purple-50/80 border-purple-500 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Admin (Super Admin)</div>
                  <div className="text-[11px] text-slate-500">
                    Akses penuh Dasbor Manajemen, pemantauan trafik real-time, manajemen database, pembatalan tiket (Void), ekspor laporan & pengaturan kuota.
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setRoleChangingUser(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
