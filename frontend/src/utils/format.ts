// Fixed conversion based on the 2026-11-02 reference rate: 1 RWF = 0.000678 USD.
export const USD_PER_RWF = 0.000678;

export function convertRwfToUsd(amount: number) {
  return Number.isFinite(amount) ? amount * USD_PER_RWF : 0;
}

export function convertUsdToRwf(amount: number) {
  return Number.isFinite(amount) ? Math.round(amount / USD_PER_RWF) : 0;
}

export function formatUsd(amount: number) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
  }
}

export function formatUsdFromRwf(amount: number) {
  return formatUsd(convertRwfToUsd(amount));
}
