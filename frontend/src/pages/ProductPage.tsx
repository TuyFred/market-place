import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CONTACT_RAW } from '../utils/whatsapp';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
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
        <div className="bg-white rounded-lg p-4 shadow relative"> 
          <div className="flex items-center justify-center p-4">
            <img
              src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[currentIndex] : (product.imageUrl || 'https://placehold.co/800x600')}
              alt={product.name}
              className="w-full max-h-96 object-contain transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
            />
          </div>
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} className="px-3 py-1 rounded bg-white border">Prev</button>
              {product.imageUrls.map((u, i) => (
                <button key={u} onClick={() => setCurrentIndex(i)} className={`w-16 h-12 overflow-hidden rounded ${i === currentIndex ? 'ring-2 ring-indigo-500' : 'border'}`}>
                  <img src={u} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
              <button onClick={() => setCurrentIndex((i) => Math.min((product.imageUrls || []).length - 1, i + 1))} className="px-3 py-1 rounded bg-white border">Next</button>
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => zoom(0.25)} className="bg-white p-2 rounded shadow">+</button>
            <button onClick={() => zoom(-0.25)} className="bg-white p-2 rounded shadow">−</button>
            <button onClick={() => rotate(90)} className="bg-white p-2 rounded shadow">↻</button>
            <button onClick={resetView} className="bg-white p-2 rounded shadow">Reset</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-base text-slate-700">{product.description}</div>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                addToCart(product as Product);
                alert('Added to bag');
              }}
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-black"
            >
              Add to bag
            </button>
            <a href={`https://wa.me/${CONTACT_RAW.replace(/^\+/, '')}`} className="block text-center text-sm text-emerald-600">Contact on WhatsApp</a>
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
