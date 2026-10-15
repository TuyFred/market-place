import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatRwf } from '../utils/format';
import { BRAND, SAMPLE_IMAGES } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { AppBackButton } from '../components/layout/AppBackButton';
import { clearAuthStorage, hardRedirectHome } from '../utils/session';
import { AdminStatsPanel } from '../components/admin/AdminStatsPanel';

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
  user_email?: string;
  status?: string;
  created_at: string;
  notes?: string;
  quantity?: number;
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
type UserRow = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  createdAt?: string;
  suspended?: boolean;
};
type Tab = 'overview' | 'stats' | 'products' | 'categories' | 'orders' | 'users' | 'reviews' | 'settings' | 'profile';

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
  const { handleLogout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [prodForm, setProdForm] = useState<Partial<Product>>({});
  const [editingProd, setEditingProd] = useState<string | null>(null);
  const [showProdModal, setShowProdModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [suspendMessage, setSuspendMessage] = useState('');
  const [broadcastForm, setBroadcastForm] = useState({
    subject: '',
    body: '',
    audience: 'all' as 'all' | 'customers' | 'staff',
  });
  const [adminReviews, setAdminReviews] = useState<
    { id: string; rating: number; body: string; user_name?: string; is_visible?: boolean; products?: { name?: string } | null }[]
  >([]);
  const [ordersPage, setOrdersPage] = useState(1);
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
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'payment_review' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'pending'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'manager' | 'admin'>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const pageSize = 8;
  const MAX_BULK_DELETE = 10;

  const [staffForm, setStaffForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'admin' as 'admin' | 'manager',
    currentAdminPassword: '',
  });
  const [staffSaving, setStaffSaving] = useState(false);

  const [storedUser, setStoredUser] = useState(() => {
    try {
      localStorage.removeItem('demo_mode');
      const s = localStorage.getItem('admin_user') || localStorage.getItem('customer_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const role = storedUser?.role;
    if (!storedUser || (role !== 'admin' && role !== 'manager')) {
      clearAuthStorage();
      hardRedirectHome('sessionExpired');
      return;
    }
    setProfileName(storedUser.fullName || '');
  }, [navigate, storedUser]);

  const fetchAll = async () => {
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
    const anyModal =
      showProdModal ||
      showCatModal ||
      showPayModal ||
      showStaffModal ||
      showBroadcastModal ||
      showUserEditModal ||
      showSuspendModal ||
      viewingProd ||
      viewingOrder;
    document.body.style.overflow = anyModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    showProdModal,
    showCatModal,
    showPayModal,
    showStaffModal,
    showBroadcastModal,
    showUserEditModal,
    showSuspendModal,
    viewingProd,
    viewingOrder,
  ]);

  const openNewCategory = () => {
    setEditingCat(null);
    setCatForm({ name: '', slug: '', parent_id: '' });
    setSlugManual(false);
    setShowCatModal(true);
    setMsg('');
  };

  const openEditCategory = (c: Category) => {
    setEditingCat(c.id);
    setCatForm({
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id || '',
    });
    setSlugManual(true);
    setShowCatModal(true);
    setMsg('');
  };

  const closeCatModal = () => {
    setShowCatModal(false);
    setEditingCat(null);
    setCatForm({ name: '', slug: '', parent_id: '' });
    setSlugManual(false);
  };

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
    const parentCats = categories.filter((c) => !c.parent_id);
    setProdForm({
      name: '',
      price: 0,
      stock: 10,
      category: parentCats[0]?.slug || categories[0]?.slug || '',
      subcategory: '',
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

      const body = {
        name: prodForm.name.trim(),
        description: prodForm.description || '',
        price: Number(prodForm.price) || 0,
        category: prodForm.category as string,
        subcategory: prodForm.subcategory || undefined,
        stock: Number(prodForm.stock) || 0,
        size: prodForm.size || undefined,
        is_active: prodForm.is_active ?? true,
        imageUrl: prodForm.imageUrl || prodForm.imageUrls?.[0] || '',
        imageUrls: prodForm.imageUrls || [],
      };
      if (!body.imageUrl && body.imageUrls.length) body.imageUrl = body.imageUrls[0];

      if (editingProd) {
        await axios.put(`/api/products/${editingProd}`, body, { headers: authHeaders() });
      } else {
        await axios.post('/api/products', body, { headers: authHeaders() });
      }
      await fetchAll();
      setProdForm({});
      setEditingProd(null);
      setShowProdModal(false);
      setMsg('Product saved to database');
      setTab('products');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not save product');
    }
    setLoading(false);
  };

  const deleteProd = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`, { headers: authHeaders() });
      setSelectedProductIds((prev) => prev.filter((x) => x !== id));
      await fetchAll();
      setMsg('Product deleted');
    } catch {
      setMsg('Error deleting product');
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_BULK_DELETE) {
        setMsg(`Select up to ${MAX_BULK_DELETE} products to delete at once`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const deleteSelectedProducts = async () => {
    const n = selectedProductIds.length;
    if (n < 1) {
      setMsg('Select products to delete (up to 10)');
      return;
    }
    if (n > MAX_BULK_DELETE) {
      setMsg(`You can delete at most ${MAX_BULK_DELETE} products at once`);
      return;
    }
    if (!confirm(`Delete ${n} selected product${n === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setLoading(true);
    setMsg('');
    try {
      await Promise.all(
        selectedProductIds.map((id) => axios.delete(`/api/products/${id}`, { headers: authHeaders() })),
      );
      setSelectedProductIds([]);
      await fetchAll();
      setMsg(`${n} product${n === 1 ? '' : 's'} deleted`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not delete some products');
      await fetchAll();
    }
    setLoading(false);
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
      if (editingCat) {
        await axios.put(`/api/categories/${editingCat}`, body, { headers: authHeaders() });
      } else {
        await axios.post('/api/categories', body, { headers: authHeaders() });
      }
      await fetchAll();
      closeCatModal();
      setMsg('Category saved');
      setTab('categories');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not save category');
    }
    setLoading(false);
  };

  const deleteCat = async (id: string) => {
    if (!confirm('Delete this category? Products using it may need a new category.')) return;
    try {
      await axios.delete(`/api/categories/${id}`, { headers: authHeaders() });
      await fetchAll();
      setMsg('Category deleted');
    } catch {
      setMsg('Error deleting category');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status }, { headers: authHeaders() });
      await fetchAll();
      const labels: Record<string, string> = {
        confirmed: 'Payment approved — order confirmed',
        payment_review: 'Marked for payment review',
        shipped: 'Order marked as shipped',
        delivered: 'Order marked as delivered',
        cancelled: 'Order cancelled / payment rejected',
        pending: 'Order set to awaiting payment',
      };
      setMsg(labels[status] || 'Order updated');
      setViewingOrder((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch {
      setMsg('Error updating status');
    }
  };

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => (o.status || 'pending') === orderFilter);
  }, [orders, orderFilter]);

  const filteredUsers = useMemo(() => {
    if (userRoleFilter === 'all') return users;
    return users.filter((u) => u.role === userRoleFilter);
  }, [users, userRoleFilter]);

  const userOrderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      const key = (o.user_email || '').toLowerCase();
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [orders]);

  const changeRole = async (id: string, role: string) => {
    try {
      const body: { role: string; currentAdminPassword?: string } = { role };
      if (role === 'admin') {
        const pwd = window.prompt('Confirm your admin password to grant administrator access:');
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
    const pwd = prompt('Enter new password (min 8 characters):');
    if (!pwd) return;
    try {
      await axios.put(`/api/auth/users/${id}/reset-password`, { password: pwd }, { headers: authHeaders() });
      setMsg('Password reset');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not reset password');
    }
  };

  const createStaff = async () => {
    setStaffSaving(true);
    setMsg('');
    try {
      if (!staffForm.email.trim() || !staffForm.password || !staffForm.currentAdminPassword) {
        setMsg('Email, new password, and your admin password are required');
        setStaffSaving(false);
        return;
      }
      if (staffForm.password.length < 8) {
        setMsg('New admin password must be at least 8 characters');
        setStaffSaving(false);
        return;
      }
      const roleLabel = staffForm.role === 'admin' ? 'Admin' : 'Manager';
      await axios.post(
        '/api/auth/admins',
        {
          email: staffForm.email.trim().toLowerCase(),
          password: staffForm.password,
          fullName: staffForm.fullName.trim() || undefined,
          role: staffForm.role,
          currentAdminPassword: staffForm.currentAdminPassword,
        },
        { headers: authHeaders() },
      );
      setStaffForm({
        email: '',
        password: '',
        fullName: '',
        role: 'admin',
        currentAdminPassword: '',
      });
      setShowStaffModal(false);
      setMsg(`${roleLabel} account created`);
      setTab('users');
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not create staff account');
    }
    setStaffSaving(false);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg('');
    try {
      const uploaded: string[] = [];
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
      if (uploaded.length) {
        setProdForm((s) => {
          const existing = s.imageUrls || [];
          const combined = [...existing, ...uploaded];
          return { ...s, imageUrls: combined, imageUrl: s.imageUrl || combined[0] };
        });
        setMsg(`${uploaded.length} image(s) uploaded`);
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!storedUser) return;
    try {
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
    { key: 'stats', label: 'Statistics' },
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'orders', label: 'Orders' },
    { key: 'users', label: 'Users' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'settings', label: 'Settings' },
    { key: 'profile', label: 'Profile' },
  ];

  const orderPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice((ordersPage - 1) * pageSize, ordersPage * pageSize);

  const loadAdminReviews = async () => {
    try {
      const res = await axios.get('/api/reviews', { headers: authHeaders() });
      setAdminReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAdminReviews([]);
    }
  };

  useEffect(() => {
    if (tab === 'reviews') loadAdminReviews();
  }, [tab]);

  const saveUserEdit = async () => {
    if (!editingUser) return;
    try {
      await axios.put(
        `/api/auth/users/${editingUser.id}`,
        { fullName: editingUser.fullName, email: editingUser.email },
        { headers: authHeaders() },
      );
      setShowUserEditModal(false);
      setEditingUser(null);
      setMsg('User updated');
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not update user');
    }
  };

  const confirmSuspend = async (suspended: boolean) => {
    if (!editingUser) return;
    try {
      const res = await axios.post(
        `/api/auth/users/${editingUser.id}/suspend`,
        { suspended, message: suspendMessage },
        { headers: authHeaders() },
      );
      setShowSuspendModal(false);
      setEditingUser(null);
      setSuspendMessage('');
      setMsg(
        suspended
          ? `User suspended${res.data?.emailSent ? ' — email sent' : ' — email not sent (check Brevo)'}`
          : 'User reinstated',
      );
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not update suspension');
    }
  };

  const deleteUser = async (u: UserRow) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/auth/users/${u.id}`, { headers: authHeaders() });
      setMsg('User deleted');
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not delete user');
    }
  };

  const sendBroadcast = async () => {
    setStaffSaving(true);
    try {
      const res = await axios.post('/api/auth/broadcast-email', broadcastForm, { headers: authHeaders() });
      setShowBroadcastModal(false);
      setBroadcastForm({ subject: '', body: '', audience: 'all' });
      setMsg(`Broadcast sent to ${res.data?.sent || 0} users${res.data?.failed ? ` (${res.data.failed} failed)` : ''}`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Broadcast failed — check Brevo API key');
    }
    setStaffSaving(false);
  };

  const gallery = prodForm.imageUrls?.length
    ? prodForm.imageUrls
    : prodForm.imageUrl
      ? [prodForm.imageUrl]
      : [];

  const productPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const ordersNeedingReview = orders.filter((o) => o.status === 'payment_review').length;

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
            onClick={() => handleLogout()}
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
            <AppBackButton to="/" label="Back to shop" className="hidden min-h-[36px] items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-black sm:inline-flex" />
            <h1 className="truncate text-base font-bold capitalize sm:text-lg">{tab}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <AppBackButton
              to="/"
              label="Shop"
              className="inline-flex min-h-[36px] items-center rounded-full border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 sm:hidden"
            />
            {tab === 'products' && (
              <button type="button" onClick={openNewProduct} className={`${btnPrimary} !px-3 !py-2 sm:!px-5`}>
                + Product
              </button>
            )}
            {tab === 'categories' && (
              <button type="button" onClick={openNewCategory} className={`${btnPrimary} !px-3 !py-2 sm:!px-5`}>
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
                  {
                    label: 'Orders',
                    value: orders.length,
                    hint:
                      ordersNeedingReview > 0
                        ? `${ordersNeedingReview} need payment review`
                        : `${orders.filter((o) => o.status === 'pending').length} pending`,
                    action: () => {
                      setOrderFilter(ordersNeedingReview > 0 ? 'payment_review' : 'all');
                      setTab('orders');
                    },
                  },
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button type="button" onClick={openNewProduct} className={btnPrimary}>
                      Add product
                    </button>
                    <button type="button" onClick={() => setTab('categories')} className={btnGhost}>
                      Manage categories
                    </button>
                    <button type="button" onClick={() => setTab('stats')} className={btnGhost}>
                      Statistics
                    </button>
                    <button type="button" onClick={() => setShowPayModal(true)} className={btnGhost}>
                      Payment details
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

              {selectedProductIds.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">
                    {selectedProductIds.length} selected (max {MAX_BULK_DELETE})
                  </p>
                  <div className="flex gap-2">
                    <button type="button" className={btnGhost} onClick={() => setSelectedProductIds([])}>
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={deleteSelectedProducts}
                      className="inline-flex items-center rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete selected
                    </button>
                  </div>
                </div>
              )}

              <div className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="w-10 px-3 py-3">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts
                        .slice((productsPage - 1) * pageSize, productsPage * pageSize)
                        .map((p) => (
                          <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => toggleSelectProduct(p.id)}
                                className="h-4 w-4 rounded border-neutral-300"
                                aria-label={`Select ${p.name}`}
                              />
                            </td>
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
                              <span
                                className={
                                  (p.stock ?? 0) <= 0
                                    ? 'font-semibold text-red-600'
                                    : (p.stock || 0) < 5
                                      ? 'font-semibold text-amber-600'
                                      : 'text-neutral-600'
                                }
                              >
                                {(p.stock ?? 0) <= 0 ? 'Out' : p.stock}
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
                          <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold">Categories</h3>
                  <p className="text-sm text-neutral-500">
                    Organize products. Add a category or subcategory in the popup form.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={openNewCategory} className={btnPrimary}>
                    + Add category
                  </button>
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
                        const count = products.filter(
                          (p) => p.category === c.slug || (p as any).subcategory === c.slug,
                        ).length;
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
                                <button type="button" onClick={() => openEditCategory(c)} className={btnGhost}>
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
                            No categories yet.
                            <button
                              type="button"
                              onClick={openNewCategory}
                              className="mt-3 block w-full font-semibold text-black underline"
                            >
                              Add your first category
                            </button>
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
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold">Customer orders</h3>
                  <p className="text-sm text-neutral-500">
                    Review payment proof, confirm payment, then ship.
                    {ordersNeedingReview > 0 ? (
                      <span className="ml-1 font-semibold text-orange-700">
                        {ordersNeedingReview} waiting for review
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['all', 'All'],
                      ['payment_review', 'Review'],
                      ['pending', 'Pending'],
                      ['confirmed', 'Confirmed'],
                      ['shipped', 'Shipped'],
                      ['delivered', 'Delivered'],
                      ['cancelled', 'Cancelled'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setOrderFilter(key);
                        setOrdersPage(1);
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        orderFilter === key
                          ? 'bg-black text-white'
                          : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {pagedOrders.map((o) => {
                  const qty = o.quantity || 1;
                  const unit = o.products?.price ?? 0;
                  const total = unit * qty;
                  return (
                    <article key={o.id} className={`${cardClass} overflow-hidden`}>
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-24 sm:w-20">
                          {o.products?.imageUrl ? (
                            <img src={o.products.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-neutral-400">
                                {new Date(o.created_at).toLocaleString()} · #{o.id.slice(0, 8)}
                              </p>
                              <h4 className="mt-0.5 text-base font-bold text-black">
                                {o.products?.name || 'Product'}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                Qty {qty}
                                {unit ? ` · ${formatRwf(unit)}` : ''}
                                {total ? ` · Total ${formatRwf(total)}` : ''}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                                statusColors[o.status || 'pending'] || statusColors.pending
                              }`}
                            >
                              {(o.status || 'pending').replace('_', ' ')}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-neutral-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Customer</p>
                              <p className="font-semibold text-black">{o.customer_name}</p>
                              <p className="text-xs text-neutral-600">{o.customer_phone}</p>
                              {o.user_email && <p className="text-xs text-neutral-500">{o.user_email}</p>}
                              <p className="mt-0.5 text-xs text-neutral-500">{o.customer_address}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Payment</p>
                              <p className="capitalize font-semibold text-black">{o.payment_method || '—'}</p>
                              <p className="text-xs text-neutral-600">
                                Status: {o.payment_status || '—'}
                              </p>
                              {o.payment_reference && (
                                <p className="text-xs text-neutral-500">Ref: {o.payment_reference}</p>
                              )}
                            </div>
                          </div>

                          {o.notes && (
                            <p className="mt-2 line-clamp-2 text-xs text-neutral-500">Notes: {o.notes}</p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {o.proof_url ? (
                              <a
                                href={o.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 pr-3 text-xs font-semibold hover:bg-neutral-50"
                              >
                                <img src={o.proof_url} alt="Payment proof" className="h-10 w-12 rounded-lg object-cover" />
                                View proof
                              </a>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                                No proof yet
                              </span>
                            )}
                            <button type="button" className={btnGhost} onClick={() => setViewingOrder(o)}>
                              Details
                            </button>
                            {(o.status === 'payment_review' || o.status === 'pending') && (
                              <button
                                type="button"
                                className={btnPrimary}
                                onClick={() => updateStatus(o.id, 'confirmed')}
                              >
                                Confirm payment
                              </button>
                            )}
                            {o.status === 'confirmed' && (
                              <button
                                type="button"
                                className={btnPrimary}
                                onClick={() => updateStatus(o.id, 'shipped')}
                              >
                                Mark shipped
                              </button>
                            )}
                            {o.status === 'shipped' && (
                              <button
                                type="button"
                                className={btnPrimary}
                                onClick={() => updateStatus(o.id, 'delivered')}
                              >
                                Mark delivered
                              </button>
                            )}
                            {o.status !== 'cancelled' && o.status !== 'delivered' && (
                              <button
                                type="button"
                                className="rounded-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                onClick={() => updateStatus(o.id, 'cancelled')}
                              >
                                Reject / cancel
                              </button>
                            )}
                            <select
                              className={`${inputClass} !ml-auto !w-auto !py-1.5 text-xs`}
                              value={o.status || 'pending'}
                              onChange={(e) => updateStatus(o.id, e.target.value)}
                              aria-label="Change order status"
                            >
                              <option value="pending">Awaiting payment</option>
                              <option value="payment_review">Review payment</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <div className={`${cardClass} py-16 text-center text-neutral-400`}>
                    No orders in this filter.
                  </div>
                )}
              </div>

              {filteredOrders.length > 0 && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    className={btnGhost}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-neutral-500">
                    Page {ordersPage} / {orderPages} · {filteredOrders.length} orders
                  </span>
                  <button
                    type="button"
                    disabled={ordersPage >= orderPages}
                    onClick={() => setOrdersPage((p) => p + 1)}
                    className={btnGhost}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold">Customers & staff</h3>
                  <p className="text-sm text-neutral-500">
                    Manage roles for customers, managers, and admins.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['all', 'All'],
                      ['customer', 'Customers'],
                      ['manager', 'Managers'],
                      ['admin', 'Admins'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setUserRoleFilter(key);
                        setUsersPage(1);
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        userRoleFilter === key
                          ? 'bg-black text-white'
                          : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">
                        (
                        {key === 'all'
                          ? users.length
                          : users.filter((u) => u.role === key).length}
                        )
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {storedUser?.role === 'admin' && (
                <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
                  <p className="text-sm text-neutral-600">Invite staff or email all customers.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnGhost} onClick={() => setShowBroadcastModal(true)}>
                      Broadcast email
                    </button>
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => {
                        setShowStaffModal(true);
                        setMsg('');
                      }}
                    >
                      Add admin
                    </button>
                  </div>
                </div>
              )}

              <div className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Orders</th>
                        <th className="px-4 py-3 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice((usersPage - 1) * pageSize, usersPage * pageSize).map((u) => {
                        const orderCount = userOrderCounts[(u.email || '').toLowerCase()] || 0;
                        return (
                          <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                                  {(u.fullName || u.email).charAt(0).toUpperCase()}
                                </span>
                                <span className="font-semibold">{u.fullName || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                  u.role === 'admin'
                                    ? 'bg-black text-white'
                                    : u.role === 'manager'
                                      ? 'bg-violet-100 text-violet-800'
                                      : 'bg-neutral-100 text-neutral-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {u.suspended ? (
                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                                  Suspended
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {orderCount > 0 ? (
                                <button
                                  type="button"
                                  className="text-sm font-semibold text-black underline-offset-2 hover:underline"
                                  onClick={() => {
                                    setOrderFilter('all');
                                    setOrdersPage(1);
                                    setTab('orders');
                                    setMsg(`Showing all orders — look for ${u.email}`);
                                  }}
                                >
                                  {orderCount} order{orderCount === 1 ? '' : 's'}
                                </button>
                              ) : (
                                <span className="text-neutral-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {storedUser?.role === 'admin' ? (
                                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                  <select
                                    className={`${inputClass} !w-auto !py-1.5 text-xs`}
                                    value={u.role}
                                    disabled={u.id === storedUser.id}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                  >
                                    <option value="customer">Customer</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button
                                    type="button"
                                    className={btnGhost}
                                    onClick={() => {
                                      setEditingUser(u);
                                      setShowUserEditModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className={btnGhost}
                                    disabled={u.id === storedUser.id}
                                    onClick={() => {
                                      setEditingUser(u);
                                      setSuspendMessage(
                                        u.suspended
                                          ? ''
                                          : 'Your account was suspended for violating our shop policies. Contact support if you believe this is a mistake.',
                                      );
                                      setShowSuspendModal(true);
                                    }}
                                  >
                                    {u.suspended ? 'Reinstate' : 'Suspend'}
                                  </button>
                                  <button type="button" onClick={() => resetPassword(u.id)} className={btnGhost}>
                                    Reset pwd
                                  </button>
                                  <button
                                    type="button"
                                    disabled={u.id === storedUser.id}
                                    onClick={() => deleteUser(u)}
                                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-400">Admin only</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                            No users in this filter.
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
            </div>
          )}

          {/* Statistics */}
          {tab === 'stats' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold">Store analytics</h3>
                <p className="text-sm text-neutral-500">
                  Revenue, order status mix, popular products by likes & reviews.
                </p>
              </div>
              <AdminStatsPanel />
            </div>
          )}

          {/* Reviews moderation */}
          {tab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Product reviews</h3>
                  <p className="text-sm text-neutral-500">
                    Moderate customer reviews shown on product pages.
                  </p>
                </div>
                <button type="button" className={btnGhost} onClick={loadAdminReviews}>
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {adminReviews.map((r) => (
                  <article key={r.id} className={`${cardClass} p-4 sm:p-5`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-neutral-400">
                          {r.products?.name || 'Product'} · {r.user_name || 'Customer'}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-600">
                          {'★'.repeat(r.rating)}
                          <span className="text-neutral-300">{'★'.repeat(5 - r.rating)}</span>
                        </p>
                        <p className="mt-2 text-sm text-neutral-700">{r.body}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            r.is_visible === false
                              ? 'bg-neutral-100 text-neutral-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {r.is_visible === false ? 'Hidden' : 'Visible'}
                        </span>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={async () => {
                            try {
                              await axios.put(
                                `/api/reviews/${r.id}/visibility`,
                                { is_visible: r.is_visible === false },
                                { headers: authHeaders() },
                              );
                              await loadAdminReviews();
                              setMsg(r.is_visible === false ? 'Review shown' : 'Review hidden');
                            } catch (e: any) {
                              setMsg(e?.response?.data?.message || 'Could not update review');
                            }
                          }}
                        >
                          {r.is_visible === false ? 'Show' : 'Hide'}
                        </button>
                        <button
                          type="button"
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm('Delete this review?')) return;
                            try {
                              await axios.delete(`/api/reviews/${r.id}`, { headers: authHeaders() });
                              await loadAdminReviews();
                              setMsg('Review deleted');
                            } catch (e: any) {
                              setMsg(e?.response?.data?.message || 'Could not delete review');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {adminReviews.length === 0 && (
                  <div className={`${cardClass} py-16 text-center text-neutral-400`}>
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings — entry cards open popup forms */}
          {tab === 'settings' && (
            <div className="mx-auto max-w-3xl space-y-4">
              <div>
                <h3 className="text-base font-bold">Settings</h3>
                <p className="text-sm text-neutral-500">Open a form to edit payment details or add staff.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(true);
                    setMsg('');
                  }}
                  className={`${cardClass} p-5 text-left transition hover:border-black sm:p-6`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Checkout</p>
                  <h4 className="mt-2 text-base font-bold">Payment details for customers</h4>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Shown at checkout: bank transfer, mobile money, and PayPal. Customers pay, then submit proof for
                    your approval.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-black underline-offset-2">
                    Open form →
                  </span>
                </button>

                {storedUser?.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffModal(true);
                      setMsg('');
                    }}
                    className={`${cardClass} p-5 text-left transition hover:border-black sm:p-6`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Team</p>
                    <h4 className="mt-2 text-base font-bold">Add admin or manager</h4>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                      Create another staff account. Confirm with your current admin password.
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-black underline-offset-2">
                      Open form →
                    </span>
                  </button>
                ) : (
                  <div className={`${cardClass} p-5 sm:p-6`}>
                    <h4 className="text-base font-bold">Staff accounts</h4>
                    <p className="mt-2 text-sm text-neutral-500">Only full admins can add staff.</p>
                  </div>
                )}
              </div>

              {storedUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className={`${cardClass} w-full p-5 text-left transition hover:border-black sm:p-6`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Marketing</p>
                  <h4 className="mt-2 text-base font-bold">Broadcast email</h4>
                  <p className="mt-2 text-sm text-neutral-500">
                    Send a promotional message to all customers, staff, or everyone at once.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-black underline-offset-2">
                    Compose email →
                  </span>
                </button>
              )}

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

      {/* Category modal — same pattern as product popup */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={closeCatModal} />
          <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-bold">{editingCat ? 'Edit category' : 'Add category'}</h2>
              <button type="button" onClick={closeCatModal} className="h-9 w-9 rounded-full hover:bg-neutral-100" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <p className="text-sm text-neutral-500">
                Categories group products on the shop. Optionally nest under a parent as a subcategory.
              </p>
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Women Wear"
                  value={catForm.name}
                  autoFocus
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
              <div>
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

            <div className="flex gap-2 border-t border-neutral-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              <button type="button" onClick={closeCatModal} className={btnGhost}>
                Cancel
              </button>
              <button type="button" onClick={saveCat} disabled={loading} className={`${btnPrimary} flex-1`}>
                {loading ? 'Saving…' : editingCat ? 'Update category' : 'Save category'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      openNewCategory();
                    }}
                  >
                    Add category
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
                      <label className={labelClass}>Items in stock *</label>
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        placeholder="e.g. 10"
                        value={prodForm.stock ?? ''}
                        onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value, 10) || 0 })}
                      />
                      <p className="mt-1 text-[11px] text-neutral-400">
                        Decreases automatically when customers order. 0 = sold out on the shop.
                      </p>
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
                    <label className={labelClass}>Product photos</label>
                    <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center transition hover:border-black hover:bg-white">
                      <span className="text-2xl leading-none text-neutral-400">+</span>
                      <span className="mt-2 text-sm font-semibold text-black">
                        {uploading ? 'Uploading…' : 'Tap to add photos'}
                      </span>
                      <span className="mt-1 text-[11px] text-neutral-500">
                        JPG, PNG or WebP · first photo is the shop thumbnail
                      </span>
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
                    {gallery.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {gallery.map((u, i) => (
                          <div
                            key={`${u}-${i}`}
                            className={`group relative h-20 w-20 overflow-hidden rounded-xl border-2 ${
                              i === 0 ? 'border-black' : 'border-neutral-200'
                            }`}
                          >
                            <img src={u} alt="" className="h-full w-full object-cover" />
                            {i === 0 && (
                              <span className="absolute left-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                Cover
                              </span>
                            )}
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
                      </div>
                    )}

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

      {viewingOrder && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setViewingOrder(null)} />
          <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Order detail</p>
                <h2 className="mt-1 text-lg font-bold">{viewingOrder.products?.name || 'Order'}</h2>
                <p className="text-xs text-neutral-500">#{viewingOrder.id}</p>
              </div>
              <button type="button" onClick={() => setViewingOrder(null)} className="h-9 w-9 rounded-full hover:bg-neutral-100">
                ✕
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Customer</dt>
                <dd className="text-right font-semibold">{viewingOrder.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Phone</dt>
                <dd className="text-right">{viewingOrder.customer_phone}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Email</dt>
                <dd className="text-right text-xs">{viewingOrder.user_email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Address</dt>
                <dd className="max-w-[60%] text-right">{viewingOrder.customer_address}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Qty / total</dt>
                <dd className="text-right font-semibold">
                  {viewingOrder.quantity || 1}
                  {viewingOrder.products?.price != null
                    ? ` · ${formatRwf((viewingOrder.products.price || 0) * (viewingOrder.quantity || 1))}`
                    : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">Payment</dt>
                <dd className="text-right capitalize">
                  {viewingOrder.payment_method || '—'} · {viewingOrder.payment_status || '—'}
                </dd>
              </div>
              {viewingOrder.payment_reference && (
                <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
                  <dt className="text-neutral-500">Reference</dt>
                  <dd className="text-right text-xs">{viewingOrder.payment_reference}</dd>
                </div>
              )}
            </dl>
            {viewingOrder.proof_url && (
              <a href={viewingOrder.proof_url} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-xl border border-neutral-200">
                <img src={viewingOrder.proof_url} alt="Proof" className="max-h-64 w-full object-contain bg-neutral-50" />
              </a>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {(viewingOrder.status === 'payment_review' || viewingOrder.status === 'pending') && (
                <button type="button" className={btnPrimary} onClick={() => updateStatus(viewingOrder.id, 'confirmed')}>
                  Confirm payment
                </button>
              )}
              {viewingOrder.status === 'confirmed' && (
                <button type="button" className={btnPrimary} onClick={() => updateStatus(viewingOrder.id, 'shipped')}>
                  Mark shipped
                </button>
              )}
              {viewingOrder.status !== 'cancelled' && viewingOrder.status !== 'delivered' && (
                <button
                  type="button"
                  className="rounded-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => updateStatus(viewingOrder.id, 'cancelled')}
                >
                  Reject
                </button>
              )}
              <button type="button" className={btnGhost} onClick={() => setViewingOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment settings modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setShowPayModal(false)}
          />
          <div className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-bold">Payment details for customers</h2>
                <p className="text-xs text-neutral-500">Bank, mobile money & PayPal shown at checkout</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="h-9 w-9 rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Bank name</label>
                  <input
                    className={inputClass}
                    value={paySettings.bankName}
                    onChange={(e) => setPaySettings({ ...paySettings, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account name</label>
                  <input
                    className={inputClass}
                    value={paySettings.bankAccountName}
                    onChange={(e) => setPaySettings({ ...paySettings, bankAccountName: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Bank account number</label>
                  <input
                    className={inputClass}
                    value={paySettings.bankAccount}
                    onChange={(e) => setPaySettings({ ...paySettings, bankAccount: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Mobile money name</label>
                  <input
                    className={inputClass}
                    value={paySettings.mobileName}
                    onChange={(e) => setPaySettings({ ...paySettings, mobileName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Mobile money number</label>
                  <input
                    className={inputClass}
                    value={paySettings.mobileNumber}
                    onChange={(e) => setPaySettings({ ...paySettings, mobileNumber: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>PayPal email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={paySettings.paypalEmail}
                    onChange={(e) => setPaySettings({ ...paySettings, paypalEmail: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Support phone / WhatsApp</label>
                  <input
                    className={inputClass}
                    value={paySettings.supportPhone}
                    onChange={(e) => setPaySettings({ ...paySettings, supportPhone: e.target.value })}
                    placeholder="+1..."
                  />
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
            </div>
            <div className="flex gap-2 border-t border-neutral-200 px-4 py-3 sm:px-5">
              <button type="button" className={btnGhost} onClick={() => setShowPayModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${btnPrimary} ml-auto`}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setMsg('');
                  try {
                    await axios.put('/api/settings/payment', paySettings, { headers: authHeaders() });
                    setShowPayModal(false);
                    setMsg('Payment settings saved');
                  } catch (e: any) {
                    setMsg(e?.response?.data?.message || 'Could not save payment settings');
                  }
                  setLoading(false);
                }}
              >
                {loading ? 'Saving…' : 'Save payment details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add staff modal */}
      {showStaffModal && storedUser?.role === 'admin' && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setShowStaffModal(false)}
          />
          <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-bold">Add admin or manager</h2>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="h-9 w-9 rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              <p className="text-sm text-neutral-500">
                Create another staff account. Confirm with your current admin password.
              </p>
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  className={inputClass}
                  placeholder="New staff name"
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="admin2@example.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Role *</label>
                <select
                  className={inputClass}
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'admin' | 'manager' })}
                >
                  <option value="admin">Admin (full access)</option>
                  <option value="manager">Manager (catalog & orders)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>New password * (min 8)</label>
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Your admin password *</label>
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Confirm it is you"
                  value={staffForm.currentAdminPassword}
                  onChange={(e) => setStaffForm({ ...staffForm, currentAdminPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-neutral-200 px-4 py-3 sm:px-5">
              <button type="button" className={btnGhost} onClick={() => setShowStaffModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${btnPrimary} ml-auto`}
                disabled={staffSaving}
                onClick={createStaff}
              >
                {staffSaving ? 'Creating…' : 'Create staff account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {showUserEditModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => {
              setShowUserEditModal(false);
              setEditingUser(null);
            }}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <h2 className="text-base font-bold">Edit user</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  className={inputClass}
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setShowUserEditModal(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className={`${btnPrimary} ml-auto`} onClick={saveUserEdit}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / reinstate modal with email message */}
      {showSuspendModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => {
              setShowSuspendModal(false);
              setEditingUser(null);
              setSuspendMessage('');
            }}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <h2 className="text-base font-bold">
              {editingUser.suspended ? 'Reinstate user' : 'Suspend user'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {editingUser.email} will receive this message by email.
            </p>
            <textarea
              className={`${inputClass} mt-4 min-h-[120px]`}
              placeholder="Message included in the email…"
              value={suspendMessage}
              onChange={(e) => setSuspendMessage(e.target.value)}
            />
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setShowSuspendModal(false);
                  setEditingUser(null);
                  setSuspendMessage('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${btnPrimary} ml-auto ${editingUser.suspended ? '' : '!bg-red-600 hover:!bg-red-700'}`}
                onClick={() => confirmSuspend(!editingUser.suspended)}
              >
                {editingUser.suspended ? 'Reinstate & email' : 'Suspend & email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast email modal */}
      {showBroadcastModal && storedUser?.role === 'admin' && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setShowBroadcastModal(false)}
          />
          <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-bold">Broadcast email</h2>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="h-9 w-9 rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              <p className="text-sm text-neutral-500">
                Advertise a sale, new drop, or announcement. Sent via Brevo to matching accounts.
              </p>
              <div>
                <label className={labelClass}>Audience</label>
                <select
                  className={inputClass}
                  value={broadcastForm.audience}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      audience: e.target.value as 'all' | 'customers' | 'staff',
                    })
                  }
                >
                  <option value="all">Everyone</option>
                  <option value="customers">Customers only</option>
                  <option value="staff">Staff only</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Subject *</label>
                <input
                  className={inputClass}
                  placeholder="New AFROLUXO collection is live"
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Message *</label>
                <textarea
                  className={`${inputClass} min-h-[140px]`}
                  placeholder="Write your promotion…"
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-neutral-200 px-4 py-3 sm:px-5">
              <button type="button" className={btnGhost} onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${btnPrimary} ml-auto`}
                disabled={staffSaving || !broadcastForm.subject.trim() || !broadcastForm.body.trim()}
                onClick={sendBroadcast}
              >
                {staffSaving ? 'Sending…' : 'Send broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
