import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertCircle, X, ArrowUpRight, ArrowDownLeft, ShieldCheck, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useApp();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'qris_coin_received':
        return <Coins className="w-5 h-5 text-amber-500 animate-bounce" />;
      case 'entry_success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'top_up':
        return <ArrowUpRight className="w-5 h-5 text-blue-500" />;
      case 'refund':
        return <ArrowDownLeft className="w-5 h-5 text-amber-500" />;
      case 'schedule_alert':
        return <Bell className="w-5 h-5 text-blue-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full pointer-events-none no-print px-4 sm:px-0">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white/95 shadow-xl backdrop-blur-md"
        >
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-xs shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Push Notifikasi</h4>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug tracking-tight">{activeToast.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{activeToast.message}</p>
            <span className="text-[10px] text-slate-400 mt-2 block font-mono">
              {new Date(activeToast.timestamp).toLocaleTimeString('id-ID')} WIB
            </span>
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
