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

/** Sample fashion images - replace later from admin uploads */
export const SAMPLE_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80',
  african: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80',
  modern: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80',
  dress: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  casual: 'https://images.unsplash.com/photo-1441984904996-e0b69263b991?auto=format&fit=crop&w=1200&q=80',
  street: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
  kids: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad2?auto=format&fit=crop&w=1200&q=80',
  formal: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
  marketUsa: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1600&q=80',
  marketAfrica: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1600&q=80',
  placeholder: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
} as const;

/** Optional default hero videos — leave empty (Pexels CDN blocks hotlinking).
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
export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    "id": "demo-african-traditional-1",
    "name": "Kente Heritage Robe",
    "price": 19379,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Kente Heritage Robe from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-2",
    "name": "Adire Wrap Blouse",
    "price": 20758,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Adire Wrap Blouse from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-3",
    "name": "Mudcloth Tunic",
    "price": 22137,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Mudcloth Tunic from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-4",
    "name": "Aso Oke Celebration Top",
    "price": 23516,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Aso Oke Celebration Top from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1601924999986-6eb0b2f5b5f5?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-5",
    "name": "Ndebele Print Shirt",
    "price": 24895,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Ndebele Print Shirt from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-6",
    "name": "Dashiki Classic Tee",
    "price": 26274,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Dashiki Classic Tee from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-7",
    "name": "Kaftan Evening Flow",
    "price": 27653,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Kaftan Evening Flow from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-african-traditional-8",
    "name": "Beaded Collar Blouse",
    "price": 29032,
    "category": "African Traditional",
    "categorySlug": "african-traditional",
    "description": "Beaded Collar Blouse from the AFROLUXO African Traditional collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-1",
    "name": "Ankara Wrap Dress",
    "price": 30411,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Ankara Wrap Dress from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-2",
    "name": "Bold Print Midi Skirt",
    "price": 31790,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Bold Print Midi Skirt from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-3",
    "name": "Wax Print Blazer",
    "price": 33169,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Wax Print Blazer from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-4",
    "name": "Floral Ankara Set",
    "price": 34548,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Floral Ankara Set from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-5",
    "name": "Peplum Print Top",
    "price": 35927,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Peplum Print Top from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-6",
    "name": "Ankara Maxi Dress",
    "price": 37306,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Ankara Maxi Dress from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-7",
    "name": "Print Culotte Pants",
    "price": 38685,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Print Culotte Pants from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-ankara-prints-8",
    "name": "Statement Ankara Jacket",
    "price": 40064,
    "category": "Ankara & Prints",
    "categorySlug": "ankara-prints",
    "description": "Statement Ankara Jacket from the AFROLUXO Ankara & Prints collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-1",
    "name": "Modern Linen Shirt",
    "price": 41443,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Modern Linen Shirt from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1441984904996-e0b69263b991?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-2",
    "name": "Soft Cotton Tee",
    "price": 42822,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Soft Cotton Tee from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-3",
    "name": "Relaxed Chino Pants",
    "price": 44201,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Relaxed Chino Pants from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-4",
    "name": "Everyday Hoodie",
    "price": 45580,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Everyday Hoodie from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-5",
    "name": "Knit Crew Sweater",
    "price": 46959,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Knit Crew Sweater from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-6",
    "name": "Cargo Utility Pants",
    "price": 48338,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Cargo Utility Pants from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-7",
    "name": "Camp Collar Shirt",
    "price": 49717,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Camp Collar Shirt from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-modern-casual-8",
    "name": "Easy Weekend Jacket",
    "price": 51096,
    "category": "Modern Casual",
    "categorySlug": "modern-casual",
    "description": "Easy Weekend Jacket from the AFROLUXO Modern Casual collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-1",
    "name": "Silk Slip Dress",
    "price": 52475,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Silk Slip Dress from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-2",
    "name": "Tailored Blouse",
    "price": 53854,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Tailored Blouse from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-3",
    "name": "Wide-Leg Trousers",
    "price": 55233,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Wide-Leg Trousers from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-4",
    "name": "Knit Cardigan Coat",
    "price": 56612,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Knit Cardigan Coat from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-5",
    "name": "Satin Midi Skirt",
    "price": 57991,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Satin Midi Skirt from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-6",
    "name": "Soft Wrap Top",
    "price": 59370,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Soft Wrap Top from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-7",
    "name": "Belted Day Dress",
    "price": 18749,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Belted Day Dress from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-women-wear-8",
    "name": "Structured Crop Jacket",
    "price": 20128,
    "category": "Women Wear",
    "categorySlug": "women-wear",
    "description": "Structured Crop Jacket from the AFROLUXO Women Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-1",
    "name": "Slim Fit Suit Jacket",
    "price": 21507,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Slim Fit Suit Jacket from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-2",
    "name": "Oxford Button Shirt",
    "price": 22886,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Oxford Button Shirt from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-3",
    "name": "Wool Overcoat",
    "price": 24265,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Wool Overcoat from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-4",
    "name": "Tailored Trousers",
    "price": 25644,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Tailored Trousers from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1593032465175-481ac7f401f0?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-5",
    "name": "Casual Blazer",
    "price": 27023,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Casual Blazer from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-6",
    "name": "Knit Polo Shirt",
    "price": 28402,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Knit Polo Shirt from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-7",
    "name": "Denim Trucker Jacket",
    "price": 29781,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Denim Trucker Jacket from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-men-wear-8",
    "name": "Smart Casual Chinos",
    "price": 31160,
    "category": "Men Wear",
    "categorySlug": "men-wear",
    "description": "Smart Casual Chinos from the AFROLUXO Men Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-1",
    "name": "Kids Play Tee",
    "price": 32539,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Kids Play Tee from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1503919545889-aef636e10ad2?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-2",
    "name": "Soft Jersey Dress",
    "price": 33918,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Soft Jersey Dress from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-3",
    "name": "Mini Denim Jacket",
    "price": 35297,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Mini Denim Jacket from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1471286174890-9c112ffca5a1?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-4",
    "name": "Comfort Jogger Set",
    "price": 36676,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Comfort Jogger Set from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-5",
    "name": "Printed Kids Shirt",
    "price": 38055,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Printed Kids Shirt from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-6",
    "name": "Cozy Kids Hoodie",
    "price": 39434,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Cozy Kids Hoodie from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-7",
    "name": "Everyday Kids Shorts",
    "price": 40813,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Everyday Kids Shorts from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-kids-wear-8",
    "name": "Kids Layered Cardigan",
    "price": 42192,
    "category": "Kids Wear",
    "categorySlug": "kids-wear",
    "description": "Kids Layered Cardigan from the AFROLUXO Kids Wear collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-1",
    "name": "Evening Gown Silhouette",
    "price": 43571,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Evening Gown Silhouette from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-2",
    "name": "Formal Suit Set",
    "price": 44950,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Formal Suit Set from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-3",
    "name": "Occasion Wrap Dress",
    "price": 46329,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Occasion Wrap Dress from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1598554747436-c9293d6a477c?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-4",
    "name": "Black Tie Shirt",
    "price": 47708,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Black Tie Shirt from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-5",
    "name": "Celebration Kaftan",
    "price": 49087,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Celebration Kaftan from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-6",
    "name": "Cocktail Midi Dress",
    "price": 50466,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Cocktail Midi Dress from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-7",
    "name": "Formal Vest Set",
    "price": 51845,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Formal Vest Set from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-formal-occasion-8",
    "name": "Gala Cape Blouse",
    "price": 53224,
    "category": "Formal & Occasion",
    "categorySlug": "formal-occasion",
    "description": "Gala Cape Blouse from the AFROLUXO Formal & Occasion collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-1",
    "name": "Tailored Street Hoodie",
    "price": 54603,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Tailored Street Hoodie from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-2",
    "name": "Oversized Graphic Tee",
    "price": 55982,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Oversized Graphic Tee from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-3",
    "name": "Cargo Street Pants",
    "price": 57361,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Cargo Street Pants from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-4",
    "name": "Bomber Light Jacket",
    "price": 58740,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Bomber Light Jacket from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-5",
    "name": "Snapback Layer Set",
    "price": 18119,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Snapback Layer Set from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-6",
    "name": "Urban Denim Jacket",
    "price": 19498,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Urban Denim Jacket from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-7",
    "name": "Street Track Pants",
    "price": 20877,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Street Track Pants from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "demo-street-style-8",
    "name": "Chunky Knit Crew",
    "price": 22256,
    "category": "Street Style",
    "categorySlug": "street-style",
    "description": "Chunky Knit Crew from the AFROLUXO Street Style collection. Sample look — replace with your product photos anytime.",
    "imageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
  }
];

export function getDemoProducts(categorySlug?: string) {
  if (!categorySlug) return DEMO_PRODUCTS;
  return DEMO_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}
