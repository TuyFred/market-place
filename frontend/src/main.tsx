import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CheckoutProvider } from './context/CheckoutContext';

// Same-origin `/api` by default (Vercel rewrite → Render). Avoids CORS on www.afroluxo.com.
// Set VITE_API_URL only when there is no proxy (e.g. direct API host).
const configuredApi = (import.meta.env.VITE_API_URL || '').trim();
axios.defaults.baseURL = configuredApi || '/';

// Quiet expected empty/demo misses in production network noise
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = String(err?.config?.url || '');
    if (err?.response?.status === 404 && /\/api\/(settings|products\/demo-)/.test(url)) {
      return Promise.resolve({ data: url.includes('settings') ? {} : null, status: 404, config: err.config, headers: {}, statusText: 'Not Found' });
    }
    return Promise.reject(err);
  }
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
  </React.StrictMode>
);