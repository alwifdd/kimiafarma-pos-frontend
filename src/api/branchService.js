// src/api/branchService.js
import apiClient from "./apiClient";

/**
 * [Super Admin / BM] Mengambil daftar cabang.
 * Backend otomatis filter untuk BM.
 */
export const getAllBranches = async () => {
  try {
    // Memanggil GET /api/branches
    const response = await apiClient.get("/branches");
    return response.data; // Controller-mu mengirim data langsung
  } catch (error) {
    console.error("Gagal mengambil daftar cabang:", error);
    throw error;
  }
};

/* =====================================================
  TAMBAHAN BARU UNTUK FILTER SUPERADMIN
=====================================================
*/

/**
 * [BARU] [Super Admin] Mengambil daftar semua Bisnis Manager.
 */
export const getListBMs = async () => {
  try {
    const response = await apiClient.get("/branches/list-bms");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil daftar BM:", error);
    throw error;
  }
};

/**
 * [BARU] [Super Admin] Mengambil daftar cabang berdasarkan area (kota).
 * @param {string} area - Nama kota, cth: "Ambon"
 */
export const getBranchesByArea = async (area) => {
  try {
    // Memanggil GET /api/branches/by-area?area=Ambon
    const response = await apiClient.get(`/branches/by-area?area=${area}`);
    return response.data;
  } catch (error) {
    console.error(`Gagal mengambil cabang untuk area ${area}:`, error);
    throw error;
  }
};
