import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckout } from '../context/CheckoutContext';
import { SAMPLE_IMAGES } from '../config/brand';
import { formatRwf } from '../utils/format';
import { Link } from 'react-router-dom';

export function CartPage() {
  const { items, totalItems, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { openCheckout } = useCheckout();

  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleBuy = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    openCheckout(items.map((i) => ({ product: i.product, quantity: i.quantity })));
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-reveal">
      <div className="mb-8">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-forest">Shopping cart</span>
        <h1 className="text-3xl font-black tracking-tight text-ink">Your cart</h1>
        <p className="mt-1 text-sm font-medium text-ink/50">
          {totalItems === 0 ? 'Your cart is currently empty.' : `You have ${totalItems} item(s) in your cart.`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="premium-card flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone sm:h-20 sm:w-20">
                  <img
                    src={item.product.imageUrl || item.product.imageUrls?.[0] || SAMPLE_IMAGES.placeholder}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink sm:text-base">{item.product.name}</p>
                  <p className="text-sm font-bold text-forest">{formatRwf(item.product.price)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <div className="flex items-center rounded-xl border border-ink/10 bg-stone p-1">
                  <button type="button" className="h-8 w-8 font-bold" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                  <div className="w-8 text-center text-sm font-black">{item.quantity}</div>
                  <button type="button" className="h-8 w-8 font-bold" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                </div>
                <button type="button" onClick={() => removeFromCart(item.product.id)} className="p-2 text-ink/30 hover:text-red-500" aria-label="Remove">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-ink/15 bg-white py-16 text-center">
              <p className="font-medium text-ink/50">Your shopping cart is waiting to be filled.</p>
              <Link to="/products" className="mt-4 inline-block text-sm font-black text-forest">Discover clothes →</Link>
            </div>
          )}
        </div>

        <div className="premium-card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <div>
            <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-ink/40">Order summary</span>
            <p className="text-2xl font-black tracking-tight text-ink">{formatRwf(totalPrice)}</p>
          </div>
          <p className="text-xs leading-relaxed text-ink/50">
            Pay securely with Visa, Mastercard, or bank account. Your card number stays in your browser — we only keep brand and last 4 digits with the order.
          </p>
          <button type="button" disabled={!items.length} onClick={handleBuy} className="btn-buy py-3.5 text-sm disabled:opacity-50">
            Buy now — card / bank
          </button>
        </div>
      </div>
    </div>
  );
}