// src/api/inventoryService.js
import apiClient from "./apiClient";

/**
 * [Admin Cabang] Mengambil stok inventaris untuk cabang tertentu.
 * @param {string} branchId - ID cabang yang sedang login
 */
export const getInventoryByBranch = async (branchId) => {
  try {
    // Memanggil GET /api/inventory/:branch_id
    const response = await apiClient.get(`/inventory/${branchId}`);
    return response.data.data; // Sesuai controller, data ada di 'response.data.data'
  } catch (error) {
    console.error("Gagal mengambil inventaris cabang:", error);
    throw error;
  }
};
