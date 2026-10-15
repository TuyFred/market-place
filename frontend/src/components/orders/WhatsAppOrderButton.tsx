import { Product } from '../products/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { orderProductOnWhatsApp } from '../../utils/orderWhatsApp';

type Props = {
  product: Product;
};

export function WhatsAppOrderButton({ product }: Props) {
  const { isAuthenticated, openAuthModal, user } = useAuth();

  const handleClick = () => {
    orderProductOnWhatsApp(product, { isAuthenticated, openAuthModal, user });
  };

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe57]"
      onClick={handleClick}
      aria-label="Order via WhatsApp"
      title="Order via WhatsApp"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.9 11.9 0 0012 0C5.373 0 .001 5.373.001 12c0 2.11.553 4.07 1.604 5.81L0 24l6.44-1.667A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.21-1.25-6.14-3.48-8.52z" />
      </svg>
      Order via WhatsApp
    </button>
  );
}
