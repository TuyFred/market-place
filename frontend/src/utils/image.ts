export async function fetchImageBlob(url: string, productId?: string) {
  // Try direct fetch first (may fail due to CORS)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return await res.blob();
  } catch (err) {
    // ignore
  }

  // Fallback to backend proxy when productId is available
  try {
    if (!productId) throw new Error('No product id for proxy');
    const proxRes = await fetch(`/api/products/${productId}/image`);
    if (!proxRes.ok) throw new Error('Proxy fetch failed');
    return await proxRes.blob();
  } catch (err) {
    throw new Error('Failed to fetch image');
  }
}
