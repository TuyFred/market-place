/** AFROLUXO brand identity */
export const BRAND = {
  name: 'AFROLUXO BY ASI',
  shortName: 'AFROLUXO',
  byline: 'BY ASI',
  initials: 'AX',
  tagline: 'African-inspired fashion, bouquets & luxury gifts',
  bio: [
    'African-inspired fashion',
    'Bouquets & luxury gifts',
    'Custom orders available',
  ] as const,
  location: 'Canada',
  social: {
    instagram: 'https://www.instagram.com/afroluxo_by_asi/',
    whatsapp: 'https://wa.me/250784017000',
    email: 'mailto:hello@afroluxo.com',
    facebook: 'https://www.facebook.com/',
    tiktok: 'https://www.tiktok.com/',
  },
} as const;

/** Neutral placeholder when a product has no uploaded image (no stock photos). */
const EMPTY_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect fill="#f4f4f5" width="800" height="800"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="28">AFROLUXO</text></svg>`,
  );

export const SAMPLE_IMAGES = {
  placeholder: EMPTY_IMG,
} as const;

/** Optional default hero videos — leave empty.
 *  Admin can set a hero video URL in settings; otherwise image slides are used.
 */
export const HERO_MARKET_VIDEOS: readonly {
  src: string;
  poster: string;
  label: string;
  subtitle: string;
}[] = [];

export type DemoProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  categorySlug: string;
  description: string;
  imageUrl: string;
};

/** 8 sample products per clothes category (replace via admin later) */
export const DEMO_PRODUCTS: DemoProduct[] = [];

export function getDemoProducts(categorySlug?: string) {
  if (!categorySlug) return DEMO_PRODUCTS;
  return DEMO_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}
