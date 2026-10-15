import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckout } from '../context/CheckoutContext';
import { SAMPLE_IMAGES } from '../config/brand';
import { formatRwf } from '../utils/format';
import { Link } from 'react-router-dom';
import { orderCartOnWhatsApp } from '../utils/orderWhatsApp';
import { AppBackButton } from '../components/layout/AppBackButton';

export function CartPage() {
  const { items, totalItems, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const { openCheckout } = useCheckout();

  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleBuy = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    openCheckout(items.map((i) => ({ product: i.product, quantity: i.quantity })));
  };

  const orderCartWhatsApp = () => {
    orderCartOnWhatsApp(items, { isAuthenticated, openAuthModal, user });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <AppBackButton to="/" label="Back to shop" />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Shopping bag</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {totalItems === 0 ? 'Your cart is empty.' : `${totalItems} item${totalItems === 1 ? '' : 's'}`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
            >
              <Link to={`/product/${item.product.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-24 sm:w-24">
                <img
                  src={item.product.imageUrl || item.product.imageUrls?.[0] || SAMPLE_IMAGES.placeholder}
                  alt={item.product.name}
                  className="h-full w-full object-cover object-top"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/product/${item.product.id}`} className="truncate text-sm font-semibold text-black sm:text-base">
                  {item.product.name}
                </Link>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{formatRwf(item.product.price)}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center text-lg font-medium touch-manipulation"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center text-lg font-medium touch-manipulation"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-xs font-semibold text-neutral-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-14 text-center">
              <p className="text-neutral-500">Nothing here yet.</p>
              <Link
                to="/"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-black px-5 text-sm font-semibold text-white"
              >
                Browse products
              </Link>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Summary</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatRwf(totalPrice)}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Checkout with card/bank, or send your cart on WhatsApp.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={!items.length}
              onClick={handleBuy}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white disabled:opacity-40"
            >
              Order now
            </button>
            <button
              type="button"
              disabled={!items.length}
              onClick={orderCartWhatsApp}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white disabled:opacity-40"
            >
              Order via WhatsApp
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
