import { useState } from 'react';
import axios from 'axios';
import { Product } from '../products/ProductCard';

type Props = {
  product: Product;
};

export function OrderFormInline({ product }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await axios.post('/api/orders', {
        name,
        phone,
        address,
        productId: product.id
      });
      setOrderId(res.data.id);
      setName('');
      setPhone('');
      setAddress('');
    } catch (err) {
      setError('Could not submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-900 mb-1">Order Submitted!</h4>
          <p className="text-[10px] text-emerald-700 font-medium">We've received your order and will contact you soon.</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Order ID</p>
          <code className="text-xs font-black text-slate-800 break-all">{orderId}</code>
        </div>
        <a
          href={`/track?id=${orderId}`}
          className="block w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
          Track My Order
        </a>
        <button
          onClick={() => setOrderId('')}
          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 text-xs";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order with Form</h4>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Not using WhatsApp? Fill this form to place your order directly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className={inputClass + " sm:col-span-2"}
          placeholder="Your Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={inputClass}
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          className={inputClass}
          placeholder="Delivery Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-xs font-black text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Submitting Order...
          </>
        ) : 'Complete My Order'}
      </button>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-[10px] text-red-600 font-bold">{error}</p>
        </div>
      )}
    </form>
  );
}

