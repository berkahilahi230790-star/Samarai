import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  RefreshCw,
  Undo2,
  Sparkles,
  ArrowRight,
  User,
  CreditCard,
  Lock,
  Volume2,
  Plus,
  Minus,
  Wallet,
  Banknote,
  QrCode,
  Camera,
  CameraOff,
  Upload,
  Search,
  Check,
} from 'lucide-react';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';
import { verifyAndDecodeQR, generateMemberQRPayload } from '../../utils/encryption';
import { Transaction } from '../../types';
import { QRCameraScanner } from './QRCameraScanner';
import { GateTopUpPage } from './GateTopUpPage';

export const GateScanner: React.FC = () => {
  const {
    users,
    settings,
    scanEntryTicket,
    cancelTransaction,
  } = useApp();

  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [manualInputCode, setManualInputCode] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: {
      memberName: string;
      memberNumber: string;
      tickets: number;
      totalDeducted: number;
      remainingBalance: number;
      txId: string;
      txCode: string;
      securityHash: string;
    };
  }>({ status: 'idle', message: '' });

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedUserId, setLastScannedUserId] = useState<string>('');

  // Sub-halaman Karyawan: 'scan' (Scan Pembayaran Tiket) atau 'topup' (Halaman Top Up Saldo Terpisah)
  const [activeSubPage, setActiveSubPage] = useState<'scan' | 'topup'>('scan');
  const [preselectedTopUpUserId, setPreselectedTopUpUserId] = useState<string>('');

  const navigateToTopUp = (targetUserId?: string) => {
    setPreselectedTopUpUserId(targetUserId || lastScannedUserId || '');
    setActiveSubPage('topup');
  };

  // State pencarian list nama member
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // Active member candidates for list nama member
  const memberCandidates = useMemo(() => users.filter(u => u.role === 'member'), [users]);

  const filteredMemberCandidates = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    if (!query) return memberCandidates;
    return memberCandidates.filter(
      m => m.name.toLowerCase().includes(query) || m.memberNumber.toLowerCase().includes(query)
    );
  }, [memberCandidates, memberSearchQuery]);

  const renderNavigationTabs = () => (
    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
          SP
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Portal Karyawan & Loket Gerbang
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeSubPage === 'scan'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {activeSubPage === 'scan' ? 'Mode Pintu Masuk' : 'Mode Loket Kasir'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Navigasi antara pemindaian tiket masuk dan halaman loket pengisian saldo member
          </p>
        </div>
      </div>

      {/* Navigasi Tab Jelas */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubPage('scan')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubPage === 'scan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Scan Pembayaran Tiket</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToTopUp()}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubPage === 'topup'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Top Up Saldo Loket</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
        </button>
      </div>
    </div>
  );

  const executeScan = (rawPayloadOrId: string) => {
    setIsProcessing(true);
    setScanResult({ status: 'idle', message: '' });

    setTimeout(() => {
      let memberIdToUse = rawPayloadOrId.trim();

      // Check if it is a Coach Badge QR
      if (memberIdToUse.startsWith('COACH:')) {
        const parts = memberIdToUse.split(':');
        const foundCoach = users.find(u => u.id === parts[1] || u.memberNumber === parts[2]);
        if (foundCoach) memberIdToUse = foundCoach.id;
      }

      // Check if it is an encrypted base64 payload
      const verification = verifyAndDecodeQR(memberIdToUse);
      if (verification.isValid && verification.payload) {
        memberIdToUse = verification.payload.mId;
        // Verify if member token was refreshed and no longer matches
        const scannedMember = users.find(u => u.id === memberIdToUse);
        if (
          scannedMember?.qrToken &&
          verification.payload.nonce &&
          scannedMember.qrToken !== verification.payload.nonce
        ) {
          setIsProcessing(false);
          setScanResult({
            status: 'error',
            message: 'Token QR Code ini sudah usang karena member telah me-refresh token. Silakan minta member membuka QR Code terbaru.',
          });
          return;
        }
      } else if (memberIdToUse.toUpperCase().startsWith('SMP')) {
        // Find user by memberNumber (support both SMP20250811 and SMP-2025-0811)
        const cleanQuery = memberIdToUse.toUpperCase().replace(/-/g, '');
        const found = users.find(
          u =>
            u.memberNumber.toUpperCase() === memberIdToUse.toUpperCase() ||
            u.memberNumber.toUpperCase().replace(/-/g, '') === cleanQuery
        );
        if (found) memberIdToUse = found.id;
      } else {
        // Direct ID, memberNumber, or Name fallback match
        const cleanQuery = memberIdToUse.toLowerCase().replace(/-/g, '');
        const found = users.find(
          u =>
            u.id.toLowerCase() === memberIdToUse.toLowerCase() ||
            u.memberNumber.toLowerCase() === memberIdToUse.toLowerCase() ||
            u.memberNumber.toLowerCase().replace(/-/g, '') === cleanQuery ||
            u.name.toLowerCase() === memberIdToUse.toLowerCase() ||
            u.name.toLowerCase().includes(memberIdToUse.toLowerCase())
        );
        if (found) memberIdToUse = found.id;
      }

      const result = scanEntryTicket(memberIdToUse, ticketQuantity);
      setIsProcessing(false);

      if (result.success && result.transaction && result.member) {
        setLastTransaction(result.transaction);
        setScanResult({
          status: 'success',
          message: result.message,
          details: {
            memberName: result.member.name,
            memberNumber: result.member.memberNumber,
            tickets: ticketQuantity,
            totalDeducted: result.transaction.amount,
            remainingBalance: result.remainingBalance || 0,
            txId: result.transaction.id,
            txCode: result.transaction.code,
            securityHash: result.transaction.securityHash,
          },
        });
        setManualInputCode('');
      } else {
        setLastScannedUserId(memberIdToUse);
        setScanResult({
          status: 'error',
          message: result.message || 'Pemindaian gagal.',
        });
      }
    }, 450);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputCode.trim()) return;
    executeScan(manualInputCode);
  };

  const handleSimulateMemberQR = (memberId: string, memberNumber: string) => {
    // Generate valid static signed QR payload using member's current token
    const user = users.find(u => u.id === memberId);
    const signedPayload = generateMemberQRPayload(
      memberId,
      memberNumber,
      user?.qrToken,
      user?.qrTokenUpdatedAt ? new Date(user.qrTokenUpdatedAt).getTime() : undefined
    );
    executeScan(signedPayload);
  };

  const handleUndoLastScan = () => {
    if (!lastTransaction) return;
    const res = cancelTransaction(lastTransaction.id, 'Kesalahan input jumlah tiket oleh karyawan loket');
    if (res.success) {
      setScanResult({
        status: 'idle',
        message: `Transaksi ${lastTransaction.code} berhasil dibatalkan. Saldo telah dikembalikan ke member.`,
      });
      setLastTransaction(null);
    } else {
      alert(res.message);
    }
  };

  const totalCost = ticketQuantity * settings.ticketPrice;

  // Render Sub-halaman Top Up Saldo jika aktif
  if (activeSubPage === 'topup') {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {renderNavigationTabs()}
        <GateTopUpPage
          initialMemberId={preselectedTopUpUserId}
          onBackToScan={() => setActiveSubPage('scan')}
        />
      </div>
    );
  }

  // Render Halaman Scan Pembayaran Tiket
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Navigasi Utama Karyawan */}
      {renderNavigationTabs()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scanner Interface & Ticket Quantity Picker */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            
            {/* Step 1: Select Quantity */}
            <div>
              <div className="mb-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  1. Pilih Jumlah Orang / Tiket
                </label>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  Tarif: <strong className="text-slate-900 font-bold">Rp {settings.ticketPrice.toLocaleString('id-ID')}</strong> / orang
                </span>
              </div>

              <div className="space-y-3">
                {/* Quick Selection Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 5, 10, 15, 20, 30].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTicketQuantity(qty)}
                      className={`py-2.5 rounded-2xl font-bold text-xs transition-all border ${
                        ticketQuantity === qty
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {qty} Orang
                    </button>
                  ))}
                </div>

                {/* Direct Number Input Field */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <label htmlFor="ticket-quantity-input" className="text-xs font-bold text-slate-800 block">
                      Input Angka Jumlah Orang
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Ketik angka bebas jika rombongan lebih banyak
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(prev => Math.max(1, prev - 1))}
                      disabled={ticketQuantity <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Kurangi 1 orang"
                      aria-label="Kurangi 1 orang"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex items-center px-1">
                      <input
                        id="ticket-quantity-input"
                        type="number"
                        min={1}
                        max={999}
                        value={ticketQuantity}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            setTicketQuantity(val);
                          } else if (e.target.value === '') {
                            setTicketQuantity(1);
                          }
                        }}
                        className="w-16 py-1 text-center font-black text-slate-900 text-sm focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                      />
                      <span className="text-[11px] font-bold text-slate-400 select-none pr-1">
                        Orang
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(prev => prev + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors"
                      title="Tambah 1 orang"
                      aria-label="Tambah 1 orang"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Calculation Preview */}
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Total Biaya Masuk ({ticketQuantity} tiket × Rp {settings.ticketPrice.toLocaleString('id-ID')}):
                </span>
                <span className="font-black text-base text-slate-900 tracking-tight">
                  Rp {totalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Step 2: Scan / Input QR Payload */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-blue-600" />
                  2. Pemindai Kamera Langsung / Input Kode Member
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Webcam Laptop & HP Aktif
                </span>
              </div>

              {/* Real-time WebRTC QR Camera Scanner */}
              <QRCameraScanner
                onScan={code => executeScan(code)}
                title="Pemindai Kamera Gerbang Masuk"
                subtitle="Arahkan QR Code Tiket Member di HP ke kamera untuk validasi & buka gerbang otomatis"
                accentColor="blue"
                minHeight="min-h-[260px]"
              />

              {/* Manual code input fallback */}
              <form onSubmit={handleManualScanSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Atau gunakan barcode scanner / ketik Nama atau No. Member (cth: Budi / SMP20250811)..."
                  value={manualInputCode}
                  onChange={e => setManualInputCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualInputCode.trim()}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-colors shrink-0 cursor-pointer"
                >
                  {isProcessing ? 'Memeriksa...' : 'Validasi'}
                </button>
              </form>
            </div>

            {/* List Nama Member Terdaftar */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900 tracking-tight">
                    List Nama Member
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                    {memberCandidates.length} Terdaftar
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama / No. Member..."
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-full sm:w-52 transition-all font-medium"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
                      title="Hapus pencarian"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable list of member cards */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredMemberCandidates.length > 0 ? (
                  filteredMemberCandidates.map(m => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {m.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono font-medium text-slate-400">{m.memberNumber}</span>
                            {m.membershipType && (
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium text-[9px]">
                                {m.membershipType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Saldo & Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Saldo</span>
                          <span className="text-xs font-black text-emerald-600 font-mono">
                            Rp {m.balance.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSimulateMemberQR(m.id, m.memberNumber)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-[11px] font-bold shadow-xs shadow-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                            title={`Validasi masuk gate untuk ${m.name}`}
                          >
                            <ScanLine className="w-3 h-3" />
                            <span>Pindai Masuk</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigateToTopUp(m.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title={`Top up saldo untuk ${m.name}`}
                          >
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            <span>+ Top Up</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Tidak ditemukan member dengan nama atau ID "{memberSearchQuery}".
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Real-time Scan Result, Barrier Status & Undo */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Result Feedback Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Status Pemindaian Karyawan
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  scanResult.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  scanResult.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {scanResult.status === 'success' ? 'PINTU TERBUKA' :
                   scanResult.status === 'error' ? 'AKSES DITOLAK' : 'MENUNGGU SCAN'}
                </span>
              </div>

              {scanResult.status === 'idle' && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <ScanLine className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">
                    Siap Memindai QR Member
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
                    Pilih jumlah orang, lalu scan QR code unik member atau gunakan tombol uji coba di samping.
                  </p>
                </div>
              )}

              {scanResult.status === 'success' && scanResult.details && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Akses Diberikan • Saldo Berhasil Dipotong
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                        {scanResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Transaction breakdown */}
                  <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Nama Member:</span>
                      <span className="font-bold text-slate-900">{scanResult.details.memberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Nomor Member:</span>
                      <span className="font-mono text-blue-600 font-bold">{scanResult.details.memberNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Jumlah Tiket:</span>
                      <span className="font-bold text-slate-800">{scanResult.details.tickets} Orang</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Total Potongan Saldo:</span>
                      <span className="font-bold text-red-500">-Rp {scanResult.details.totalDeducted.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-400 font-medium">Sisa Saldo Member:</span>
                      <span className="font-bold text-emerald-600">Rp {scanResult.details.remainingBalance.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-[9px] text-slate-400 block font-medium">Verifikasi Enkripsi Digital:</span>
                      <span className="text-[9px] font-mono text-slate-500 break-all bg-white p-1 rounded-lg border border-slate-200 block">
                        {scanResult.details.securityHash}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {scanResult.status === 'error' && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    Peringatan Akses Masuk
                  </div>
                  <p className="text-xs leading-relaxed text-red-800 font-medium">
                    {scanResult.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateToTopUp(lastScannedUserId || undefined)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    Buka Halaman Top Up Saldo Member Ini →
                  </button>
                </div>
              )}
            </div>

            {/* Quick Undo / Void Button */}
            {lastTransaction && scanResult.status === 'success' && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUndoLastScan}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4 text-amber-700" />
                  Batalkan Transaksi Terakhir (Koreksi Salah Input)
                </button>
                <span className="text-[10px] text-slate-400 block text-center mt-1 font-medium">
                  Saldo Rp {lastTransaction.amount.toLocaleString('id-ID')} akan otomatis dikembalikan ke akun member.
                </span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
