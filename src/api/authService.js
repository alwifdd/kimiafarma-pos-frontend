import apiClient from "./apiClient";

/**
 * Memanggil API backend untuk login.
 * @param {string} username - Username kasir/admin
 * @param {string} password - Password kasir/admin
 * @returns {Promise<object>} Data respons dari server (termasuk token dan user)
 */
export const login = async (username, password) => {
  try {
    // 1. Panggil endpoint /auth/login di backend
    const response = await apiClient.post("/auth/login", {
      username,
      password,
    });

    // 2. Jika login berhasil, simpan token dan data user
    if (response.data && response.data.token) {
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

    // 3. Kembalikan data respons
    return response.data;
  } catch (error) {
    // 4. Jika gagal, lempar error agar halaman login bisa menanganinya
    // Kita cek jika ada pesan error dari server, jika tidak, lempar error umum
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Login gagal");
    }
    throw new Error("Tidak dapat terhubung ke server.");
  }
};

/**
 * Fungsi untuk logout
 */
export const logout = () => {
  // Hapus token dan data user dari localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Fungsi helper untuk mendapatkan data user yang sedang login
 */
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
};
