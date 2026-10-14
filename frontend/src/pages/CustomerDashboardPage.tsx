import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRwf } from '../utils/format';
import { openWhatsApp, CONTACT_DISPLAY } from '../utils/whatsapp';

type CustomerOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  created_at: string;
  products?: { name: string; price: number; category: string; imageUrl?: string } | null;
  proof_url?: string | null;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_reference?: string;
};

const STEPS = ['pending', 'payment_review', 'confirmed', 'shipped', 'delivered'] as const;

function stepIndex(status?: string) {
  if (!status || status === 'cancelled') return -1;
  const i = STEPS.indexOf(status as (typeof STEPS)[number]);
  return i >= 0 ? i : 0;
}

const statusLabel: Record<string, string> = {
  pending: 'Awaiting payment',
  payment_review: 'Payment under review',
  confirmed: 'Payment approved',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function CustomerDashboardPage() {
  const { isAuthenticated, token, user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    axios
      .get<CustomerOrder[]>('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  const uploadProof = async (orderId: string, file: File | null) => {
    if (!file || !token) return;
    setUploading(orderId);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`/api/orders/${orderId}/proof`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.data } : o)));
      setMsg('Payment proof uploaded — waiting for admin approval.');
    } catch {
      setMsg('Could not upload proof. Try again.');
    } finally {
      setUploading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-black">Your orders</h1>
        <p className="mt-2 text-sm text-neutral-500">Sign in to track payment approval and delivery.</p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="mt-6 inline-flex min-h-[48px] items-center bg-black px-8 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">My account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Hello, {user?.fullName || user?.email?.split('@')[0]}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Follow payment review and shipping progress.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            openWhatsApp('Hello AFROLUXO, I need help with my order status / payment.')
          }
          className="inline-flex min-h-[44px] items-center justify-center border border-neutral-200 px-4 text-sm font-semibold"
        >
          WhatsApp support ({CONTACT_DISPLAY})
        </button>
      </div>

      {msg && <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{msg}</p>}

      <div className="mt-8 space-y-5">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 py-16 text-center">
            <p className="font-semibold text-black">No orders yet</p>
            <Link to="/products" className="mt-3 inline-block text-sm font-semibold underline">
              Browse products
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const idx = stepIndex(order.status);
            return (
              <article key={order.id} className="rounded-2xl border border-neutral-150 border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-400">
                      {new Date(order.created_at).toLocaleString()} · {order.id.slice(0, 8)}…
                    </p>
                    <h2 className="mt-1 text-lg font-bold">{order.products?.name || 'Order'}</h2>
                    <p className="text-sm text-neutral-500">
                      {order.products?.price != null ? formatRwf(order.products.price) : ''}
                      {order.payment_method ? ` · Paid via ${order.payment_method}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-700">
                    {statusLabel[order.status || 'pending'] || order.status}
                  </span>
                </div>

                {order.status !== 'cancelled' && (
                  <div className="mt-5">
                    <div className="flex justify-between gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex-1 text-center">
                          <div
                            className={`mx-auto h-2 rounded-full ${
                              idx >= i ? 'bg-black' : 'bg-neutral-200'
                            }`}
                          />
                          <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-neutral-400">
                            {s === 'payment_review' ? 'Review' : s}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-neutral-600">
                      {order.status === 'confirmed' || order.payment_status === 'paid'
                        ? 'Payment approved by admin. We will prepare your shipment.'
                        : order.status === 'payment_review'
                          ? 'Admin is checking your payment. You will see Confirmed when approved.'
                          : order.status === 'shipped'
                            ? 'Your order is on the way.'
                            : order.status === 'delivered'
                              ? 'Delivered — thank you for shopping AFROLUXO.'
                              : 'Complete payment and upload proof if you have not yet.'}
                    </p>
                  </div>
                )}

                {order.payment_reference && (
                  <p className="mt-3 text-xs text-neutral-500">Reference: {order.payment_reference}</p>
                )}

                {order.proof_url && (
                  <a href={order.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold underline">
                    View payment proof
                  </a>
                )}

                {(order.status === 'pending' || order.status === 'payment_review') && (
                  <label className="mt-4 block text-xs text-neutral-500">
                    Upload / replace payment screenshot
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading === order.id}
                      className="mt-1 block w-full text-sm"
                      onChange={(e) => uploadProof(order.id, e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
