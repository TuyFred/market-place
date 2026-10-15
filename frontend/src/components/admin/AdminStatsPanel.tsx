import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatRwf } from '../../utils/format';

type Stats = {
  totals: {
    products: number;
    activeProducts: number;
    orders: number;
    reviews: number;
    likes: number;
    categories: number;
    revenueEstimate: number;
    pendingReview: number;
    outOfStock: number;
  };
  statusCounts: Record<string, number>;
  revenueSeries: { date: string; revenue: number; orders: number }[];
  popular: {
    id: string;
    name: string;
    imageUrl?: string;
    likes: number;
    reviews: number;
    avgRating: number;
    stock: number;
  }[];
  byCategory: { name: string; value: number }[];
  lowStock: { id: string; name: string; stock: number; imageUrl?: string }[];
};

function authHeaders() {
  const t = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  payment_review: '#ea580c',
  confirmed: '#0ea5e9',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export function AdminStatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    axios
      .get<Stats>('/api/stats', { headers: authHeaders() })
      .then((res) => setStats(res.data))
      .catch((e) => setErr(e?.response?.data?.message || 'Could not load statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (err || !stats) {
    return <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{err || 'No data'}</p>;
  }

  const { totals, revenueSeries, statusCounts, popular, byCategory, lowStock } = stats;
  const maxRev = Math.max(1, ...revenueSeries.map((d) => d.revenue));
  const statusEntries = Object.entries(statusCounts);
  const statusTotal = statusEntries.reduce((s, [, v]) => s + v, 0) || 1;
  const catMax = Math.max(1, ...byCategory.map((c) => c.value));

  const kpis = [
    { label: 'Revenue (est.)', value: formatRwf(totals.revenueEstimate), hint: 'Confirmed-ready orders' },
    { label: 'Orders', value: String(totals.orders), hint: `${totals.pendingReview} awaiting payment review` },
    { label: 'Products', value: String(totals.activeProducts), hint: `${totals.outOfStock} sold out` },
    { label: 'Engagement', value: String(totals.likes + totals.reviews), hint: `${totals.likes} likes · ${totals.reviews} reviews` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5 shadow-sm"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-black/[0.03]" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-black">{k.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-black">Revenue trend</p>
              <p className="text-xs text-neutral-500">Last 14 days</p>
            </div>
          </div>
          <div className="flex h-48 items-end gap-1.5 sm:gap-2">
            {revenueSeries.map((d) => (
              <div key={d.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end">
                <div className="mb-1 hidden rounded bg-black px-1.5 py-0.5 text-[9px] text-white opacity-0 transition group-hover:opacity-100 sm:block">
                  {formatRwf(d.revenue)}
                </div>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-black to-neutral-600 transition hover:to-neutral-500"
                  style={{ height: `${Math.max(4, (d.revenue / maxRev) * 100)}%` }}
                  title={`${d.date}: ${formatRwf(d.revenue)} · ${d.orders} orders`}
                />
                <p className="mt-1 truncate text-[8px] text-neutral-400 sm:text-[9px]">{d.date.slice(5)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-bold text-black">Order status</p>
          <p className="text-xs text-neutral-500">Pipeline mix</p>
          <div className="mt-5 flex items-center gap-5">
            <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
              {(() => {
                let angle = -90;
                return statusEntries.map(([key, value]) => {
                  const sweep = (value / statusTotal) * 360;
                  const start = angle;
                  angle += sweep;
                  const r = 48;
                  const cx = 60;
                  const cy = 60;
                  const rad = (deg: number) => (deg * Math.PI) / 180;
                  const x1 = cx + r * Math.cos(rad(start));
                  const y1 = cy + r * Math.sin(rad(start));
                  const x2 = cx + r * Math.cos(rad(start + sweep));
                  const y2 = cy + r * Math.sin(rad(start + sweep));
                  const large = sweep > 180 ? 1 : 0;
                  if (value <= 0) return null;
                  return (
                    <path
                      key={key}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={STATUS_COLORS[key] || '#a3a3a3'}
                    />
                  );
                });
              })()}
              <circle cx="60" cy="60" r="28" fill="white" />
              <text x="60" y="64" textAnchor="middle" className="fill-black text-[14px] font-bold">
                {statusTotal}
              </text>
            </svg>
            <ul className="min-w-0 flex-1 space-y-2">
              {statusEntries.map(([key, value]) => (
                <li key={key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 capitalize text-neutral-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: STATUS_COLORS[key] || '#a3a3a3' }}
                    />
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-bold tabular-nums text-black">{value}</span>
                </li>
              ))}
              {statusEntries.length === 0 && <li className="text-xs text-neutral-400">No orders yet</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-black">Most liked products</p>
          <p className="text-xs text-neutral-500">Popularity from likes & reviews</p>
          <ul className="mt-4 space-y-3">
            {popular.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-neutral-400">{i + 1}</span>
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-100">
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-neutral-500">
                    ♥ {p.likes} · ★ {p.avgRating || '—'} ({p.reviews}) · stock {p.stock}
                  </p>
                </div>
              </li>
            ))}
            {popular.length === 0 && <li className="text-sm text-neutral-400">No engagement yet</li>}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-black">Products by category</p>
            <div className="mt-4 space-y-2.5">
              {byCategory.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate text-neutral-600">{c.name}</span>
                    <span className="font-bold">{c.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: `${(c.value / catMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {byCategory.length === 0 && <p className="text-sm text-neutral-400">No products</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <p className="text-sm font-bold text-amber-950">Low stock alert</p>
            <ul className="mt-3 space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between text-xs text-amber-900">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="font-bold">{p.stock <= 0 ? 'Out' : p.stock}</span>
                </li>
              ))}
              {lowStock.length === 0 && <li className="text-xs text-amber-800/70">All stocked well</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
