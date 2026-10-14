import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type { CheckoutLine } from './types';
import { formatRwf } from '../../utils/format';
import { SAMPLE_IMAGES } from '../../config/brand';
import { CONTACT_DISPLAY, CONTACT_RAW, openWhatsApp, whatsappDigits } from '../../utils/whatsapp';

type Props = {
  open: boolean;
  lines: CheckoutLine[];
  onClose: () => void;
};

type PayMethod = 'bank' | 'mobile' | 'paypal';

type PaymentInfo = {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  mobileNumber: string;
  mobileName: string;
  paypalEmail: string;
  supportPhone: string;
  instructions: string;
};

export function PaymentCheckoutModal({ open, lines, onClose }: Props) {
  const { isAuthenticated, token, openAuthModal, user } = useAuth();
  const { clearCart } = useCart();
  const [method, setMethod] = useState<PayMethod>('bank');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [pay, setPay] = useState<PaymentInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines],
  );

  useEffect(() => {
    if (!open) return;
    setSuccessId(null);
    setError('');
    setPaymentReference('');
    setProofFile(null);
    if (user?.email) setEmail(user.email);
    axios
      .get<{ payment?: PaymentInfo }>('/api/settings')
      .then((res) => {
        const p = res.data?.payment;
        if (p) {
          setPay(p);
          if (p.bankAccount) setMethod('bank');
          else if (p.mobileNumber) setMethod('mobile');
          else if (p.paypalEmail) setMethod('paypal');
        }
      })
      .catch(() => setPay(null));
  }, [open, user?.email]);

  if (!open) return null;

  const supportPhone = pay?.supportPhone || CONTACT_RAW;
  const supportDigits = (supportPhone || '').replace(/\D/g, '') || whatsappDigits();

  const askSupport = () => {
    const msg = `Hello AFROLUXO support,\nI need help with checkout / payment.\nTotal: ${formatRwf(total)}\nItems: ${lines.map((l) => l.product.name).join(', ')}`;
    openWhatsApp(msg);
  };

  const callSupport = () => {
    if (!supportDigits) return;
    window.location.href = `tel:+${supportDigits}`;
  };

  const validate = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) return 'Please fill delivery name, phone, and address.';
    if (!paymentReference.trim()) return 'Enter your payment reference or transaction ID after you pay.';
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
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

    try {
      const headers = { Authorization: `Bearer ${token}` };
      let lastOrderId: string | null = null;

      for (const line of lines) {
        const notes = [
          `Payment method: ${method}`,
          `Reference: ${paymentReference.trim()}`,
          `Qty: ${line.quantity}`,
          `Amount: ${formatRwf(line.product.price * line.quantity)}`,
          email ? `Email: ${email}` : '',
          `Product: ${line.product.name}`,
        ]
          .filter(Boolean)
          .join(' | ');

        const res = await axios.post(
          '/api/orders',
          {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            productId: line.product.id,
            notes,
            paymentMethod: method,
            paymentReference: paymentReference.trim(),
            paymentStatus: 'payment_review',
          },
          { headers },
        );
        lastOrderId = res.data?.id || lastOrderId;

        if (proofFile && lastOrderId) {
          const fd = new FormData();
          fd.append('file', proofFile);
          await axios.post(`/api/orders/${lastOrderId}/proof`, fd, {
            headers: { ...headers, 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      if (!lastOrderId) {
        setError('Order was not saved. Please try again.');
        return;
      }

      clearCart();
      setSuccessId(lastOrderId);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.error || err.message
        : '';
      setError(
        typeof msg === 'string' && msg
          ? msg
          : 'Could not place order. Sign in and check payment details.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={onClose} />

      <div className="relative flex max-h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Secure checkout</p>
            <h2 className="mt-0.5 text-lg font-bold text-black">
              {successId ? 'Order received' : 'Pay & confirm'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-black">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {successId ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-neutral-600">
                Thank you. Your order is under <strong>payment review</strong>. We will confirm once payment is verified.
              </p>
              <p className="text-xs text-neutral-400">Order ID: {successId}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  to="/customer/dashboard"
                  className="inline-flex min-h-[44px] items-center justify-center bg-black px-5 text-sm font-semibold text-white"
                  onClick={onClose}
                >
                  Track my order
                </Link>
                <button
                  type="button"
                  onClick={askSupport}
                  className="inline-flex min-h-[44px] items-center justify-center border border-neutral-200 px-5 text-sm font-semibold"
                >
                  WhatsApp support
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex gap-3 py-2">
                    <div className="h-14 w-14 shrink-0 overflow-hidden bg-neutral-200">
                      <img
                        src={l.product.imageUrl || l.product.imageUrls?.[0] || SAMPLE_IMAGES.placeholder}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.product.name}</p>
                      <p className="text-xs text-neutral-500">
                        × {l.quantity} · {formatRwf(l.product.price * l.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="mt-2 border-t border-neutral-200 pt-2 text-right text-sm font-bold">
                  Total {formatRwf(total)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">How to pay</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {pay?.instructions ||
                    'Send the total using bank, mobile money, or PayPal, then submit your details below.'}
                </p>

                <div className="mt-3 grid gap-2">
                  {(
                    [
                      ['bank', 'Bank transfer'],
                      ['mobile', 'Mobile money'],
                      ['paypal', 'PayPal'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMethod(id)}
                      className={`rounded-xl border px-3 py-3 text-left text-sm ${
                        method === id ? 'border-black bg-black text-white' : 'border-neutral-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
                  {method === 'bank' && (
                    <>
                      <p className="font-semibold">Bank account</p>
                      <p className="mt-1 text-neutral-600">{pay?.bankName || '— set by admin —'}</p>
                      <p className="mt-1">
                        Account name: <strong>{pay?.bankAccountName || '—'}</strong>
                      </p>
                      <p>
                        Account number: <strong className="tracking-wide">{pay?.bankAccount || '—'}</strong>
                      </p>
                    </>
                  )}
                  {method === 'mobile' && (
                    <>
                      <p className="font-semibold">Mobile money</p>
                      <p className="mt-1">
                        Name: <strong>{pay?.mobileName || '—'}</strong>
                      </p>
                      <p>
                        Number: <strong className="tracking-wide">{pay?.mobileNumber || '—'}</strong>
                      </p>
                    </>
                  )}
                  {method === 'paypal' && (
                    <>
                      <p className="font-semibold">PayPal</p>
                      <p className="mt-1">
                        Send to:{' '}
                        <strong>{pay?.paypalEmail || '—'}</strong>
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">Use PayPal email to complete payment, then continue this form.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Delivery & payment proof</p>
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
                  placeholder="Payment reference / transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  required
                />
                <label className="block text-xs text-neutral-500">
                  Upload payment screenshot (optional)
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="mt-1 block w-full text-sm"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] bg-black text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'I paid — submit order'}
              </button>

              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={askSupport}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold"
                >
                  WhatsApp help ({CONTACT_DISPLAY})
                </button>
                <button
                  type="button"
                  onClick={callSupport}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold"
                >
                  Call support
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
