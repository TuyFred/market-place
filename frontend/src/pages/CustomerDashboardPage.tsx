import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type CustomerOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  created_at: string;
  products?: { name: string; price: number; category: string } | null;
  proof_url?: string | null;
  status?: string;
};

export function CustomerDashboardPage() {
  const { isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    axios
      .get<CustomerOrder[]>('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">
          My orders
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Please sign in from the navbar to view your order history.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          My orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track orders you placed while signed in.
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {order.products?.name ?? 'Order'}
                </p>
                <p className="text-slate-500">
                  {order.customer_address} · {order.customer_phone}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-xs">
                <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${statusColors[order.status || 'pending'] || statusColors.pending}`}>
                  <span className="text-[11px] font-medium">{(order.status || 'pending').toUpperCase()}</span>
                </span>
              </div>

              <div className="text-xs text-slate-500 ml-3">Placed: {new Date(order.created_at).toLocaleString()}</div>

              <div className="ml-auto flex items-center gap-3">
                {order.proof_url ? (
                  <div className="flex items-center gap-3">
                    <a href={order.proof_url} target="_blank" rel="noreferrer" className="inline-block rounded overflow-hidden border" title="Open proof in new tab">
                      <img src={order.proof_url} alt="proof" className="w-20 h-16 object-cover" />
                    </a>
                    <div className="text-xs text-slate-400">Payment proof uploaded — waiting verification.</div>
                  </div>
                ) : (
                  (order.status === 'pending' || !order.status) && (
                    <div className="flex items-center gap-2">
                      <input type="file" id={`proof-${order.id}`} className="text-xs" />
                      <button
                        disabled={uploading === order.id}
                        onClick={async () => {
                          const input = document.getElementById(`proof-${order.id}`) as HTMLInputElement | null;
                          if (!input || !input.files || input.files.length === 0) return alert('Select a file');
                          const f = input.files[0];
                          setUploading(order.id);
                          try {
                            const fd = new FormData();
                            fd.append('file', f);
                            await axios.post(`/api/orders/${order.id}/proof`, fd, { headers: { Authorization: `Bearer ${token}` } });
                            const res = await axios.get<CustomerOrder[]>('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } });
                            setOrders(res.data);
                          } catch (e: any) {
                            const msg = e?.response?.data?.message || e?.message || 'Upload failed';
                            alert(msg);
                          }
                          setUploading(null);
                        }}
                        className="text-xs text-white px-2 py-1 rounded bg-amber-500 hover:bg-amber-600"
                      >
                        {uploading === order.id ? 'Uploading...' : 'Upload payment proof'}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-slate-500">
            No orders found yet.
          </p>
        )}
      </div>
    </section>
  );
}

