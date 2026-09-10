import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

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
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Set global axios base URL from Vite env var. In production set VITE_API_URL
// (e.g. https://market-place-z0w0.onrender.com) in Vercel environment variables.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/';

