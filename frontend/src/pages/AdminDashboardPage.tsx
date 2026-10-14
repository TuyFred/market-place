import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatRwf } from '../utils/format';
import { BRAND, SAMPLE_IMAGES } from '../config/brand';
import {
  isDemoAdminToken,
  loadDemoCategories,
  loadDemoOrders,
  loadDemoProducts,
  loadDemoUsers,
  saveDemoCategories,
  saveDemoOrders,
  saveDemoProducts,
  saveDemoUsers,
  type DemoCategory,
  type DemoProduct,
} from '../config/demoAuth';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  subcategory?: string;
  size?: string;
  imageUrl?: string;
  imageUrls?: string[];
  stock?: number;
  is_active?: boolean;
};
type Category = { id: string; name: string; slug: string; parent_id?: string | null };
type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status?: string;
  created_at: string;
  notes?: string;
  products?: { name: string; price: number; category: string; imageUrl?: string } | null;
  proof_url?: string;
  payment_method?: string;
  payment_status?: string;
  payment_reference?: string;
};
type PaymentSettings = {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  mobileNumber: string;
  mobileName: string;
  paypalEmail: string;
  supportPhone: string;
  instructions: string;
};
type UserRow = { id: string; email: string; role: string; fullName: string; createdAt: string };
type Tab = 'overview' | 'products' | 'categories' | 'orders' | 'users' | 'settings' | 'profile';

function authHeaders() {
  const t = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500';
const cardClass = 'rounded-2xl border border-neutral-200 bg-white shadow-sm';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50';
const btnGhost =
  'inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  payment_review: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-sky-100 text-sky-800',
  shipped: 'bg-violet-100 text-violet-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [prodForm, setProdForm] = useState<Partial<Product>>({});
  const [editingProd, setEditingProd] = useState<string | null>(null);
  const [showProdModal, setShowProdModal] = useState(false);
  const [catForm, setCatForm] = useState<{ name: string; slug: string; parent_id: string }>({
    name: '',
    slug: '',
    parent_id: '',
  });
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [paySettings, setPaySettings] = useState<PaymentSettings>({
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
    mobileNumber: '',
    mobileName: '',
    paypalEmail: '',
    supportPhone: '',
    instructions: '',
  });
  const [viewingProd, setViewingProd] = useState<Product | null>(null);
  const [viewingImageIdx, setViewingImageIdx] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [profileName, setProfileName] = useState('');

  const [productsPage, setProductsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const pageSize = 8;

  const [storedUser, setStoredUser] = useState(() => {
    try {
      const s = localStorage.getItem('admin_user') || localStorage.getItem('customer_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const demoMode = isDemoAdminToken(
    localStorage.getItem('admin_token') || localStorage.getItem('customer_token'),
  );

  useEffect(() => {
    const role = storedUser?.role;
    if (!storedUser || (role !== 'admin' && role !== 'manager')) {
      navigate('/login', { replace: true });
      return;
    }
    setProfileName(storedUser.fullName || '');
  }, [navigate, storedUser]);

  const loadDemoDashboard = () => {
    setProducts(loadDemoProducts() as Product[]);
    setCategories(loadDemoCategories() as Category[]);
    setOrders(loadDemoOrders() as Order[]);
    setUsers(loadDemoUsers() as UserRow[]);
    setHeroVideoUrl('');
  };

  const fetchAll = async () => {
    if (
      isDemoAdminToken(localStorage.getItem('admin_token') || localStorage.getItem('customer_token')) ||
      localStorage.getItem('demo_mode') === '1'
    ) {
      loadDemoDashboard();
      return;
    }
    const h = { headers: authHeaders() };
    try {
      const [p, c, o, u, s] = await Promise.all([
        axios.get<Product[]>('/api/products', h),
        axios.get<Category[]>('/api/categories', h),
        axios.get<Order[]>('/api/orders', h).catch(() => ({ data: [] as Order[] })),
        axios.get<UserRow[]>('/api/auth/users', h).catch(() => ({ data: [] as UserRow[] })),
        axios
          .get<{ hero_video_url: string; payment?: PaymentSettings }>('/api/settings', h)
          .catch(() => ({ data: { hero_video_url: '', payment: undefined } })),
      ]);
      setProducts(p.data || []);
      setCategories(c.data || []);
      setOrders(o.data || []);
      setUsers(u.data || []);
      setHeroVideoUrl(s.data?.hero_video_url || '');
      if (s.data?.payment) setPaySettings((prev) => ({ ...prev, ...s.data.payment }));
    } catch {
      setMsg('Could not load dashboard data. Check your connection and try again.');
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showProdModal || viewingProd ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showProdModal, viewingProd]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const openNewProduct = () => {
    setEditingProd(null);
    setProdForm({
      name: '',
      price: 0,
      stock: 10,
      category: categories[0]?.slug || '',
      description: '',
      size: '',
      imageUrl: '',
      imageUrls: [],
      is_active: true,
    });
    setShowProdModal(true);
    setMsg('');
  };

  const openEditProduct = (p: Product) => {
    setEditingProd(p.id);
    setProdForm({ ...p, imageUrls: p.imageUrls || (p.imageUrl ? [p.imageUrl] : []) });
    setShowProdModal(true);
    setViewingProd(null);
    setMsg('');
  };

  const inDemo = () =>
    demoMode ||
    isDemoAdminToken(localStorage.getItem('admin_token') || localStorage.getItem('customer_token'));

  const saveProd = async () => {
    setLoading(true);
    setMsg('');
    try {
      if (!prodForm.name?.trim()) {
        setMsg('Product name is required');
        setLoading(false);
        return;
      }
      if (!prodForm.category) {
        setMsg('Please select a category — create one in Categories first if needed');
        setLoading(false);
        return;
      }
      if (!categories.some((c) => c.slug === prodForm.category)) {
        setMsg('Please select a valid category');
        setLoading(false);
        return;
      }

      const payload: DemoProduct & { subcategory?: string } = {
        id: editingProd || `demo-prod-${Date.now()}`,
        name: prodForm.name.trim(),
        description: prodForm.description || '',
        price: Number(prodForm.price) || 0,
        category: prodForm.category as string,
        subcategory: prodForm.subcategory || undefined,
        stock: Number(prodForm.stock) || 0,
        size: prodForm.size || undefined,
        is_active: prodForm.is_active ?? true,
        imageUrl: prodForm.imageUrl,
        imageUrls: prodForm.imageUrls || [],
      };
      if (!payload.imageUrl && payload.imageUrls?.length) {
        payload.imageUrl = payload.imageUrls[0];
      }

      if (inDemo()) {
        const list = loadDemoProducts();
        const next = editingProd
          ? list.map((p) => (p.id === editingProd ? { ...p, ...payload, id: editingProd } : p))
          : [payload, ...list];
        saveDemoProducts(next);
        setProducts(next as Product[]);
      } else {
        const { id: _id, ...body } = payload;
        if (editingProd) {
          await axios.put(`/api/products/${editingProd}`, body, { headers: authHeaders() });
        } else {
          await axios.post('/api/products', body, { headers: authHeaders() });
        }
        await fetchAll();
      }
      setProdForm({});
      setEditingProd(null);
      setShowProdModal(false);
      setMsg(inDemo() ? 'Product saved (demo / local)' : 'Product saved');
      setTab('products');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not save product');
    }
    setLoading(false);
  };

  const deleteProd = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      if (inDemo()) {
        const next = loadDemoProducts().filter((p) => p.id !== id);
        saveDemoProducts(next);
        setProducts(next as Product[]);
      } else {
        await axios.delete(`/api/products/${id}`, { headers: authHeaders() });
        await fetchAll();
      }
      setMsg('Product deleted');
    } catch {
      setMsg('Error deleting product');
    }
  };

  const saveCat = async () => {
    setLoading(true);
    setMsg('');
    try {
      const name = catForm.name.trim();
      const slug = (catForm.slug || slugify(name)).trim();
      if (!name || !slug) {
        setMsg('Category name is required');
        setLoading(false);
        return;
      }
      const body = { name, slug, parent_id: catForm.parent_id || null };
      if (inDemo()) {
        const list = loadDemoCategories();
        const next: DemoCategory[] = editingCat
          ? list.map((c) => (c.id === editingCat ? { ...c, ...body } : c))
          : [{ id: `demo-cat-${Date.now()}`, ...body }, ...list];
        saveDemoCategories(next);
        setCategories(next as Category[]);
      } else if (editingCat) {
        await axios.put(`/api/categories/${editingCat}`, body, { headers: authHeaders() });
        await fetchAll();
      } else {
        await axios.post('/api/categories', body, { headers: authHeaders() });
        await fetchAll();
      }
      setCatForm({ name: '', slug: '', parent_id: '' });
      setEditingCat(null);
      setSlugManual(false);
      setMsg(inDemo() ? 'Category saved (demo / local)' : 'Category saved');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not save category');
    }
    setLoading(false);
  };

  const deleteCat = async (id: string) => {
    if (!confirm('Delete this category? Products using it may need a new category.')) return;
    try {
      if (inDemo()) {
        const next = loadDemoCategories().filter((c) => c.id !== id);
        saveDemoCategories(next);
        setCategories(next);
      } else {
        await axios.delete(`/api/categories/${id}`, { headers: authHeaders() });
        await fetchAll();
      }
      setMsg('Category deleted');
    } catch {
      setMsg('Error deleting category');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (inDemo()) {
        const next = (loadDemoOrders() as Order[]).map((o) => (o.id === id ? { ...o, status } : o));
        saveDemoOrders(next);
        setOrders(next);
      } else {
        await axios.put(`/api/orders/${id}/status`, { status }, { headers: authHeaders() });
        await fetchAll();
      }
    } catch {
      setMsg('Error updating status');
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      if (inDemo()) {
        const next = (loadDemoUsers() as UserRow[]).map((u) => (u.id === id ? { ...u, role } : u));
        saveDemoUsers(next);
        setUsers(next);
        return;
      }
      const body: { role: string; currentAdminPassword?: string } = { role };
      if (role === 'admin') {
        const pwd = window.prompt(
          'Confirm your admin password to grant administrator access:',
        );
        if (!pwd) {
          setMsg('Role change cancelled — password required to create admins');
          await fetchAll();
          return;
        }
        body.currentAdminPassword = pwd;
      }
      await axios.put(`/api/auth/users/${id}/role`, body, { headers: authHeaders() });
      setMsg(`Role updated to ${role}`);
      await fetchAll();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : null;
      setMsg(typeof msg === 'string' ? msg : 'Error updating role');
      await fetchAll();
    }
  };

  const resetPassword = async (id: string) => {
    if (inDemo()) {
      setMsg('Password reset skipped in demo mode');
      return;
    }
    const pwd = prompt('Enter new password (min 6 characters):');
    if (!pwd) return;
    try {
      await axios.put(`/api/auth/users/${id}/reset-password`, { password: pwd }, { headers: authHeaders() });
      setMsg('Password reset');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not reset password');
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg('');
    try {
      const uploaded: string[] = [];
      if (inDemo()) {
        for (let i = 0; i < files.length; i++) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(files[i]);
          });
          if (dataUrl) uploaded.push(dataUrl);
        }
      } else {
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData();
          fd.append('file', files[i]);
          const url = editingProd
            ? `/api/products/upload-image?productId=${editingProd}`
            : '/api/products/upload-image';
          const res = await axios.post(url, fd, {
            headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.imageUrl) uploaded.push(res.data.imageUrl);
        }
      }
      if (uploaded.length) {
        setProdForm((s) => {
          const existing = s.imageUrls || [];
          const combined = [...existing, ...uploaded];
          return { ...s, imageUrls: combined, imageUrl: s.imageUrl || combined[0] };
        });
        setMsg(`${uploaded.length} image(s) added${inDemo() ? ' (demo / local)' : ''}`);
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!storedUser) return;
    try {
      if (inDemo()) {
        const next = { ...storedUser, fullName: profileName };
        localStorage.setItem('admin_user', JSON.stringify(next));
        localStorage.setItem('customer_user', JSON.stringify(next));
        setStoredUser(next);
        setMsg('Profile updated (demo / local)');
        return;
      }
      await axios.put(`/api/auth/users/${storedUser.id}`, { fullName: profileName }, { headers: authHeaders() });
      const key = localStorage.getItem('admin_user') ? 'admin_user' : 'customer_user';
      const next = { ...storedUser, fullName: profileName };
      localStorage.setItem(key, JSON.stringify(next));
      setStoredUser(next);
      setMsg('Profile updated');
    } catch {
      setMsg('Could not update profile');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'orders', label: 'Orders' },
    { key: 'users', label: 'Users' },
    { key: 'settings', label: 'Settings' },
    { key: 'profile', label: 'Profile' },
  ];

  const gallery = prodForm.imageUrls?.length
    ? prodForm.imageUrls
    : prodForm.imageUrl
      ? [prodForm.imageUrl]
      : [];

  const productPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const userPages = Math.max(1, Math.ceil(users.length / pageSize));

  return (
    <div className="fixed inset-0 flex bg-neutral-50 text-black">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-neutral-200 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-5 sm:h-16">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black text-[11px] font-bold text-white">
            {BRAND.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold tracking-wide">{BRAND.shortName}</p>
            <p className="text-[11px] text-neutral-500">Admin</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-neutral-400 md:hidden" aria-label="Close">
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSidebarOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                tab === t.key ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <p className="truncate text-xs text-neutral-500">{storedUser?.email}</p>
          <p className="mt-0.5 text-xs font-semibold capitalize text-black">{storedUser?.role}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              localStorage.removeItem('customer_token');
              localStorage.removeItem('customer_user');
              navigate('/');
            }}
            className="mt-3 text-xs text-neutral-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 md:hidden"
              aria-label="Open menu"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 bg-black" />
                <span className="h-0.5 w-4 bg-black" />
                <span className="h-0.5 w-4 bg-black" />
              </span>
            </button>
            <h1 className="truncate text-base font-bold capitalize sm:text-lg">{tab}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {tab === 'products' && (
              <button type="button" onClick={openNewProduct} className={`${btnPrimary} !px-3 !py-2 sm:!px-5`}>
                + Product
              </button>
            )}
            {tab === 'categories' && (
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({ name: '', slug: '' });
                  setSlugManual(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`${btnPrimary} !px-3 !py-2 sm:!px-5`}
              >
                + Category
              </button>
            )}
            <Link to="/" className="text-xs font-semibold text-neutral-500 hover:text-black sm:text-sm">
              ← Shop
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {msg && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black shadow-sm">
              <span>{msg}</span>
              <button type="button" onClick={() => setMsg('')} className="shrink-0 text-neutral-400 hover:text-black">
                ✕
              </button>
            </div>
          )}

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {[
                  { label: 'Products', value: products.length, hint: 'In catalog', action: () => setTab('products') },
                  { label: 'Categories', value: categories.length, hint: 'Collections', action: () => setTab('categories') },
                  { label: 'Orders', value: orders.length, hint: `${orders.filter((o) => o.status === 'pending').length} pending`, action: () => setTab('orders') },
                  { label: 'Users', value: users.length, hint: 'Accounts', action: () => setTab('users') },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={s.action}
                    className={`${cardClass} p-4 text-left transition hover:border-black sm:p-5`}
                  >
                    <p className="text-2xl font-bold sm:text-3xl">{s.value}</p>
                    <p className="mt-1 text-sm font-semibold">{s.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{s.hint}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${cardClass} p-4 sm:p-5`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold">Quick actions</h3>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={openNewProduct} className={btnPrimary}>
                      Add product
                    </button>
                    <button type="button" onClick={() => setTab('categories')} className={btnGhost}>
                      Manage categories
                    </button>
                  </div>
                  {categories.length === 0 && (
                    <p className="mt-3 text-xs text-amber-700">
                      Create at least one category before adding products.
                    </p>
                  )}
                </div>
                <div className={`${cardClass} p-4 sm:p-5`}>
                  <h3 className="mb-3 text-sm font-bold">Recent orders</h3>
                  <div className="max-h-56 space-y-2 overflow-auto">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{o.customer_name}</span>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${statusColors[o.status || 'pending']}`}>
                            {o.status || 'pending'}
                          </span>
                        </div>
                        <p className="mt-1 text-neutral-500">
                          {o.products?.name || '—'}
                          {o.products?.price != null ? ` · ${formatRwf(o.products.price)}` : ''}
                        </p>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-xs text-neutral-400">No orders yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {tab === 'products' && (
            <div className="space-y-4">
              {categories.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <p className="font-semibold">No categories yet</p>
                  <p className="mt-1 text-amber-800/90">Add a category first so you can assign products to it.</p>
                  <button type="button" onClick={() => setTab('categories')} className={`${btnPrimary} mt-3 !bg-amber-900`}>
                    Go to Categories
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  className={`${inputClass} sm:max-w-xs`}
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductsPage(1);
                  }}
                />
                <button type="button" onClick={openNewProduct} disabled={categories.length === 0} className={btnPrimary}>
                  + Add product
                </button>
              </div>

              <div className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts
                        .slice((productsPage - 1) * pageSize, productsPage * pageSize)
                        .map((p) => (
                          <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="flex items-center gap-3 text-left"
                                onClick={() => {
                                  setViewingProd(p);
                                  setViewingImageIdx(0);
                                }}
                              >
                                <img
                                  src={p.imageUrl || SAMPLE_IMAGES.placeholder}
                                  alt=""
                                  className="h-11 w-11 rounded-lg object-cover bg-neutral-100"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold">{p.name}</span>
                                  <span className="block truncate text-xs text-neutral-500">
                                    {p.description || 'No description'}
                                  </span>
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {categories.find((c) => c.slug === p.category)?.name || p.category}
                            </td>
                            <td className="px-4 py-3 font-semibold">{formatRwf(p.price ?? 0)}</td>
                            <td className="px-4 py-3">
                              <span className={(p.stock || 0) < 5 ? 'font-semibold text-red-600' : 'text-neutral-600'}>
                                {p.stock ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex gap-2">
                                <button type="button" onClick={() => openEditProduct(p)} className={btnGhost}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteProd(p.id)}
                                  className="rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                            No products yet. Click “Add product” to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-4 py-3">
                  <button
                    type="button"
                    disabled={productsPage === 1}
                    onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                    className={btnGhost}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-neutral-500">
                    Page {productsPage} / {productPages}
                  </span>
                  <button
                    type="button"
                    disabled={productsPage >= productPages}
                    onClick={() => setProductsPage((p) => p + 1)}
                    className={btnGhost}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {tab === 'categories' && (
            <div className="space-y-4">
              <div className={`${cardClass} p-4 sm:p-5`}>
                <h3 className="mb-4 text-sm font-bold">{editingCat ? 'Edit category' : 'Add category / subcategory'}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Women Wear"
                      value={catForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setCatForm((f) => ({
                          ...f,
                          name,
                          slug: slugManual ? f.slug : slugify(name),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Slug</label>
                    <input
                      className={inputClass}
                      placeholder="women-wear"
                      value={catForm.slug}
                      onChange={(e) => {
                        setSlugManual(true);
                        setCatForm({ ...catForm, slug: slugify(e.target.value) });
                      }}
                    />
                    <p className="mt-1 text-[11px] text-neutral-400">Auto-fills from name. Used in product filters.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Parent category (optional subcategory)</label>
                    <select
                      className={inputClass}
                      value={catForm.parent_id}
                      onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })}
                    >
                      <option value="">None — top-level category</option>
                      {categories
                        .filter((c) => !c.parent_id && c.id !== editingCat)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={saveCat} disabled={loading} className={btnPrimary}>
                    {loading ? 'Saving…' : editingCat ? 'Update category' : 'Add category'}
                  </button>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(null);
                        setCatForm({ name: '', slug: '', parent_id: '' });
                        setSlugManual(false);
                      }}
                      className={btnGhost}
                    >
                      Cancel
                    </button>
                  )}
                  {categories.length > 0 && (
                    <button type="button" onClick={openNewProduct} className={btnGhost}>
                      Add product →
                    </button>
                  )}
                </div>
              </div>

              <div className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3">Products</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => {
                        const count = products.filter((p) => p.category === c.slug || (p as any).subcategory === c.slug).length;
                        const parent = categories.find((p) => p.id === c.parent_id);
                        return (
                          <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                            <td className="px-4 py-3 font-semibold">
                              {c.parent_id ? <span className="text-neutral-400">↳ </span> : null}
                              {c.name}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {parent ? `Sub of ${parent.name}` : 'Category'}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">{c.slug}</td>
                            <td className="px-4 py-3 text-neutral-600">{count}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCat(c.id);
                                    setCatForm({
                                      name: c.name,
                                      slug: c.slug,
                                      parent_id: c.parent_id || '',
                                    });
                                    setSlugManual(true);
                                  }}
                                  className={btnGhost}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCat(c.id)}
                                  className="rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                            No categories yet. Add one above to start selling.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div className={`${cardClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Proof</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Process</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-neutral-100">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{o.customer_name}</p>
                          <p className="text-xs text-neutral-600">{o.customer_phone}</p>
                          <p className="max-w-[160px] truncate text-xs text-neutral-500">{o.customer_address}</p>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{o.products?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-neutral-600">
                          <p className="capitalize">{o.payment_method || '—'}</p>
                          <p className="text-neutral-400">{o.payment_reference || o.payment_status || ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          {o.proof_url ? (
                            <a href={o.proof_url} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg border border-neutral-200">
                              <img src={o.proof_url} alt="proof" className="h-10 w-12 object-cover" />
                            </a>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[o.status || 'pending'] || statusColors.pending}`}>
                            {o.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            className={`${inputClass} !w-auto !py-1.5 text-xs`}
                            value={o.status || 'pending'}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                          >
                            <option value="pending">Awaiting payment</option>
                            <option value="payment_review">Review payment</option>
                            <option value="confirmed">Approve / confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel / reject</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className={`${cardClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice((usersPage - 1) * pageSize, usersPage * pageSize).map((u) => (
                      <tr key={u.id} className="border-b border-neutral-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                              {(u.fullName || u.email).charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold">{u.fullName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                        <td className="px-4 py-3 capitalize text-neutral-700">{u.role}</td>
                        <td className="px-4 py-3 text-right">
                          {storedUser?.role === 'admin' && (
                            <div className="inline-flex items-center gap-2">
                              <select
                                className={`${inputClass} !w-auto !py-1.5 text-xs`}
                                value={u.role}
                                onChange={(e) => changeRole(u.id, e.target.value)}
                              >
                                <option value="customer">Customer</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button type="button" onClick={() => resetPassword(u.id)} className={btnGhost}>
                                Reset
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-neutral-400">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-4 py-3">
                <button type="button" disabled={usersPage === 1} onClick={() => setUsersPage((p) => Math.max(1, p - 1))} className={btnGhost}>
                  Prev
                </button>
                <span className="text-xs text-neutral-500">
                  Page {usersPage} / {userPages}
                </span>
                <button
                  type="button"
                  disabled={usersPage >= userPages}
                  onClick={() => setUsersPage((p) => p + 1)}
                  className={btnGhost}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div className="mx-auto max-w-3xl space-y-4">
              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-base font-bold">Payment details for customers</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Shown at checkout: bank transfer, mobile money, and PayPal. Customers pay, then submit proof for your approval.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Bank name</label>
                    <input className={inputClass} value={paySettings.bankName} onChange={(e) => setPaySettings({ ...paySettings, bankName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Account name</label>
                    <input className={inputClass} value={paySettings.bankAccountName} onChange={(e) => setPaySettings({ ...paySettings, bankAccountName: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Bank account number</label>
                    <input className={inputClass} value={paySettings.bankAccount} onChange={(e) => setPaySettings({ ...paySettings, bankAccount: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile money name</label>
                    <input className={inputClass} value={paySettings.mobileName} onChange={(e) => setPaySettings({ ...paySettings, mobileName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile money number</label>
                    <input className={inputClass} value={paySettings.mobileNumber} onChange={(e) => setPaySettings({ ...paySettings, mobileNumber: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>PayPal email</label>
                    <input type="email" className={inputClass} value={paySettings.paypalEmail} onChange={(e) => setPaySettings({ ...paySettings, paypalEmail: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Support phone / WhatsApp</label>
                    <input className={inputClass} value={paySettings.supportPhone} onChange={(e) => setPaySettings({ ...paySettings, supportPhone: e.target.value })} placeholder="+1..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Checkout instructions</label>
                    <textarea
                      className={`${inputClass} min-h-[80px]`}
                      value={paySettings.instructions}
                      onChange={(e) => setPaySettings({ ...paySettings, instructions: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className={`${btnPrimary} mt-4`}
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setMsg('');
                    try {
                      await axios.put('/api/settings/payment', paySettings, { headers: authHeaders() });
                      setMsg('Payment settings saved');
                    } catch (e: any) {
                      setMsg(e?.response?.data?.message || 'Could not save payment settings');
                    }
                    setLoading(false);
                  }}
                >
                  Save payment details
                </button>
              </div>

              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-base font-bold">Hero video</h3>
                <p className="mt-1 text-sm text-neutral-500">Optional home-page video (max 45 MB, MP4 recommended).</p>
                <div className="mt-4">
                  {heroVideoUrl ? (
                    <video src={heroVideoUrl} controls className="aspect-video w-full max-w-xl rounded-xl bg-black object-contain" />
                  ) : (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-500">
                      No hero video uploaded yet.
                    </div>
                  )}
                </div>
                <label className="mt-4 inline-flex cursor-pointer">
                  <span className={btnPrimary}>{loading ? 'Uploading…' : 'Upload video'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 45 * 1024 * 1024) {
                        setMsg('File too large (max 45MB)');
                        return;
                      }
                      setLoading(true);
                      setMsg('Uploading video…');
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await axios.post('/api/settings/hero-video', formData, {
                          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
                        });
                        const url = res.data?.data?.url || res.data?.url || '';
                        setHeroVideoUrl(url);
                        setMsg(url ? 'Hero video updated' : 'Upload finished');
                      } catch (err: any) {
                        setMsg(err.response?.data?.message || 'Upload failed');
                      }
                      setLoading(false);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Profile */}
          {tab === 'profile' && (
            <div className={`${cardClass} mx-auto max-w-lg p-5 sm:p-6`}>
              <h3 className="mb-4 text-sm font-bold">Your profile</h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Full name</label>
                  <input className={inputClass} value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input className={inputClass} value={storedUser?.email || ''} disabled />
                </div>
              </div>
              <button type="button" onClick={saveProfile} className={`${btnPrimary} mt-4`}>
                Save profile
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Product modal */}
      {showProdModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setShowProdModal(false)} />
          <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-bold">{editingProd ? 'Edit product' : 'Add product'}</h2>
              <button type="button" onClick={() => setShowProdModal(false)} className="h-9 w-9 rounded-full hover:bg-neutral-100" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {categories.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Create a category first, then come back to add products.
                  <button
                    type="button"
                    className="mt-2 block font-semibold underline"
                    onClick={() => {
                      setShowProdModal(false);
                      setTab('categories');
                    }}
                  >
                    Open Categories
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Name *</label>
                      <input
                        className={inputClass}
                        placeholder="Product name"
                        value={prodForm.name || ''}
                        onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Price (RWF) *</label>
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        placeholder="0"
                        value={prodForm.price ?? ''}
                        onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                      />
                      {typeof prodForm.price === 'number' && (
                        <p className="mt-1 text-xs text-neutral-500">{formatRwf(prodForm.price)}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Stock</label>
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        value={prodForm.stock ?? ''}
                        onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Category *</label>
                      <select
                        className={inputClass}
                        value={prodForm.category || ''}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, category: e.target.value, subcategory: '' })
                        }
                      >
                        <option value="">Select category</option>
                        {categories
                          .filter((c) => !c.parent_id)
                          .map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Subcategory (optional)</label>
                      <select
                        className={inputClass}
                        value={prodForm.subcategory || ''}
                        onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                        disabled={!prodForm.category}
                      >
                        <option value="">None</option>
                        {categories
                          .filter((c) => {
                            const parent = categories.find((p) => p.id === c.parent_id);
                            return parent && parent.slug === prodForm.category;
                          })
                          .map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Size</label>
                      <input
                        className={inputClass}
                        placeholder="S, M, L, XL…"
                        value={prodForm.size || ''}
                        onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea
                        className={`${inputClass} min-h-[88px] resize-y`}
                        placeholder="Short product description"
                        value={prodForm.description || ''}
                        onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        id="prod-active"
                        type="checkbox"
                        checked={prodForm.is_active ?? true}
                        onChange={(e) => setProdForm({ ...prodForm, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      <label htmlFor="prod-active" className="text-sm text-neutral-700">
                        Active (visible in shop)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Images</label>
                    <div className="flex flex-wrap gap-2">
                      {gallery.map((u, i) => (
                        <div key={`${u}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200">
                          <img src={u} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...gallery];
                              next.splice(i, 1);
                              setProdForm({
                                ...prodForm,
                                imageUrls: next,
                                imageUrl: prodForm.imageUrl === u ? next[0] || '' : prodForm.imageUrl,
                              });
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-black hover:text-black">
                        <span className="text-lg leading-none">+</span>
                        <span className="text-[10px] font-semibold">{uploading ? '…' : 'Upload'}</span>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          disabled={uploading}
                          onChange={(e) => {
                            uploadFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-400">First image is the shop thumbnail. Upload JPG/PNG/WebP.</p>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-neutral-500">Or use a sample image</summary>
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        {Object.entries(SAMPLE_IMAGES)
                          .filter(([k]) => k !== 'hero' && k !== 'placeholder')
                          .map(([key, url]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                setProdForm({
                                  ...prodForm,
                                  imageUrl: url,
                                  imageUrls: [url, ...(prodForm.imageUrls || []).filter((u) => u !== url)].slice(0, 6),
                                })
                              }
                              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                                prodForm.imageUrl === url ? 'border-black' : 'border-transparent'
                              }`}
                            >
                              <img src={url} alt={key} className="h-full w-full object-cover" />
                            </button>
                          ))}
                      </div>
                    </details>

                    <div className="mt-3">
                      <label className={labelClass}>Or paste image URL</label>
                      <input
                        className={inputClass}
                        placeholder="https://…"
                        value={prodForm.imageUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setProdForm({
                            ...prodForm,
                            imageUrl: url,
                            imageUrls: url
                              ? [url, ...(prodForm.imageUrls || []).filter((u) => u !== url)]
                              : prodForm.imageUrls,
                          });
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 border-t border-neutral-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              <button type="button" onClick={() => setShowProdModal(false)} className={btnGhost}>
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProd}
                disabled={loading || categories.length === 0}
                className={`${btnPrimary} flex-1`}
              >
                {loading ? 'Saving…' : editingProd ? 'Update product' : 'Save product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View product */}
      {viewingProd && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setViewingProd(null)} />
          <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:flex-row sm:rounded-2xl">
            <div className="relative flex min-h-[220px] flex-1 items-center justify-center bg-neutral-100 p-4">
              {(() => {
                const imgs =
                  viewingProd.imageUrls?.length
                    ? viewingProd.imageUrls
                    : ([viewingProd.imageUrl].filter(Boolean) as string[]);
                const src = imgs[viewingImageIdx] || SAMPLE_IMAGES.placeholder;
                return <img src={src} alt={viewingProd.name} className="max-h-[40vh] max-w-full object-contain sm:max-h-[60vh]" />;
              })()}
            </div>
            <div className="flex w-full flex-col gap-4 overflow-y-auto p-5 sm:w-[320px] sm:border-l sm:border-neutral-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {categories.find((c) => c.slug === viewingProd.category)?.name || viewingProd.category}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{viewingProd.name}</h2>
                </div>
                <button type="button" onClick={() => setViewingProd(null)} className="h-9 w-9 rounded-full hover:bg-neutral-100">
                  ✕
                </button>
              </div>
              <p className="text-lg font-bold">{formatRwf(viewingProd.price)}</p>
              <p className="text-sm text-neutral-600">{viewingProd.description || 'No description'}</p>
              <p className="text-sm text-neutral-500">
                Stock: <span className="font-semibold text-black">{viewingProd.stock ?? 0}</span>
              </p>
              {viewingProd.imageUrls && viewingProd.imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {viewingProd.imageUrls.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setViewingImageIdx(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 ${
                        viewingImageIdx === i ? 'border-black' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => openEditProduct(viewingProd)} className={`${btnPrimary} mt-auto`}>
                Edit product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
