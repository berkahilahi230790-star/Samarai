import React, { useState } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { users, registerMember, resetPasswordRequest, switchUser } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form state
  const [regRole, setRegRole] = useState<'member' | 'coach'>('member');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDeposit, setRegDeposit] = useState('50000');
  const [regCoachSpecialty, setRegCoachSpecialty] = useState('Instruktur Renang Bersertifikat FIN/PRSI');
  const [regMsg, setRegMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forgot Password state
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const found = users.find(
      u =>
        u.email.toLowerCase() === loginIdentifier.toLowerCase().trim() ||
        u.phone.trim() === loginIdentifier.trim() ||
        u.memberNumber.toLowerCase() === loginIdentifier.toLowerCase().trim()
    );

    if (found) {
      switchUser(found.id);
      onClose();
    } else {
      setLoginError('Akun tidak ditemukan. Pastikan email, nomor HP, atau nomor member benar.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setRegMsg({ type: 'error', text: 'Semua kolom wajib diisi.' });
      return;
    }

    const depositNum = regRole === 'coach' ? 0 : (parseInt(regDeposit, 10) || 50000);
    const res = registerMember({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      initialDeposit: depositNum,
      role: regRole,
      coachSpecialty: regRole === 'coach' ? regCoachSpecialty.trim() : undefined,
    });

    if (res.success) {
      setRegMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setRegMsg({ type: 'error', text: res.message });
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    if (!forgotInput.trim()) {
      setForgotMsg({ type: 'error', text: 'Masukkan email atau nomor HP Anda.' });
      return;
    }

    const res = resetPasswordRequest(forgotInput.trim());
    if (res.success) {
      setForgotMsg({ type: 'success', text: res.message });
    } else {
      setForgotMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-white/15">
              <ShieldCheck className="w-5 h-5 text-white" />
            </span>
            <span className="text-[10px] font-black tracking-widest uppercase bg-white/15 px-2.5 py-0.5 rounded-full">
              SAMARAI PARK
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight">
            {activeTab === 'login' && 'Masuk Akun Member'}
            {activeTab === 'register' && 'Pendaftaran Member Baru'}
            {activeTab === 'forgot' && 'Pemulihan Kata Sandi'}
          </h3>
          <p className="text-xs text-blue-100 mt-1 font-medium">
            {activeTab === 'login' && 'Akses saldo tiket, riwayat transaksi, dan jadwal kelas renang.'}
            {activeTab === 'register' && 'Dapatkan QR Member instan & bonus saldo pendaftaran Rp 50.000!'}
            {activeTab === 'forgot' && 'Masukkan info akun untuk menerima instruksi reset password.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 text-xs font-bold bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Daftar Member
          </button>
          <button
            onClick={() => {
              setActiveTab('forgot');
              setForgotMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'forgot'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Lupa Sandi
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email, No. HP, atau No. Member
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="contoh: ahmad.fauzi@gmail.com / 0812..."
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  *Untuk mode simulasi instan, sandi bersifat fleksibel.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                Masuk Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Fast Demo Accounts */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center mb-2">
                  Pilih Masuk Cepat Sesuai Peran (Role):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      switchUser('usr-member-01');
                      onClose();
                    }}
                    className="p-2.5 border border-slate-200 rounded-2xl text-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-800">1. Member</div>
                    <div className="text-[10px] text-blue-600 font-medium">Ahmad Fauzi</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchUser('usr-coach-01');
                      onClose();
                    }}
                    className="p-2.5 border border-slate-200 rounded-2xl text-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-800">2. Guru Les</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Coach Randy</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchUser('usr-admin-01');
                      onClose();
                    }}
                    className="p-2.5 border border-slate-200 rounded-2xl text-center hover:bg-slate-100 hover:border-slate-300 transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-800">3. Admin</div>
                    <div className="text-[10px] text-slate-700 font-medium">Super Admin</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {regMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    regMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {regMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {regMsg.text}
                </div>
              )}

              {/* Role Selection in Register */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Sebagai Peran (Role):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('member')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      regRole === 'member'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Member / Murid
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('coach')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      regRole === 'coach'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Guru Les (Instruktur)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {regRole === 'coach' ? 'Nama Lengkap Instruktur & Gelar' : 'Nama Lengkap'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={regRole === 'coach' ? 'contoh: Coach Randy Siregar, S.Or' : 'contoh: Muhammad Rizky'}
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="contoh: akun@gmail.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="contoh: 081234567890"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {regRole === 'coach' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Spesialisasi & Lisensi Kepelatihan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Spesialis Gaya Bebas, Sertifikasi PRSI Level 1"
                    value={regCoachSpecialty}
                    onChange={e => setRegCoachSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    *Guru Les akan otomatis mendapatkan ID Instruktur resmi bertanda GURU-XXXX.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saldo Awal / Bonus Registrasi
                  </label>
                  <select
                    value={regDeposit}
                    onChange={e => setRegDeposit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="50000">Rp 50.000 (Paket Standar Promo)</option>
                    <option value="100000">Rp 100.000 (Paket Berenang Hemat)</option>
                    <option value="250000">Rp 250.000 (Paket Keluarga & Les)</option>
                  </select>
                  <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    Termasuk penerbitan Kartu QR Member Unik digital instan.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {regRole === 'coach' ? 'Daftar Sebagai Guru Les' : 'Daftar Member Sekarang'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              {forgotMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    forgotMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {forgotMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email atau Nomor HP Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan email atau no HP akun Anda"
                    value={forgotInput}
                    onChange={e => setForgotInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                  Sistem keamanan SAMARAI PARK akan memverifikasi data dan mengirimkan tautan reset kata sandi ke kontak terdaftar.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                Kirim Tautan Pemulihan
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-slate-400 hover:text-slate-800 font-semibold"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3 h-3 text-slate-400" />
            Dilindungi Enkripsi Token Digital & HMAC SHA Signature
          </p>
        </div>

      </div>
    </div>
  );
};
