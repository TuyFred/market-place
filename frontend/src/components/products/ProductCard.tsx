import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatRwf } from '../../utils/format';
import { SAMPLE_IMAGES } from '../../config/brand';
import { useState, useRef } from 'react';

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
  const sliderRef = useRef<HTMLDivElement>(null);

  // Prioritize imageUrls list, then fallback to imageUrl
  const displayImages = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : [SAMPLE_IMAGES.placeholder]);

  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [scales, setScales] = useState<Record<number, number>>({});

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotations(prev => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + 90
    }));
  };

  const handleZoom = (delta: number) => {
    setScales((prev) => ({
      ...prev,
      [currentIndex]: Math.max(0.5, Math.min(4, (prev[currentIndex] || 1) + delta))
    }));
  };

  const handleResetView = () => {
    setScales((prev) => ({ ...prev, [currentIndex]: 1 }));
    setRotations((prev) => ({ ...prev, [currentIndex]: 0 }));
  };

  const scrollToImage = (index: number) => {
    if (sliderRef.current) {
      const width = sliderRef.current.clientWidth;
      sliderRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = () => {
    if (sliderRef.current) {
      const width = sliderRef.current.clientWidth;
      const index = Math.round(sliderRef.current.scrollLeft / width);
      setCurrentIndex(index);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <article className="premium-card group relative flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone">
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-rail"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((img, idx) => (
              <div key={idx} className="h-full w-full shrink-0 snap-center">
                <Link to={`/product/${product.id}`} className="block h-full w-full">
                    <img
                      src={img}
                      alt={`${product.name} - ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES.placeholder; }}
                    />
                </Link>
              </div>
            ))}
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollToImage((currentIndex - 1 + displayImages.length) % displayImages.length); }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollToImage((currentIndex + 1) % displayImages.length); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 z-10">
                {displayImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); scrollToImage(idx); }}
                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'}`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute left-1.5 top-1.5 z-10 max-w-[75%]">
            <span className="inline-block truncate max-w-full rounded-md bg-white/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink shadow-sm">
              {product.category}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="absolute right-1.5 top-1.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            title="Quick view"
            aria-label="Quick view"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-2 sm:p-3.5 gap-1.5 sm:gap-2">
          <Link to={`/product/${product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-[11px] sm:text-sm font-bold text-ink leading-snug group-hover:text-forest transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
            <p className="text-[12px] sm:text-base font-black text-ink tracking-tight truncate">
              {formatRwf(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`btn-buy py-2 sm:py-2.5 text-[10px] sm:text-[11px] ${added ? 'btn-buy-added' : ''}`}
          >
            {added ? (
              <>
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <span>Added</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span className="sm:hidden">Buy</span>
                <span className="hidden sm:inline">Add to cart</span>
              </>
            )}
          </button>
        </div>
      </article>

      {/* Modal Gallery / Details Viewer */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-all duration-500"
            onClick={() => setShowModal(false)}
          />

          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[2.5rem] bg-white/95 border border-white/20 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row transition-all duration-700 scale-in-center backdrop-blur-sm">

            {/* Standard Close Button for Desktop */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 z-50 hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/50 text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xl transition-all active:scale-90 border border-slate-200/50"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Left: Image / Gallery Section */}
            <div className="w-full lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col min-h-[350px] sm:min-h-[450px] lg:min-h-[600px]">

              {/* Floating Toolbar */}
              <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
                <button
                  onClick={handleRotate}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
                  title="Rotate image"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoom(0.25); }}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
                  title="Zoom in"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoom(-0.25); }}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
                  title="Zoom out"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleResetView(); }}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
                  title="Reset view"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6"/><path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-6h-6"/></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); const raw = displayImages[currentIndex] || ''; const src = raw.startsWith('http') || raw.startsWith('//') ? raw : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`; window.open(src, '_blank', 'noopener,noreferrer'); }}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
                  title="Open image in new tab"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6m0-6L10 14" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21H3V3" /></svg>
                </button>
                <div className="glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white/90 shadow-xl border border-indigo-100/50">
                  {product.category}
                </div>
              </div>

              {/* Mobile Close Button (More accessible on top right) */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 z-10 lg:hidden h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-white/90 text-slate-800 backdrop-blur-md hover:bg-white shadow-xl transition-all active:scale-90 border border-slate-200/50"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />

                <img
                  src={displayImages[currentIndex]}
                  className="max-w-[90%] max-h-[80%] lg:max-w-full lg:max-h-full object-contain transition-all duration-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] rounded-[2.5rem] relative z-10"
                  style={{ transform: `rotate(${rotations[currentIndex] || 0}deg) scale(${scales[currentIndex] || 1})` }}
                  alt={`${product.name} gallery`}
                />

                {/* Navigation Arrows */}
                {displayImages.length > 1 && (
                  <div className="absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                    <button
                      onClick={() => setCurrentIndex((currentIndex - 1 + displayImages.length) % displayImages.length)}
                      className="pointer-events-auto h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-2xl transition-all hover:bg-white hover:scale-110 active:scale-90 border border-slate-100/50"
                    >
                      <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      onClick={() => setCurrentIndex((currentIndex + 1) % displayImages.length)}
                      className="pointer-events-auto h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-2xl transition-all hover:bg-white hover:scale-110 active:scale-90 border border-slate-100/50"
                    >
                      <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Thumbnails (Scrollable on Mobile) */}
              {displayImages.length > 1 && (
                <div className="px-6 py-4 sm:p-8 flex items-center justify-start lg:justify-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide bg-white/30 backdrop-blur-md border-t border-slate-200/20">
                  {displayImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-14 w-14 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 sm:border-4 transition-all duration-500 shrink-0 ${currentIndex === i ? 'border-indigo-500 scale-105 shadow-xl shadow-indigo-500/20' : 'border-white opacity-40 hover:opacity-100 hover:scale-105'}`}
                    >
                      <img src={img} className="w-full h-full object-contain bg-stone" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Detailed Info Section */}
            <div className="w-full lg:w-[480px] h-full flex flex-col bg-white overflow-y-auto">
              <div className="p-8 sm:p-10 flex flex-col gap-8 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="h-px w-8 bg-slate-900"></span>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Product Details</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    {product.name}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Price Plate */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing Price</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                          {formatRwf(product.price)}
                        </span>
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      Description
                      <span className="h-px flex-1 bg-slate-100"></span>
                    </h4>
                    <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                      {product.description || 'This premium item is carefully selected for our curated catalog. It features high-quality materials and craftsmanship that stands out in any setting.'}
                    </p>
                  </div>

                  {/* Badges/Highlights (Added for visual interest) */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Premium Quality', 'Verified Seller', 'Quick Delivery'].map((badge) => (
                      <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-4 pt-10 border-t border-slate-100 pb-4">
                  <button
                    onClick={handleAddToCart}
                    className={`btn-buy py-3.5 text-[11px] uppercase tracking-wider ${added ? 'btn-buy-added' : ''}`}
                  >
                    {added ? (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Added to cart
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        Add to cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* In-modal toast confirmation */}
          {added && (
            <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full bg-forest px-4 py-2 text-white shadow-2xl">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="font-bold">Added to cart</span>
              <Link to="/cart" onClick={() => setShowModal(false)} className="ml-2 underline font-semibold">View cart</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
