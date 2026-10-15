import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatRwf } from '../../utils/format';
import { SAMPLE_IMAGES } from '../../config/brand';
import { orderProductOnWhatsApp } from '../../utils/orderWhatsApp';
import { useState, useRef, useEffect, useCallback } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  stock?: number;
  /** Original price before discount — shows SALE badge when higher than price */
  compareAtPrice?: number;
  /** Visible customer reviews (from API) */
  reviewCount?: number;
  avgRating?: number;
};

function ReviewBadge({ count, avg }: { count?: number; avg?: number }) {
  const n = count || 0;
  if (n <= 0) return null;
  return (
    <span
      className="absolute bottom-1.5 left-1.5 z-10 inline-flex max-w-[calc(100%-0.75rem)] items-center gap-0.5 rounded-full bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm sm:bottom-2 sm:left-2 sm:gap-1 sm:px-2 sm:py-1 sm:text-[10px]"
      title={`${avg || 0} average · ${n} review${n === 1 ? '' : 's'}`}
    >
      <svg className="h-2.5 w-2.5 shrink-0 text-amber-400 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="tabular-nums">{avg ? avg.toFixed(1) : '—'}</span>
      <span className="text-white/70">·</span>
      <span className="tabular-nums">{n}</span>
    </span>
  );
}

interface ProductCardProps {
  product: Product;
  /** Card with image, wishlist, SALE badge, WhatsApp order CTA */
  variant?: 'default' | 'shop';
}

const WISHLIST_KEY = 'afroluxo_wishlist';

function readWishlist(): Set<string> {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function writeWishlist(ids: Set<string>) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify([...ids]));
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { openCheckout } = useCheckout();
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setWishlisted(readWishlist().has(product.id));
    setImgFailed(false);
  }, [product.id]);

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
    openCheckout([{ product, quantity: 1 }]);
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

  const soldOut = typeof product.stock === 'number' && product.stock <= 0;
  const isShop = variant === 'shop';
  const onSale =
    typeof product.compareAtPrice === 'number' &&
    product.compareAtPrice > product.price;
  const hasImage = Boolean(displayImages[0]) && !imgFailed;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = readWishlist();
    if (next.has(product.id)) next.delete(product.id);
    else next.add(product.id);
    writeWishlist(next);
    setWishlisted(next.has(product.id));
  };

  const orderOnWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    orderProductOnWhatsApp(product, { isAuthenticated, openAuthModal, user });
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

  if (isShop) {
    const waIcon = (
      <svg className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.86 11.86 0 0012.01 0C5.4 0 .05 5.35.05 11.96c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62a11.93 11.93 0 005.8 1.48h.01c6.61 0 11.96-5.35 11.96-11.96 0-3.19-1.24-6.19-3.45-8.42zM12 21.5a9.5 9.5 0 01-4.85-1.33l-.35-.21-3.68.96.98-3.58-.23-.37A9.47 9.47 0 012.5 12C2.5 6.76 6.76 2.5 12 2.5S21.5 6.76 21.5 12 17.24 21.5 12 21.5zm5.2-7.07c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4-.84-.74-1.4-1.66-1.57-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.17.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.48h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.02c.14.19 2.01 3.07 4.87 4.3.68.3 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.11-.26-.18-.54-.32z" />
      </svg>
    );

    return (
      <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Link to={`/product/${product.id}`} className="absolute inset-0 block" aria-label={`Open ${product.name}`}>
            {hasImage ? (
              <img
                src={displayImages[0]}
                alt={product.name}
                className={`h-full w-full object-cover object-center transition duration-400 group-hover:scale-[1.04] ${soldOut ? 'opacity-70' : ''}`}
                loading="lazy"
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-neutral-400">
                No image
              </span>
            )}
          </Link>

          {onSale && !soldOut && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded bg-[#e91e63] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
          {soldOut && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-white/95 px-2 py-0.5 text-[9px] text-neutral-600">
              Sold out
            </span>
          )}

          <ReviewBadge count={product.reviewCount} avg={product.avgRating} />

          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm touch-manipulation"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill={wishlisted ? '#e91e63' : 'none'}
              stroke={wishlisted ? '#e91e63' : '#222'}
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 p-1.5 sm:gap-1 sm:p-2">
          <Link to={`/product/${product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-[10px] font-semibold leading-snug text-black sm:text-[12px]">
              {product.name}
            </h3>
          </Link>

          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1">
            <span className="text-[11px] font-bold tabular-nums text-black sm:text-[13px]">
              {formatRwf(product.price)}
            </span>
            {onSale && (
              <span className="text-[9px] tabular-nums text-neutral-400 line-through sm:text-[10px]">
                {product.compareAtPrice!.toLocaleString()}
              </span>
            )}
          </div>

          {!soldOut && typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5 && (
            <p className="text-[9px] font-medium text-amber-700 sm:text-[10px]">
              Only {product.stock} left
            </p>
          )}

          {soldOut ? (
            <button
              type="button"
              disabled
              className="mt-1 inline-flex w-full min-h-[32px] items-center justify-center rounded-full bg-neutral-200 px-1 text-[9px] font-semibold text-neutral-500"
            >
              Sold out
            </button>
          ) : (
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex min-h-[32px] min-w-0 flex-1 items-center justify-center rounded-full bg-black px-1.5 text-[9px] font-semibold text-white touch-manipulation active:scale-[0.98] hover:bg-neutral-800 sm:min-h-[34px] sm:text-[10px]"
              >
                {added ? 'Added' : 'Order now'}
              </button>
              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white touch-manipulation active:scale-[0.98] hover:bg-[#1ebe57] sm:h-[34px] sm:w-auto sm:gap-1 sm:px-2.5"
                aria-label="Order via WhatsApp"
                title="Order via WhatsApp"
              >
                {waIcon}
                <span className="hidden text-[10px] font-semibold sm:inline">WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

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

          {soldOut ? (
            <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-neutral-200/95 px-2.5 py-1 text-[11px] text-neutral-700">
              Sold out
            </span>
          ) : (
            <div className="absolute left-1.5 top-1.5 z-10 max-w-[70%]">
              <span className="inline-block max-w-full truncate rounded-md bg-white/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink shadow-sm">
                {product.category}
              </span>
            </div>
          )}

          <ReviewBadge count={product.reviewCount} avg={product.avgRating} />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(currentIndex);
            }}
            className="absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-opacity sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover:opacity-100"
            title="Quick view"
            aria-label="Quick view"
            style={soldOut ? { top: '2.5rem' } : undefined}
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
            disabled={soldOut}
            className={`btn-buy py-2 text-[10px] sm:py-2.5 sm:text-[11px] ${added ? 'btn-buy-added' : ''} ${soldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {soldOut ? (
              <span>Sold out</span>
            ) : added ? (
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