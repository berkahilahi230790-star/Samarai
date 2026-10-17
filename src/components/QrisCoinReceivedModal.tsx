import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, CheckCircle2, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const QrisCoinReceivedModal: React.FC = () => {
  const { qrisCoinAlert, dismissCoinAlert, currentUser } = useApp();

  if (!qrisCoinAlert) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in no-print">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200/80"
        >
          {/* Top Decorative Golden Header */}
          <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 p-6 text-white text-center overflow-hidden">
            {/* Glow / Sparkle background effects */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-300/30 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={dismissCoinAlert}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Bouncing Gold Coin Icon */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-xl shadow-amber-600/30 flex items-center justify-center mb-3 text-amber-500 border-4 border-amber-200"
            >
              <Coins className="w-11 h-11 text-amber-500 animate-pulse" />
            </motion.div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider mb-1.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Webhook QRIS Berhasil Masuk
            </div>

            <h3 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              Koin Saldo Diterima!
            </h3>
            <p className="text-amber-100 text-xs mt-0.5 font-medium">
              Pembayaran QRIS telah diverifikasi & saldo diperbarui instan
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Amount Callout */}
            <div className="text-center bg-gradient-to-b from-amber-50/80 to-yellow-50/50 p-4 rounded-2xl border border-amber-200/70">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Nominal Saldo Bertambah
              </span>
              <div className="text-3xl font-black text-amber-600 tracking-tight">
                +Rp {qrisCoinAlert.amount.toLocaleString('id-ID')}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Langsung masuk ke e-wallet Samarai Member</span>
              </div>
            </div>

            {/* Receipt Summary Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Nama Member</span>
                <span className="font-bold text-slate-900">{qrisCoinAlert.userName}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">No. Member</span>
                <span className="font-mono font-bold text-blue-600">{qrisCoinAlert.memberNumber}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Metode / Gateway</span>
                <span className="font-bold text-slate-800">{qrisCoinAlert.channelName}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">No. Referensi Transaksi</span>
                <span className="font-mono text-slate-600 font-semibold">{qrisCoinAlert.referenceId}</span>
              </div>
              {currentUser && currentUser.role === 'member' && (
                <div className="flex justify-between items-center pt-1 text-emerald-700 font-bold">
                  <span>Total Saldo Sekarang</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    Rp {currentUser.balance.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Button */}
            <button
              onClick={dismissCoinAlert}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-sm shadow-md shadow-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gunakan Koin / Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dikonfirmasi otomatis oleh Sistem Webhook Samarai Park</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
