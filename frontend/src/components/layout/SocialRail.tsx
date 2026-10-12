import { useEffect, useRef, useState } from 'react';
import { BRAND } from '../../config/brand';

const icons = {
  instagram: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  ),
  whatsapp: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.52 3.48A11.9 11.9 0 0012 0C5.373 0 0 5.373 0 12a11.9 11.9 0 001.6 5.81L0 24l6.39-1.67A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.21-1.25-6.14-3.48-8.52zM12 21.5a9.46 9.46 0 01-4.82-1.31l-.35-.21-3.56.93.95-3.47-.23-.36A9.45 9.45 0 012.5 12C2.5 6.76 6.76 2.5 12 2.5S21.5 6.76 21.5 12 17.24 21.5 12 21.5zm5.2-6.64c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.63.14-.19.28-.72.91-.88 1.1-.16.18-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.92-.16-.28-.02-.43.12-.57.13-.12.28-.33.42-.49.14-.16.19-.28.28-.46.1-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 .2.72 2.15c.14.28 1.98 3.02 4.8 4.24.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.66-.68 1.89-1.33.23-.65.23-1.21.16-1.33-.07-.11-.25-.18-.53-.32z" />
    </svg>
  ),
  email: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  facebook: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.174 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  tiktok: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86 4.48V13.3a8.16 8.16 0 005.58 2.15V12a4.84 4.84 0 01-2.99-1.05 4.84 4.84 0 002.99-4.26z" />
    </svg>
  ),
};

const links = [
  { key: 'instagram' as const, label: 'Instagram', href: BRAND.social.instagram },
  { key: 'whatsapp' as const, label: 'WhatsApp', href: BRAND.social.whatsapp },
  { key: 'email' as const, label: 'Email', href: BRAND.social.email },
  { key: 'facebook' as const, label: 'Facebook', href: BRAND.social.facebook },
  { key: 'tiktok' as const, label: 'TikTok', href: BRAND.social.tiktok },
];

/** Collapsed by default — tap blue share to reveal social icons */
export function SocialRail() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed right-3 sm:right-5 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] sm:bottom-28 z-40 flex flex-col items-center gap-2"
    >
      <div
        className={`flex flex-col items-center gap-2 transition-all duration-300 origin-bottom ${
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-3 scale-90 pointer-events-none h-0 overflow-hidden'
        }`}
        aria-hidden={!open}
      >
        {links.map((item) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            title={item.label}
            aria-label={item.label}
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md shadow-blue-500/30 hover:bg-[#0f65d8] transition-all"
          >
            {icons[item.key]}
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Hide social links' : 'Show social links'}
        className={`inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full shadow-lg shadow-blue-500/25 border transition-all active:scale-95 ${
          open
            ? 'bg-[#0f65d8] text-white border-[#0f65d8]'
            : 'bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#0f65d8]'
        }`}
      >
        {open ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
      </button>
    </div>
  );
}