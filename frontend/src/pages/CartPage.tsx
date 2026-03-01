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

    const lines = items.map((it) => `${it.quantity} x ${it.product.name} (${new Intl.NumberFormat('en-RW',{style:'currency',currency:'RWF',maximumFractionDigits:0}).format(it.product.price)})`);
    const imageLines = items
      .map((it) => it.product.imageUrl || (it.product.imageUrls && it.product.imageUrls[0]) || '')
      .filter(Boolean);

    const body = `Hello! I'd like to place an order:\n\n${lines.join('\n')}\n\nTotal: ${new Intl.NumberFormat('en-RW',{style:'currency',currency:'RWF',maximumFractionDigits:0}).format(totalPrice)}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}` + (imageLines.length ? `\n\nImages:\n${imageLines.join('\n')}` : '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Your cart</h1>
          <p className="text-xs text-slate-500">
            {totalItems === 0
              ? 'You have no items yet.'
              : `${totalItems} item(s) ready to order.`}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 bg-slate-50 rounded overflow-hidden">
                  <img src={item.product.imageUrl || (item.product.imageUrls && item.product.imageUrls[0])} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">{new Intl.NumberFormat('en-RW',{style:'currency',currency:'RWF',maximumFractionDigits:0}).format(item.product.price)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button className="px-3 py-1 text-sm" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                  <div className="px-3 py-1 text-sm">{item.quantity}</div>
                  <button className="px-3 py-1 text-sm" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                </div>
                <div className="text-sm font-medium">{new Intl.NumberFormat('en-RW',{style:'currency',currency:'RWF',maximumFractionDigits:0}).format(item.product.price * item.quantity)}</div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              Browse products and add items to your cart.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-700">Summary</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {new Intl.NumberFormat('en-RW',{style:'currency',currency:'RWF',maximumFractionDigits:0}).format(totalPrice)}
            </p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-2 text-xs">
            <p className="text-[11px] text-slate-500">
              Please confirm your delivery details. You need an account to
              continue.
            </p>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {submitting
                ? 'Placing order...'
                : isAuthenticated
                ? 'Place order'
                : 'Sign in to order'}
            </button>
            <button
              type="button"
              onClick={handleWhatsAppCart}
              className="mt-2 w-full inline-flex items-center justify-center rounded-lg border border-accent px-4 py-2 text-xs font-medium text-accent hover:bg-accent/5 disabled:opacity-60"
              aria-label={`Contact us via WhatsApp`}
            >
              Contact us via WhatsApp
            </button>
            {message && (
              <p className="text-[11px] text-slate-500 mt-1">{message}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

