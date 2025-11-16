import apiClient from "./apiClient";

/**
 * (UPDATE) Mengambil semua pesanan (membutuhkan token).
 * Backend akan otomatis memfilter berdasarkan role/cabang.
 *
 * (BARU) Sekarang menerima objek filter dinamis.
 * @param {object} filters - Objek filter, cth: { filter_branch_id: 123, filter_area_kota: "Ambon" }
 * @returns {Promise<Array>} Daftar pesanan
 */
export const getAllOrders = async (filters = {}) => {
  try {
    // (BARU) Buat query string dari objek filter
    const params = new URLSearchParams();
    if (filters.filter_branch_id) {
      params.append("filter_branch_id", filters.filter_branch_id);
    }
    if (filters.filter_area_kota) {
      params.append("filter_area_kota", filters.filter_area_kota);
    }

    // (BARU) Jika ada query, tambahkan '?' di depannya
    const queryString = params.toString() ? `?${params.toString()}` : "";

    // (UPDATE) Panggil API dengan query string filter
    const response = await apiClient.get(`/orders${queryString}`);
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    throw error;
  }
};

/**
 * (DIHAPUS) Fungsi ini tidak lagi digunakan.
 * Logika pemisahan status akan dilakukan di frontend (DashboardPage.jsx)
 * setelah memanggil getAllOrders() satu kali.
 */
// export const getOrdersByStatus = async (status) => { ... };

/**
 * Memanggil API backend untuk menerima pesanan (INCOMING -> PREPARING).
 * @param {string} grabOrderId - ID pesanan dari Grab
 * @returns {Promise<object>} Data pesanan yang sudah di-update
 */
export const acceptOrder = async (grabOrderId) => {
  try {
    const response = await apiClient.post(`/orders/${grabOrderId}/accept`);
    return response.data;
  } catch (error) {
    console.error(`Gagal menerima pesanan ${grabOrderId}:`, error);
    // Lempar pesan error dari backend agar bisa ditangkap UI
    throw new Error(error.response?.data?.message || "Gagal menerima pesanan");
  }
};

/**
 * Memanggil API backend untuk menolak pesanan (INCOMING -> REJECTED).
 * @param {string} grabOrderId - ID pesanan dari Grab
 * @returns {Promise<object>} Data pesanan yang sudah di-update
 */
export const rejectOrder = async (grabOrderId) => {
  try {
    const response = await apiClient.post(`/orders/${grabOrderId}/reject`);
    return response.data;
  } catch (error) {
    console.error(`Gagal menolak pesanan ${grabOrderId}:`, error);
    throw new Error(error.response?.data?.message || "Gagal menolak pesanan");
  }
};

/**
 * Memanggil API backend untuk menandai pesanan siap (PREPARING -> READY_FOR_PICKUP).
 * @param {string} grabOrderId - ID pesanan dari Grab
 * @returns {Promise<object>} Data respons
 */
export const markOrderReady = async (grabOrderId) => {
  try {
    const response = await apiClient.post(`/orders/${grabOrderId}/ready`);
    return response.data;
  } catch (error) {
    console.error(`Gagal menandai pesanan ${grabOrderId} siap:`, error);
    throw new Error(error.response?.data?.message || "Gagal menandai pesanan");
  }
};

/**
 * Memanggil API backend untuk membatalkan pesanan.
 * @param {string} grabOrderId - ID pesanan dari Grab
 * @param {string} cancelCode - Kode alasan pembatalan (cth: "1001")
 * @returns {Promise<object>} Data respons
 */
export const cancelOrder = async (grabOrderId, cancelCode) => {
  try {
    const response = await apiClient.post(`/orders/${grabOrderId}/cancel`, {
      cancelCode,
    });
    return response.data;
  } catch (error) {
    console.error(`Gagal membatalkan pesanan ${grabOrderId}:`, error);
    throw new Error(
      error.response?.data?.message || "Gagal membatalkan pesanan"
    );
  }
};

// (Opsional) Fungsi untuk mengecek kelayakan pembatalan
export const checkCancellation = async (grabOrderId) => {
  try {
    const response = await apiClient.get(`/orders/${grabOrderId}/cancelable`);
    return response.data; // Akan berisi { cancelAble: true, reasons: [...] }
  } catch (error) {
    console.error(`Gagal mengecek pembatalan ${grabOrderId}:`, error);
    throw new Error(
      error.response?.data?.message || "Gagal mengecek pembatalan"
    );
  }
};
