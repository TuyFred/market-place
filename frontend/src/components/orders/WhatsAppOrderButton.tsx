import { Product } from '../products/ProductCard';
import { buildProductWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';
import { fetchImageBlob } from '../../utils/image';
import { formatRwf } from '../../utils/format';

type Props = {
  product: Product;
};

export function WhatsAppOrderButton({ product }: Props) {
  const handleClick = async () => {
    const price = formatRwf(product.price);
    const imageUrl = product.imageUrl || product.imageUrls?.[0] || '';
    const body = buildProductWhatsAppMessage({
      name: product.name,
      priceLabel: price,
      category: product.category,
      productId: product.id,
      imageUrl,
    });

    if (navigator.share && imageUrl) {
      try {
        const blob = await fetchImageBlob(imageUrl, product.id);
        const ext = (blob.type && blob.type.split('/')?.[1]) || 'jpg';
        const file = new File([blob], `${product.name.replace(/\s+/g, '_')}.${ext}`, {
          type: blob.type || 'image/jpeg',
        });
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], text: body });
          return;
        }
      } catch {
        /* fall through to wa.me */
      }
    }

    openWhatsApp(body);
  };

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-accent text-white shadow-sm hover:bg-accent/90"
      onClick={handleClick}
      aria-label="Order via WhatsApp"
      title="Order via WhatsApp"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 2.11.617 4.065 1.682 5.7L2 22l4.41-1.608A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10z"
          fill="rgba(255,255,255,0.12)"
        />
        <path d="M10.5 7.5l4 2.5-4 2.5v-5z" fill="white" />
      </svg>
      Order via WhatsApp
    </button>
  );
}
