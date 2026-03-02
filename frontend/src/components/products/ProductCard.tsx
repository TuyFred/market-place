import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRwf } from '../../utils/format';
import { CONTACT_RAW, INQUIRY_EMAIL } from '../../utils/whatsapp';
import { useState, useRef, useEffect } from 'react';
import { OrderFormInline } from '../orders/OrderFormInline';

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

      {/* Modal Gallery / Details Viewer */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl flex flex-col lg:flex-row">
            {/* Left: Image / Gallery Section */}
            <div className="flex-1 relative bg-slate-50 flex flex-col min-h-[350px]">
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <button
                  onClick={handleRotate}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/80 text-slate-800 backdrop-blur-md hover:bg-white shadow-lg transition-all active:scale-90"
                  title="Rotate image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 z-10 h-12 w-12 flex items-center justify-center rounded-2xl bg-white/80 text-slate-800 backdrop-blur-md hover:bg-white shadow-lg transition-all active:scale-90 lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                <img
                  src={displayImages[currentIndex]}
                  className="max-w-full max-h-full object-contain transition-all duration-500 shadow-2xl rounded-3xl"
                  style={{ transform: `rotate(${rotations[currentIndex] || 0}deg)` }}
                  alt={`${product.name} gallery`}
                />
              </div>

              {/* Navigation Arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((currentIndex - 1 + displayImages.length) % displayImages.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-xl transition-all hover:bg-white active:scale-90"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex((currentIndex + 1) % displayImages.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-xl transition-all hover:bg-white active:scale-90"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {/* Modal Thumbnails */}
              {displayImages.length > 1 && (
                <div className="p-6 flex justify-center gap-3 overflow-x-auto scrollbar-hide bg-white/50 backdrop-blur-sm border-t border-slate-200/50">
                  {displayImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-20 w-20 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${currentIndex === i ? 'border-orange-500 scale-110 shadow-lg' : 'border-white opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Detailed Info Section */}
            <div className="w-full lg:w-[450px] p-8 sm:p-10 flex flex-col gap-8 overflow-y-auto bg-white border-l border-slate-100">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-2xl bg-orange-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-orange-600 border border-orange-100">
                    {product.category}
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                    {product.name}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Price</span>
                  <span className="text-3xl font-black text-slate-900">
                    {formatRwf(product.price)}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Details</h4>
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">
                    {product.description || 'No description available for this product. Our items are crafted with quality and care to ensure the best experience for our customers.'}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-4 pt-6">
                <button
                  onClick={handleAddToCart}
                  className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black tracking-wide transition-all duration-300 active:scale-95 shadow-xl ${added
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/40'
                    }`}
                >
                  {added ? (
                    <>
                      <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Added to Your Cart
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      Add to Shopping Cart
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-100/50">
                  <OrderFormInline product={product} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100/50">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-[11px] font-black text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#128C7E] active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Chat
                  </button>
                  <button
                    onClick={handleEmail}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-[11px] font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Inquiry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
