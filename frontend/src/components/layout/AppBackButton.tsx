import { useNavigate } from 'react-router-dom';

type Props = {
  /** In-app destination (never rely on browser back / search-engine history). */
  to?: string;
  label?: string;
  className?: string;
};

/**
 * Secure in-app back control. Always navigates to a known route with replace
 * optional — avoids Chrome history.back() which can revive expired sessions.
 */
export function AppBackButton({ to = '/', label = 'Back', className = '' }: Props) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={
        className ||
        'inline-flex min-h-[40px] items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition hover:text-black'
      }
      aria-label={label}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
