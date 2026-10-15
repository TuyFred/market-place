import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthRedirect } from './pages/AuthRedirect';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth roles={['admin', 'manager']}>
            <AdminDashboardPage />
          </RequireAuth>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthRedirect mode="login" />} />
        <Route path="/register" element={<AuthRedirect mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route
          path="/customer/dashboard"
          element={
            <RequireAuth>
              <CustomerDashboardPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}