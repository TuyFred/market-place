import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import { useAuth } from '../context/AuthContext';
import { DEMO_PRODUCTS, SAMPLE_IMAGES, getDemoProducts } from '../config/brand';
import { formatRwf } from '../utils/format';
import { buildProductWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { fetchImageBlob } from '../utils/image';

function demoAsProduct(id: string): Product | null {
  const d = DEMO_PRODUCTS.find((p) => p.id === id);
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    price: d.price,
    category: d.category,
    description: d.description,
    imageUrl: d.imageUrl,
    imageUrls: [d.imageUrl],
  };
}

function relatedFromDemo(product: Product): Product[] {
  const demo = DEMO_PRODUCTS.find((p) => p.id === product.id);
  const slug = demo?.categorySlug;
  const pool = slug
    ? getDemoProducts(slug)
    : DEMO_PRODUCTS.filter(
        (p) => p.category === product.category || p.categorySlug === product.category,
      );
  return pool
    .filter((p) => p.id !== product.id)
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      category: d.category,
      description: d.description,
      imageUrl: d.imageUrl,
      imageUrls: [d.imageUrl],
    }));
}

export function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { openCheckout } = useCheckout();
  const { isAuthenticated, openAuthModal } = useAuth();
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

    const applyRelated = async (prod: Product) => {
      try {
        const r = await axios.get<Product[]>('/api/products', {
          params: { category: prod.category },
        });
        const fromApi = (r.data || []).filter((p) => p.id !== prod.id).slice(0, 8);
        if (!cancelled) {
          setRelated(fromApi.length ? fromApi : relatedFromDemo(prod));
        }
      } catch {
        if (!cancelled) setRelated(relatedFromDemo(prod));
      }
    };

    if (id.startsWith('demo-')) {
      const demo = demoAsProduct(id);
      if (!cancelled) {
        setProduct(demo);
        setRelated(demo ? relatedFromDemo(demo) : []);
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    axios
      .get(`/api/products/${id}`)
      .then(async (res) => {
        const prod = res.data as Product;
        if (cancelled) return;
        setProduct(prod);
        await applyRelated(prod);
      })
      .catch(() => {
        const demo = demoAsProduct(id);
        if (!cancelled) {
          setProduct(demo);
          setRelated(demo ? relatedFromDemo(demo) : []);
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
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-neutral-200" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-[4/5] rounded-2xl bg-neutral-100" />
            <div className="space-y-3 pt-2">
              <div className="h-8 w-3/4 rounded bg-neutral-200" />
              <div className="h-5 w-1/3 rounded bg-neutral-200" />
              <div className="h-24 w-full rounded bg-neutral-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 text-center">
        <p className="text-lg font-semibold text-black">Product not found</p>
        <Link to="/" className="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">
          Back to shop
        </Link>
      </section>
    );
  }

  const gallery =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || SAMPLE_IMAGES.placeholder];
  const activeSrc = imgFailed ? SAMPLE_IMAGES.placeholder : gallery[currentIndex] || SAMPLE_IMAGES.placeholder;

  const handleAdd = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    addToCart(product);
    openCheckout([{ product, quantity: 1 }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const orderOnWhatsApp = async () => {
    const price = formatRwf(product.price);
    const imageUrl = product.imageUrl || product.imageUrls?.[0] || '';
    const body = buildProductWhatsAppMessage({
      name: product.name,
      priceLabel: price,
      category: product.category,
      productId: product.id,
      imageUrl,
    });
    if (navigator.share && imageUrl) {
      try {
        const blob = await fetchImageBlob(imageUrl, product.id);
        const ext = (blob.type && blob.type.split('/')?.[1]) || 'jpg';
        const file = new File([blob], `${product.name.replace(/\s+/g, '_')}.${ext}`, {
          type: blob.type || 'image/jpeg',
        });
        if ((navigator as any).canShare?.({ files: [file] })) {
          await (navigator as any).share({ files: [file], text: body });
          return;
        }
      } catch {
        /* fall through */
      }
    }
    openWhatsApp(body);
  };

  return (
    <section className="bg-white text-black">
      <div className="mx-auto w-full max-w-6xl px-3 pb-12 pt-4 sm:px-6 sm:pt-8 lg:px-10">
        <Link
          to="/"
          className="inline-flex min-h-[40px] items-center text-[13px] font-medium text-neutral-500 hover:text-black"
        >
          ← Back to Products
        </Link>

        <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-2 lg:gap-10">
          {/* Gallery */}
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
              <div className="flex aspect-[4/5] items-center justify-center sm:aspect-square">
                <img
                  src={activeSrc}
                  alt={product.name}
                  className="h-full w-full object-cover object-top"
                  onError={() => setImgFailed(true)}
                />
              </div>
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {gallery.map((u, i) => (
                  <button
                    key={`${u}-${i}`}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(i);
                      setImgFailed(false);
                    }}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-[72px] sm:w-[72px] ${
                      i === currentIndex ? 'border-black' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex min-w-0 flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {product.category}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-xl font-bold tabular-nums sm:text-2xl">{formatRwf(product.price)}</p>

            <p className="mt-5 text-[15px] leading-relaxed text-neutral-600 sm:text-base">
              {product.description ||
                'Premium AFROLUXO piece — African-inspired fashion crafted for everyday elegance.'}
            </p>

            <div className="mt-8 flex flex-col gap-2.5 sm:mt-10">
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white transition touch-manipulation active:scale-[0.99] hover:bg-neutral-800"
              >
                {added ? 'Opening checkout…' : 'Order now'}
              </button>
              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white transition touch-manipulation active:scale-[0.99] hover:bg-[#1ebe57]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.52 3.48A11.86 11.86 0 0012.01 0C5.4 0 .05 5.35.05 11.96c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62a11.93 11.93 0 005.8 1.48h.01c6.61 0 11.96-5.35 11.96-11.96 0-3.19-1.24-6.19-3.45-8.42zM12 21.5a9.5 9.5 0 01-4.85-1.33l-.35-.21-3.68.96.98-3.58-.23-.37A9.47 9.47 0 012.5 12C2.5 6.76 6.76 2.5 12 2.5S21.5 6.76 21.5 12 17.24 21.5 12 21.5zm5.2-7.07c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4-.84-.74-1.4-1.66-1.57-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.17.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.48h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.02c.14.19 2.01 3.07 4.87 4.3.68.3 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.11-.26-.18-.54-.32z" />
                </svg>
                Order via WhatsApp
              </button>
            </div>

            <ul className="mt-8 space-y-2 border-t border-neutral-100 pt-6 text-sm text-neutral-500">
              <li>Secure checkout or WhatsApp order</li>
              <li>Custom sizes available on request</li>
              <li>Ships from {DEMO_PRODUCTS.length ? 'AFROLUXO' : 'store'}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-100 pt-8 sm:mt-16 sm:pt-10">
          <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">More to love</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">Related products</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-neutral-600 hover:text-black">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(related.length ? related : relatedFromDemo(product)).map((p) => (
              <ProductCard key={p.id} product={p} variant="shop" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
