import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatRwf } from '../../utils/format';
import { CONTACT_RAW, INQUIRY_EMAIL } from '../../utils/whatsapp';
import { useState, useRef, useEffect } from 'react';

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Prioritize imageUrls list, then fallback to imageUrl
  const displayImages = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : ['https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image']);

  const [rotations, setRotations] = useState<Record<number, number>>({});

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotations(prev => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + 90
    }));
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

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/products?search=${encodeURIComponent(product.name)}`;
    const priceText = formatRwf(product.price);
    const message = `*I'm interested in this product*\n\n*Name:* ${product.name}\n*Price:* ${priceText}\n*Category:* ${product.category}\n*Link:* ${productUrl}\n\n${displayImages[currentIndex]}`;
    const whatsappUrl = `https://wa.me/${CONTACT_RAW}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = encodeURIComponent(`Inquiry about ${product.name}`);
    const body = encodeURIComponent(`Hello, I'm interested in the following product:\n\nName: ${product.name}\nPrice: ${formatRwf(product.price)}\n\nPlease provide more details.\n\nProduct Link: ${window.location.origin}/products?id=${product.id}`);
    window.location.href = `mailto:josephnkurunziza642@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <article className="premium-card group relative flex flex-col">
        {/* Image Slider Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((img, idx) => (
              <div key={idx} className="h-full w-full shrink-0 snap-center">
                <Link to={`/product/${product.id}`} className="block h-full w-full">
                  <img
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation Arrows (Shows on Hover) */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollToImage((currentIndex - 1 + displayImages.length) % displayImages.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md transition-all opacity-0 group-hover:opacity-100 hover:bg-white"
                aria-label="Previous image"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollToImage((currentIndex + 1) % displayImages.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md transition-all opacity-0 group-hover:opacity-100 hover:bg-white"
                aria-label="Next image"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {/* Slider Indicators */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 z-10">
              {displayImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); scrollToImage(idx); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-1.5 bg-white/40 hover:bg-white'}`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute left-6 top-6 z-10">
            <span className="glass inline-flex items-center rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-xl">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <div className="mb-2">
            <h3 className="line-clamp-2 text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-[1.2] tracking-tight">
              {product.name}
            </h3>
            <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
              {product.description || 'No description available for this premium piece.'}
            </p>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter">
              {formatRwf(product.price)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleAddToCart}
              className={`shimmer-on-hover w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 shadow-lg ${added
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30'
                }`}
            >
              {added ? (
                <>
                  <svg className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Added
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Buy now
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsApp}
                className="shimmer-on-hover group/btn flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-[9px] font-black tracking-widest uppercase text-white transition-all hover:bg-[#20bd5a] active:scale-95 shadow-lg shadow-[#25D366]/20"
              >
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handleEmail}
                className="group/btn flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-[9px] font-black tracking-widest uppercase text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/10"
              >
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
            </div>
          </div>
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
                  className="max-w-[90%] max-h-[80%] lg:max-w-full lg:max-h-full object-contain transition-all duration-700 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] rounded-[2.5rem] relative z-10 hover:scale-[1.02]"
                  style={{ transform: `rotate(${rotations[currentIndex] || 0}deg)` }}
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
                      <img src={img} className="w-full h-full object-cover" alt="" />
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

                <div className="mt-auto space-y-4 pt-10 border-t border-slate-100">
                  <button
                    onClick={handleAddToCart}
                    className={`shimmer-on-hover w-full flex items-center justify-center gap-3 rounded-[1.5rem] py-5 text-[11px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 shadow-2xl ${added
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/40'
                      }`}
                  >
                    {added ? (
                      <>
                        <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Added to bag
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        Add to bag
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3 pb-4">
                    <button
                      onClick={handleWhatsApp}
                      className="group/btn flex items-center justify-center gap-2 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-[#065f46] hover:bg-emerald-100 transition-all active:scale-95"
                    >
                      <svg className="h-4 w-4 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Chat
                    </button>
                    <button
                      onClick={handleEmail}
                      className="group/btn flex items-center justify-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                    >
                      <svg className="h-4 w-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Inquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
