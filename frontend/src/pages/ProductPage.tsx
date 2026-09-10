import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import { useAuth } from '../context/AuthContext';
import { DEMO_PRODUCTS, SAMPLE_IMAGES, getDemoProducts } from '../config/brand';
import { formatRwf } from '../utils/format';

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
        (p) => p.category === product.category || p.categorySlug === product.category
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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [added, setAdded] = useState(false);

  const zoom = (d: number) => setScale((s) => Math.max(0.5, Math.min(3, +(s + d).toFixed(2))));
  const rotate = (d: number) => setRotation((r) => r + d);
  const resetView = () => {
    setScale(1);
    setRotation(0);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentIndex(0);
    resetView();
    setAdded(false);
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

    // Demo catalog IDs never hit the API
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
      <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-5 lg:px-8">
        <Link to="/products" className="text-sm font-semibold text-forest">
          Back to clothes
        </Link>
        <p className="mt-4 text-ink/50">Loading product...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-5 lg:px-8">
        <Link to="/products" className="text-sm font-semibold text-forest">
          Back to clothes
        </Link>
        <p className="mt-4 text-ink/70">Product not found.</p>
        <div className="mt-8">
          <h2 className="font-display mb-3 text-lg sm:text-2xl">Continue browsing</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {DEMO_PRODUCTS.slice(0, 8).map((d) => (
              <ProductCard
                key={d.id}
                product={{
                  id: d.id,
                  name: d.name,
                  price: d.price,
                  category: d.category,
                  description: d.description,
                  imageUrl: d.imageUrl,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const gallery =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || SAMPLE_IMAGES.placeholder];
  const raw = gallery[currentIndex] || SAMPLE_IMAGES.placeholder;
  const imgUrl =
    raw.startsWith('http') || raw.startsWith('//')
      ? raw
      : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;

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

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 px-3 py-5 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <Link to="/products" className="mb-2 inline-block text-xs font-semibold text-forest">
            ← Back to clothes
          </Link>
          <h1 className="font-display text-xl text-ink sm:text-2xl md:text-3xl">{product.name}</h1>
          <p className="text-xs text-ink/50 sm:text-sm">{product.category}</p>
        </div>
        <div className="text-lg font-bold text-ink sm:text-xl">{formatRwf(product.price)}</div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border border-ink/5 bg-white sm:rounded-2xl">
          <div className="flex min-h-[260px] items-center justify-center bg-stone p-3 sm:min-h-[380px] sm:p-4">
            <img
              src={imgUrl}
              alt={product.name}
              className="max-h-[360px] max-w-full object-contain transition-transform duration-300 sm:max-h-[420px]"
              style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
            />
          </div>

          <div className="absolute right-2 top-2 flex gap-1.5 sm:right-3 sm:top-3">
            <button type="button" onClick={() => zoom(0.25)} className="rounded-full bg-white/95 px-2.5 py-1.5 text-sm font-bold shadow">
              +
            </button>
            <button type="button" onClick={() => zoom(-0.25)} className="rounded-full bg-white/95 px-2.5 py-1.5 text-sm font-bold shadow">
              −
            </button>
            <button type="button" onClick={() => rotate(-90)} className="rounded-full bg-white/95 px-2.5 py-1.5 text-sm shadow" title="Rotate left">
              ↺
            </button>
            <button type="button" onClick={() => rotate(90)} className="rounded-full bg-white/95 px-2.5 py-1.5 text-sm shadow" title="Rotate right">
              ↻
            </button>
            <button type="button" onClick={resetView} className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold shadow">
              Reset
            </button>
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-ink/5 p-3 scrollbar-hide">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="shrink-0 rounded-full bg-stone px-3 py-1.5 text-xs font-semibold"
              >
                Prev
              </button>
              {gallery.map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(i);
                    resetView();
                  }}
                  className={`h-12 w-14 shrink-0 overflow-hidden rounded-lg ${
                    i === currentIndex ? 'ring-2 ring-forest' : 'border border-ink/10'
                  }`}
                >
                  <img src={u} className="h-full w-full object-cover" alt="" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(gallery.length - 1, i + 1))}
                className="shrink-0 rounded-full bg-stone px-3 py-1.5 text-xs font-semibold"
              >
                Next
              </button>
            </div>
          )}

          {(rotation !== 0 || scale !== 1) && (
            <p className="border-t border-ink/5 bg-white px-3 py-1.5 text-center text-[10px] font-semibold text-ink/45">
              {rotation % 360}° · {Math.round(scale * 100)}%
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <p className="text-sm leading-relaxed text-ink/70 sm:text-base">
            {product.description || 'Premium AFROLUXO piece selected for quality and style.'}
          </p>
          <button type="button" onClick={handleAdd} className={`btn-buy py-3.5 text-sm ${added ? 'btn-buy-added' : ''}`}>
            {added ? 'Opening checkout…' : 'Buy now'}
          </button>
          <Link to="/products" className="text-center text-xs font-semibold text-forest sm:text-sm">
            Browse more clothes →
          </Link>
        </div>
      </div>

      {/* Related / continue shopping — always below */}
      <div className="border-t border-ink/10 pt-6 sm:pt-8">
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-forest">Keep shopping</p>
            <h2 className="font-display text-lg text-ink sm:text-2xl">Related clothes</h2>
          </div>
          <Link to={`/products?category=${encodeURIComponent(
            DEMO_PRODUCTS.find((d) => d.id === product.id)?.categorySlug || product.category
          )}`} className="shrink-0 text-xs font-semibold text-forest sm:text-sm">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(related.length ? related : relatedFromDemo(product)).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}