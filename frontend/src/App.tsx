import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      {/* admin dashboard uses its own full-screen layout */}
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

      {/* public pages wrapped in Layout (Navbar + Footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
      </Route>
    </Routes>
  );
}
