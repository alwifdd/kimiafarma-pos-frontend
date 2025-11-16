import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

/**
 * Komponen ini bertindak sebagai "satpam".
 * Ia memeriksa apakah ada token login yang valid dan belum kedaluwarsa.
 * Jika tidak, ia akan mengarahkan pengguna ke halaman /login.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // 1. Jika TIDAK ADA token, tendang ke /login
    return <Navigate to="/login" replace />;
  }

  try {
    // 2. Cek apakah token sudah KEDALUWARSA
    const decodedToken = jwtDecode(token);
    const isExpired = decodedToken.exp * 1000 < Date.now();

    if (isExpired) {
      console.log("Token kedaluwarsa, membersihkan...");
      localStorage.removeItem("token"); // Hapus token basi
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // 3. Jika token TIDAK VALID (rusak/omong kosong)
    console.log("Token tidak valid, membersihkan...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // 4. Jika semua aman (ada token & valid), tampilkan halaman yang diminta
  return children;
};

export default ProtectedRoute;
