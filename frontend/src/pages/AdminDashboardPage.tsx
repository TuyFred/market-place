import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatRwf } from '../utils/format';

/* ─── Types ─── */
type Product = { id: string; name: string; description?: string; price: number; category: string; imageUrl?: string; imageUrls?: string[]; stock?: number; is_active?: boolean };
type Category = { id: string; name: string; slug: string };
type Order = { id: string; customer_name: string; customer_phone: string; customer_address: string; status?: string; created_at: string; notes?: string; products?: { name: string; price: number; category: string } | null; proof_url?: string };
type UserRow = { id: string; email: string; role: string; fullName: string; createdAt: string };

type Tab = 'overview' | 'products' | 'categories' | 'orders' | 'users' | 'profile' | 'settings';

/* helper */
function authHeaders() {
  const t = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ─── Component ─── */
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  /* data */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  /* form states */
  const [prodForm, setProdForm] = useState<Partial<Product>>({});
  const [editingProd, setEditingProd] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<{ name: string; slug: string }>({ name: '', slug: '' });
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');

  /* pagination */
  const [productsPage, setProductsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const pageSize = 8;

  /* stored user info for role check */
  const storedUser = (() => {
    try {
      const s = localStorage.getItem('admin_user') || localStorage.getItem('customer_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'manager')) {
      navigate('/');
    }
  }, []);

  /* fetch */
  const fetchAll = async () => {
    const h = { headers: authHeaders() };
    try {
      const [p, c, o, u, s] = await Promise.all([
        axios.get<Product[]>('/api/products', h),
        axios.get<Category[]>('/api/categories', h),
        axios.get<Order[]>('/api/orders', h).catch(() => ({ data: [] as Order[] })),
        axios.get<UserRow[]>('/api/auth/users', h).catch(() => ({ data: [] as UserRow[] })),
        axios.get<{ hero_video_url: string }>('/api/settings', h).catch(() => ({ data: { hero_video_url: '' } })),
      ]);
      setProducts(p.data);
      setCategories(c.data);
      setOrders(o.data);
      setUsers(u.data);
      setHeroVideoUrl(s.data.hero_video_url);
    } catch { /* ignore */ }
  };
  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /* ── Product CRUD ── */
  const saveProd = async () => {
    setLoading(true); setMsg('');
    try {
      // validate category exists in DB
      if (!prodForm.category) {
        setMsg('Please select a category');
        setLoading(false);
        return;
      }
      const catSlugs = categories.map((c) => c.slug);
      if (!catSlugs.includes(prodForm.category as string)) {
        setMsg('Please select a valid category from the list');
        setLoading(false);
        return;
      }

      // send only fields that exist in the products table to avoid unknown-column issues
      const payload: any = {
        name: prodForm.name,
        description: prodForm.description,
        price: prodForm.price,
        category: prodForm.category,
        stock: prodForm.stock,
        is_active: prodForm.is_active ?? true,
        imageUrl: prodForm.imageUrl,
        imageUrls: prodForm.imageUrls || []
      };

      if (!payload.imageUrl && payload.imageUrls.length > 0) {
        payload.imageUrl = payload.imageUrls[0];
      }

      if (editingProd) {
        await axios.put(`/api/products/${editingProd}`, payload, { headers: authHeaders() });
      } else {
        await axios.post('/api/products', payload, { headers: authHeaders() });
      }
      setProdForm({}); setEditingProd(null); await fetchAll();
      setMsg('Product saved!');
    } catch (e: any) { setMsg(e?.response?.data?.message || 'Error'); }
    setLoading(false);
  };
  const deleteProd = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await axios.delete(`/api/products/${id}`, { headers: authHeaders() }); await fetchAll(); } catch { setMsg('Error deleting'); }
  };

  /* ── Category CRUD ── */
  const saveCat = async () => {
    setLoading(true); setMsg('');
    try {
      if (editingCat) {
        await axios.put(`/api/categories/${editingCat}`, catForm, { headers: authHeaders() });
      } else {
        await axios.post('/api/categories', catForm, { headers: authHeaders() });
      }
      setCatForm({ name: '', slug: '' }); setEditingCat(null); await fetchAll();
      setMsg('Category saved!');
    } catch (e: any) { setMsg(e?.response?.data?.message || 'Error'); }
    setLoading(false);
  };
  const deleteCat = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await axios.delete(`/api/categories/${id}`, { headers: authHeaders() }); await fetchAll(); } catch { setMsg('Error deleting'); }
  };

  /* ── Order status ── */
  const updateStatus = async (id: string, status: string) => {
    try { await axios.put(`/api/orders/${id}/status`, { status }, { headers: authHeaders() }); await fetchAll(); } catch { setMsg('Error updating status'); }
  };

  /* ── User role ── */
  const changeRole = async (id: string, role: string) => {
    try { await axios.put(`/api/auth/users/${id}/role`, { role }, { headers: authHeaders() }); await fetchAll(); } catch { setMsg('Error updating role'); }
  };

  /* upload image file(s) */
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const h = { headers: authHeaders() };
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData();
        fd.append('file', f);
        const url = editingProd ? `/api/products/upload-image?productId=${editingProd}` : '/api/products/upload-image';
        const res = await axios.post(url, fd, { headers: { ...h.headers, 'Content-Type': 'multipart/form-data' } });
        if (res.data?.imageUrl) uploaded.push(res.data.imageUrl);
      }
      // Persist images coming from storage to the form.
      if (uploaded.length > 0) {
        setProdForm((s) => {
          const existing = s.imageUrls || [];
          const combined = [...existing, ...uploaded];
          return {
            ...s,
            imageUrls: combined,
            imageUrl: s.imageUrl || combined[0]
          };
        });
      }
      setMsg('Image(s) uploaded and added to product gallery');
    } catch (e: any) { setMsg(e?.response?.data?.message || 'Upload failed'); }
  };

  /* profile update */
  const saveProfile = async () => {
    if (!storedUser) return;
    try {
      const h = { headers: authHeaders() };
      await axios.put(`/api/auth/users/${storedUser.id}`, { fullName: storedUser.fullName }, h);
      setMsg('Profile updated');
      await fetchAll();
    } catch { setMsg('Could not update profile'); }
  };

  /* ── Sidebar tabs ── */
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'categories', label: 'Categories', icon: '🏷️' },
    { key: 'orders', label: 'Orders', icon: '🛒' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
    { key: 'profile', label: 'Profile', icon: '🙍' },
  ];

  const inputClass = theme === 'dark'
    ? 'w-full rounded-lg bg-slate-800/50 border border-slate-700 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500'
    : 'w-full rounded-lg bg-white border border-slate-200 text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:border-sky-300';
  const btnPrimary = theme === 'dark'
    ? 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-60'
    : 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-60';
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    confirmed: 'bg-blue-500/20 text-blue-300',
    shipped: 'bg-purple-500/20 text-purple-300',
    delivered: 'bg-emerald-500/20 text-emerald-300',
    cancelled: 'bg-red-500/20 text-red-300',
  };

  const containerClass = theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <div className={`${containerClass} app-shell fixed inset-0 flex`}>
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out sidebar`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b" style={theme === 'dark' ? { borderColor: 'rgba(148,163,184,.06)' } : { borderColor: 'rgba(2,6,23,.04)' }}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm">KS</span>
          <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-semibold tracking-tight`}>Admin Panel</span>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-300 hover:text-white" aria-label="Close sidebar">✕</button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${tab === t.key ? (theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100') : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{storedUser?.email}</p>
          <p className="text-xs" style={{ color: 'var(--btn-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{storedUser?.role}</p>
          <button
            type="button"
            onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); localStorage.removeItem('customer_token'); localStorage.removeItem('customer_user'); navigate('/'); }}
            className="mt-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* top bar */}
        <header className={`sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b shrink-0 backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              <span className="flex flex-col gap-1.5"><span className="h-0.5 w-5 bg-current rounded-full" /><span className="h-0.5 w-5 bg-current rounded-full" /><span className="h-0.5 w-5 bg-current rounded-full" /></span>
            </button>
            <h1 className={`text-lg font-black tracking-tight capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button type="button" onClick={() => navigate('/')} className={`text-xs font-semibold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}>← Back to shop</button>
          </div>
        </header>

        {/* scrollable content */}
        <main className="flex-1 overflow-auto p-6">
          {msg && (
            <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm text-amber-300 flex items-center justify-between">
              {msg}
              <button type="button" onClick={() => setMsg('')} className="text-amber-400 hover:text-white ml-4">✕</button>
            </div>
          )}

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="space-y-6">
              <div className="rounded-2xl p-5 border card">
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4`}>Your profile</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Full name" value={storedUser?.fullName || ''} onChange={(e) => { try { const s = JSON.parse(localStorage.getItem('admin_user') || 'null'); if (s) { s.fullName = e.target.value; localStorage.setItem('admin_user', JSON.stringify(s)); } } catch { } }} />
                  <input className={inputClass} placeholder="Email" value={storedUser?.email || ''} disabled />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={saveProfile} className={btnPrimary} style={theme === 'dark' ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)' } : { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                    Save profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Products', value: products.length, sub: `${products.filter(p => p.is_active).length} active`, color: 'from-blue-600 to-indigo-600', icon: '📦' },
                  { label: 'Categories', value: categories.length, sub: 'Organized sections', color: 'from-purple-600 to-fuchsia-600', icon: '🏷️' },
                  { label: 'Total Orders', value: orders.length, sub: `${orders.filter(o => o.status === 'pending').length} pending`, color: 'from-amber-500 to-orange-600', icon: '🛒' },
                  { label: 'Total Users', value: users.length, sub: `${users.filter(u => u.role === 'admin' || u.role === 'manager').length} team`, color: 'from-emerald-500 to-teal-600', icon: '👥' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-[2rem] p-6 border shadow-sm relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-md ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full`} />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.color} text-xl shadow-inner text-white`}>
                        <span className="drop-shadow-md">{s.icon}</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className={`text-3xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                      <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</p>
                      <p className={`text-[11px] font-medium mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className={`rounded-3xl p-6 border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Recent Orders</h3>
                  <div className="space-y-3 max-h-64 overflow-auto scrollbar-hide">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className={`rounded-xl p-3 text-xs border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{o.customer_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[o.status || 'pending'] || statusColors.pending}`}>{o.status || 'pending'}</span>
                        </div>
                        <p className={`mt-1 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{o.products?.name} · {o.products?.price ? formatRwf(o.products.price) : ''}</p>
                      </div>
                    ))}
                    {orders.length === 0 && <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No orders yet.</p>}
                  </div>
                </div>
                <div className={`rounded-3xl p-6 border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Team Members</h3>
                  <div className="space-y-3 max-h-64 overflow-auto scrollbar-hide">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className={`flex items-center justify-between rounded-xl p-3 text-xs border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                        <div>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{u.fullName || u.email}</p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {tab === 'products' && (
            <div className="space-y-6">
              {/* form */}
              <div className="rounded-2xl p-5 border card">
                <h3 className="text-sm font-semibold text-white mb-4">{editingProd ? 'Edit Product' : 'Add New Product'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Product name" value={prodForm.name || ''} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
                  <div>
                    <input className={inputClass} placeholder="Price" type="number" step="0.01" value={prodForm.price ?? ''} onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })} />
                    {typeof prodForm.price === 'number' && !Number.isNaN(prodForm.price) && (
                      <div className="text-xs text-slate-400 mt-1">{formatRwf(prodForm.price)}</div>
                    )}
                  </div>
                  <select className={inputClass} value={prodForm.category || ''} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                  <input className={inputClass} placeholder="Stock" type="number" value={prodForm.stock ?? ''} onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value) || 0 })} />
                  <input className={inputClass + ' md:col-span-2'} placeholder="Description" value={prodForm.description || ''} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} />
                  <input className={inputClass + ' md:col-span-2'} placeholder="Image URL" value={prodForm.imageUrl || ''} onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })} />
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-xs font-bold text-slate-400 block mb-1">Product Gallery</label>
                    <div className="flex flex-wrap gap-3">
                      {prodForm.imageUrls?.map((u, i) => (
                        <div key={`${u}-${i}`} className="group relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                          <img src={u} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = [...(prodForm.imageUrls || [])];
                              newUrls.splice(i, 1);
                              setProdForm({
                                ...prodForm,
                                imageUrls: newUrls,
                                imageUrl: prodForm.imageUrl === u ? (newUrls[0] || '') : prodForm.imageUrl
                              });
                            }}
                            className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <span className="text-xs font-bold">Remove</span>
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                        <span className="text-xl">+</span>
                        <span className="text-[10px] font-bold">Upload</span>
                        <input type="file" className="hidden" onChange={(e) => uploadFiles(e.target.files)} multiple />
                      </label>
                    </div>
                    {prodForm.imageUrl && (
                      <div className="text-[10px] text-slate-500 italic">
                        * The first image in the gallery will be used as the primary thumbnail.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={saveProd} disabled={loading} className={btnPrimary} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                    {loading ? 'Saving...' : editingProd ? 'Update' : 'Add Product'}
                  </button>
                  {editingProd && <button type="button" onClick={() => { setEditingProd(null); setProdForm({}); }} className="text-xs text-slate-400 hover:text-white">Cancel</button>}
                </div>
              </div>

              {/* table */}
              <div className="rounded-2xl border overflow-hidden card">
                <div className="overflow-x-auto table-container table-zebra">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Price</th>
                        <th className="px-4 py-2">Stock</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice((productsPage - 1) * pageSize, productsPage * pageSize).map((p) => (
                        <tr key={p.id} className="border-b border-slate-800/50 transition-colors hover:bg-white/5">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <div className="relative group cursor-pointer" onClick={() => { setEditingProd(p.id); setProdForm(p); }}>
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-sm" alt="" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">NO IMG</div>
                                )}
                                {p.imageUrls && p.imageUrls.length > 1 && (
                                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1 rounded-md shadow-lg border border-indigo-400/50">
                                    +{p.imageUrls.length - 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-slate-200 font-bold text-sm truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{p.description || 'No description'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                              {(categories.find((c) => c.slug === p.category)?.name) || p.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-black text-slate-200 text-sm">{formatRwf(p.price ?? 0)}</td>
                          <td className="px-4 py-2">
                            <span className={`text-[11px] font-bold ${(p.stock || 0) < 5 ? 'text-red-400' : 'text-slate-400'}`}>
                              {p.stock ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="table-actions inline-flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => { setEditingProd(p.id); setProdForm(p); }}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 transition-all font-bold text-[10px]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProd(p.id)}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 transition-all font-bold text-[10px]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No products yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 flex items-center justify-end gap-2">
                  <button disabled={productsPage === 1} onClick={() => setProductsPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded border">Prev</button>
                  <div className="text-sm text-slate-400">Page {productsPage} / {Math.max(1, Math.ceil(products.length / pageSize))}</div>
                  <button disabled={productsPage >= Math.ceil(products.length / pageSize)} onClick={() => setProductsPage((p) => p + 1)} className="px-3 py-1 rounded border">Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <div className="rounded-2xl p-5 border card">
                <h3 className="text-sm font-semibold text-white mb-4">{editingCat ? 'Edit Category' : 'Add New Category'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
                  <input className={inputClass} placeholder="Slug (e.g. children-shoes)" value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={saveCat} disabled={loading} className={btnPrimary} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                    {loading ? 'Saving...' : editingCat ? 'Update' : 'Add Category'}
                  </button>
                  {editingCat && <button type="button" onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '' }); }} className="text-xs text-slate-400 hover:text-white">Cancel</button>}
                </div>
              </div>
              <div className="rounded-2xl border overflow-hidden card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Slug</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/50 transition-colors hover:bg-white/5">
                          <td className="px-4 py-1.5 font-semibold text-slate-200">{c.name}</td>
                          <td className="px-4 py-1.5 text-slate-400">{c.slug}</td>
                          <td className="px-4 py-1.5 text-right">
                            <div className="table-actions inline-flex items-center gap-2 justify-end">
                              <button type="button" onClick={() => { setEditingCat(c.id); setCatForm({ name: c.name, slug: c.slug }); }} className="edit text-[10px] px-2 py-0.5">Edit</button>
                              <button type="button" onClick={() => deleteCat(c.id)} className="delete text-[10px] px-2 py-0.5">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-xs">No categories yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Store Settings</h2>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Manage your store's global configuration and media.</p>
              </div>

              <div className={`rounded-[2rem] p-8 border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="mb-6">
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hero Demo Video</h3>
                  <p className={`text-sm mt-1 mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Add a video up to 45 MB to help explain your products and store to visitors on the Home Page.</p>
                </div>

                <div className="space-y-6">
                  {heroVideoUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-700/50 aspect-video max-w-2xl bg-black shadow-lg relative group">
                      <video src={heroVideoUrl} controls className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white font-semibold flex items-center gap-2 backdrop-blur-md bg-black/30 px-4 py-2 rounded-lg">
                          <span>🎥</span> Current Video
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${theme === 'dark' ? 'border-slate-700 bg-slate-800/20 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      <div className="text-4xl mb-3 opacity-50">📤</div>
                      <p className="font-medium">No hero video uploaded yet.</p>
                      <p className="text-xs mt-1">Upload a visually stunning preview of your products.</p>
                    </div>
                  )}

                  <div className={`flex flex-col gap-3 p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                    <label className={`text-sm font-bold flex flex-col gap-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-2">
                        <span>✨</span> Upload New Video <span className="text-xs font-normal opacity-70">(Max 45MB, MP4 recommended)</span>
                      </div>

                      <div className="relative group/btn w-fit">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 45 * 1024 * 1024) return setMsg('File too large (Max 45MB)');

                            setLoading(true); setMsg('Uploading HD video...');
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await axios.post('/api/settings/hero-video', formData, {
                                headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
                              });
                              setHeroVideoUrl(res.data.data.url);
                              setMsg('Hero video updated successfully!');
                            } catch (err: any) {
                              setMsg(err.response?.data?.message || 'Upload failed');
                            }
                            setLoading(false);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button
                          type="button"
                          className={`relative z-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-transform group-active/btn:scale-95 shadow-md ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          <span>Add Video</span>
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === 'orders' && (
            <div className="rounded-2xl border overflow-hidden card">
              <div className="overflow-x-auto table-container table-zebra">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Phone</th>
                      <th className="px-4 py-2">Proof</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-1.5">
                          <p className="text-slate-200 font-semibold">{o.customer_name}</p>
                          <p className="text-[9px] text-slate-500 truncate max-w-[100px]">{o.customer_address}</p>
                        </td>
                        <td className="px-4 py-1.5 text-slate-300">{o.products?.name || '—'}</td>
                        <td className="px-4 py-1.5 text-slate-400">{o.customer_phone}</td>
                        <td className="px-4 py-1.5">
                          {o.proof_url ? (
                            <a href={o.proof_url} target="_blank" rel="noreferrer" className="inline-block rounded overflow-hidden border border-slate-700">
                              <img src={o.proof_url} alt="proof" className="w-12 h-10 object-cover" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusColors[o.status || 'pending'] || statusColors.pending}`}>{o.status || 'pending'}</span>
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          <select
                            className="rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 focus:outline-none"
                            value={o.status || 'pending'}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500 text-xs">No orders yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="rounded-2xl border overflow-hidden card">
              <div className="overflow-x-auto table-container table-zebra">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice((usersPage - 1) * pageSize, usersPage * pageSize).map((u) => (
                      <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[10px] font-bold">
                              {(u.fullName || u.email).charAt(0).toUpperCase()}
                            </span>
                            <span className="text-slate-200 font-semibold">{u.fullName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-1.5 text-slate-400">{u.email}</td>
                        <td className="px-4 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : u.role === 'manager' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          {storedUser?.role === 'admin' && (
                            <select
                              className="rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 focus:outline-none"
                              value={u.role}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                            >
                              <option value="customer">Customer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-xs">No users found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-3 flex items-center justify-end gap-2">
                <button disabled={usersPage === 1} onClick={() => setUsersPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded border">Prev</button>
                <div className="text-sm text-slate-400">Page {usersPage} / {Math.max(1, Math.ceil(users.length / pageSize))}</div>
                <button disabled={usersPage >= Math.ceil(users.length / pageSize)} onClick={() => setUsersPage((p) => p + 1)} className="px-3 py-1 rounded border">Next</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar Mobile Overlay handled at top */}
    </div>
  );
}
