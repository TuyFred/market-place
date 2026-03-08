import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';

export function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);

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
      <section>
        <div className="mb-4">
          <Link to="/products" className="text-sm text-indigo-600">Back to products</Link>
        </div>
        <div className="text-slate-500">Loading product...</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500">{product.category}</p>
        </div>
        <div className="text-lg font-black">{product.price ? product.price.toLocaleString() : ''}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow"> 
          <img src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || 'https://placehold.co/800x600'} alt={product.name} className="w-full h-96 object-contain" />
        </div>
        <div className="space-y-4">
          <div className="text-base text-slate-700">{product.description}</div>
          <div className="space-y-2">
            <button className="w-full rounded-xl bg-slate-900 text-white py-3 font-black">Add to bag</button>
            <a href={`https://wa.me/250${process.env.CONTACT_RAW || ''}`} className="block text-center text-sm text-emerald-600">Contact on WhatsApp</a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-black mb-4">Related products</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
