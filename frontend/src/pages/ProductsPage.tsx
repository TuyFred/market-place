import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';

const CATEGORY_LABELS: Record<string, string> = {
  'children-clothes': 'Children Clothes',
  'women-clothes': 'Women Clothes',
  'small-bags': 'Small Bags',
  accessories: 'Accessories'
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catsMap, setCatsMap] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (search) params.search = search;

    // fetch categories and products so we can display category names from DB
    Promise.all([
      axios.get('/api/categories'),
      axios.get<Product[]>('/api/products', { params: Object.keys(params).length ? params : undefined })
    ])
      .then(([cRes, pRes]) => {
        const cats: { id: string; name: string; slug: string }[] = cRes.data || [];
        const map: Record<string, string> = {};
        cats.forEach((c) => { map[c.slug] = c.name; });
        setCatsMap(map);
        const mapped = (pRes.data || []).map((p) => ({ ...p, category: map[p.category] || p.category }));
        setProducts(mapped);
      })
      .catch(() => setProducts([]));
  }, [category, search]);

  const title = search
    ? `Results for "${search}"`
    : category
      ? (catsMap[category] || CATEGORY_LABELS[category] || 'Products')
      : 'All Products';

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">
            Order quickly via WhatsApp or the built-in form.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          // fallback demo clothes when no products available yet
          ([
            { id: 'demo-1', name: 'Striped Cotton Tee', price: 12.99, category: 'Children Clothes', description: 'Soft striped tee for everyday play', imageUrl: '' },
            { id: 'demo-2', name: 'Floral Dress', price: 24.5, category: 'Women Clothes', description: 'Lightweight seasonal dress', imageUrl: '' },
            { id: 'demo-3', name: 'Comfy Joggers', price: 18.0, category: 'Children Clothes', description: 'Stretchy and durable joggers', imageUrl: '' },
            { id: 'demo-4', name: 'Classic Blouse', price: 29.99, category: 'Women Clothes', description: 'Versatile blouse for work or casual', imageUrl: '' },
          ] as Product[]).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}
