import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowLeft,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Users,
  QrCode,
  Banknote,
  CreditCard,
  Search,
  Check,
  Printer,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { verifyAndDecodeQR, generateMemberQRPayload } from '../../utils/encryption';
import { QRCameraScanner } from './QRCameraScanner';
import { Transaction } from '../../types';

interface GateTopUpPageProps {
  initialMemberId?: string;
  onBackToScan: () => void;
}

export const GateTopUpPage: React.FC<GateTopUpPageProps> = ({
  initialMemberId = '',
  onBackToScan,
}) => {
  const { users, settings, topUpBalance, transactions } = useApp();

  // Batas Minimal Top Up dari pengaturan Admin
  const minTopUpEmployee =
    typeof settings.minTopUpEmployee === 'number' && settings.minTopUpEmployee > 0
      ? settings.minTopUpEmployee
      : 100000;

  const [topUpUserId, setTopUpUserId] = useState<string>(initialMemberId);
  const [customTopUpAmount, setCustomTopUpAmount] = useState<string>(minTopUpEmployee.toString());
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState<'cash' | 'e_wallet' | 'bank_transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    txCode: string;
    memberName: string;
    memberNumber: string;
    amount: number;
    paymentMethod: string;
    oldBalance: number;
    newBalance: number;
    timestamp: string;
  } | null>(null);

  // Mode identifikasi member: 'qr_scan' atau 'manual'
  const [selectMode, setSelectMode] = useState<'qr_scan' | 'manual'>(initialMemberId ? 'manual' : 'qr_scan');
  const [qrScanInput, setQrScanInput] = useState<string>('');
  const [qrScanFeedback, setQrScanFeedback] = useState<string>('');
  const [scannedViaQR, setScannedViaQR] = useState<boolean>(Boolean(initialMemberId));
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // Daftar member aktif
  const memberCandidates = useMemo(() => users.filter(u => u.role === 'member'), [users]);

  const filteredMemberCandidates = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    if (!query) return memberCandidates;
    return memberCandidates.filter(
      m => m.name.toLowerCase().includes(query) || m.memberNumber.toLowerCase().includes(query)
    );
  }, [memberCandidates, memberSearchQuery]);

  const selectedMember = users.find(u => u.id === topUpUserId);

  // Sinkronisasi jika initialMemberId berubah
  useEffect(() => {
    if (initialMemberId) {
      setTopUpUserId(initialMemberId);
      setScannedViaQR(true);
      setSelectMode('manual');
    }
  }, [initialMemberId]);

  // Handler dekripsi & pemindaian QR Member
  const handleProcessScannedMemberQR = useCallback(
    (rawQrString: string): boolean => {
      const trimmed = rawQrString.trim();
      if (!trimmed) return false;

      let memberId = '';
      if (trimmed.startsWith('COACH:')) {
        const parts = trimmed.split(':');
        const foundCoach = users.find(u => u.id === parts[1] || u.memberNumber === parts[2]);
        if (foundCoach) memberId = foundCoach.id;
      }

      if (!memberId) {
        const verification = verifyAndDecodeQR(trimmed);
        if (verification.isValid && verification.payload) {
          memberId = verification.payload.mId;
        } else if (trimmed.toUpperCase().startsWith('SMP')) {
          const cleanQuery = trimmed.toUpperCase().replace(/-/g, '');
          const found = users.find(
            u =>
              u.memberNumber.toUpperCase() === trimmed.toUpperCase() ||
              u.memberNumber.toUpperCase().replace(/-/g, '') === cleanQuery
          );
          if (found) memberId = found.id;
        } else {
          const cleanQuery = trimmed.toLowerCase().replace(/-/g, '');
          const found = users.find(
            u =>
              u.id.toLowerCase() === trimmed.toLowerCase() ||
              u.memberNumber.toLowerCase() === trimmed.toLowerCase() ||
              u.memberNumber.toLowerCase().replace(/-/g, '') === cleanQuery ||
              u.name.toLowerCase() === trimmed.toLowerCase() ||
              u.name.toLowerCase().includes(trimmed.toLowerCase())
          );
          if (found) memberId = found.id;
        }
      }

      if (memberId) {
        const targetMember = users.find(
          u => u.id === memberId && (u.role === 'member' || u.role === 'coach')
        );
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
    },
    [users]
  );

  const handleSimulateScanMember = (m: (typeof memberCandidates)[0]) => {
    const payload = generateMemberQRPayload(m.id, m.memberNumber, m.qrToken);
    handleProcessScannedMemberQR(payload);
  };

  // Preset nominal top up dinamis berbasis minTopUpEmployee
  const presetAmounts = useMemo(() => {
    const base = minTopUpEmployee;
    return [
      base,
      Math.round(base * 1.5 / 10000) * 10000 || base + 50000,
      base * 2,
      base * 2.5,
      base * 3,
      base * 5,
    ].filter((val, idx, self) => self.indexOf(val) === idx);
  }, [minTopUpEmployee]);

  // Handler Submit Top Up
  const handleConfirmTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpUserId || !selectedMember) {
      alert('Silakan pilih member penerima saldo terlebih dahulu.');
      return;
    }

    const finalAmount = parseInt(customTopUpAmount, 10);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Nominal top up tidak valid.');
      return;
    }

    if (finalAmount < minTopUpEmployee) {
      alert(
        `Nominal top up minimal Rp ${minTopUpEmployee.toLocaleString(
          'id-ID'
        )} (berdasarkan pengaturan Min. Top Up Karyawan Aktif).`
      );
      return;
    }

    setIsProcessing(true);

    const channelMap = {
      cash: 'Tunai di Loket Kasir Gerbang',
      e_wallet: 'QRIS Kasir Loket',
      bank_transfer: 'Transfer Bank (VA Kasir)',
    };

    const oldBal = selectedMember.balance;

    setTimeout(() => {
      const res = topUpBalance(
        topUpUserId,
        finalAmount,
        topUpPaymentMethod,
        channelMap[topUpPaymentMethod]
      );
      setIsProcessing(false);

      if (res.success) {
        setSuccessReceipt({
          txCode: `TOP-${Date.now().toString().slice(-8)}`,
          memberName: selectedMember.name,
          memberNumber: selectedMember.memberNumber,
          amount: finalAmount,
          paymentMethod: channelMap[topUpPaymentMethod],
          oldBalance: oldBal,
          newBalance: oldBal + finalAmount,
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        });
      } else {
        alert(res.message || 'Gagal memproses top up.');
      }
    }, 450);
  };

  const handleResetForNewTopUp = () => {
    setSuccessReceipt(null);
    setTopUpUserId('');
    setScannedViaQR(false);
    setQrScanFeedback('');
    setQrScanInput('');
    setCustomTopUpAmount(minTopUpEmployee.toString());
  };

  // Daftar mutasi top up loket terkini
  const recentTopUps = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'top_up')
      .slice(0, 8);
  }, [transactions]);

  const parsedAmount = parseInt(customTopUpAmount, 10) || 0;
  const isAmountValid = parsedAmount >= minTopUpEmployee;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Top Up Saldo */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            
            {/* Header Form */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                  Layanan Kasir Loket
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Formulir Tambah Saldo Akun Member
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Min. Top Up Rp {minTopUpEmployee.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Sukses / Struk Transaksi */}
            {successReceipt ? (
              <div className="p-6 rounded-3xl bg-emerald-50/90 border border-emerald-200 text-center space-y-5 animate-scale-in shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Transaksi Sukses
                  </span>
                  <h4 className="text-xl font-black text-emerald-950 tracking-tight mt-0.5">
                    Saldo Berhasil Ditambahkan!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Member sekarang dapat langsung menggunakan saldonya untuk tap masuk gerbang.
                  </p>
                </div>

                {/* Struk Rincian */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 text-left text-xs space-y-2.5 shadow-2xs">
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Kode Transaksi:</span>
                    <span className="font-mono font-bold text-slate-800">{successReceipt.txCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Member:</span>
                    <span className="font-bold text-slate-900">{successReceipt.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Member:</span>
                    <span className="font-mono font-bold text-blue-600">{successReceipt.memberNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-bold text-slate-800">{successReceipt.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu:</span>
                    <span className="font-medium text-slate-600">{successReceipt.timestamp} WIB</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Saldo Sebelumnya:</span>
                    <span className="font-semibold text-slate-700">
                      Rp {successReceipt.oldBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Nominal Ditambahkan:</span>
                    <span>+Rp {successReceipt.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 text-sm font-black text-emerald-900">
                    <span>Saldo Akhir Member:</span>
                    <span>Rp {successReceipt.newBalance.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Tombol Aksi Struk */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Cetak Struk Loket</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForNewTopUp}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Top Up Member Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToScan}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs shadow-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Scan Tiket Masuk</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmTopUp} className="space-y-6">
                
                {/* 1. Pemilihan Member */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      1. Identifikasi Member Penerima Saldo
                    </label>

                    {/* Mode Switcher */}
                    <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectMode('qr_scan');
                          setQrScanFeedback('');
                        }}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectMode === 'qr_scan'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Kamera / Scan QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectMode('manual')}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectMode === 'manual'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Daftar Member</span>
                      </button>
                    </div>
                  </div>

                  {/* Kartu Member Terpilih */}
                  {selectedMember && (
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedMember.avatarUrl ? (
                          <img
                            src={selectedMember.avatarUrl}
                            alt={selectedMember.name}
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                            {selectedMember.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm truncate">
                              {selectedMember.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {scannedViaQR ? '✓ Terverifikasi via QR' : '✓ Member Terpilih'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-blue-600">{selectedMember.memberNumber}</span>
                            {selectedMember.membershipType && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                                {selectedMember.membershipType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60 shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Saldo Saat Ini
                        </span>
                        <span className="font-black text-emerald-700 text-base font-mono">
                          Rp {selectedMember.balance.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mode 1: Pemindai Kamera & Input Barcode */}
                  {selectMode === 'qr_scan' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <QRCameraScanner
                        onScan={code => handleProcessScannedMemberQR(code)}
                        title="Pemindai Kamera Loket Top Up"
                        subtitle="Arahkan QR badge atau layar HP member ke kamera loket"
                        accentColor="emerald"
                        autoCloseOnSuccess={true}
                        minHeight="min-h-[220px]"
                      />

                      <div className="pt-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Atau Gunakan Barcode Scanner / Cari Nama / No. Member:
                        </label>
                        <div className="flex gap-2">
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
                            placeholder="Ketik Nama Member (cth: Budi) atau No. Member (cth: SMP20250811)..."
                            className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleProcessScannedMemberQR(qrScanInput)}
                            disabled={!qrScanInput.trim()}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                          >
                            Cari
                          </button>
                        </div>
                      </div>

                      {qrScanFeedback && (
                        <div
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                            qrScanFeedback.startsWith('✓')
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {qrScanFeedback.startsWith('✓') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>{qrScanFeedback}</span>
                        </div>
                      )}

                      {/* Simulasi scan cepat */}
                      <div className="pt-2 border-t border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                          Simulasi Cepat dari List Member:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {memberCandidates.slice(0, 5).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSimulateScanMember(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                topUpUserId === m.id
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 hover:bg-emerald-50 text-slate-700'
                              }`}
                            >
                              <QrCode className="w-3 h-3" />
                              <span>{m.name.split(' ')[0]} ({m.memberNumber.slice(-4)})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Searchable Member List */}
                  {selectMode === 'manual' && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Ketik nama member atau nomor kartu..."
                          value={memberSearchQuery}
                          onChange={e => setMemberSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                        {memberSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMemberSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-5 h-5 flex items-center justify-center cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {filteredMemberCandidates.length > 0 ? (
                          filteredMemberCandidates.map(m => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setTopUpUserId(m.id);
                                setScannedViaQR(false);
                              }}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                topUpUserId === m.id
                                  ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">{m.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{m.memberNumber}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 block">Saldo</span>
                                <span className="text-xs font-black text-emerald-600 font-mono">
                                  Rp {m.balance.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            Tidak ada member yang cocok dengan "{memberSearchQuery}".
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Metode Pembayaran di Loket */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    2. Metode Pembayaran Diterima di Loket
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTopUpPaymentMethod('cash')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        topUpPaymentMethod === 'cash'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>Tunai / Cash</span>
                      <span className="text-[9px] font-semibold text-slate-400">Kasir Loket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopUpPaymentMethod('e_wallet')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        topUpPaymentMethod === 'e_wallet'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-blue-600" />
                      <span>QRIS Kasir</span>
                      <span className="text-[9px] font-semibold text-slate-400">Scan Statis/Dinamis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopUpPaymentMethod('bank_transfer')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        topUpPaymentMethod === 'bank_transfer'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <span>Transfer Bank</span>
                      <span className="text-[9px] font-semibold text-slate-400">BCA/Mandiri/BRI</span>
                    </button>
                  </div>
                </div>

                {/* 3. Pilihan & Input Nominal Top Up */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      3. Masukkan Nominal Saldo
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Min. Rp {minTopUpEmployee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Tombol Nominal Cepat */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {presetAmounts.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomTopUpAmount(amt.toString())}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customTopUpAmount === amt.toString()
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-emerald-50/50 text-slate-700'
                        }`}
                      >
                        Rp {(amt / 1000).toLocaleString('id-ID')}k
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input */}
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={minTopUpEmployee}
                      step="1000"
                      value={customTopUpAmount}
                      onChange={e => setCustomTopUpAmount(e.target.value)}
                      placeholder={`Masukkan nominal top up (Min. Rp ${minTopUpEmployee.toLocaleString('id-ID')})...`}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm font-bold border rounded-xl focus:ring-2 focus:outline-hidden ${
                        customTopUpAmount && !isAmountValid
                          ? 'border-red-300 bg-red-50/40 text-red-900 focus:ring-red-500'
                          : 'border-slate-200 focus:ring-emerald-500 bg-white'
                      }`}
                      required
                    />
                  </div>

                  {customTopUpAmount && !isAmountValid && (
                    <p className="text-xs font-bold text-red-600 animate-fade-in flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Nominal minimal top up adalah Rp {minTopUpEmployee.toLocaleString('id-ID')} (berdasarkan input ketentuan Admin).
                      </span>
                    </p>
                  )}
                </div>

                {/* 4. Kalkulasi Ringkasan Transaksi */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Member Terpilih:</span>
                    <span className="font-bold text-slate-900">
                      {selectedMember ? selectedMember.name : '— Belum dipilih —'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Saldo Saat Ini:</span>
                    <span className="font-semibold text-slate-700">
                      Rp {(selectedMember?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Nominal Tambah Saldo:</span>
                    <span className="font-black text-emerald-600">
                      +Rp {parsedAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-black pt-2 border-t border-slate-200 text-sm text-slate-900">
                    <span>Saldo Akhir Member:</span>
                    <span className="text-emerald-700 font-black">
                      Rp {((selectedMember?.balance || 0) + parsedAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Tombol Eksekusi Top Up */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onBackToScan}
                    className="py-3 px-4 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal & Kembali
                  </button>

                  <button
                    type="submit"
                    disabled={!selectedMember || !isAmountValid || isProcessing}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                      !selectedMember || !isAmountValid || isProcessing
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-200 cursor-pointer'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memproses Top Up...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Konfirmasi & Tambahkan Saldo</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>

        {/* Right Column: Panduan Kasir Loket & Riwayat Mutasi Top Up */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Petunjuk Operasional Loket */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">SOP Kasir Top Up Loket</h4>
                <p className="text-xs text-slate-500">Panduan pengisian saldo gerbang</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block">Scan Kartu / QR HP Member</strong>
                  Arahkan QR Code Member ke kamera loket atau cari nama/No. Member pada pencarian.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block">Terima Pembayaran</strong>
                  Pastikan uang fisik diterima (untuk tunai) atau notifikasi QRIS kasir berhasil masuk.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block">Auto-Sync Masuk Gerbang</strong>
                  Setelah top up sukses, klik <em>"Scan Tiket Masuk"</em> untuk langsung memvalidasi tiket masuk member.
                </div>
              </div>
            </div>

            {/* Quick Action Link to Scan */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToScan}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ScanLine className="w-4 h-4 text-blue-400" />
                <span>Buka Halaman Scan Pembayaran Tiket</span>
              </button>
            </div>
          </div>

          {/* Riwayat Mutasi Top Up Loket */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Riwayat Top Up Loket Terkini
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {recentTopUps.length} Transaksi
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentTopUps.length > 0 ? (
                recentTopUps.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{tx.userName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">{tx.memberNumber}</span>
                        <span>•</span>
                        <span>{tx.channelName || tx.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-600 font-mono">
                        +Rp {tx.amount.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Sukses
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada riwayat transaksi top up loket pada sesi ini.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
