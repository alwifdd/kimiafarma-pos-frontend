import axios from "axios";

// 1. Buat instance Axios dengan baseURL ke backend kita
const apiClient = axios.create({
  baseURL: ""https://kf-backend-api.vercel.app/api"", // <-- URL API backend Anda
});

// 2. Buat Interceptor (Middleware untuk Frontend)
// Ini akan "mencegat" setiap request dan otomatis menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // Jika ada token, tambahkan ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Jika ada error saat request, tolak promise-nya
    return Promise.reject(error);
  }
);

export default apiClient;
