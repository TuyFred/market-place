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

function Stars({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: 'sm' | 'lg';
}) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-8 w-8 sm:h-9 sm:w-9';
  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`touch-manipulation rounded-lg p-0.5 transition active:scale-95 ${
            onChange ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
          }`}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-checked={onChange ? n === value : undefined}
          role={onChange ? 'radio' : undefined}
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
  const { isAuthenticated, openAuthModal, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likes, setLikes] = useState({ count: 0, liked: false });
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  const load = () => {
    axios.get<Review[]>(`/api/reviews/product/${productId}`).then((r) => setReviews(r.data || [])).catch(() => setReviews([]));
    axios
      .get<{ count: number; liked: boolean }>(`/api/reviews/product/${productId}/likes`)
      .then((r) => setLikes(r.data || { count: 0, liked: false }))
      .catch(() => setLikes({ count: 0, liked: false }));
  };

  useEffect(() => {
    load();
    setOpenForm(false);
    setMsg('');
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
        { rating, body },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBody('');
      setRating(5);
      setOpenForm(false);
      setMsg('Thanks — your review is live.');
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

  const startReview = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setOpenForm(true);
    setMsg('');
  };

  return (
    <section className="mt-10 border-t border-neutral-200 pt-8 sm:mt-12 sm:pt-10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">Reviews</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
            {avg > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-black">
                <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {avg}
              </span>
            )}
            <span>
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold touch-manipulation ${
            likes.liked
              ? 'border-pink-200 bg-pink-50 text-pink-700'
              : 'border-neutral-200 bg-white text-neutral-700'
          }`}
          aria-label={likes.liked ? 'Unlike' : 'Like'}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={likes.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span className="tabular-nums">{likes.count}</span>
        </button>
      </div>

      {/* Compact write review */}
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
        {!openForm ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600">Tap stars and submit your rating.</p>
            <button
              type="button"
              onClick={startReview}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white touch-manipulation sm:w-auto"
            >
              Write a review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-black">Your rating</p>
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="text-xs font-semibold text-neutral-500 hover:text-black"
              >
                Cancel
              </button>
            </div>
            <div className="flex justify-center sm:justify-start">
              <Stars value={rating} onChange={setRating} size="lg" />
            </div>
            <textarea
              className="min-h-[72px] w-full resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Add a short comment (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
            {msg && <p className="text-xs text-neutral-600">{msg}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white touch-manipulation disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
        {!openForm && msg && <p className="mt-3 text-xs text-emerald-700">{msg}</p>}
      </div>

      {/* Review list */}
      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <Stars value={r.rating} size="sm" />
              <p className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            {r.title && <h3 className="mt-2 text-sm font-bold text-black">{r.title}</h3>}
            {r.body && !/^Rated \d stars?$/i.test(r.body.trim()) && (
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{r.body}</p>
            )}
            <p className="mt-2 text-xs font-medium text-neutral-400">{r.user_name || 'Customer'}</p>
          </article>
        ))}
        {reviews.length === 0 && (
          <p className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-400">
            No reviews yet — be the first.
          </p>
        )}
      </div>
    </section>
  );
}
