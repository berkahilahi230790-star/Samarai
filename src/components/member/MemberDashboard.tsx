import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Wallet,
  PlusCircle,
  QrCode,
  History,
  ShieldCheck,
  RefreshCw,
  Maximize2,
  Copy,
  Check,
  Building2,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Waves,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateMemberQRPayload } from '../../utils/encryption';
import { Transaction, PaymentMethod } from '../../types';
import { SwimmingCourseSection } from './SwimmingCourseSection';
import { MemberBannerCarousel } from './MemberBannerCarousel';

export const MemberDashboard: React.FC = () => {
  const { currentUser, transactions, settings, topUpBalance, refreshMemberQRToken } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'beranda' | 'riwayat' | 'kursus'>('beranda');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showQRZoomModal, setShowQRZoomModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Static QR Generation state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [tokenRefreshedAlert, setTokenRefreshedAlert] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Top Up Modal state
  const minTopUp = typeof settings.minTopUpEmployee === 'number' && settings.minTopUpEmployee > 0
    ? settings.minTopUpEmployee
    : 100000;

  const topUpPresets = [
    minTopUp,
    Math.round((minTopUp * 1.25) / 1000) * 1000,
    Math.round((minTopUp * 1.5) / 1000) * 1000,
    minTopUp * 2,
    Math.round((minTopUp * 2.5) / 1000) * 1000,
    minTopUp * 3,
  ];

  const [topUpMethod, setTopUpMethod] = useState<'bank' | 'ewallet'>('ewallet');
  const [topUpAmount, setTopUpAmount] = useState<number>(() => minTopUp);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<number>(0);
  const [selectedEwallet, setSelectedEwallet] = useState<number>(0);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const handleOpenTopUpModal = () => {
    setTopUpAmount(minTopUp);
    setCustomAmount('');
    setShowTopUpModal(true);
  };

  // Filter transactions
  const [filterType, setFilterType] = useState<string>('all');

  // Generate static encrypted QR code
  const generateStaticQR = (token?: string, updatedAt?: string) => {
    if (!currentUser) return;
    const activeToken = token || currentUser.qrToken;
    const updatedTs = updatedAt
      ? new Date(updatedAt).getTime()
      : currentUser.qrTokenUpdatedAt
      ? new Date(currentUser.qrTokenUpdatedAt).getTime()
      : undefined;
    const encryptedPayload = generateMemberQRPayload(currentUser.id, currentUser.memberNumber, activeToken, updatedTs);
    QRCode.toDataURL(encryptedPayload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => console.error('QR generation error:', err));
  };

  useEffect(() => {
    generateStaticQR();
  }, [currentUser?.id, currentUser?.qrToken, currentUser?.memberNumber]);

  const handleManualRefreshToken = () => {
    if (!currentUser) return;
    setIsRefreshingToken(true);
    const newToken = refreshMemberQRToken(currentUser.id);
    const nowIso = new Date().toISOString();
    generateStaticQR(newToken, nowIso);
    setIsRefreshingToken(false);
    setTokenRefreshedAlert(true);
    setTimeout(() => setTokenRefreshedAlert(false), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!currentUser || currentUser.role !== 'member') {
    return (
      <div className="text-center py-16 px-4">
        <Waves className="w-12 h-12 text-cyan-600 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800">Silakan Masuk Sebagai Member</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Gunakan tombol di pojok kanan atas atau pemilih akun untuk masuk ke akun member Anda.
        </p>
      </div>
    );
  }

  // Filtered transactions for current user
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  const filteredTransactions = userTransactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const handleExecuteTopUp = () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : topUpAmount;
    if (!finalAmount || finalAmount < minTopUp) {
      alert(`Nominal top up minimal Rp ${minTopUp.toLocaleString('id-ID')} (berdasarkan ketentuan minimal top up dari admin).`);
      return;
    }

    setIsProcessingTopUp(true);
    setTimeout(() => {
      let method: PaymentMethod = topUpMethod === 'bank' ? 'bank_transfer' : 'e_wallet';
      let channel =
        topUpMethod === 'bank'
          ? settings.bankAccounts[selectedBank]?.bankName || 'Virtual Account'
          : settings.eWallets[selectedEwallet]?.walletName || 'QRIS';

      topUpBalance(currentUser.id, finalAmount, method, channel);
      setIsProcessingTopUp(false);
      setShowTopUpModal(false);
      setCustomAmount('');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner & Quick Navigation */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 p-0.5 shadow-md shadow-blue-200/60 flex items-center justify-center overflow-hidden shrink-0">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <span className="font-black text-xl text-white">{currentUser.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Halo, {currentUser.name}!
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Member Aktif
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                {currentUser.memberNumber}
              </span>
              <span>•</span>
              <span>Bergabung sejak {currentUser.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 w-full md:w-auto gap-1">
          <button
            onClick={() => setActiveSubTab('beranda')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'beranda'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Kartu QR & Saldo
          </button>
          <button
            onClick={() => setActiveSubTab('kursus')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'kursus'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <Waves className="w-4 h-4" />
            Kursus Renang
            {currentUser.enrolledCourseIds?.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-300" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'riwayat'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat
          </button>
        </div>
      </div>

      {/* TAB 1: BERANDA (SALDO & DYNAMIC QR PASS) */}
      {activeSubTab === 'beranda' && (
        <div className="space-y-6">
          {/* Banner Iklan 3 Gambar Foto */}
          <MemberBannerCarousel banners={settings.banners} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Saldo Card & Park Rate Info */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Saldo Member Card */}
            <div className="bg-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-3.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-blue-100/80 block whitespace-nowrap">
                        Saldo Tiket Kolam Renang
                      </span>
                      <div className="mt-1">
                        <h3 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight whitespace-nowrap">
                          Rp {currentUser.balance.toLocaleString('id-ID')}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono bg-white/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white font-bold flex items-center gap-1 whitespace-nowrap">
                        <Lock className="w-3 h-3 text-blue-200" />
                        Auto-Deduct Gate
                      </span>
                      <span className="text-[11px] sm:text-xs font-black tracking-tight text-white bg-blue-700/60 px-2 sm:px-2.5 py-0.5 rounded-lg border border-white/15 shadow-xs whitespace-nowrap">
                        Rp {settings.ticketPrice.toLocaleString('id-ID')}
                        <span className="text-[9px] sm:text-[10px] font-normal text-blue-200"> / orang</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={handleOpenTopUpModal}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    Top-Up Saldo Instan
                  </button>
                  <button
                    onClick={() => setActiveSubTab('riwayat')}
                    className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    Mutasi
                  </button>
                </div>
                <div className="text-[11px] text-blue-100/90 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                  <span>Minimal top up Rp {minTopUp.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Static Member QR Code Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center relative">
              
              {/* Header Badge */}
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  QR Akses Pintu Masuk
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  QR Statis Aktif
                </div>
              </div>

              {/* Refreshed Alert */}
              {tokenRefreshedAlert && (
                <div className="w-full p-2.5 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Token QR berhasil diperbarui! Kode QR lama tidak lagi berlaku.
                </div>
              )}

              {/* High Resolution Static QR Canvas */}
              <div className="relative w-64 h-64 bg-white border-8 border-slate-50 p-2.5 rounded-2xl shadow-inner flex items-center justify-center mb-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Member QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-1 flex justify-center">
                  <span className="text-[9px] font-mono tracking-widest bg-white/95 px-2 py-0.5 rounded text-slate-400 border border-slate-200 font-bold">
                    STATIC SECURE QR
                  </span>
                </div>
              </div>

              {/* Member Details Under QR */}
              <div className="mt-3 space-y-0.5">
                <p className="text-sm font-black text-slate-900 tracking-tight">{currentUser.name}</p>
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs text-blue-600 font-bold">
                  <span>{currentUser.memberNumber}</span>
                  <button
                    onClick={() => copyToClipboard(currentUser.memberNumber, 'memberNum')}
                    className="p-1 hover:text-blue-800 transition-colors"
                    title="Salin Nomor Member"
                  >
                    {copiedText === 'memberNum' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Token: {currentUser.qrToken || 'TKN-DEFAULT'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2 mt-5">
                <button
                  onClick={handleManualRefreshToken}
                  disabled={isRefreshingToken}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Ganti token QR jika ingin memperbarui kode akses Anda"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                  Refresh Token
                </button>
                <button
                  onClick={() => setShowQRZoomModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Perbesar Layar
                </button>
              </div>

              {/* Security note */}
              <p className="text-[11px] text-slate-400 mt-4 leading-normal flex items-center justify-center gap-1 font-medium">
                <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                QR Code sistem statis. Kode QR hanya akan berubah jika Anda menekan tombol Refresh Token.
              </p>

            </div>
          </div>

        </div>
        </div>
      )}

      {/* TAB 2: KURSUS RENANG */}
      {activeSubTab === 'kursus' && <SwimmingCourseSection />}

      {/* TAB 3: RIWAYAT TRANSAKSI LENGKAP */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Riwayat Transaksi Pelanggan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Semua pemotongan tiket masuk oleh karyawan, top up saldo, dan pendaftaran kursus renang Anda.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'entry_ticket', label: 'Tiket Masuk' },
                { id: 'top_up', label: 'Top-Up' },
                { id: 'course_fee', label: 'Kursus' },
                { id: 'refund', label: 'Pengembalian' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterType === f.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                Tidak ada riwayat transaksi pada kategori ini.
              </div>
            ) : (
              filteredTransactions.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedReceipt(tx)}
                  className="p-4 flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'top_up' ? 'bg-emerald-50 text-emerald-600' :
                      tx.type === 'entry_ticket' ? 'bg-red-50 text-red-500' :
                      tx.type === 'refund' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.type === 'top_up' ? <ArrowUpRight className="w-5 h-5" /> :
                       tx.type === 'entry_ticket' ? <Waves className="w-5 h-5" /> :
                       tx.type === 'refund' ? <ArrowDownLeft className="w-5 h-5" /> :
                       <Tag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{tx.title}</span>
                        {tx.status === 'cancelled' && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.2 rounded-md border border-red-100">
                            Dibatalkan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                        <span className="font-mono">{tx.code}</span>
                        <span>•</span>
                        <span>{new Date(tx.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black block ${
                      tx.type === 'top_up' || tx.type === 'refund' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'top_up' || tx.type === 'refund' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize font-medium">
                      {tx.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: TOP UP SALDO */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Header */}
            <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/80">
                  Isi Saldo Member
                </span>
                <h3 className="text-lg font-black tracking-tight">Top-Up Saldo Instan</h3>
                <p className="text-xs font-semibold text-blue-100 mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Minimal top up Rp {minTopUp.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Method Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTopUpMethod('ewallet')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    topUpMethod === 'ewallet'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  QRIS / E-Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod('bank')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    topUpMethod === 'bank'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Transfer Bank (VA)
                </button>
              </div>

              {/* Nominal Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Pilih Nominal Saldo</label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Min. Rp {minTopUp.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {topUpPresets.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTopUpAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !customAmount && topUpAmount === amt
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      Rp {amt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Atau Input Nominal Lain (Rp)
                  </label>
                  <input
                    type="number"
                    min={minTopUp}
                    placeholder={`Min. Rp ${minTopUp.toLocaleString('id-ID')}`}
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  {customAmount && parseInt(customAmount, 10) < minTopUp && (
                    <p className="text-[11px] text-red-500 font-bold mt-1">
                      ⚠️ Nominal minimal top up adalah Rp {minTopUp.toLocaleString('id-ID')} (sesuai ketentuan admin).
                    </p>
                  )}
                </div>
              </div>

              {/* Channel Details */}
              {topUpMethod === 'ewallet' ? (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                    <img
                      src={settings.eWallets[0]?.qrImageUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SAMARAI-PARK-QRIS-MEMBER'}
                      alt="QRIS Samarai Park"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Scan QRIS via GoPay, OVO, DANA, BCA, Livin, ShopeePay
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {settings.eWallets[0]?.accountNumber}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Pilih Rekening Tujuan</label>
                  <div className="space-y-1.5">
                    {settings.bankAccounts.map((b, idx) => (
                      <div
                        key={b.accountNumber}
                        onClick={() => setSelectedBank(idx)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                          selectedBank === idx
                            ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-950 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div>{b.bankName}</div>
                          <div className="font-mono text-slate-500 font-normal">{b.accountNumber}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(b.accountNumber, `bank-${idx}`);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700"
                        >
                          {copiedText === `bank-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Top Up Action */}
              <button
                type="button"
                disabled={isProcessingTopUp || Boolean(customAmount && parseInt(customAmount, 10) < minTopUp)}
                onClick={handleExecuteTopUp}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessingTopUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses Saldo...
                  </>
                ) : (
                  <>
                    Konfirmasi Pembayaran (Simulasi Instan)
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: FULL-SCREEN QR ZOOM MODAL FOR SCANNER */}
      {showQRZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQRZoomModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                Pintu Masuk Samarai Park
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">
                Scan QR Masuk (Karyawan)
              </h3>
            </div>

            <div className="p-3 bg-white border-2 border-dashed border-blue-500 rounded-2xl inline-block shadow-inner">
              <img
                src={qrDataUrl}
                alt="Zoomed QR"
                className="w-72 h-72 object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-black text-slate-800">{currentUser.name}</p>
              <p className="text-xs font-mono text-blue-600 font-bold">{currentUser.memberNumber}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Token: {currentUser.qrToken || 'TKN-DEFAULT'}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  QR Statis
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
              Tingkatkan kecerahan layar HP Anda saat didekatkan ke scanner petugas.
            </div>

            <button
              onClick={() => setShowQRZoomModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: STRUK / RECEIPT DETAIL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="text-center border-b border-dashed border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center font-black text-base mb-1 shadow-sm shadow-blue-200">
                SP
              </div>
              <h4 className="font-black text-base tracking-tight">{settings.businessName}</h4>
              <p className="text-[11px] text-slate-400 font-mono">Bukti Transaksi Resmi Digital</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Kode Transaksi:</span>
                <span className="font-mono font-bold">{selectedReceipt.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Waktu:</span>
                <span className="font-medium">{new Date(selectedReceipt.timestamp).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Member:</span>
                <span className="font-bold">{selectedReceipt.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Keterangan:</span>
                <span className="font-bold text-right">{selectedReceipt.title}</span>
              </div>
              {selectedReceipt.quantity && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Jumlah Orang:</span>
                  <span className="font-bold">{selectedReceipt.quantity} Orang</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Metode:</span>
                <span className="capitalize font-medium">{selectedReceipt.paymentMethod} {selectedReceipt.channelName ? `(${selectedReceipt.channelName})` : ''}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold">
                <span>Total:</span>
                <span className="text-blue-600 font-black">Rp {selectedReceipt.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Token Enkripsi Keamanan:</span>
                <span className="text-[10px] font-mono text-slate-500 break-all bg-slate-50 p-1.5 rounded-lg block border border-slate-100">
                  {selectedReceipt.securityHash}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
