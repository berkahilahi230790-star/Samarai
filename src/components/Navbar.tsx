import React, { useState } from 'react';
import {
  Bell,
  Waves,
  QrCode,
  Shield,
  ScanLine,
  UserCheck,
  LogOut,
  ChevronDown,
  CheckCheck,
  Trash2,
  Lock,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: 'member' | 'coach' | 'admin' | 'gate';
  setCurrentTab: (tab: 'member' | 'coach' | 'admin' | 'gate') => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuthModal }) => {
  const {
    currentUser,
    users,
    settings,
    notifications,
    remainingQuota,
    todayVisitorsCount,
    switchUser,
    switchRole,
    logout,
    markNotificationAsRead,
    clearNotifications,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    if (role === 'admin') setCurrentTab('admin');
    else if (role === 'coach') setCurrentTab('coach');
    else if (role === 'gate') setCurrentTab('gate');
    else setCurrentTab('member');
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-200/60 p-0.5 flex items-center justify-center overflow-hidden shrink-0 text-white">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={e => {
                    // Fallback to Waves icon if custom image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Waves className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tighter text-slate-900 leading-none">
                  {settings.businessName}
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terkripsi
                </span>
              </div>
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] uppercase mt-0.5 hidden sm:block">
                Park Manager • Tiket QR Real-Time
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs: Member, Guru Les, Admin, Gate */}
          <nav className="hidden md:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setCurrentTab('member')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'member'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Area Member
            </button>
            <button
              onClick={() => setCurrentTab('coach')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'coach'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Guru Les
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Dasbor Admin
            </button>
            <button
              onClick={() => setCurrentTab('gate')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'gate'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Karyawan
            </button>
          </nav>

          {/* Right Action: Quota Indicator, Push Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Quota Pill */}
            <div className="hidden lg:flex flex-col items-end text-right border-r border-slate-100 pr-3 mr-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Kuota Hari Ini: <span className="font-black text-slate-900">{remainingQuota}</span> / {settings.dailyQuota}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {todayVisitorsCount} Pengunjung Masuk
              </span>
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifikasi Masuk"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-black text-slate-800 tracking-tight">Notifikasi Real-Time</h4>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-red-500 p-1"
                        title="Bersihkan Semua"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        Belum ada notifikasi baru.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3.5 text-left transition-colors cursor-pointer ${
                            notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account / Role Selector */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center font-bold text-xs text-blue-600">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      {currentUser.name.split(' ')[0]}
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        currentUser.role === 'admin' ? 'bg-slate-900 text-white' :
                        currentUser.role === 'coach' ? 'bg-emerald-100 text-emerald-800' :
                        currentUser.role === 'gate' ? 'bg-blue-100 text-blue-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'coach' ? 'Guru Les' : currentUser.role === 'gate' ? 'Petugas' : 'Member'}
                      </span>
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 whitespace-nowrap">
                      {currentUser.role === 'member' ? `Rp ${currentUser.balance.toLocaleString('id-ID')}` : currentUser.memberNumber}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in">
                    <div className="p-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate font-medium">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {currentUser.memberNumber}
                        </span>
                        {currentUser.role === 'member' && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            Saldo: Rp {currentUser.balance.toLocaleString('id-ID')}
                          </span>
                        )}
                        {currentUser.role === 'coach' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Instruktur Akuatik
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Demo Switcher Section */}
                    <div className="py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                        Pilih Role Pengguna:
                      </p>
                      <div className="grid grid-cols-3 gap-1 px-1 mb-2">
                        <button
                          type="button"
                          onClick={() => handleRoleChange('member')}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                            currentUser.role === 'member'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Member
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange('coach')}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                            currentUser.role === 'coach'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Guru Les
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange('admin')}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                            currentUser.role === 'admin'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Admin
                        </button>
                      </div>

                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Daftar Akun Tersedia:
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              if (u.role === 'coach') setCurrentTab('coach');
                              else if (u.role === 'admin') setCurrentTab('admin');
                              else if (u.role === 'gate') setCurrentTab('gate');
                              else setCurrentTab('member');
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              currentUser.id === u.id
                                ? 'bg-blue-50 font-bold text-blue-700'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate font-medium">{u.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ml-2 ${
                              u.role === 'coach' ? 'bg-emerald-50 text-emerald-700' :
                              u.role === 'admin' ? 'bg-slate-100 text-slate-800' :
                              u.role === 'gate' ? 'bg-amber-50 text-amber-800' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {u.role === 'coach' ? 'Guru Les' : u.role === 'admin' ? 'Admin' : u.role === 'gate' ? 'Karyawan' : 'Member'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          onOpenAuthModal();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        Ganti / Daftar Akun Lain
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5"
              >
                Masuk / Daftar
              </button>
            )}

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setCurrentTab('member')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
              currentTab === 'member' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            Member
          </button>
          <button
            onClick={() => setCurrentTab('coach')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
              currentTab === 'coach' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            Guru Les
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
              currentTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            onClick={() => setCurrentTab('gate')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
              currentTab === 'gate' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5 text-blue-600" />
            Karyawan
          </button>
        </div>
      </div>
    </header>
  );
};
