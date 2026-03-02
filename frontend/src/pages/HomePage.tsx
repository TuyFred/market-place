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
      <header className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Ass Market Place Explore
          </span>
        </div>
        <div className="hidden xs:flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-900">
              37
            </span>
            <span>orders last 7 days</span>
          </div>
        </div>
      </header>

      <section className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Category Sidebar/Top Bar */}
        <aside className="w-full lg:w-[260px] shrink-0">
          <div className="flex flex-col gap-4 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm">
            <div className="hidden lg:block space-y-1">
              <p className="text-sm font-semibold text-slate-900">Explore</p>
              <p className="text-[11px] text-slate-500">Popular products and new drops.</p>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide text-xs whitespace-nowrap lg:whitespace-normal">
              <button className="flex items-center gap-2 lg:justify-between rounded-2xl bg-slate-900 text-white px-4 lg:px-3 py-2 shrink-0">
                <span>Explore new</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full hidden lg:inline">
                  Kids & women
                </span>
              </button>
              {categoriesList.map(c => (
                <a
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="rounded-2xl px-4 lg:px-3 py-2 text-slate-700 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0"
                >
                  {c.name}
                </a>
              ))}
              {!categoriesList.length && (
                <>
                  <button className="rounded-2xl px-4 lg:px-3 py-2 text-slate-700 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Clothing and shoes</button>
                  <button className="rounded-2xl px-4 lg:px-3 py-2 text-slate-700 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Small bags</button>
                  <button className="rounded-2xl px-4 lg:px-3 py-2 text-slate-700 hover:bg-slate-50 border border-slate-100 lg:border-none shrink-0">Electronics</button>
                </>
              )}
            </nav>
          </div>
        </aside>

        <div className="flex-1 w-full space-y-4">
          <div className="grid xl:grid-cols-[1.5fr,1fr] gap-4">
            <div className={`rounded-[2.5rem] bg-gradient-to-br from-[#fef3c7] via-[#fce7f3] to-[#e0f2fe] p-6 sm:p-8 flex shadow-sm min-h-[300px] sm:min-h-[340px] relative overflow-hidden ${heroVideoUrl ? 'flex-col md:flex-row gap-8 items-center justify-between' : 'flex-col justify-center'}`}>

              <div className="relative z-10 space-y-4 max-w-lg w-full flex flex-col justify-center flex-1">
                <p className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] opacity-80">
                  SPECIAL OFFER · GET UP TO 50% OFF
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  Premium Fashion <br className="hidden sm:block" />
                  for Everyone.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md font-medium leading-relaxed opacity-90">
                  Discover the latest arrivals in women's and children's apparel. Minimalist style, maximum comfort.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href="/products"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 sm:px-8 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 border-b-2 border-slate-700 w-full sm:w-auto text-center"
                  >
                    Shop Collection
                  </a>
                  <a
                    href="#featured"
                    className="inline-flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md px-6 sm:px-8 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-white transition-all hover:-translate-y-1 active:scale-95 border border-slate-100 w-full sm:w-auto text-center"
                  >
                    View Favorites
                  </a>
                </div>
              </div>

              {heroVideoUrl && (
                <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center h-full max-h-[250px] md:max-h-full shrink-0">
                  <div className="relative w-full h-full aspect-video md:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/80 transform hover:scale-[1.02] transition-transform duration-500 group bg-slate-100">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              <div className="rounded-[1.5rem] bg-[#fef3c7] p-5 shadow-sm flex flex-col justify-center h-28 sm:h-auto xl:h-32 group cursor-pointer transition-all hover:shadow-md border border-orange-200/50">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">New Drop</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 group-hover:translate-x-1 transition-transform">
                    Casual & Warm Layers
                  </p>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-white border border-slate-100 p-5 shadow-sm flex flex-col justify-center h-28 sm:h-auto xl:h-32 group cursor-pointer transition-all hover:shadow-md">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bold Style</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 group-hover:translate-x-1 transition-transform">
                    Modern Essentials
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section id="featured" className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Curated Selection
                </h2>
                <p className="text-[10px] text-slate-500 font-medium lowercase">Our most popular pieces right now</p>
              </div>
              <a
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold text-slate-900 hover:bg-slate-200 transition-colors"
              >
                View Catalog
                <span>→</span>
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

