import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

/**
 * Komponen ini mengatur semua Rute (URL) di aplikasi Anda.
 */
function App() {
  return (
    <Routes>
      {/* Rute 1: Halaman Login (Publik) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rute 2: Halaman Utama / Dashboard (Diproteksi) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Rute 3: Halaman Produk (Diproteksi) */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* (Anda bisa tambahkan rute lain di sini) */}
    </Routes>
  );
}

export default App;
