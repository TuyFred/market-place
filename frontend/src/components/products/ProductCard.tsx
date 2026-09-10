import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatRwf } from '../../utils/format';
import { SAMPLE_IMAGES } from '../../config/brand';
import { useState, useRef, useEffect, useCallback } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const displayImages =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [SAMPLE_IMAGES.placeholder];

  const closeModal = useCallback(() => {
    setShowModal(false);
    setRotation(0);
    setScale(1);
  }, []);

  const openModal = (index = currentIndex) => {
    setCurrentIndex(index);
    setRotation(0);
    setScale(1);
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
        setRotation(0);
        setScale(1);
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => (i + 1) % displayImages.length);
        setRotation(0);
        setScale(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showModal, closeModal, displayImages.length]);

  const goTo = (index: number) => {
    const next = ((index % displayImages.length) + displayImages.length) % displayImages.length;
    setCurrentIndex(next);
    setRotation(0);
    setScale(1);
  };

  const scrollToImage = (index: number) => {
    if (sliderRef.current) {
      const width = sliderRef.current.clientWidth;
      sliderRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth;
    if (!width) return;
    setCurrentIndex(Math.round(sliderRef.current.scrollLeft / width));
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const openFullImage = () => {
    const raw = displayImages[currentIndex] || '';
    const src =
      raw.startsWith('http') || raw.startsWith('//')
        ? raw
        : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || displayImages.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx > 0) goTo(currentIndex - 1);
    else goTo(currentIndex + 1);
  };

  return (
    <>
      <article className="premium-card group relative flex h-full flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone">
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="scroll-rail flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((img, idx) => (
              <Link
                key={idx}
                to={`/product/${product.id}`}
                className="h-full w-full shrink-0 snap-center focus:outline-none"
                aria-label={`Open ${product.name}`}
              >
                <img
                  src={img}
                  alt={`${product.name} - ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES.placeholder;
                  }}
                />
              </Link>
            ))}
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToImage((currentIndex - 1 + displayImages.length) % displayImages.length);
                }}
                className="absolute left-1.5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow opacity-0 transition-all group-hover:opacity-100 sm:flex"
                aria-label="Previous image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToImage((currentIndex + 1) % displayImages.length);
                }}
                className="absolute right-1.5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow opacity-0 transition-all group-hover:opacity-100 sm:flex"
                aria-label="Next image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                {displayImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToImage(idx);
                    }}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute left-1.5 top-1.5 z-10 max-w-[70%]">
            <span className="inline-block max-w-full truncate rounded-md bg-white/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink shadow-sm">
              {product.category}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(currentIndex);
            }}
            className="absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-opacity sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover:opacity-100"
            title="Quick view"
            aria-label="Quick view"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-2 sm:gap-2 sm:p-3.5">
          <Link to={`/product/${product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-[11px] font-bold leading-snug text-ink transition-colors group-hover:text-forest sm:text-sm">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
            <p className="truncate text-[12px] font-black tracking-tight text-ink sm:text-base">
              {formatRwf(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`btn-buy py-2 text-[10px] sm:py-2.5 sm:text-[11px] ${added ? 'btn-buy-added' : ''}`}
          >
            {added ? (
              <>
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="sm:hidden">Buy</span>
                <span className="hidden sm:inline">Add to cart</span>
              </>
            )}
          </button>
        </div>
      </article>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
            aria-label="Close"
            onClick={closeModal}
          />

          <div className="relative flex h-[min(100dvh,100%)] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-stone shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl animate-[fadeUp_0.28s_ease-out]">
            {/* Top bar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-forest">
                  {product.category}
                </p>
                <h2 className="truncate text-sm font-bold text-ink sm:text-base">{product.name}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-full bg-stone px-2.5 py-1 text-xs font-black text-ink">
                  {formatRwf(product.price)}
                </span>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white active:scale-95"
                  aria-label="Close viewer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image stage */}
            <div
              className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-stone to-white"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="relative flex min-h-[42dvh] flex-1 items-center justify-center overflow-hidden px-3 py-4 sm:min-h-[420px] sm:px-8 sm:py-6">
                <img
                  src={displayImages[currentIndex]}
                  alt={`${product.name} gallery`}
                  className="max-h-[52dvh] w-auto max-w-full object-contain transition-transform duration-300 ease-out sm:max-h-[58vh]"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                  draggable={false}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES.placeholder;
                  }}
                />

                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => goTo(currentIndex - 1)}
                      className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg active:scale-95 sm:left-4 sm:h-12 sm:w-12"
                      aria-label="Previous"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo(currentIndex + 1)}
                      className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg active:scale-95 sm:right-4 sm:h-12 sm:w-12"
                      aria-label="Next"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Controls — even grid on phone */}
              <div className="shrink-0 border-t border-ink/10 bg-white/95 px-3 py-3 backdrop-blur sm:px-4">
                <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r - 90)}
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-stone text-ink active:bg-sand"
                    title="Rotate left"
                  >
                    <svg className="h-4 w-4 -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="text-[9px] font-bold">Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-stone text-ink active:bg-sand"
                    title="Rotate right"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="text-[9px] font-bold">Right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))}
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-stone text-ink active:bg-sand"
                    title="Zoom in"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                    </svg>
                    <span className="text-[9px] font-bold">Zoom+</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-stone text-ink active:bg-sand"
                    title="Zoom out"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                    <span className="text-[9px] font-bold">Zoom−</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotation(0);
                      setScale(1);
                    }}
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-ink text-white active:scale-95"
                    title="Reset"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
                    </svg>
                    <span className="text-[9px] font-bold">Reset</span>
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-ink/50">
                  <span>
                    {currentIndex + 1} / {displayImages.length}
                    {rotation !== 0 ? ` · ${rotation % 360}°` : ''}
                    {scale !== 1 ? ` · ${Math.round(scale * 100)}%` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={openFullImage}
                    className="rounded-full bg-stone px-3 py-1 text-[10px] font-bold text-ink active:bg-sand"
                  >
                    Open full size
                  </button>
                </div>

                {displayImages.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {displayImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          currentIndex === i
                            ? 'border-forest shadow-md'
                            : 'border-transparent opacity-55'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="shrink-0 space-y-2 border-t border-ink/10 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
              <p className="line-clamp-2 text-xs leading-relaxed text-ink/60 sm:text-sm">
                {product.description ||
                  'Premium AFROLUXO piece — tap rotate to check every side of the look.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/product/${product.id}`}
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white py-3 text-[11px] font-bold text-ink active:scale-[0.98]"
                >
                  Full details
                </Link>
                <button
                  type="button"
                  onClick={() => handleAddToCart()}
                  className={`btn-buy py-3 text-[11px] ${added ? 'btn-buy-added' : ''}`}
                >
                  {added ? 'Added' : 'Add to cart'}
                </button>
              </div>
            </div>

            {added && (
              <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-bold text-white shadow-xl">
                Added to cart
                <Link to="/cart" onClick={closeModal} className="underline">
                  View
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}