import { Product } from '../products/ProductCard';
import { WhatsAppOrderButton } from './WhatsAppOrderButton';

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirmAdd: () => void;
};

export function ContactAndAddModal({ product, open, onClose, onConfirmAdd }: Props) {
  if (!open) return null;

  const emailSubject = encodeURIComponent(`Inquiry about ${product.name}`);
  const emailBody = encodeURIComponent(
    `Hello,%0A%0AI would like to ask about the following product before placing it in my cart:%0A%0A` +
      `Product: ${product.name}%0APrice: ${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(product.price)}%0ACategory: ${product.category}%0A%0APlease confirm availability and any other details.%0A%0AThank you.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold">Contact before adding</h3>
          <button className="text-slate-500" onClick={onClose}>✕</button>
        </div>

        <p className="mt-2 text-xs text-slate-600">Please send a quick message via WhatsApp or email to confirm availability or ask questions. After sending, press "I sent it — Add to cart".</p>

        <div className="mt-4 space-y-2">
          <WhatsAppOrderButton product={product} />

          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="w-full inline-flex items-center justify-center rounded-full bg-amber-500 px-3 py-2 text-sm font-medium text-white"
            onClick={() => { /* mailto opens user's email client */ }}
          >
            Inquiry by Email
          </a>

          <button
            type="button"
            className="w-full inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
            onClick={() => {
              onConfirmAdd();
              onClose();
            }}
          >
            I sent it — Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
