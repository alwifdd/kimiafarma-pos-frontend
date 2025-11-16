// src/api/productService.js
import apiClient from "./apiClient";

/**
 * [Super Admin] Mengambil SEMUA daftar master produk.
 */
export const getAllProducts = async () => {
  try {
    // Memanggil GET /api/products
    const response = await apiClient.get("/products");
    return response.data.data; // Sesuai controller, data ada di 'response.data.data'
  } catch (error) {
    console.error("Gagal mengambil semua produk:", error);
    throw error;
  }
};
