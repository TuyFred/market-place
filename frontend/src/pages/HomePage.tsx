import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Product, ProductCard } from '../components/products/ProductCard';
import { DEMO_PRODUCTS } from '../config/brand';

type AvailabilityFilter = 'all' | 'in_stock' | 'sold_out';
type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'name_asc';
type GridCols = 2 | 4;

function withDemoStock(products: Product[]): Product[] {
  return products.map((p, i) => {
    const stock = p.stock ?? (i % 5 === 3 || i % 5 === 4 ? 0 : 12);
    const onSale = i % 4 === 1 && stock > 0;
    return {
      ...p,
      stock,
      compareAtPrice: p.compareAtPrice ?? (onSale ? Math.round(p.price * 1.18) : undefined),
    };
  });
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [priceOpen, setPriceOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>('featured');
  const [gridCols, setGridCols] = useState<GridCols>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 4 : 2,
  );

  useEffect(() => {
    axios
      .get<Product[]>('/api/products')
      .then((res) => {
        const mapped = (res.data || []).map((p) => ({ ...p }));
        setProducts(mapped.length ? mapped : withDemoStock(DEMO_PRODUCTS as Product[]));
      })
      .catch(() => {
        setProducts(withDemoStock(DEMO_PRODUCTS as Product[]));
      });
  }, []);

  const priceCeiling = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.price)) : 0),
    [products],
  );

  const list = useMemo(() => {
    let next = [...products];

    if (availability === 'in_stock') {
      next = next.filter((p) => (p.stock ?? 1) > 0);
    } else if (availability === 'sold_out') {
      next = next.filter((p) => (p.stock ?? 1) <= 0);
    }

    if (maxPrice != null) {
      next = next.filter((p) => p.price <= maxPrice);
    }

    if (sort === 'price_asc') next.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') next.sort((a, b) => b.price - a.price);
    else if (sort === 'name_asc') next.sort((a, b) => a.name.localeCompare(b.name));

    return next.slice(0, 20);
  }, [products, availability, maxPrice, sort]);

  const closeMenus = () => {
    setAvailOpen(false);
    setPriceOpen(false);
    setSortOpen(false);
  };

  const gridClass =
    gridCols === 2
      ? 'grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3';

  return (
    <section className="bg-white text-black" onClick={closeMenus}>
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-5 sm:pb-8 lg:px-10">
        <div className="flex flex-col gap-2 border-b border-neutral-200 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-3">
          <div
            className="flex items-center gap-4 overflow-x-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAvailOpen((v) => !v);
                  setPriceOpen(false);
                  setSortOpen(false);
                }}
                className="inline-flex shrink-0 min-h-[44px] items-center gap-1.5 text-[13px] text-black touch-manipulation sm:text-sm"
              >
                Availability
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {availOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-44 border border-neutral-200 bg-white py-2 shadow-lg">
                  {(
                    [
                      ['all', 'All'],
                      ['in_stock', 'In stock'],
                      ['sold_out', 'Sold out'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setAvailability(value);
                        setAvailOpen(false);
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-sm touch-manipulation hover:bg-neutral-50 ${
                        availability === value ? 'font-medium' : ''
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPriceOpen((v) => !v);
                  setAvailOpen(false);
                  setSortOpen(false);
                }}
                className="inline-flex shrink-0 min-h-[44px] items-center gap-1.5 text-[13px] text-black touch-manipulation sm:text-sm"
              >
                Price
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {priceOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-52 max-w-[calc(100vw-2rem)] border border-neutral-200 bg-white py-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(null);
                      setPriceOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm touch-manipulation hover:bg-neutral-50 ${maxPrice == null ? 'font-medium' : ''}`}
                  >
                    All prices
                  </button>
                  {[0.25, 0.5, 0.75].map((ratio) => {
                    const value = Math.round(priceCeiling * ratio);
                    if (!value) return null;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          setMaxPrice(value);
                          setPriceOpen(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm touch-manipulation hover:bg-neutral-50 ${
                          maxPrice === value ? 'font-medium' : ''
                        }`}
                      >
                        Under {value.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-between gap-2 sm:justify-end sm:gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="shrink-0 text-[13px] text-neutral-600 sm:text-sm">
              {list.length} item{list.length === 1 ? '' : 's'}
            </span>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSortOpen((v) => !v);
                    setAvailOpen(false);
                    setPriceOpen(false);
                  }}
                  className="inline-flex shrink-0 min-h-[44px] items-center gap-1.5 text-[13px] text-black touch-manipulation sm:text-sm"
                >
                  Sort
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 max-w-[calc(100vw-2rem)] border border-neutral-200 bg-white py-2 shadow-lg">
                    {(
                      [
                        ['featured', 'Featured'],
                        ['price_asc', 'Price, low to high'],
                        ['price_desc', 'Price, high to low'],
                        ['name_asc', 'Alphabetically, A–Z'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value);
                          setSortOpen(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm touch-manipulation hover:bg-neutral-50 ${
                          sort === value ? 'font-medium' : ''
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGridCols(2)}
                  aria-label="2-column grid"
                  className={`inline-flex h-9 w-9 items-center justify-center touch-manipulation ${
                    gridCols === 2 ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" />
                    <rect x="9" y="1" width="6" height="6" />
                    <rect x="1" y="9" width="6" height="6" />
                    <rect x="9" y="9" width="6" height="6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setGridCols(4)}
                  aria-label="4-column grid"
                  className={`inline-flex h-9 w-9 items-center justify-center touch-manipulation ${
                    gridCols === 4 ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="3" height="3" />
                    <rect x="6.5" y="1" width="3" height="3" />
                    <rect x="12" y="1" width="3" height="3" />
                    <rect x="1" y="6.5" width="3" height="3" />
                    <rect x="6.5" y="6.5" width="3" height="3" />
                    <rect x="12" y="6.5" width="3" height="3" />
                    <rect x="1" y="12" width="3" height="3" />
                    <rect x="6.5" y="12" width="3" height="3" />
                    <rect x="12" y="12" width="3" height="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-4 sm:mt-8 ${gridClass}`}>
          {list.map((product) => (
            <div key={product.id} className="min-w-0">
              <ProductCard product={product} variant="shop" />
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">No products match these filters.</p>
        )}
      </div>
    </section>
  );
}
