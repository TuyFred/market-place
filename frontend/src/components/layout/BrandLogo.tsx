import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

type Props = {
  to?: string;
  className?: string;
  size?: 'nav' | 'hero';
};

export function BrandLogo({ to = '/', className = '', size = 'nav' }: Props) {
  const isHero = size === 'hero';

  const content = (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-black font-display font-bold tracking-wide text-white ${
          isHero ? 'h-11 w-11 text-sm sm:h-12 sm:w-12 sm:text-base' : 'h-8 w-8 text-[10px] sm:h-9 sm:w-9 sm:text-[11px]'
        }`}
        aria-hidden
      >
        {BRAND.initials}
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={`block truncate font-display font-bold uppercase tracking-[0.14em] text-black ${
            isHero ? 'text-xl sm:text-2xl md:text-3xl' : 'text-[13px] sm:text-[15px]'
          }`}
        >
          {BRAND.shortName}
        </span>
        <span
          className={`mt-0.5 block font-semibold uppercase tracking-[0.2em] text-neutral-500 ${
            isHero ? 'text-[11px] sm:text-xs' : 'text-[8px] sm:text-[9px]'
          }`}
        >
          {BRAND.byline}
        </span>
      </span>
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="shrink-0 hover:opacity-80 transition-opacity" aria-label={BRAND.name}>
      {content}
    </Link>
  );
}
