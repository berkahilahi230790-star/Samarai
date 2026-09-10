import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Tag, ExternalLink } from 'lucide-react';
import { AdBanner } from '../../types';

interface MemberBannerCarouselProps {
  banners?: AdBanner[];
}

export const MemberBannerCarousel: React.FC<MemberBannerCarouselProps> = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeBanners = banners.length > 0 ? banners.slice(0, 3) : [];

  // Auto-play slider every 5 seconds if not paused
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-100 bg-slate-900 group select-none transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Banner Media Slide Container */}
      <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
        {activeBanners.map((banner, idx) => (
          <div
            key={banner.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
              loading="lazy"
              onError={(e) => {
                // Fallback image if broken
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80';
              }}
            />

            {/* Dark & Gradient Overlay for optimal contrast & text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />

            {/* Content Text Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-7 md:p-8 text-white max-w-2xl">
              {/* Badge & Slide Tag */}
              <div className="flex items-center gap-2 mb-2">
                {banner.badge ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-xs border border-blue-400/30 shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-200" />
                    {banner.badge}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                    INFO & PROMO
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Iklan #{idx + 1}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                {banner.title}
              </h3>

              {/* Subtitle */}
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2 max-w-xl drop-shadow-sm font-medium leading-relaxed">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 shadow-md border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 shadow-md border border-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Bottom Indicators & Slide Dots */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-3 right-4 sm:right-6 z-30 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {activeBanners.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(dotIdx);
              }}
              aria-label={`Lihat banner ${dotIdx + 1}`}
              className={`transition-all rounded-full ${
                dotIdx === currentIndex
                  ? 'w-6 h-2 bg-blue-500'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
          <span className="text-[10px] font-mono text-white/80 ml-1 font-bold">
            {currentIndex + 1}/{activeBanners.length}
          </span>
        </div>
      )}
    </div>
  );
};
