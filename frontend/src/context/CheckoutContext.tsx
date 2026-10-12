import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { PaymentCheckoutModal } from '../components/checkout/PaymentCheckoutModal';
import type { CheckoutLine } from '../components/checkout/types';

export type { CheckoutLine };

type CheckoutContextValue = {
  openCheckout: (lines: CheckoutLine[]) => void;
  closeCheckout: () => void;
};

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CheckoutLine[]>([]);

  const openCheckout = useCallback((next: CheckoutLine[]) => {
    const cleaned = next.filter((l) => l.quantity > 0 && l.product);
    if (!cleaned.length) return;
    setLines(cleaned);
    setOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setOpen(false);
    setLines([]);
  }, []);

  const value = useMemo(
    () => ({ openCheckout, closeCheckout }),
    [openCheckout, closeCheckout]
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
      <PaymentCheckoutModal open={open} lines={lines} onClose={closeCheckout} />
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}