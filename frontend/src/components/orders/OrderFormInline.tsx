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
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/orders', {
        name,
        phone,
        address,
        productId: product.id
      });
      setSuccess('Order submitted! We will contact you soon.');
      setName('');
      setPhone('');
      setAddress('');
    } catch (err) {
      setError('Could not submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 text-[11px]">
      <p className="font-medium text-slate-700">
        No WhatsApp? Order with this form:
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <input
          className="col-span-2 rounded-full border border-slate-200 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-accent text-[11px]"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-full border border-slate-200 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-accent text-[11px]"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          className="rounded-full border border-slate-200 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-accent text-[11px]"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 w-full inline-flex items-center justify-center rounded-full border border-accent/60 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/5 disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Order without WhatsApp'}
      </button>
      {success && <p className="text-[10px] text-emerald-600">{success}</p>}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </form>
  );
}

