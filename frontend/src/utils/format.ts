export function formatRwf(amount: number) {
  try {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return `RWF ${Math.round(amount)}`;
  }
}
