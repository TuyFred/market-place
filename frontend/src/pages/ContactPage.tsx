import { BRAND } from '../config/brand';

export function ContactPage() {
  return (
    <section className="bg-white text-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-16 lg:px-10">
        <h1 className="text-[1.75rem] font-bold tracking-tight sm:text-4xl md:text-5xl">Contact</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:mt-4 sm:text-base">
          Questions about orders, custom pieces, or sizing? Reach out — we usually reply within a day.
        </p>

        <div className="mt-8 space-y-5 text-[15px] sm:mt-10 sm:space-y-4 sm:text-sm">
          <p>
            <span className="text-neutral-500">Email</span>
            <br />
            <a
              href={BRAND.social.email}
              className="break-all underline underline-offset-2 hover:opacity-60"
            >
              {BRAND.social.email.replace('mailto:', '')}
            </a>
          </p>
          <p>
            <span className="text-neutral-500">WhatsApp</span>
            <br />
            <a
              href={BRAND.social.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:opacity-60"
            >
              Message us
            </a>
          </p>
          <p>
            <span className="text-neutral-500">Instagram</span>
            <br />
            <a
              href={BRAND.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:opacity-60"
            >
              @{BRAND.shortName.toLowerCase()}
            </a>
          </p>
          <p className="pt-1 text-neutral-500">{BRAND.location}</p>
        </div>
      </div>
    </section>
  );
}
