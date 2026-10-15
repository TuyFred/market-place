/** Shop WhatsApp — override with VITE_WHATSAPP_NUMBER in .env */
const ENV_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim();

export const CONTACT_RAW = ENV_NUMBER || '+13653369344';
export const CONTACT_DISPLAY = formatDisplay(CONTACT_RAW);
export const INQUIRY_EMAIL = 'josephnkurunziza642@gmail.com';

function formatDisplay(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length >= 11) {
    // +1 365 336 9344 style for NANP, otherwise +XXX groups
    if (d.startsWith('1') && d.length === 11) {
      return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    }
    return `+${d}`;
  }
  return raw;
}

export function whatsappDigits() {
  return CONTACT_RAW.replace(/\D/g, '');
}

/** Absolute public product URL (opens the shop product page). */
export function productPageUrl(productId: string) {
  if (typeof window === 'undefined') return `/product/${productId}`;
  const origin = window.location.origin.replace(/\/$/, '');
  return `${origin}/product/${productId}`;
}

export type ProductWhatsAppOpts = {
  name: string;
  priceLabel: string;
  category?: string;
  subcategory?: string;
  size?: string;
  stock?: number;
  description?: string;
  productId: string;
  imageUrl?: string;
  quantity?: number;
  customerName?: string;
  customerEmail?: string;
};

/** Rich order message: product link first so staff can open and review the item. */
export function buildProductWhatsAppMessage(opts: ProductWhatsAppOpts) {
  const link = productPageUrl(opts.productId);
  const qty = Math.max(1, Number(opts.quantity) || 1);
  const lines = [
    'Hello AFROLUXO BY ASI 👋',
    'I would like to place an order.',
    '',
    '—— Product ——',
    `Name: ${opts.name}`,
    `Price: ${opts.priceLabel}`,
    qty > 1 ? `Quantity: ${qty}` : null,
    opts.category ? `Category: ${opts.category}` : null,
    opts.subcategory ? `Subcategory: ${opts.subcategory}` : null,
    opts.size ? `Size: ${opts.size}` : null,
    typeof opts.stock === 'number' ? `Stock shown: ${opts.stock}` : null,
    '',
    'Open product page (full details & photos):',
    link,
  ].filter(Boolean) as string[];

  if (opts.description?.trim()) {
    lines.push('', `Description: ${opts.description.trim().slice(0, 280)}`);
  }
  if (opts.imageUrl) {
    lines.push('', `Product image: ${opts.imageUrl}`);
  }
  if (opts.customerName || opts.customerEmail) {
    lines.push('', '—— Customer ——');
    if (opts.customerName) lines.push(`Name: ${opts.customerName}`);
    if (opts.customerEmail) lines.push(`Email: ${opts.customerEmail}`);
  }
  lines.push('', 'Please confirm availability and payment. Thank you!');
  return lines.join('\n');
}

export function buildCartWhatsAppMessage(
  items: {
    name: string;
    quantity: number;
    lineTotalLabel: string;
    productId: string;
    priceLabel?: string;
  }[],
  totalLabel: string,
  customer?: { name?: string; email?: string },
) {
  const lines = [
    'Hello AFROLUXO BY ASI 👋',
    'I would like to order these items:',
    '',
  ];

  items.forEach((i, idx) => {
    const link = productPageUrl(i.productId);
    lines.push(
      `${idx + 1}. ${i.name}`,
      `   Qty: ${i.quantity}${i.priceLabel ? ` · ${i.priceLabel}` : ''} · ${i.lineTotalLabel}`,
      `   Product link: ${link}`,
      '',
    );
  });

  lines.push(`Total: ${totalLabel}`);
  if (customer?.name || customer?.email) {
    lines.push('', '—— Customer ——');
    if (customer.name) lines.push(`Name: ${customer.name}`);
    if (customer.email) lines.push(`Email: ${customer.email}`);
  }
  lines.push('', 'Please confirm availability and payment. Thank you!');
  return lines.join('\n');
}

/** Build wa.me URL for the shop number with prefilled text. */
export function whatsappOrderUrl(message: string) {
  const digits = whatsappDigits();
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Open WhatsApp chat with the shop, message prefilled.
 * Prefer same-tab navigation on mobile so the WhatsApp app opens reliably.
 */
export function openWhatsApp(message: string) {
  const digits = whatsappDigits();
  if (!digits) {
    alert('WhatsApp number is not configured. Set VITE_WHATSAPP_NUMBER in frontend/.env');
    return false;
  }

  const url = whatsappOrderUrl(message);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      window.location.href = url;
    } else {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        // Popup blocked — navigate current tab
        window.location.href = url;
      }
    }
    return true;
  } catch {
    window.location.href = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
    return true;
  }
}
