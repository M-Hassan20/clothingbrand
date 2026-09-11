import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './stores/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PageConfigManager from './pages/PageConfigManager';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Discounts from './pages/Discounts';
import Reviews from './pages/Reviews';
import Blog from './pages/Blog';
import Inventory from './pages/Inventory';
import Newsletter from './pages/Newsletter';
import { Toaster } from 'sonner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="config" element={<PageConfigManager />} />
            <Route path="homepage" element={<PageConfigManager />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="blog" element={<Blog />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="newsletter" element={<Newsletter />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton duration={1400} />
    </AuthProvider>
  </StrictMode>
);
