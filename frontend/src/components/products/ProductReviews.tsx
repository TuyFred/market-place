import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

type Review = {
  id: string;
  rating: number;
  title?: string;
  body: string;
  user_name?: string;
  created_at: string;
};

type Props = { productId: string };

function Stars({ value, onChange, size = 'md' }: { value: number; onChange?: (n: number) => void; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} stars`}
        >
          <svg className={cls} viewBox="0 0 20 20" fill={n <= value ? '#f59e0b' : '#e5e5e5'}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: Props) {
  const { isAuthenticated, openAuthModal, token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likes, setLikes] = useState({ count: 0, liked: false });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    axios.get<Review[]>(`/api/reviews/product/${productId}`).then((r) => setReviews(r.data || [])).catch(() => setReviews([]));
    axios
      .get<{ count: number; liked: boolean }>(`/api/reviews/product/${productId}/likes`)
      .then((r) => setLikes(r.data || { count: 0, liked: false }))
      .catch(() => setLikes({ count: 0, liked: false }));
  };

  useEffect(() => {
    load();
  }, [productId]);

  const avg =
    reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  const submit = async () => {
    if (!isAuthenticated || !token) {
      openAuthModal('login');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      await axios.post(
        `/api/reviews/product/${productId}`,
        { rating, title, body },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTitle('');
      setBody('');
      setRating(5);
      setMsg('Thank you — your review is live.');
      load();
    } catch (e: unknown) {
      const m = axios.isAxiosError(e) ? e.response?.data?.message : null;
      setMsg(typeof m === 'string' ? m : 'Could not post review');
    }
    setSaving(false);
  };

  const toggleLike = async () => {
    if (!isAuthenticated || !token) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await axios.post(
        `/api/reviews/product/${productId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLikes((prev) => ({
        liked: !!res.data?.liked,
        count: Math.max(0, prev.count + (res.data?.liked ? 1 : -1)),
      }));
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mt-12 border-t border-neutral-200 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer reviews</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {reviews.length} review{reviews.length === 1 ? '' : 's'}
            {avg ? ` · ${avg} average` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
            likes.liked ? 'border-pink-200 bg-pink-50 text-pink-700' : 'border-neutral-200 text-neutral-700'
          }`}
        >
          ♥ {likes.liked ? 'Liked' : 'Like'} · {likes.count}
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} size="sm" />
                <p className="text-[11px] text-neutral-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              {r.title && <h3 className="mt-2 text-sm font-bold">{r.title}</h3>}
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">{r.body}</p>
              <p className="mt-2 text-xs font-medium text-neutral-500">{r.user_name || 'Customer'}</p>
            </article>
          ))}
          {reviews.length === 0 && (
            <p className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
              No reviews yet — be the first to share your experience.
            </p>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-sm font-bold">Write a review</p>
          <p className="mt-1 text-xs text-neutral-500">
            {isAuthenticated ? `Signed in as ${user?.email}` : 'Sign in required to review'}
          </p>
          <div className="mt-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Rating</p>
            <Stars value={rating} onChange={setRating} />
          </div>
          <input
            className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="mt-2 min-h-[100px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            placeholder="What did you like or dislike?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {msg && <p className="mt-2 text-xs text-neutral-600">{msg}</p>}
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="mt-3 w-full rounded-full bg-black py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Posting…' : isAuthenticated ? 'Submit review' : 'Sign in to review'}
          </button>
        </div>
      </div>
    </section>
  );
}
