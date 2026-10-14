/** Shop WhatsApp — override with VITE_WHATSAPP_NUMBER in .env */
const ENV_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim();

export const CONTACT_RAW = ENV_NUMBER || '+250784017000';
export const CONTACT_DISPLAY = formatDisplay(CONTACT_RAW);
export const INQUIRY_EMAIL = 'josephnkurunziza642@gmail.com';

function formatDisplay(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length >= 12) return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return raw;
}

export function whatsappDigits() {
  return CONTACT_RAW.replace(/\D/g, '');
}

/** Public product page URL for WhatsApp messages */
export function productPageUrl(productId: string) {
  if (typeof window === 'undefined') return `/product/${productId}`;
  return `${window.location.origin}/product/${productId}`;
}

export function buildProductWhatsAppMessage(opts: {
  name: string;
  priceLabel: string;
  category?: string;
  productId: string;
  imageUrl?: string;
}) {
  const link = productPageUrl(opts.productId);
  const lines = [
    'Hello! I would like to order:',
    '',
    `Product: ${opts.name}`,
    `Price: ${opts.priceLabel}`,
  ];
  if (opts.category) lines.push(`Category: ${opts.category}`);
  lines.push('', `Product link: ${link}`);
  if (opts.imageUrl) lines.push(`Image: ${opts.imageUrl}`);
  return lines.join('\n');
}

export function buildCartWhatsAppMessage(
  items: { name: string; quantity: number; lineTotalLabel: string; productId: string }[],
  totalLabel: string,
) {
  const lines = items.map((i) => {
    const link = productPageUrl(i.productId);
    return `• ${i.name} × ${i.quantity} — ${i.lineTotalLabel}\n  ${link}`;
  });
  return `Hello! I would like to order:\n\n${lines.join('\n\n')}\n\nTotal: ${totalLabel}`;
}

export function openWhatsApp(message: string) {
  const digits = whatsappDigits();
  if (!digits) {
    alert('WhatsApp number is not configured. Set VITE_WHATSAPP_NUMBER in frontend/.env');
    return;
  }
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
}
