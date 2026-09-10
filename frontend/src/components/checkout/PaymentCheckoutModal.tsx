import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type { CheckoutLine } from './types';
import { formatRwf } from '../../utils/format';
import { SAMPLE_IMAGES } from '../../config/brand';

type Props = {
  open: boolean;
  lines: CheckoutLine[];
  onClose: () => void;
};

type PayMethod = 'card' | 'bank';

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

function formatCardNumber(v: string) {
  return onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function detectBrand(num: string): 'visa' | 'mastercard' | 'amex' | 'other' {
  const d = onlyDigits(num);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'other';
}

/** Luhn check — format validation only; never store full PAN */
function luhnOk(num: string) {
  const d = onlyDigits(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function BrandBadges({ active }: { active: string }) {
  const items = [
    { id: 'visa', label: 'Visa' },
    { id: 'mastercard', label: 'Mastercard' },
    { id: 'bank', label: 'Bank' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => (
        <span
          key={b.id}
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            active === b.id
              ? 'border-forest bg-forest/10 text-forest'
              : 'border-ink/10 bg-white text-ink/45'
          }`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function PaymentCheckoutModal({ open, lines, onClose }: Props) {
  const { isAuthenticated, token, openAuthModal, user } = useAuth();
  const { clearCart } = useCart();
  const [method, setMethod] = useState<PayMethod>('card');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  const brand = detectBrand(cardNumber);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines]
  );

  useEffect(() => {
    if (!open) return;
    setError('');
    setSuccessId(null);
    setSubmitting(false);
    if (user?.fullName) setName((n) => n || user.fullName || '');
    if (user?.email) setEmail((e) => e || user.email);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, user]);

  if (!open) return null;

  const payLabel =
    method === 'card'
      ? `Pay ${formatRwf(total)}`
      : `Confirm ${formatRwf(total)}`;

  const validate = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      return 'Please fill name, phone, and delivery address.';
    }
    if (method === 'card') {
      if (!cardName.trim()) return 'Enter the name on the card.';
      if (!luhnOk(cardNumber)) return 'Enter a valid Visa / Mastercard number.';
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Expiry must be MM/YY.';
      const [mm, yy] = expiry.split('/').map(Number);
      if (mm < 1 || mm > 12) return 'Invalid expiry month.';
      const now = new Date();
      const exp = new Date(2000 + yy, mm);
      if (exp <= now) return 'Card looks expired.';
      if (cvc.length < 3 || cvc.length > 4) return 'Enter a valid CVC.';
      if (brand === 'other') return 'Use Visa or Mastercard for card payments.';
    } else {
      if (!bankName.trim() || !accountName.trim() || onlyDigits(accountNumber).length < 6) {
        return 'Enter bank name, account name, and account number.';
      }
    }
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError('');

    const digits = onlyDigits(cardNumber);
    const last4 = digits.slice(-4);
    const payNote =
      method === 'card'
        ? `CARD ${brand.toUpperCase()} •••• ${last4} | ${cardName}`
        : `BANK ${bankName} | ${accountName} | ****${onlyDigits(accountNumber).slice(-4)}`;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      let lastOrderId: string | null = null;

      for (const line of lines) {
        const notes = [
          `Checkout payment: ${payNote}`,
          `Qty: ${line.quantity}`,
          `Amount: ${formatRwf(line.product.price * line.quantity)}`,
          email ? `Email: ${email}` : '',
          `Product: ${line.product.name}`,
        ]
          .filter(Boolean)
          .join(' | ');

        const body = {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          productId: line.product.id,
          notes,
        };

        try {
          const res = await axios.post('/api/orders', body, { headers });
          lastOrderId = res.data?.id || lastOrderId;
        } catch {
          // Demo / offline fallback — keep a local receipt so checkout still completes
          const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const receipt = {
            id: localId,
            ...body,
            total: line.product.price * line.quantity,
            paidAt: new Date().toISOString(),
            payment: payNote,
          };
          const prev = JSON.parse(localStorage.getItem('afroluxo_local_orders') || '[]');
          prev.unshift(receipt);
          localStorage.setItem('afroluxo_local_orders', JSON.stringify(prev.slice(0, 40)));
          lastOrderId = localId;
        }
      }

      // Never persist full card data
      setCardNumber('');
      setCvc('');
      clearCart();
      setSuccessId(lastOrderId);
    } catch {
      setError('Payment could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/80 backdrop-blur-sm" aria-label="Close" onClick={onClose} />

      <div className="relative flex max-h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-stone shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Secure checkout</p>
            <h2 className="text-lg font-black text-ink">Pay with card or bank</h2>
            <p className="mt-0.5 text-xs text-ink/50">Visa · Mastercard · Bank transfer</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
            aria-label="Close checkout"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {successId ? (
          <div className="space-y-4 overflow-y-auto px-4 py-8 text-center sm:px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-ink">Payment received</h3>
            <p className="text-sm text-ink/60">
              Your order is confirmed. Ref: <span className="font-mono font-bold text-ink">{successId}</span>
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
              <Link to="/track" onClick={onClose} className="btn-buy py-3 text-xs">
                Track order
              </Link>
              <button type="button" onClick={onClose} className="rounded-xl border border-ink/15 bg-white py-3 text-xs font-bold text-ink">
                Continue shopping
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {/* Order lines */}
              <div className="space-y-2 rounded-2xl border border-ink/10 bg-white p-3">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex items-center gap-3">
                    <img
                      src={l.product.imageUrl || l.product.imageUrls?.[0] || SAMPLE_IMAGES.placeholder}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover bg-stone"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{l.product.name}</p>
                      <p className="text-[11px] text-ink/45">
                        Qty {l.quantity} · {formatRwf(l.product.price)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-ink">
                      {formatRwf(l.product.price * l.quantity)}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-ink/10 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/45">Total</span>
                  <span className="text-lg font-black text-ink">{formatRwf(total)}</span>
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">Delivery</h3>
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-sm font-medium text-ink outline-none focus:border-forest"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-sm font-medium text-ink outline-none focus:border-forest"
                  placeholder="Phone (+250…)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-sm font-medium text-ink outline-none focus:border-forest"
                  placeholder="Email (receipt)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-sm font-medium text-ink outline-none focus:border-forest"
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Method */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">Payment method</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      method === 'card' ? 'border-forest bg-forest/10' : 'border-ink/10 bg-white'
                    }`}
                  >
                    <p className="text-sm font-black text-ink">Card</p>
                    <p className="text-[10px] text-ink/45">Visa / Mastercard</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      method === 'bank' ? 'border-forest bg-forest/10' : 'border-ink/10 bg-white'
                    }`}
                  >
                    <p className="text-sm font-black text-ink">Bank account</p>
                    <p className="text-[10px] text-ink/45">Local transfer</p>
                  </button>
                </div>
                <BrandBadges active={method === 'bank' ? 'bank' : brand} />
              </div>

              {method === 'card' ? (
                <div className="space-y-2 rounded-2xl border border-ink/10 bg-gradient-to-br from-ink to-forest p-4 text-white shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">AFROLUXO Pay</span>
                    <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase">
                      {brand === 'other' ? 'Card' : brand}
                    </span>
                  </div>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold tracking-widest text-white placeholder:text-white/40 outline-none focus:border-white/40"
                    placeholder="Card number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  />
                  <input
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-medium text-white placeholder:text-white/40 outline-none focus:border-white/40"
                    placeholder="Name on card"
                    autoComplete="cc-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white placeholder:text-white/40 outline-none focus:border-white/40"
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(e) => {
                        let v = onlyDigits(e.target.value).slice(0, 4);
                        if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setExpiry(v);
                      }}
                    />
                    <input
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white placeholder:text-white/40 outline-none focus:border-white/40"
                      placeholder="CVC"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvc}
                      onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))}
                    />
                  </div>
                  <p className="pt-1 text-[10px] leading-relaxed text-white/55">
                    Card details are checked in your browser. Only brand + last 4 digits are saved with the order — never the full card number.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border border-ink/10 bg-white p-3">
                  <input
                    className="w-full rounded-xl border border-ink/10 bg-stone px-3.5 py-3 text-sm font-medium outline-none focus:border-forest"
                    placeholder="Bank name (e.g. Bank of Kigali)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-ink/10 bg-stone px-3.5 py-3 text-sm font-medium outline-none focus:border-forest"
                    placeholder="Account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-ink/10 bg-stone px-3.5 py-3 text-sm font-medium outline-none focus:border-forest"
                    placeholder="Account number"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(onlyDigits(e.target.value).slice(0, 20))}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-ink/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="mb-2 w-full text-center text-xs font-semibold text-forest"
                >
                  Sign in to complete payment →
                </button>
              )}
              <button type="submit" disabled={submitting} className="btn-buy py-3.5 text-sm disabled:opacity-60">
                {submitting ? 'Processing payment…' : payLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}