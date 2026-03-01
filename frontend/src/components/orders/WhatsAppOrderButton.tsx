import { Product } from '../products/ProductCard';
import { CONTACT_DISPLAY, CONTACT_RAW } from '../../utils/whatsapp';
import { fetchImageBlob } from '../../utils/image';

type Props = {
  product: Product;
};

export function WhatsAppOrderButton({ product }: Props) {
  const handleClick = async () => {
    const digits = CONTACT_RAW;
    if (!digits) {
      alert('WhatsApp number is not configured correctly.');
      return;
    }

    const price = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(product.price);
    const imageUrl = product.imageUrl || (product.imageUrls && product.imageUrls[0]) || '';

    // Try Web Share with image when possible (use proxied fetch helper)
    if (navigator.share && imageUrl) {
      try {
        const blob = await fetchImageBlob(imageUrl, product.id);
        const ext = (blob.type && blob.type.split('/')?.[1]) || 'jpg';
        const file = new File([blob], `${product.name.replace(/\s+/g, '_')}.${ext}`, { type: blob.type || 'image/jpeg' });
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], text: `Hello! I would like to order ${product.name} (${price}).` });
          return;
        }
      } catch (err) {
        // fallback to wa.me with image url in message
      }
    }

    const body = `Hello! I would like to order:\n\nProduct: ${product.name}\nPrice: ${price}\nCategory: ${product.category}` + (imageUrl ? `\n\nImage: ${imageUrl}` : '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-accent text-white shadow-sm hover:bg-accent/90"
      onClick={handleClick}
      aria-label={`Contact us via WhatsApp`}
      title={`Contact us via WhatsApp`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 2.11.617 4.065 1.682 5.7L2 22l4.41-1.608A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10z" fill="rgba(255,255,255,0.12)"/><path d="M10.5 7.5l4 2.5-4 2.5v-5z" fill="white"/></svg>
      Contact us via WhatsApp
    </button>
  );
}

