import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_IMAGES } from '../config/brand';
import { formatRwf } from '../utils/format';

export function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const zoom = (d: number) => setScale((s) => Math.max(0.5, Math.min(4, s + d)));
  const rotate = (d: number) => setRotation((r) => r + d);
  const resetView = () => { setScale(1); setRotation(0); };

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        return res.data;
      })
      .then((prod) => {
        if (!prod) return;
        axios.get<Product[]>('/api/products', { params: { category: prod.category } })
          .then((r) => {
            const items = (r.data || []).filter((p) => p.id !== prod.id).slice(0, 6);
            setRelated(items);
          })
          .catch(() => setRelated([]));
      })
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return (
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        <div className="mb-4">
          <Link to="/products" className="text-sm text-forest font-semibold">Back to clothes</Link>
        </div>
        <div className="text-ink/50">Loading product...</div>
      </section>
    );
  }

  const gallery = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : [product.imageUrl || SAMPLE_IMAGES.placeholder];
  const raw = gallery[currentIndex] || SAMPLE_IMAGES.placeholder;
  const imgUrl = raw.startsWith('http') || raw.startsWith('//') ? raw : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl text-ink">{product.name}</h1>
          <p className="text-xs sm:text-sm text-ink/50">{product.category}</p>
        </div>
        <div className="text-lg sm:text-xl font-bold text-ink">{formatRwf(product.price)}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-ink/5 relative">
          <div className="flex items-center justify-center p-3 sm:p-4 min-h-[240px] sm:min-h-[360px] bg-stone">
            <img
              src={imgUrl}
              alt={product.name}
              className="max-w-full max-h-[360px] sm:max-h-[420px] object-contain transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 overflow-x-auto scrollbar-hide border-t border-ink/5">
              <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} className="px-3 py-1.5 rounded-full bg-stone text-xs font-semibold shrink-0">Prev</button>
              {gallery.map((u, i) => (
                <button key={`${u}-${i}`} type="button" onClick={() => setCurrentIndex(i)} className={`w-14 h-12 overflow-hidden rounded-lg shrink-0 ${i === currentIndex ? 'ring-2 ring-forest' : 'border border-ink/10'}`}>
                  <img src={u} className="w-full h-full object-contain bg-stone" alt="" />
                </button>
              ))}
              <button type="button" onClick={() => setCurrentIndex((i) => Math.min(gallery.length - 1, i + 1))} className="px-3 py-1.5 rounded-full bg-stone text-xs font-semibold shrink-0">Next</button>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button type="button" onClick={() => zoom(0.25)} className="bg-white/90 p-2 rounded-full shadow text-sm font-bold">+</button>
            <button type="button" onClick={() => zoom(-0.25)} className="bg-white/90 p-2 rounded-full shadow text-sm font-bold">−</button>
            <button type="button" onClick={() => rotate(90)} className="bg-white/90 p-2 rounded-full shadow text-sm">↻</button>
            <button type="button" onClick={resetView} className="bg-white/90 px-2 py-1 rounded-full shadow text-[10px] font-bold">Reset</button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm sm:text-base text-ink/70 leading-relaxed">
            {product.description || 'Premium AFROLUXO piece selected for quality and style.'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) { openAuthModal('login'); return; }
              addToCart(product);
              alert('Added to cart');
            }}
            className="btn-buy py-3.5 text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Add to cart
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="font-display text-lg sm:text-2xl mb-3 sm:mb-4">Related clothes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
