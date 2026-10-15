import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function getAdminStats() {
  if (!supabaseAdmin) throw notConfiguredError;

  const [productsRes, ordersRes, reviewsRes, likesRes, catsRes] = await Promise.all([
    supabaseAdmin.from('products').select('id, name, price, stock, category, is_active, imageUrl'),
    supabaseAdmin.from('orders').select('id, status, payment_status, payment_method, created_at, quantity, product_id, user_email'),
    supabaseAdmin.from('product_reviews').select('id, product_id, rating, created_at, is_visible'),
    supabaseAdmin.from('product_likes').select('product_id'),
    supabaseAdmin.from('categories').select('id, slug, name, parent_id')
  ]);

  const products = productsRes.data || [];
  const orders = ordersRes.data || [];
  const reviews = reviewsRes.data || [];
  const likes = likesRes.data || [];
  const categories = catsRes.data || [];

  const statusCounts = {};
  for (const o of orders) {
    const s = o.status || 'pending';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const revenueByDay = {};
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  let revenueEstimate = 0;
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const price = productMap[o.product_id]?.price || 0;
    const qty = Number(o.quantity) || 1;
    const line = price * qty;
    revenueEstimate += line;
    const day = (o.created_at || '').slice(0, 10);
    if (day) revenueByDay[day] = (revenueByDay[day] || 0) + line;
  }

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last14.push({ date: key, revenue: Math.round(revenueByDay[key] || 0), orders: 0 });
  }
  for (const o of orders) {
    const day = (o.created_at || '').slice(0, 10);
    const row = last14.find((r) => r.date === day);
    if (row) row.orders += 1;
  }

  const likeCounts = {};
  for (const l of likes) {
    likeCounts[l.product_id] = (likeCounts[l.product_id] || 0) + 1;
  }
  const reviewAgg = {};
  for (const r of reviews) {
    if (!reviewAgg[r.product_id]) reviewAgg[r.product_id] = { sum: 0, n: 0 };
    reviewAgg[r.product_id].sum += r.rating || 0;
    reviewAgg[r.product_id].n += 1;
  }

  const popular = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      stock: p.stock,
      likes: likeCounts[p.id] || 0,
      reviews: reviewAgg[p.id]?.n || 0,
      avgRating: reviewAgg[p.id]
        ? Math.round((reviewAgg[p.id].sum / reviewAgg[p.id].n) * 10) / 10
        : 0
    }))
    .sort((a, b) => b.likes - a.likes || b.reviews - a.reviews || b.avgRating - a.avgRating)
    .slice(0, 8);

  const byCategory = {};
  for (const p of products) {
    const c = p.category || 'other';
    byCategory[c] = (byCategory[c] || 0) + 1;
  }

  const lowStock = products
    .filter((p) => p.is_active !== false && (p.stock ?? 0) <= 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 8)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0, imageUrl: p.imageUrl }));

  return {
    totals: {
      products: products.length,
      activeProducts: products.filter((p) => p.is_active !== false).length,
      orders: orders.length,
      reviews: reviews.length,
      likes: likes.length,
      categories: categories.filter((c) => !c.parent_id).length,
      revenueEstimate: Math.round(revenueEstimate),
      pendingReview: statusCounts.payment_review || 0,
      outOfStock: products.filter((p) => (p.stock ?? 0) <= 0).length
    },
    statusCounts,
    revenueSeries: last14,
    popular,
    byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    lowStock,
    recentOrders: orders.slice(0, 6)
  };
}
