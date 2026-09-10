import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Eye,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { AdBanner } from '../../types';

interface BannerSettingsCardProps {
  banners: AdBanner[];
  onChange: (updatedBanners: AdBanner[]) => void;
}

const DEFAULT_BANNER_PRESETS = [
  {
    name: 'Kolam Olympic Utama',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pelatihan & Kursus Renang',
    url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Wahana & Seluncuran Air',
    url: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Resort Sunset Pool',
    url: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bermain Air Keluarga',
    url: 'https://images.unsplash.com/photo-1582650625119-3a31f8418365?w=1200&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_BANNERS_FALLBACK: AdBanner[] = [
  {
    id: 'banner-1',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80',
    title: 'Selamat Datang di SAMARAI PARK Water Zone',
    subtitle: 'Kolam renang berstandar olimpiade dengan air jernih, filter UV higienis & wahana ramah anak.',
    badge: 'PROMO UTAMA',
    targetUrl: '#',
  },
  {
    id: 'banner-2',
    imageUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=1200&auto=format&fit=crop&q=80',
    title: 'Akademi Renang Bersertifikat - Buka Pendaftaran!',
    subtitle: 'Tersedia kelas privat, pemula, hingga jalur prestasi bersama instruktur renang profesional.',
    badge: 'KELAS RENANG',
    targetUrl: '#',
  },
  {
    id: 'banner-3',
    imageUrl: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=1200&auto=format&fit=crop&q=80',
    title: 'Paket Hemat Rombongan & Family Gathering Weekend',
    subtitle: 'Nikmati diskon spesial tiket masuk untuk kunjungan keluarga dan rombongan sekolah.',
    badge: 'DISKON SPESIAL',
    targetUrl: '#',
  },
];

export const BannerSettingsCard: React.FC<BannerSettingsCardProps> = ({ banners, onChange }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize list to ensure exactly 3 banners exist
  const currentBanners: AdBanner[] = [0, 1, 2].map(idx => {
    if (banners && banners[idx]) {
      return banners[idx];
    }
    return DEFAULT_BANNERS_FALLBACK[idx];
  });

  const activeBanner = currentBanners[activeTab];

  const updateBannerField = (field: keyof AdBanner, value: string) => {
    const updated = [...currentBanners];
    updated[activeTab] = {
      ...updated[activeTab],
      [field]: value,
    };
    onChange(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateBannerField('imageUrl', reader.result);
        setUploadSuccess(`Foto untuk Banner ${activeTab + 1} berhasil diunggah!`);
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetCurrentBanner = () => {
    const defaultData = DEFAULT_BANNERS_FALLBACK[activeTab];
    const updated = [...currentBanners];
    updated[activeTab] = { ...defaultData };
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Pengaturan 3 Banner Iklan Dashboard Member
            </h4>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
              3 Slide Promosi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Unggah gambar atau masukkan URL foto untuk 3 banner iklan yang bergantian tampil otomatis pada Dashboard Member.
          </p>
        </div>
      </div>

      {/* Tabs for Banner 1, Banner 2, Banner 3 */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((idx) => {
          const item = currentBanners[idx];
          const isActive = activeTab === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  Banner #{idx + 1}
                </span>
                {item.imageUrl ? (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {item.title || `Banner ${idx + 1}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Upload Success Alert */}
      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          {uploadSuccess}
        </div>
      )}

      {/* Main Banner Editor Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Photo Input (URL + File Upload) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Foto Gambar Banner {activeTab + 1}
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Rekomendasi rasio 16:9 atau 21:9 landscape
              </span>
            </div>

            {/* Input URL Foto */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... atau URL foto"
                value={activeBanner.imageUrl}
                onChange={(e) => updateBannerField('imageUrl', e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />

              {/* Upload Local File Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                title="Pilih file foto dari laptop/HP Anda"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Upload Foto
              </button>
            </div>

            {/* Preset Photo Buttons */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                Pilihan Preset Foto Kolam Samarai:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_BANNER_PRESETS.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => updateBannerField('imageUrl', p.url)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-medium transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Judul Banner */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Judul Banner Iklan
            </label>
            <input
              type="text"
              placeholder="Contoh: Diskon Liburan Keluarga 20%"
              value={activeBanner.title}
              onChange={(e) => updateBannerField('title', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
            />
          </div>

          {/* Subjudul / Deskripsi Singkat */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Subjudul / Keterangan Banner
            </label>
            <textarea
              rows={2}
              placeholder="Tuliskan deskripsi ringkas promosi atau informasi yang menarik minat pengunjung..."
              value={activeBanner.subtitle}
              onChange={(e) => updateBannerField('subtitle', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Badge Label & Target URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Teks Badge / Label
              </label>
              <input
                type="text"
                placeholder="Contoh: PROMO UTAMA, SPESIAL, KURSUS"
                value={activeBanner.badge || ''}
                onChange={(e) => updateBannerField('badge', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tautan / URL (Opsional)
              </label>
              <input
                type="text"
                placeholder="#"
                value={activeBanner.targetUrl || ''}
                onChange={(e) => updateBannerField('targetUrl', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetCurrentBanner}
              className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Kembalikan Banner {activeTab + 1} ke Foto Bawaan
            </button>
          </div>
        </div>

        {/* Right Column: Live Mockup Preview on Member Dashboard */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Pratinjau Live di Layar Member
            </span>
            <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white text-[10px]">
              Slide #{activeTab + 1} dari 3
            </span>
          </div>

          {/* Banner Mockup Box */}
          <div className="relative h-44 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner flex flex-col justify-end p-4">
            {activeBanner.imageUrl ? (
              <img
                src={activeBanner.imageUrl}
                alt="Banner Preview"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                Belum ada foto gambar
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

            {/* Text details in preview */}
            <div className="relative z-10 space-y-1">
              {activeBanner.badge && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 text-blue-200" />
                  {activeBanner.badge}
                </span>
              )}
              <h5 className="text-xs font-black text-white line-clamp-1">
                {activeBanner.title || 'Judul Banner Iklan'}
              </h5>
              <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                {activeBanner.subtitle || 'Keterangan promo atau info yang menarik...'}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium leading-normal">
            Setelah klik <strong>Simpan Perubahan Pengaturan</strong> di bawah, banner ini langsung aktif dan tampil bergantian di akun semua member.
          </p>
        </div>
      </div>
    </div>
  );
};
