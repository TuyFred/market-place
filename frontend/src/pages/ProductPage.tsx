import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_IMAGES } from '../config/brand';
import { formatRwf } from '../utils/format';
import { orderProductOnWhatsApp } from '../utils/orderWhatsApp';
import { AppBackButton } from '../components/layout/AppBackButton';
import { ProductReviews } from '../components/products/ProductReviews';

export function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { openCheckout } = useCheckout();
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentIndex(0);
    setAdded(false);
    setImgFailed(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    axios
      .get(`/api/products/${id}`)
      .then(async (res) => {
        const prod = res.data as Product;
        if (cancelled) return;
        setProduct(prod);
        try {
          const r = await axios.get<Product[]>('/api/products', {
            params: { category: prod.category },
          });
          if (!cancelled) {
            setRelated((r.data || []).filter((p) => p.id !== prod.id).slice(0, 8));
          }
        } catch {
          if (!cancelled) setRelated([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setRelated([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-sm text-neutral-500">Loading…</div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg font-semibold text-black">Product not found</p>
        <p className="mt-2 text-sm text-neutral-500">This item may have been removed.</p>
        <div className="mt-6">
          <AppBackButton to="/products" label="Back to catalog" />
        </div>
      </div>
    );
  }

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [SAMPLE_IMAGES.placeholder];
  const active = imgFailed ? SAMPLE_IMAGES.placeholder : images[currentIndex] || SAMPLE_IMAGES.placeholder;

  const buyNow = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    addToCart(product);
    openCheckout([{ product, quantity: 1 }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const orderOnWhatsApp = () => {
    orderProductOnWhatsApp(product, { isAuthenticated, openAuthModal, user });
  };

  return (
    <section className="bg-white text-black">
      <div className="mx-auto w-full max-w-6xl px-3 pb-12 pt-4 sm:px-6 sm:pt-8 lg:px-10">
        <AppBackButton to="/products" label="Back to products" />

        <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <img
                src={active}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={() => setImgFailed(true)}
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(i);
                      setImgFailed(false);
                    }}
                    className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${
                      i === currentIndex ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {product.category}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="mt-3 text-xl font-semibold">{formatRwf(product.price)}</p>
            {(product.reviewCount || 0) > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-600">
                <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-black">{(product.avgRating || 0).toFixed(1)}</span>
                <span className="text-neutral-400">·</span>
                <span>
                  {product.reviewCount} review{(product.reviewCount || 0) === 1 ? '' : 's'}
                </span>
              </p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              {product.description || 'Premium AFROLUXO piece — order online or via WhatsApp.'}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={buyNow}
                className="min-h-[48px] flex-1 bg-black px-6 text-sm font-semibold text-white"
              >
                {added ? 'Added — checkout' : 'Order now'}
              </button>
              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="min-h-[48px] flex-1 border border-neutral-200 px-6 text-sm font-semibold text-black"
              >
                Order via WhatsApp
              </button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-neutral-500">
              <li>Pay by bank transfer, mobile money, or PayPal</li>
              <li>Admin confirms payment before shipping</li>
              <li>WhatsApp support available anytime</li>
            </ul>
          </div>
        </div>

        {product.id && <ProductReviews productId={product.id} />}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-bold">You may also like</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} variant="shop" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
