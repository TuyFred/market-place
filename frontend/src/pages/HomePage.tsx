import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        setCategoriesList(cats);
        const map: Record<string, string> = {};
        cats.forEach((c) => { map[c.slug] = c.name; });
        const mapped = (pRes.data || []).map((p) => ({ ...p, category: map[p.category] || p.category }));
        setProducts(mapped.slice(0, 6));
        setHeroVideoUrl(sRes.data.hero_video_url || '');
      })
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        <div className="flex items-baseline gap-2">
          <span>Explore Ass Marketplace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-soft"></span>
        </div>
        <div className="hidden xs:flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-slate-900">37</span>
            <span className="font-bold opacity-60">Weekly Orders</span>
          </div>
        </div>
      </header>

      <section className="flex flex-col lg:flex-row gap-6 items-start animate-reveal">
        {/* Category Sidebar */}
        <aside className="w-full lg:w-[260px] shrink-0 animate-reveal animation-delay-200">
          <div className="flex flex-col gap-6 rounded-[2rem] bg-white border border-slate-100 p-6 shadow-sm">
            <div className="hidden lg:block space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-slate-900">Collections</p>
              <p className="text-[10px] text-slate-400 font-medium">Curated for your lifestyle.</p>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide text-[11px] font-bold whitespace-nowrap lg:whitespace-normal">
              <button className="flex items-center gap-2 lg:justify-between rounded-xl bg-slate-900 text-white px-4 lg:px-3 py-2.5 shrink-0 shadow-lg shadow-slate-900/10">
                <span>View All Drops</span>
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md hidden lg:inline">
                  NEW
                </span>
              </button>
              {categoriesList.map(c => (
                <a
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="rounded-xl px-4 lg:px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0 transition-colors"
                >
                  {c.name}
                </a>
              ))}
              {!categoriesList.length && (
                <>
                  <button className="rounded-xl px-4 lg:px-3 py-2.5 text-slate-500 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Clothing & Shoes</button>
                  <button className="rounded-xl px-4 lg:px-3 py-2.5 text-slate-500 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Luxury Bags</button>
                  <button className="rounded-xl px-4 lg:px-3 py-2.5 text-slate-500 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Electronics</button>
                </>
              )}
            </nav>
          </div>
        </aside>

        <div className="flex-1 w-full space-y-4">
          <div className="grid xl:grid-cols-[1.5fr,1fr] gap-6">
            <div className={`rounded-[3rem] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] p-8 sm:p-12 flex shadow-2xl shadow-slate-200/50 min-h-[400px] relative overflow-hidden ${heroVideoUrl ? 'flex-col md:flex-row gap-8 items-center justify-between' : 'flex-col justify-center'}`}>

              <div className="relative z-10 space-y-6 max-w-xl w-full flex flex-col justify-center flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[10px] font-black text-orange-600 uppercase tracking-widest self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Up to 50% Off Collection
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-900 leading-[0.95] tracking-tight animate-reveal">
                  Premium <br /> Apparel <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600">for All Styles.</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 max-w-md leading-relaxed animate-reveal animation-delay-200">
                  Discover the latest arrivals in women's and children's apparel. Minimalist style, maximum comfort, and unparalleled quality.
                </p>
                <div className="pt-4 flex flex-wrap gap-4 animate-reveal animation-delay-400">
                  <a href="/products" className="btn-premium-primary shimmer-on-hover">
                    Shop Collection
                  </a>
                  <a href="#featured" className="btn-premium-secondary shimmer-on-hover">
                    View Favorites
                  </a>
                </div>
              </div>

              {heroVideoUrl && (
                <div className="relative z-10 w-full md:w-[42%] flex items-center justify-center h-full max-h-[300px] md:max-h-full shrink-0">
                  <div className="relative w-full aspect-square md:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/50 transform hover:scale-[1.02] transition-all duration-700 group bg-slate-100 ring-1 ring-slate-900/5">
                    {/* Floating Badge */}
                    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Live Preview</span>
                    </div>
                    <video
                      ref={videoRef}
                      src={heroVideoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

                    {/* ── Volume Control Overlay ── */}
                    <div
                      className="absolute bottom-3 right-3 flex items-center gap-2 z-20"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      {/* Volume slider – slides out to the left */}
                      <div
                        className={`flex items-center overflow-hidden rounded-full bg-black/40 backdrop-blur-md transition-all duration-300 ${showVolumeSlider ? 'w-24 px-2 opacity-100' : 'w-0 px-0 opacity-0'}`}
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-full h-1 accent-white cursor-pointer appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                          aria-label="Volume"
                        />
                      </div>

                      {/* Mute / Unmute button */}
                      <button
                        onClick={toggleMute}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all active:scale-90 shadow-lg"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          /* Speaker off icon */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                        ) : (
                          /* Speaker on icon */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Abstract decorative elements for premium feel */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 animate-reveal animation-delay-400">
              <div className="rounded-[2rem] bg-amber-50 p-6 shadow-sm flex flex-col justify-center h-32 sm:h-auto xl:h-40 group cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-900/5 border border-amber-100 flex-1 shimmer-on-hover">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">New Arrivals</p>
                  <p className="text-base font-black text-slate-900 group-hover:translate-x-1 transition-transform">
                    Casual & Warm <br /> Season Layers
                  </p>
                </div>
              </div>
              <div className="rounded-[2rem] bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-center h-32 sm:h-auto xl:h-40 group cursor-pointer transition-all hover:shadow-xl hover:shadow-slate-900/5 flex-1 shimmer-on-hover">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Minimalist</p>
                  <p className="text-base font-black text-slate-900 group-hover:translate-x-1 transition-transform">
                    Modern Essentials <br /> for Her
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section id="featured" className="space-y-6 pt-12">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Curated Catalog
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best sellers this month</p>
                </div>
              </div>
              <a
                href="/products"
                className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-900 hover:bg-slate-200 transition-all active:scale-95"
              >
                Full Collection
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                ([
                  { id: 'demo-1', name: 'Striped Cotton Tee', price: 12.99, category: 'Children Clothes', description: 'Soft striped tee for everyday play', imageUrl: '' },
                  { id: 'demo-2', name: 'Floral Dress', price: 24.5, category: 'Women Clothes', description: 'Lightweight seasonal dress', imageUrl: '' },
                  { id: 'demo-3', name: 'Comfy Joggers', price: 18.0, category: 'Children Clothes', description: 'Stretchy and durable joggers', imageUrl: '' },
                ] as Product[]).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

