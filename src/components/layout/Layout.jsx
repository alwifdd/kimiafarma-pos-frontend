import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout, getCurrentUser } from "../../api/authService";
import { FaBell } from "react-icons/fa"; // Impor ikon notifikasi

/**
 * Komponen layout utama (Sidebar + Navbar + Konten)
 */
const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLinkClass = (path) => {
    return location.pathname === path
      ? "block px-4 py-2 rounded-md bg-indigo-600 text-white"
      : "block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  return (
    // ==================================================================
    // --- PERBAIKAN SCROLL ---
    // 'h-screen' (tinggi tetap 1 layar)
    // 'overflow-hidden' (container utama tidak bisa di-scroll)
    // ==================================================================
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* --- Sidebar (Sekarang akan tetap) --- */}
      <div className="w-64 bg-gray-800 text-white flex flex-col shadow-lg">
        {/* ================================================================== */}
        {/* --- PERUBAHAN LOGO DI SINI --- */}
        {/* Kita ganti jadi flex horizontal, logo di kiri, teks di kanan */}
        <div className="p-5 border-b border-gray-700 flex items-center space-x-3">
          {/* 1. Logo */}
          <img
            src="/kimiafarma.png" // Mengambil dari folder /public/kimiafarma.png
            alt="Logo KF"
            className="h-10 w-auto" // Tinggi 40px, lebar otomatis
            onError={(e) => {
              e.target.style.display = "none";
            }} // Sembunyikan jika logo gagal dimuat
          />

          {/* 2. Teks */}
          <div>
            {/* Ukuran font disesuaikan agar rapi */}
            <div className="text-base font-bold text-white">KF POS</div>
            <div className="text-sm text-indigo-300">
              {user?.branchName || "Cabang Pusat"}
            </div>
          </div>
        </div>
        {/* --- AKHIR PERUBAHAN LOGO --- */}
        {/* ================================================================== */}

        {/* 'flex-1' akan mendorong div logout ke bawah 
          (FIX) 'overflow-y-auto' agar menu bisa scroll jika panjang
        */}
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <Link to="/" className={getLinkClass("/")}>
            Dashboard Order
          </Link>
          <Link to="/products" className={getLinkClass("/products")}>
            Produk & Stok
          </Link>
        </nav>

        {/* Ini akan 'terdorong' ke bawah dan tetap di sana */}
        <div className="p-5 border-t border-gray-700">
          <p className="text-sm text-gray-400">Selamat Datang,</p>
          <p className="font-medium truncate">{user?.username || "Kasir"}</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 mt-4 font-medium text-left text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>

      {/* --- Konten Utama (Area Sebelah Kanan) --- */}
      {/* (FIX) 'overflow-hidden' agar container kanan tidak scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- NAVBAR ATAS (Tetap) --- */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 shrink-0">
          <div className="flex justify-between items-center">
            {/* Judul Halaman (bisa dibuat dinamis nanti) */}
            <h1 className="text-xl font-semibold text-gray-800">
              {user?.branchName || user?.username || "Dashboard"}
            </h1>

            {/* Ikon Aksi Kanan */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <FaBell className="w-5 h-5" />
              </button>
              {/* Tambahkan tombol lain di sini jika perlu */}
            </div>
          </div>
        </header>

        {/* --- Konten Halaman (children) --- */}
        {/* KUNCI SCROLL: 'flex-1' dan 'overflow-auto' 
            membuat HANYA <main> ini yang bisa di-scroll
        */}
        <main className="flex-1 overflow-auto">
          {/* children adalah DashboardPage, ProductsPage, dll. */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
