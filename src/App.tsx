import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { AuthModal } from './components/AuthModal';
import { MemberDashboard } from './components/member/MemberDashboard';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { GateScanner } from './components/gate/GateScanner';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  Phone,
  Clock,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { settings } = useApp();
  const [currentTab, setCurrentTab] = useState<'member' | 'coach' | 'admin' | 'gate'>('member');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuth = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white" style={{ backgroundColor: '#f8fafc' }}>
      {/* Real-time Push Notification Floating Banner */}
      <NotificationToast />

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuthModal={() => openAuth('login')}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* View Component Switcher */}
        {currentTab === 'member' && <MemberDashboard />}
        {currentTab === 'coach' && <CoachDashboard />}
        {currentTab === 'gate' && <GateScanner />}
        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-blue-200">
              SP
            </div>
            <div>
              <span className="font-black text-slate-800 tracking-tight">{settings.businessName}</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-slate-400 font-medium">Tiket Masuk & Sistem Keanggotaan Terintegrasi</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {settings.openHours}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {settings.contactPhone}
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Terenkripsi & Anti-Duplikasi
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
