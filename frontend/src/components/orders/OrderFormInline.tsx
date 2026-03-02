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

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 text-[11px]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5 mb-5 animate-reveal">
        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
          Quick Checkout
        </h4>
        <p className="text-[11px] text-slate-500 font-medium leading-tight ml-3">
          Not using WhatsApp? Enter your details below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 animate-reveal [animation-delay:100ms]">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
            placeholder="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="animate-reveal [animation-delay:200ms]">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="animate-reveal [animation-delay:300ms]">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:scale-[1.01] transition-all duration-300 placeholder:text-slate-400"
            placeholder="Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="animate-reveal [animation-delay:400ms]">
        <button
          type="submit"
          disabled={submitting}
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

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-[10px] text-red-600 font-bold">{error}</p>
        </div>
      )}
    </form>
  );
}

