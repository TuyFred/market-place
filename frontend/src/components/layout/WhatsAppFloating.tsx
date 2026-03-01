import { useEffect, useState } from 'react';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

export function WhatsAppFloating() {
  const [digits, setDigits] = useState('');

  useEffect(() => {
    setDigits(WHATSAPP_NUMBER.replace(/\D/g, ''));
  }, []);

  if (!digits) return null;

  const message = encodeURIComponent('Hello! I have a question about your products.');
  const url = `https://wa.me/${digits}?text=${message}`;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="fixed right-4 bottom-6 z-50">
      <div className="w-14 h-14 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.52 3.48A11.9 11.9 0 0012 0C5.373 0 .001 5.373.001 12c0 2.11.553 4.07 1.604 5.81L0 24l6.44-1.667A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.21-1.25-6.14-3.48-8.52z" fill="#fff"/>
        </svg>
      </div>
    </a>
  );
}
