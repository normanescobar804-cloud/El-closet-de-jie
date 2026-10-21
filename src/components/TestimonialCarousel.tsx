import React, { useRef, useState, useEffect } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Quote,
  Sparkles,
  ShoppingBag,
  MapPin,
  PenSquare,
  Trash2,
  MessageSquareHeart
} from 'lucide-react';
import { CustomerTestimonial, UserAccount } from '../types';

interface TestimonialCarouselProps {
  testimonials: CustomerTestimonial[];
  currentUser?: UserAccount | null;
  onOpenReviewForm: () => void;
  onDeleteTestimonial?: (id: string) => void;
}

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
  currentUser,
  onOpenReviewForm,
  onDeleteTestimonial
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Estimate active card
      const cardWidth = 340;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), testimonials.length - 1));
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [testimonials]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const averageRating = testimonials.length > 0
    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
    : '5.0';

  return (
    <section className="relative my-8 sm:my-10 bg-gradient-to-b from-stone-50/80 via-amber-50/20 to-white rounded-3xl p-4 sm:p-7 border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Decorative ambient background spots */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-black tracking-wide uppercase mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>🇳🇮 Testimonios Reales • Clientes en Toda Nicaragua</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
            Lo que dicen quienes ya visten con nuestra ropa
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl flex items-center gap-2 flex-wrap">
            <span>Experiencias verificadas con envíos express inDrive, WhatsApp y transferencias bancarias.</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{averageRating} / 5.0 ({testimonials.length} opiniones)</span>
            </span>
          </p>
        </div>

        {/* Carousel actions: Dejar Reseña & Arrows */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-end">
          <button
            type="button"
            id="btn-leave-testimonial-header"
            onClick={onOpenReviewForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            title="Escribir tu opinión o experiencia de compra"
          >
            <PenSquare className="w-4 h-4 text-amber-100" />
            <span>Dejar mi Testimonio</span>
          </button>

          <div className="flex items-center gap-1 ml-1 bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              id="btn-testimonials-prev"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 active:scale-90'
                  : 'text-stone-300 cursor-not-allowed bg-stone-50'
              }`}
              aria-label="Testimonios anteriores"
              title="Ver anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-testimonials-next"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 active:scale-90'
                  : 'text-stone-300 cursor-not-allowed bg-stone-50'
              }`}
              aria-label="Siguientes testimonios"
              title="Ver siguientes"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 px-0.5 scroll-smooth scrollbar-none"
        tabIndex={0}
        aria-label="Carrusel de testimonios"
      >
        {testimonials.length === 0 ? (
          <div className="w-full text-center py-10 bg-white rounded-3xl border border-dashed border-stone-300 p-6 space-y-3">
            <MessageSquareHeart className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="font-bold text-stone-800 text-sm">Sé el primero en compartir tu experiencia</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Cuéntanos qué tal te parecieron las prendas, la atención por WhatsApp y los envíos.
            </p>
            <button
              type="button"
              onClick={onOpenReviewForm}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 hover:bg-stone-800"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Escribir la primera reseña</span>
            </button>
          </div>
        ) : (
          testimonials.map((t, idx) => {
            const isUserAuthor =
              currentUser?.isLoggedIn &&
              ((t.authorId && t.authorId === currentUser.uid) ||
                (currentUser.name && t.customerName.toLowerCase() === currentUser.name.toLowerCase()));

            const initials = t.customerName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase() || 'C';

            return (
              <div
                key={t.id || `test-${idx}`}
                className="min-w-[290px] sm:min-w-[340px] md:min-w-[370px] max-w-[390px] snap-start shrink-0 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 hover:border-amber-400/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle card top gradient strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top: Stars, Verified Badge & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < t.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-200 fill-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {t.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verificada</span>
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 font-medium whitespace-nowrap">
                        {t.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Quote decoration & comment */}
                  <div className="space-y-2 mb-4">
                    <Quote className="w-6 h-6 text-amber-300/70 shrink-0 -scale-x-100" />
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal italic line-clamp-4 group-hover:line-clamp-none transition-all">
                      «{t.comment}»
                    </p>
                  </div>

                  {/* Garment / Product tag */}
                  {t.productName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-600 text-[11px] font-medium max-w-full truncate mb-4">
                      <ShoppingBag className="w-3 h-3 text-violet-600 shrink-0" />
                      <span className="truncate">Compró: {t.productName}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Customer Profile & Location */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl ${
                        t.avatarBg || 'bg-violet-600'
                      } text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs tracking-wider`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {t.customerName}
                      </h4>
                      {t.customerCity && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate font-medium">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{t.customerCity}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Author or Admin Delete action */}
                  {(isUserAuthor || currentUser?.role === 'admin') && onDeleteTestimonial && (
                    <button
                      type="button"
                      onClick={() => onDeleteTestimonial(t.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar esta reseña"
                      aria-label="Eliminar reseña"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Progress Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="relative z-10 flex items-center justify-center gap-1.5 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (scrollContainerRef.current) {
                  const cardWidth = 360;
                  scrollContainerRef.current.scrollTo({
                    left: i * cardWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeIndex
                  ? 'w-6 bg-amber-500'
                  : 'w-1.5 bg-stone-200 hover:bg-stone-300'
              }`}
              aria-label={`Ir al testimonio ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
