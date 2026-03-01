import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    const productUrl = `${window.location.origin}/products/${product.id}`;
    const priceText = formatRwf(product.price);
    const message = `*I'm interested in this product*\n\n*Name:* ${product.name}\n*Price:* ${priceText}\n*Link:* ${productUrl}\n\n${displayImages[currentIndex]}`;
    const whatsappUrl = `https://wa.me/${CONTACT_RAW}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Inquiry: ${product.name}`;
    const body = `Hello,\n\nI am interested in ${product.name} which is priced at ${formatRwf(product.price)}.\n\nProduct Link: ${window.location.origin}/products/${product.id}\n\nPlease provide more details.\n\nThank you.`;
    const mailto = `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
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
      <article className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
        {/* Image Slider Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 cursor-pointer" onClick={() => setShowModal(true)}>
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((img, idx) => (
              <div key={idx} className="h-full w-full shrink-0 snap-center">
                <img
                  src={img}
                  alt={`${product.name} - ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
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
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-orange-500' : 'w-2 bg-white/60 hover:bg-white'}`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute left-6 top-6 z-10">
            <span className="inline-flex items-center rounded-2xl bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 backdrop-blur-sm shadow-sm">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <div className="mb-1">
            <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[10px] sm:text-xs leading-relaxed text-slate-500">
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg sm:text-xl font-black text-slate-900">
                {formatRwf(product.price)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black tracking-wide transition-all duration-300 active:scale-95 shadow-lg ${added
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30'
                  }`}
              >
                {added ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Added!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Add to Cart
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="group/btn flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-2 py-2 text-[9px] font-black text-white shadow-md shadow-[#25D366]/10 transition-all hover:bg-[#128C7E] active:scale-95"
                >
                  <svg className="h-3 w-3 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat Now
                </button>
                <button
                  onClick={handleEmail}
                  className="group/btn flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-2 py-2 text-[9px] font-black text-white shadow-md shadow-orange-500/10 transition-all hover:bg-orange-600 active:scale-95"
                >
                  <svg className="h-3 w-3 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Modal Gallery */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300">
          <div className="absolute right-8 top-8 z-[110] flex gap-2">
            <button
              onClick={handleRotate}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
              title="Rotate image"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
              aria-label="Close modal"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="relative flex h-full w-full items-center justify-center px-4 md:px-20">
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((currentIndex - 1 + displayImages.length) % displayImages.length)}
                  className="absolute left-6 top-1/2 z-[110] -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 md:left-12"
                  aria-label="Previous image"
                >
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % displayImages.length)}
                  className="absolute right-6 top-1/2 z-[110] -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 md:right-12"
                  aria-label="Next image"
                >
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            <div className="flex h-full w-full items-center justify-center p-4">
              <img
                src={displayImages[currentIndex]}
                alt={`${product.name} - Full screen`}
                style={{ transform: `rotate(${rotations[currentIndex] || 0}deg)` }}
                className="max-h-[85vh] max-w-full rounded-3xl object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)] transition-all duration-500"
              />
            </div>

            {/* Modal Thumbnails */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-3 z-[110] max-w-[90vw] overflow-x-auto pb-4 scrollbar-hide">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 transition-all duration-300 ${idx === currentIndex ? 'border-orange-500 scale-110 shadow-lg' : 'border-white/20 opacity-40 hover:opacity-100'
                      }`}
                  >
                    <img src={img} className="h-full w-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
