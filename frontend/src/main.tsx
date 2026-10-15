import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CheckoutProvider } from './context/CheckoutContext';
import { clearAuthStorage, hardRedirectHome, isProtectedPath } from './utils/session';

// Same-origin `/api` by default (Vercel rewrite → Render). Avoids CORS on www.afroluxo.com.
const configuredApi = (import.meta.env.VITE_API_URL || '').trim();
axios.defaults.baseURL = configuredApi || '/';

axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = String(err?.config?.url || '');
    const status = err?.response?.status;
    if (status === 404 && /\/api\/(settings|products\/demo-)/.test(url)) {
      return Promise.resolve({
        data: url.includes('settings') ? {} : null,
        status: 404,
        config: err.config,
        headers: {},
        statusText: 'Not Found',
      });
    }
    // Expired / missing session — never leave a protected UI open
    if (status === 401) {
      const isAuthCall = /\/api\/auth\/(login|register)/.test(url);
      if (!isAuthCall && isProtectedPath(window.location.pathname)) {
        clearAuthStorage();
        hardRedirectHome('sessionExpired');
      }
    }
    return Promise.reject(err);
  },
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <CartProvider>
          <CheckoutProvider>
            <App />
          </CheckoutProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
