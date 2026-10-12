export function buildOrderMessage({ productName, price, category }) {
  return `Hello! I would like to order:\n\nProduct: ${productName}\nPrice: $${price.toFixed(
    2
  )}\nCategory: ${category}\n\nPlease confirm availability.`;
}

