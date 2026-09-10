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

export const GateScanner: React.FC = () => {
  const {
    users,
    settings,
    scanEntryTicket,
    cancelTransaction,
    topUpBalance,
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

  // Top Up Modal state - strictly based on active Admin settings
  const minTopUpEmployee = typeof settings.minTopUpEmployee === 'number' && settings.minTopUpEmployee > 0
    ? settings.minTopUpEmployee
    : 100000;

  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [topUpUserId, setTopUpUserId] = useState<string>('');
  const [customTopUpAmount, setCustomTopUpAmount] = useState<string>(minTopUpEmployee.toString());
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState<'cash' | 'e_wallet' | 'bank_transfer'>('cash');
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string>('');

  // Mode pemilihan member pada Top Up: 'qr_scan' (default) atau 'manual' (dropdown)
  const [topUpSelectMode, setTopUpSelectMode] = useState<'qr_scan' | 'manual'>('qr_scan');
  const [qrScanInput, setQrScanInput] = useState<string>('');
  const [qrScanFeedback, setQrScanFeedback] = useState<string>('');
  const [scannedViaQR, setScannedViaQR] = useState<boolean>(false);

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

  const selectedTopUpMember = users.find(u => u.id === topUpUserId);

  const handleProcessScannedMemberQR = useCallback((rawQrString: string): boolean => {
    const trimmed = rawQrString.trim();
    if (!trimmed) return false;

    let memberId = '';
    // 0. Cek format COACH badge
    if (trimmed.startsWith('COACH:')) {
      const parts = trimmed.split(':');
      const foundCoach = users.find(u => u.id === parts[1] || u.memberNumber === parts[2]);
      if (foundCoach) memberId = foundCoach.id;
    }
    // 1. Coba dekripsi payload terenkripsi QR Samarai Park
    if (!memberId) {
      const verification = verifyAndDecodeQR(trimmed);
      if (verification.isValid && verification.payload) {
        memberId = verification.payload.mId;
      } else if (trimmed.toUpperCase().startsWith('SMP-')) {
        const found = users.find(u => u.memberNumber.toUpperCase() === trimmed.toUpperCase());
        if (found) memberId = found.id;
      } else {
        const found = users.find(
          u => u.id.toLowerCase() === trimmed.toLowerCase() || u.memberNumber.toLowerCase() === trimmed.toLowerCase()
        );
        if (found) memberId = found.id;
      }
    }

    if (memberId) {
      const targetMember = users.find(u => u.id === memberId && (u.role === 'member' || u.role === 'coach'));
      if (targetMember) {
        setTopUpUserId(targetMember.id);
        setScannedViaQR(true);
        setQrScanFeedback(`✓ Berhasil terdeteksi: ${targetMember.name} (${targetMember.memberNumber})`);
        setQrScanInput('');
        return true;
      }
    }

    setQrScanFeedback('⚠️ QR Code terbaca tetapi member tidak ditemukan dalam sistem.');
    return false;
  }, [users]);

  const handleSimulateScanMember = (member: typeof memberCandidates[0]) => {
    // Generate QR payload terenkripsi nyata persis seperti yang ada di layar HP member
    const payload = generateMemberQRPayload(member.id, member.memberNumber, member.qrToken);
    handleProcessScannedMemberQR(payload);
  };

  // Bersihkan input saat modal ditutup
  useEffect(() => {
    if (!isTopUpOpen) {
      setQrScanFeedback('');
      setQrScanInput('');
    }
  }, [isTopUpOpen]);

  const handleOpenTopUp = (targetUserId?: string) => {
    const defaultUser = targetUserId || lastScannedUserId || '';
    setTopUpUserId(defaultUser);
    setScannedViaQR(Boolean(targetUserId || lastScannedUserId));
    setTopUpSelectMode(defaultUser ? 'qr_scan' : 'qr_scan');
    setCustomTopUpAmount(minTopUpEmployee.toString());
    setTopUpSuccessMsg('');
    setQrScanFeedback(defaultUser ? 'Member terisi dari riwayat pemindaian gerbang.' : '');
    setIsTopUpOpen(true);
  };

  const handleConfirmTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseInt(customTopUpAmount, 10);
    if (!topUpUserId) {
      alert('Pilih member terlebih dahulu.');
      return;
    }
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Nominal top up tidak valid.');
      return;
    }
    if (finalAmount < minTopUpEmployee) {
      alert(`Nominal top up minimal Rp ${minTopUpEmployee.toLocaleString('id-ID')} (berdasarkan pengaturan Min. Top Up Karyawan Aktif).`);
      return;
    }

    const channelMap = {
      cash: 'Tunai di Loket Gerbang',
      e_wallet: 'QRIS Kasir Loket',
      bank_transfer: 'Transfer Bank (VA)',
    };

    const res = topUpBalance(topUpUserId, finalAmount, topUpPaymentMethod, channelMap[topUpPaymentMethod]);
    if (res.success) {
      const targetUser = users.find(u => u.id === topUpUserId);
      const newBal = (targetUser?.balance || 0) + finalAmount;
      setTopUpSuccessMsg(`Top Up Rp ${finalAmount.toLocaleString('id-ID')} berhasil untuk ${targetUser?.name || 'Member'}! Saldo sekarang: Rp ${newBal.toLocaleString('id-ID')}`);
      setTimeout(() => {
        setIsTopUpOpen(false);
        setTopUpSuccessMsg('');
      }, 1500);
    } else {
      alert(res.message);
    }
  };

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
      } else if (memberIdToUse.toUpperCase().startsWith('SMP-')) {
        // Find user by memberNumber
        const found = users.find(u => u.memberNumber.toUpperCase() === memberIdToUse.toUpperCase());
        if (found) memberIdToUse = found.id;
      } else {
        // Direct ID or memberNumber fallback match
        const found = users.find(
          u => u.id.toLowerCase() === memberIdToUse.toLowerCase() || u.memberNumber.toLowerCase() === memberIdToUse.toLowerCase()
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scanner Interface & Ticket Quantity Picker */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            
            {/* Step 1: Select Quantity */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    1. Pilih Jumlah Orang / Tiket
                  </label>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Tarif: <strong className="text-slate-900 font-bold">Rp {settings.ticketPrice.toLocaleString('id-ID')}</strong> / orang
                  </span>
                </div>

                {/* Tombol Top Up Saldo Member */}
                <button
                  type="button"
                  onClick={() => handleOpenTopUp()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
                  title="Isi saldo akun member di loket gerbang"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Top Up Saldo
                </button>
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
                  placeholder="Atau gunakan barcode scanner fisik / ketik No. Member (cth: SMP-2025-0811)..."
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
                            onClick={() => handleOpenTopUp(m.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                            title={`Top up saldo untuk ${m.name}`}
                          >
                            + Top Up
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
                    onClick={() => handleOpenTopUp(lastScannedUserId || undefined)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    Top Up Saldo Member Sekarang
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

      {/* MODAL: TOP UP SALDO MEMBER DI LOKET */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-slate-900 animate-scale-in">
            {/* Header */}
            <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight leading-tight">Top Up Saldo Member</h3>
                  <p className="text-xs text-emerald-100 font-medium">Pengisian saldo instan di pintu masuk / loket</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {topUpSuccessMsg ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5 animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-900">Transaksi Berhasil!</h4>
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">{topUpSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmTopUp} className="space-y-4">
                  {/* 1. Pilih Member (Bisa dengan Scan QR Member atau Manual) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        1. Pilih Member Penerima Saldo
                      </label>
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setTopUpSelectMode('qr_scan');
                            setQrScanFeedback('');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            topUpSelectMode === 'qr_scan'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Scan QR Member
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTopUpSelectMode('manual');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            topUpSelectMode === 'manual'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Pilih Daftar
                        </button>
                      </div>
                    </div>

                    {/* Jika Member Sudah Terpilih (baik dari Scan QR maupun Manual) */}
                    {selectedTopUpMember && (
                      <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 animate-fade-in shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {selectedTopUpMember.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-900 text-xs truncate">
                                {selectedTopUpMember.name}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {scannedViaQR ? '✓ Terverifikasi via QR' : '✓ Terpilih'}
                              </span>
                            </div>
                            <span className="text-[10px] text-blue-600 font-mono font-bold block">
                              {selectedTopUpMember.memberNumber}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            Saldo Saat Ini
                          </span>
                          <span className="font-black text-emerald-700 text-xs">
                            Rp {selectedTopUpMember.balance.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* MODE 1: SCAN QR MEMBER */}
                    {topUpSelectMode === 'qr_scan' && (
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                        {/* Area Pemindai Kamera Aktif dengan WebRTC & jsQR */}
                        <QRCameraScanner
                          onScan={code => handleProcessScannedMemberQR(code)}
                          title="Pemindai Kamera Loket Top Up"
                          subtitle="Arahkan kartu QR atau layar HP member ke kamera"
                          accentColor="emerald"
                          autoCloseOnSuccess={true}
                          minHeight="min-h-[220px]"
                        />

                        {/* Input Pemindai Barcode Fisik / Paste Token QR / No. Member */}
                        <div className="pt-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Atau Gunakan Barcode Scanner / Ketik No. Member:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={qrScanInput}
                              onChange={e => setQrScanInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleProcessScannedMemberQR(qrScanInput);
                                }
                              }}
                              placeholder="Ketik No. Member (cth: SMP-2025-0811) atau paste token..."
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleProcessScannedMemberQR(qrScanInput)}
                              disabled={!qrScanInput.trim()}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                            >
                              Cari
                            </button>
                          </div>
                        </div>

                        {/* Pesan Feedback Pemindaian */}
                        {qrScanFeedback && (
                          <div
                            className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                              qrScanFeedback.startsWith('✓')
                                ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {qrScanFeedback.startsWith('✓') ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span className="truncate">{qrScanFeedback}</span>
                          </div>
                        )}

                        {/* Pilih Cepat Member Aktif */}
                        <div className="pt-1 border-t border-slate-200/70">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                            Pilih Langsung dari List Member:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {memberCandidates.slice(0, 4).map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSimulateScanMember(m)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  topUpUserId === m.id
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                    : 'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700'
                                }`}
                                title={`Simulasi scan QR untuk ${m.name}`}
                              >
                                <QrCode className="w-3 h-3" />
                                {m.name.split(' ')[0]} ({m.memberNumber.split('-')[2] || m.memberNumber})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: PILIH DARI DAFTAR DROPDOWN */}
                    {topUpSelectMode === 'manual' && (
                      <div className="space-y-1">
                        <select
                          value={topUpUserId}
                          onChange={e => {
                            setTopUpUserId(e.target.value);
                            setScannedViaQR(false);
                          }}
                          required
                          className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                        >
                          <option value="">-- Pilih Member dari Daftar --</option>
                          {memberCandidates.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.memberNumber}) - Saldo: Rp {m.balance.toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. Metode Pembayaran */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Metode Pembayaran di Loket
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTopUpPaymentMethod('cash')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          topUpPaymentMethod === 'cash'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Tunai / Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopUpPaymentMethod('e_wallet')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          topUpPaymentMethod === 'e_wallet'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-blue-600" />
                        QRIS Kasir
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopUpPaymentMethod('bank_transfer')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          topUpPaymentMethod === 'bank_transfer'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Transfer Bank
                      </button>
                    </div>
                  </div>

                  {/* 3. Input Nominal Top Up */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Nominal Top Up
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Min. Rp {minTopUpEmployee.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min={minTopUpEmployee}
                        step="1000"
                        placeholder={`Masukkan nominal top up (Min. Rp ${minTopUpEmployee.toLocaleString('id-ID')})...`}
                        value={customTopUpAmount}
                        onChange={e => setCustomTopUpAmount(e.target.value)}
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 text-xs font-bold border rounded-xl focus:ring-2 focus:outline-hidden ${
                          customTopUpAmount && parseInt(customTopUpAmount, 10) < minTopUpEmployee
                            ? 'border-red-300 bg-red-50/40 text-red-900 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-emerald-500 bg-white'
                        }`}
                      />
                    </div>
                    {customTopUpAmount && parseInt(customTopUpAmount, 10) < minTopUpEmployee && (
                      <p className="text-[11px] font-bold text-red-600 animate-fade-in">
                        ⚠️ Nominal top up minimal Rp {minTopUpEmployee.toLocaleString('id-ID')} (berdasarkan pengaturan Min. Top Up Karyawan Aktif).
                      </p>
                    )}
                  </div>

                  {/* Kalkulasi Ringkasan */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-500">
                      <span>Saldo Saat Ini:</span>
                      <span className="font-semibold text-slate-700">
                        Rp {(selectedTopUpMember?.balance || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Nominal Top Up:</span>
                      <span className="font-bold text-emerald-600">
                        +Rp {(parseInt(customTopUpAmount, 10) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between font-black pt-1.5 border-t border-slate-200 text-slate-900">
                      <span>Saldo Akhir:</span>
                      <span className="text-emerald-700 font-black">
                        Rp {((selectedTopUpMember?.balance || 0) + (parseInt(customTopUpAmount, 10) || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTopUpOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={Boolean(customTopUpAmount && parseInt(customTopUpAmount, 10) < minTopUpEmployee)}
                      className={`flex-2 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                        customTopUpAmount && parseInt(customTopUpAmount, 10) < minTopUpEmployee
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Konfirmasi Top Up
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
