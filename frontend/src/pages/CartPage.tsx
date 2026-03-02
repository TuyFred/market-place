import { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CONTACT_DISPLAY, CONTACT_RAW } from '../utils/whatsapp';

export function CartPage() {
  const { items, totalItems, removeFromCart, clearCart, updateQuantity } = useCart();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!items.length) return;

    setSubmitting(true);
    setMessage('');
    try {
      const headers = token
        ? {
          Authorization: `Bearer ${token}`
        }
        : undefined;

      for (const item of items) {
        await axios.post(
          '/api/orders',
          {
            name,
            phone,
            address,
            productId: item.product.id,
            notes: `From cart, quantity: ${item.quantity}`
          },
          { headers }
        );
      }
      clearCart();
      setName('');
      setPhone('');
      setAddress('');
      setMessage('Order placed! You can track it in your dashboard.');
    } catch {
      setMessage('Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppCart = () => {
    if (!items.length) return;
    const digits = CONTACT_RAW;
    if (!digits) {
      alert('WhatsApp number is not configured.');
      return;
    }

    const lines = items.map((it) => `${it.quantity} x ${it.product.name} (${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(it.product.price)})`);
    const imageLines = items
      .map((it) => it.product.imageUrl || (it.product.imageUrls && it.product.imageUrls[0]) || '')
      .filter(Boolean);

    const body = `Hello! I'd like to place an order:\n\n${lines.join('\n')}\n\nTotal: ${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(totalPrice)}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}` + (imageLines.length ? `\n\nImages:\n${imageLines.join('\n')}` : '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-reveal">
      <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Shopping Bag</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Cart</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {totalItems === 0
              ? 'Your bag is currently empty.'
              : `You have ${totalItems} exclusive item(s) in your bag.`}
          </p>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="group premium-card !rounded-[2rem] flex items-center justify-between px-6 py-5 transition-all duration-500"
          >
            <div className="flex items-center gap-6">
              <div className="w-24 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                <img src={item.product.imageUrl || (item.product.imageUrls && item.product.imageUrls[0])} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 mb-1">{item.product.name}</p>
                <p className="text-sm font-bold text-indigo-600">{new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(item.product.price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-inner">
                <button className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                <div className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</div>
                <button className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
              </div>
              <div className="text-base font-black text-slate-900 min-w-[100px] text-right">
                {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(item.product.price * item.quantity)}
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Remove item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed animate-reveal">
            <div className="text-5xl mb-6 opacity-30">📦</div>
            <p className="text-slate-500 font-medium">Your shopping bag is waiting to be filled.</p>
            <a href="/products" className="inline-block mt-4 text-sm font-black text-indigo-600 hover:text-indigo-800 transition-colors">Discover Products →</a>
          </div>
        )}
      </div>

      <div className="premium-card !rounded-[2.5rem] p-8 space-y-6 lg:sticky lg:top-24 h-fit">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order Summary</span>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(totalPrice)}
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4 pt-6 border-t border-slate-100">
          <div className="space-y-1.5 mb-5 animate-reveal">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
              Secure Checkout
            </h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight ml-3">Enter details to finalize your premium order.</p>
          </div>
          <div className="animate-reveal [animation-delay:100ms]">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="animate-reveal [animation-delay:200ms]">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="animate-reveal [animation-delay:300ms]">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
              placeholder="Detailed Shipping Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="animate-reveal [animation-delay:400ms]">
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-[10px] font-black text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60 shimmer-on-hover relative overflow-hidden group/submit"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Buy now
                    <svg className="w-3.5 h-3.5 group-hover/submit:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleWhatsAppCart}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-[9px] font-black uppercase text-white hover:bg-[#20bd5a] transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            <span>Order via WhatsApp</span>
          </button>
          {message && (
            <p className="text-[11px] font-bold text-indigo-600 mt-4 text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

