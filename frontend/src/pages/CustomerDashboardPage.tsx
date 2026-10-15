import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRwf } from '../utils/format';
import { openWhatsApp, CONTACT_DISPLAY } from '../utils/whatsapp';
import { AppBackButton } from '../components/layout/AppBackButton';

type CustomerOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  created_at: string;
  quantity?: number;
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
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusTone: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  payment_review: 'bg-orange-50 text-orange-800 ring-orange-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  shipped: 'bg-violet-50 text-violet-800 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
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

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    return { total: orders.length, active, delivered };
  }, [orders]);

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
      <section className="min-h-[70vh] bg-neutral-50">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-black">Your orders</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Sign in to track payment review, shipping, and delivery in one place.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-black px-8 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-neutral-50 pb-16">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">My account</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-black sm:text-3xl">
              Hello, {user?.fullName || user?.email?.split('@')[0]}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppBackButton
              to="/"
              label="Back to shop"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-black"
            />
            <button
              type="button"
              onClick={() =>
                openWhatsApp('Hello AFROLUXO, I need help with my order status / payment.')
              }
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-4 text-sm font-semibold text-white"
            >
              WhatsApp · {CONTACT_DISPLAY}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Orders', value: stats.total },
            { label: 'In progress', value: stats.active },
            { label: 'Delivered', value: stats.delivered },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-black">{s.value}</p>
            </div>
          ))}
        </div>

        {msg && (
          <p className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
            {msg}
          </p>
        )}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black">Order history</h2>
            <Link to="/track" className="text-sm font-semibold text-neutral-600 underline-offset-2 hover:underline">
              Track by ID
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <p className="text-base font-semibold text-black">No orders yet</p>
                <p className="mt-1 text-sm text-neutral-500">When you checkout, progress appears here.</p>
                <Link
                  to="/"
                  className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-black px-6 text-sm font-semibold text-white"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const idx = stepIndex(order.status);
                const qty = order.quantity || 1;
                const unit = order.products?.price ?? 0;
                const lineTotal = unit * qty;
                const tone = statusTone[order.status || 'pending'] || statusTone.pending;

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                      <div className="flex min-w-0 gap-4">
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-24 sm:w-20">
                          {order.products?.imageUrl ? (
                            <img
                              src={order.products.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-400">
                            {new Date(order.created_at).toLocaleString()} · #{order.id.slice(0, 8)}
                          </p>
                          <h3 className="mt-1 truncate text-base font-bold text-black sm:text-lg">
                            {order.products?.name || 'Order'}
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600">
                            Qty {qty}
                            {unit ? ` · ${formatRwf(unit)} each` : ''}
                            {lineTotal ? ` · ${formatRwf(lineTotal)}` : ''}
                          </p>
                          {order.payment_method && (
                            <p className="mt-0.5 text-xs capitalize text-neutral-500">
                              Payment: {order.payment_method}
                              {order.payment_reference ? ` · Ref ${order.payment_reference}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${tone}`}
                      >
                        {statusLabel[order.status || 'pending'] || order.status}
                      </span>
                    </div>

                    {order.status !== 'cancelled' && (
                      <div className="border-t border-neutral-100 px-5 py-4 sm:px-6">
                        <div className="flex gap-1.5">
                          {STEPS.map((s, i) => (
                            <div key={s} className="min-w-0 flex-1">
                              <div
                                className={`h-1.5 rounded-full ${idx >= i ? 'bg-black' : 'bg-neutral-200'}`}
                              />
                              <p className="mt-1.5 truncate text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                                {s === 'payment_review' ? 'Review' : s}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                          {order.status === 'confirmed' || order.payment_status === 'paid'
                            ? 'Payment approved. We are preparing your shipment.'
                            : order.status === 'payment_review'
                              ? 'Admin is checking your payment proof.'
                              : order.status === 'shipped'
                                ? 'Your order is on the way.'
                                : order.status === 'delivered'
                                  ? 'Delivered — thank you for shopping AFROLUXO.'
                                  : 'Complete payment and upload proof if you have not yet.'}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 bg-neutral-50/80 px-5 py-3 sm:px-6">
                      {order.proof_url && (
                        <a
                          href={order.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-black underline underline-offset-2"
                        >
                          View payment proof
                        </a>
                      )}
                      {(order.status === 'pending' || order.status === 'payment_review') && (
                        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-700">
                          <span className="rounded-full border border-neutral-300 bg-white px-3 py-1.5">
                            {uploading === order.id ? 'Uploading…' : 'Upload proof'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploading === order.id}
                            className="hidden"
                            onChange={(e) => uploadProof(order.id, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <Link
                        to={`/track?id=${order.id}`}
                        className="text-xs font-semibold text-neutral-500 hover:text-black"
                      >
                        Open tracking →
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
