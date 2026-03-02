import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatRwf } from '../utils/format';

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
  const { isAuthenticated, token, user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    };

    axios
      .get<CustomerOrder[]>('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">🔑</div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Your Dashboard</h1>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          Please sign in to view your order history, track deliveries, and manage your account.
        </p>
        <a href="/login" className="inline-block px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 active:scale-95">
          Sign In Now
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Customer Portal</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back, {user?.email?.split('@')[0]}</h1>
          <p className="text-slate-500 font-medium mt-2">Manage your orders and track your shopping journey.</p>
        </div>

        <div className="flex gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1 md:w-32">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1 md:w-32">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
            <p className="text-2xl font-black text-indigo-600">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Recent Orders</h2>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-slate-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row">
                {/* Product Detail Section */}
                <div className="p-8 flex-1 border-r border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${statusColors[order.status || 'pending'] || statusColors.pending}`}>
                      {order.status || 'pending'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ID: <code className="bg-slate-50 px-2 py-0.5 rounded text-[8px]">{order.id}</code>
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1">{order.products?.name || 'Ass Marketplace Order'}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6">
                    Purchased on {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Address</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{order.customer_address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                      <p className="text-xs font-black text-slate-900">{formatRwf(order.products?.price || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking / Action Section */}
                <div className="bg-slate-50/50 p-8 w-full md:w-80 flex flex-col justify-center">
                  {order.proof_url ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <a href={order.proof_url} target="_blank" rel="noreferrer" className="w-20 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                          <img src={order.proof_url} alt="Proof" className="w-full h-full object-cover transition-transform hover:scale-110" />
                        </a>
                        <div>
                          <p className="text-xs font-black text-emerald-600">Proof Uploaded</p>
                          <p className="text-[10px] text-slate-500 font-medium">Pending verification</p>
                        </div>
                      </div>
                      <a
                        href={`/track?id=${order.id}`}
                        className="block w-full text-center py-3 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                      >
                        Detailed Status
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {order.status === 'pending' || !order.status ? (
                        <div className="text-center">
                          <p className="text-[10px] font-black text-amber-600 uppercase mb-3">Action Required</p>
                          <label className="block w-full cursor-pointer py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 mb-2">
                            {uploading === order.id ? 'Uploading...' : 'Upload Payment Proof'}
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                if (!e.target.files?.[0]) return;
                                setUploading(order.id);
                                try {
                                  const fd = new FormData();
                                  fd.append('file', e.target.files[0]);
                                  await axios.post(`/api/orders/${order.id}/proof`, fd, { headers: { Authorization: `Bearer ${token}` } });
                                  const res = await axios.get<CustomerOrder[]>('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } });
                                  setOrders(res.data);
                                } catch (err: any) {
                                  alert(err.response?.data?.message || 'Upload failed');
                                } finally {
                                  setUploading(null);
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="text-center p-4 rounded-2xl bg-white border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                          <p className="text-xs font-black text-slate-900 tracking-wide">{order.status?.toUpperCase()}</p>
                        </div>
                      )}
                      <a
                        href={`/track?id=${order.id}`}
                        className="block w-full text-center py-3 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                      >
                        Track Shipment
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-slate-500 font-medium mb-6">You haven't placed any orders yet.</p>
            <a href="/products" className="text-sm font-black text-indigo-600 hover:text-indigo-700">Start Shopping →</a>
          </div>
        )}
      </div>
    </div>
  );
}
