import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { DEMO_PRODUCTS, getDemoProducts } from '../config/brand';

const CATEGORY_LABELS: Record<string, string> = {
  'african-traditional': 'African Traditional',
  'ankara-prints': 'Ankara & Prints',
  'modern-casual': 'Modern Casual',
  'women-wear': 'Women Wear',
  'men-wear': 'Men Wear',
  'kids-wear': 'Kids Wear',
  'formal-occasion': 'Formal & Occasion',
  'street-style': 'Street Style',
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [catsMap, setCatsMap] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (search) params.search = search;

    Promise.all([
      axios.get('/api/categories'),
      axios.get<Product[]>('/api/products', { params: Object.keys(params).length ? params : undefined })
    ])
      .then(([cRes, pRes]) => {
        const cats: { id: string; name: string; slug: string }[] = cRes.data || [];
        const map: Record<string, string> = {};
        cats.forEach((c) => { map[c.slug] = c.name; });
        setCategories(cats);
        setCatsMap(map);
        const mapped = (pRes.data || []).map((p) => ({ ...p, category: map[p.category] || p.category }));
        setProducts(mapped);
      })
      .catch(() => setProducts([]));
  }, [category, search]);

  const title = search
    ? `Results for "${search}"`
    : category
      ? (catsMap[category] || CATEGORY_LABELS[category] || 'Clothes')
      : 'All clothes';

  const chipCategories = categories.length
    ? categories
    : Object.entries(CATEGORY_LABELS).map(([slug, name]) => ({ id: slug, slug, name }));

  const demoFallback = (category
    ? getDemoProducts(category)
    : DEMO_PRODUCTS) as Product[];

  const filteredDemo = search
    ? demoFallback.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : demoFallback;

  const list = products.length > 0 ? products : filteredDemo;

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-ink/50 hover:text-forest font-semibold text-xs transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back home
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">Wardrobe</p>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mt-1">{title}</h1>
          <p className="text-xs sm:text-sm text-ink/55 mt-1">{list.length} pieces</p>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
          <Link
            to="/products"
            className={`snap-start shrink-0 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold transition-colors ${!category ? 'bg-ink text-white' : 'bg-white text-ink/70 border border-ink/10 hover:border-forest/40'}`}
          >
            All
          </Link>
          {chipCategories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className={`snap-start shrink-0 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold transition-colors ${category === c.slug ? 'bg-ink text-white' : 'bg-white text-ink/70 border border-ink/10 hover:border-forest/40'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {list.map((product, i) => (
          <div key={product.id} className="animate-reveal" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
