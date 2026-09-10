import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { DEMO_PRODUCTS, SAMPLE_IMAGES, getDemoProducts, BRAND, HERO_MARKET_VIDEOS } from '../config/brand';
import { SocialRail } from '../components/layout/SocialRail';

const FALLBACK_CATEGORIES = [
  { id: 'f1', name: 'African Traditional', slug: 'african-traditional' },
  { id: 'f2', name: 'Ankara & Prints', slug: 'ankara-prints' },
  { id: 'f3', name: 'Modern Casual', slug: 'modern-casual' },
  { id: 'f4', name: 'Women Wear', slug: 'women-wear' },
  { id: 'f5', name: 'Men Wear', slug: 'men-wear' },
  { id: 'f6', name: 'Kids Wear', slug: 'kids-wear' },
  { id: 'f7', name: 'Formal & Occasion', slug: 'formal-occasion' },
  { id: 'f8', name: 'Street Style', slug: 'street-style' },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroAnim, setHeroAnim] = useState(true);
  const [marketVideoIndex, setMarketVideoIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);

  const heroSlides = [
    {
      image: SAMPLE_IMAGES.marketUsa,
      title: BRAND.shortName,
      byline: BRAND.byline,
      subtitle: 'Shop clothes the market way — USA retail floors to African stalls.',
      note: 'Browse African prints and modern fits inspired by real marketplaces.',
      cta: { label: 'Shop clothes', to: '/products' },
      secondary: { label: 'African wear', to: '/products?category=african-traditional' },
    },
    {
      image: SAMPLE_IMAGES.marketAfrica,
      title: 'African markets',
      byline: '',
      subtitle: 'Bold fabrics and heritage style from open-air market culture.',
      note: 'Discover African Traditional and Ankara collections.',
      cta: { label: 'African wear', to: '/products?category=african-traditional' },
      secondary: { label: 'Ankara prints', to: '/products?category=ankara-prints' },
    },
    {
      image: SAMPLE_IMAGES.modern,
      title: 'USA style floors',
      byline: '',
      subtitle: 'Clean modern clothes with the energy of American shopping markets.',
      note: 'Explore modern casual, women, men, and street style.',
      cta: { label: 'Modern looks', to: '/products?category=modern-casual' },
      secondary: { label: 'Street style', to: '/products?category=street-style' },
    },
    {
      image: SAMPLE_IMAGES.dress,
      title: 'Custom orders',
      byline: '',
      subtitle: 'Made for you — custom fashion pieces tailored to your vision.',
      note: 'Bouquets, luxury gifts, and special occasion wear available.',
      cta: { label: 'View collection', to: '/products' },
      secondary: { label: 'Formal wear', to: '/products?category=formal-occasion' },
    },
  ];

  const activeMarketVideo = HERO_MARKET_VIDEOS.length
    ? HERO_MARKET_VIDEOS[marketVideoIndex % HERO_MARKET_VIDEOS.length]
    : undefined;
  const showHeroVideo = Boolean(heroVideoUrl) || (!videoFailed && Boolean(activeMarketVideo?.src));
  const activeVideoSrc = heroVideoUrl || activeMarketVideo?.src || '';

  useEffect(() => {
    if (heroVideoUrl) return;
    const id = window.setInterval(() => {
      setHeroAnim(false);
      window.setTimeout(() => {
        setHeroIndex((i) => (i + 1) % heroSlides.length);
        if (HERO_MARKET_VIDEOS.length) {
          setMarketVideoIndex((i) => (i + 1) % HERO_MARKET_VIDEOS.length);
          setVideoFailed(false);
        }
        setHeroAnim(true);
      }, 220);
    }, 6000);
    return () => window.clearInterval(id);
  }, [heroVideoUrl, heroSlides.length]);

  // Clothes by style — auto-slide every 1s
  useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    const id = window.setInterval(() => {
      const card = rail.querySelector('a') as HTMLElement | null;
      const step = card ? card.offsetWidth + 8 : Math.max(140, rail.clientWidth * 0.42);
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 8) return;
      if (rail.scrollLeft >= maxScroll - 4) {
        rail.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        rail.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [categoriesList.length]);

  const goSlide = (next: number) => {
    setHeroAnim(false);
    window.setTimeout(() => {
      setHeroIndex((next + heroSlides.length) % heroSlides.length);
      if (HERO_MARKET_VIDEOS.length) {
        setMarketVideoIndex((next + HERO_MARKET_VIDEOS.length) % HERO_MARKET_VIDEOS.length);
        setVideoFailed(false);
      }
      setHeroAnim(true);
    }, 180);
  };

  const slide = heroSlides[heroIndex];

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !isMuted;
    v.muted = next;
    setIsMuted(next);
    if (!next && v.volume === 0) { v.volume = 0.5; setVolume(0.5); }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) { videoRef.current.muted = true; setIsMuted(true); }
      else if (isMuted) { videoRef.current.muted = false; setIsMuted(false); }
    }
  };

  useEffect(() => {
    Promise.all([
      axios.get('/api/categories'),
      axios.get<Product[]>('/api/products'),
      axios.get('/api/settings').catch(() => ({ data: { hero_video_url: '' } }))
    ])
      .then(([cRes, pRes, sRes]) => {
        const cats: { id: string; name: string; slug: string }[] = cRes.data || [];
        setCategoriesList(cats.length ? cats : FALLBACK_CATEGORIES);
        const map: Record<string, string> = {};
        cats.forEach((c) => { map[c.slug] = c.name; });
        const mapped = (pRes.data || []).map((p) => ({ ...p, category: map[p.category] || p.category }));
        setProducts(mapped.slice(0, 8));
        setHeroVideoUrl(sRes.data.hero_video_url || '');
      })
      .catch(() => {
        setCategoriesList(FALLBACK_CATEGORIES);
        setProducts([]);
      });
  }, []);

  const displayCategories = categoriesList.length ? categoriesList : FALLBACK_CATEGORIES;
  const featured = products.length
    ? products.slice(0, 8)
    : (DEMO_PRODUCTS.filter((_, i) => i % 8 === 0).slice(0, 8) as Product[]);

  return (
    <div className="space-y-0 relative">
      <SocialRail />
      {/* Full-bleed fashion hero — fits visible screen (below navbar) */}
      <section className="relative h-[calc(100svh-3.5rem)] sm:h-[calc(100svh-4rem)] max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col justify-end overflow-hidden bg-stone">
        {showHeroVideo ? (
          <video
            key={activeVideoSrc}
            ref={videoRef}
            src={activeVideoSrc}
            poster={activeMarketVideo?.poster || slide.image}
            autoPlay
            muted
            loop={!heroVideoUrl}
            playsInline
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <>
            {heroSlides.map((s, i) => (
              <div
                key={s.image + i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === heroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={i !== heroIndex}
              >
                <img
                  src={s.image}
                  alt=""
                  className={`h-full w-full object-cover object-center transition-transform duration-[6s] ease-out ${
                    i === heroIndex ? 'scale-100' : 'scale-105'
                  }`}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES.placeholder; }}
                />
              </div>
            ))}
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/10 sm:from-ink/80 sm:via-ink/35 sm:to-transparent" />

        {showHeroVideo && (
          <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 sm:top-auto sm:bottom-28 sm:right-8 z-20 flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-md text-white hover:bg-white/35 transition-all border border-white/20"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
              )}
            </button>
          </div>
        )}

        {!heroVideoUrl && (
          <>
            <button
              type="button"
              onClick={() => goSlide(heroIndex - 1)}
              className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 hover:bg-white/30 transition-colors"
              aria-label="Previous slide"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={() => goSlide(heroIndex + 1)}
              className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 hover:bg-white/30 transition-colors"
              aria-label="Next slide"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:pb-14">
          <div key={heroIndex} className={heroAnim ? 'hero-slide-in' : 'opacity-0'}>
            {!heroVideoUrl && activeMarketVideo?.label && (
              <p className="mb-1.5 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                {activeMarketVideo.label}
              </p>
            )}
            <p className="font-display text-white text-[1.75rem] leading-[1.05] xs:text-[2.1rem] sm:text-5xl md:text-6xl lg:text-7xl tracking-tight max-w-[16ch] sm:max-w-none">
              {slide.title}
              {slide.byline ? (
                <span className="ml-1.5 sm:ml-2 align-middle text-[0.5em] sm:text-[0.55em] font-semibold tracking-[0.12em] text-white/85">
                  {slide.byline}
                </span>
              ) : null}
            </p>
            <h1 className="mt-2 sm:mt-3 max-w-xl text-[13px] xs:text-[15px] sm:text-xl md:text-2xl font-medium text-white/90 leading-snug line-clamp-2 sm:line-clamp-none">
              {slide.subtitle}
            </h1>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/65 leading-relaxed hidden sm:block">
              {slide.note}
            </p>
            <div className="mt-4 sm:mt-7 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link to={slide.cta.to} className="btn-fashion-primary !text-[10px] sm:!text-xs !px-3.5 !py-2.5 sm:!px-5 sm:!py-3">
                {slide.cta.label}
              </Link>
              <Link to={slide.secondary.to} className="btn-fashion-ghost !text-[10px] sm:!text-xs !px-3.5 !py-2.5 sm:!px-5 sm:!py-3">
                {slide.secondary.label}
              </Link>
            </div>
          </div>

          {!heroVideoUrl && (
            <div className="mt-4 sm:mt-7 flex items-center gap-1.5 sm:gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-5 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories — one-line sliding cards */}
      <section className="px-4 sm:px-6 lg:px-10 py-8 sm:py-12 bg-stone">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">Collections</p>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mt-1">Clothes by style</h2>
            </div>
            <Link to="/products" className="text-xs sm:text-sm font-semibold text-ink/70 hover:text-forest transition-colors shrink-0">
              View all →
            </Link>
          </div>

          <div
            ref={categoryRailRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-rail pb-2 -mx-1 px-1"
          >
            {displayCategories.map((c, i) => {
              const thumb =
                c.slug.includes('african') ? SAMPLE_IMAGES.african
                : c.slug.includes('ankara') ? SAMPLE_IMAGES.dress
                : c.slug.includes('modern') ? SAMPLE_IMAGES.modern
                : c.slug.includes('women') ? SAMPLE_IMAGES.dress
                : c.slug.includes('men') ? SAMPLE_IMAGES.casual
                : c.slug.includes('kids') ? SAMPLE_IMAGES.kids
                : c.slug.includes('formal') ? SAMPLE_IMAGES.formal
                : SAMPLE_IMAGES.street;
              return (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="group snap-start shrink-0 w-[42%] xs:w-[38%] sm:w-[148px] md:w-[160px] rounded-xl overflow-hidden bg-white border border-ink/5 hover:border-forest/30 hover:shadow-md transition-all"
                >
                  <div className="aspect-[4/3] bg-stone overflow-hidden">
                    <img
                      src={thumb}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES.placeholder; }}
                    />
                  </div>
                  <div className="px-2 py-2 sm:px-2.5 sm:py-2.5">
                    <p className="font-display text-[11px] sm:text-sm text-ink leading-snug line-clamp-2 group-hover:text-forest transition-colors">
                      {c.name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section id="featured" className="px-4 sm:px-6 lg:px-10 py-8 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">New & noted</p>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mt-1">Featured clothes</h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-white px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-forest transition-colors self-start"
            >
              Full collection
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {featured.map((product, i) => (
              <div key={product.id} className="animate-reveal" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by category rows */}
      <section className="px-4 sm:px-6 lg:px-10 py-8 sm:py-12 bg-stone space-y-10 sm:space-y-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">Shop by category</p>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mt-1">Browse the wardrobe</h2>
          </div>

          <div className="space-y-9 sm:space-y-12">
            {displayCategories.map((cat) => {
              const fromApi = products.filter((p) =>
                p.category === cat.name || p.category === cat.slug
              );
              const catProducts = (fromApi.length >= 4
                ? fromApi.slice(0, 8)
                : getDemoProducts(cat.slug).slice(0, 8)) as Product[];

              return (
                <div key={cat.id} className="space-y-3 sm:space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="font-display text-lg sm:text-xl text-ink">{cat.name}</h3>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-forest hover:text-ink shrink-0"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-rail pb-1 -mx-1 px-1">
                    {catProducts.map((product, i) => (
                      <div
                        key={product.id}
                        className="w-[calc(50%-4px)] sm:w-[200px] md:w-[220px] snap-start shrink-0 animate-slide-in-x"
                        style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Split story */}
      <section className="grid md:grid-cols-2 min-h-[420px]">
        <div
          className="relative min-h-[240px] md:min-h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${SAMPLE_IMAGES.african}')`,
          }}
        >
          <div className="absolute inset-0 bg-ink/40" />
          <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-10 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Heritage</p>
            <h3 className="font-display text-2xl sm:text-3xl mt-2">African traditional</h3>
            <Link to="/products?category=african-traditional" className="mt-4 text-sm font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white">
              Explore pieces
            </Link>
          </div>
        </div>
        <div
          className="relative min-h-[240px] md:min-h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${SAMPLE_IMAGES.modern}')`,
          }}
        >
          <div className="absolute inset-0 bg-forest/50" />
          <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-10 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Now</p>
            <h3 className="font-display text-2xl sm:text-3xl mt-2">Modern everyday</h3>
            <Link to="/products?category=modern-casual" className="mt-4 text-sm font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white">
              Shop modern
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
