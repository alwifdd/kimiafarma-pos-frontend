import React, { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "../api/authService";
import { getInventoryByBranch } from "../api/inventoryService";
import { getAllBranches } from "../api/branchService"; // Ini akan difilter otomatis oleh backend

// Impor komponen Autocomplete dan TextField dari MUI
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Halaman untuk menampilkan produk & stok.
 * - Super Admin: Bisa cari dari SEMUA cabang.
 * - Bisnis Manager: Bisa cari dari cabang di AREANYA.
 * - Admin Cabang: Langsung melihat stok cabangnya.
 */
const ProductsPage = () => {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [loading, setLoading] = useState(false); // Loading untuk tabel
  const [loadingBranches, setLoadingBranches] = useState(false); // Loading untuk dropdown
  const [error, setError] = useState(null);

  const user = getCurrentUser();

  // --- Fungsi untuk mengambil data INVENTARIS ---
  const fetchInventory = useCallback(async (branchId) => {
    if (!branchId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryByBranch(branchId);
      setItems(
        data.map((inv) => ({
          ...inv.products,
          stock: inv.opname_stock,
        }))
      );
    } catch (err) {
      setError("Gagal memuat data inventaris untuk cabang ini.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Efek Utama saat Halaman Dibuka ---
  useEffect(() => {
    const loadInitialData = async () => {
      // Alur untuk Super Admin dan Bisnis Manager sekarang SAMA
      // Perbedaannya ditangani oleh backend
      if (user.role === "superadmin" || user.role === "bisnis_manager") {
        try {
          setLoadingBranches(true);
          const branchData = await getAllBranches();
          setBranches(branchData);
        } catch (err) {
          setError("Gagal memuat daftar cabang.");
        } finally {
          setLoadingBranches(false);
        }
      } else if (user.role === "admin_cabang" && user.branchId) {
        // Alur Admin Cabang (tidak berubah)
        fetchInventory(user.branchId);
      }
    };
    loadInitialData();
  }, [user.role, user.branchId, fetchInventory]);

  // --- Handler saat Super Admin/BM memilih cabang ---
  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue);
    if (newValue) {
      fetchInventory(newValue.branch_id);
    } else {
      setItems([]);
    }
  };

  return (
    <div className="p-6 min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Manajemen Produk & Stok
      </h1>

      {/* --- Kotak Pencarian Cabang (untuk Super Admin & Bisnis Manager) --- */}
      {(user.role === "superadmin" || user.role === "bisnis_manager") && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cari dan Pilih Cabang untuk Dilihat Stoknya:
          </label>
          <Autocomplete
            id="branch-select"
            options={branches}
            loading={loadingBranches}
            value={selectedBranch}
            onChange={handleBranchChange}
            // Tampilkan ID agar unik
            getOptionLabel={(option) =>
              `${option.branch_name} - ${option.kota} (ID: ${option.branch_id})`
            }
            isOptionEqualToValue={(option, value) =>
              option.branch_id === value.branch_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ketik nama apotek, kota, atau ID..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingBranches ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            className="w-full max-w-lg"
          />
        </div>
      )}

      {/* --- Info untuk Admin Cabang --- */}
      {user.role === "admin_cabang" && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <p className="text-lg font-semibold text-gray-900">
            Menampilkan Stok untuk: {user.branchName}
          </p>
        </div>
      )}

      {/* --- Bagian Konten (Tabel Inventaris) --- */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading && <p>Memuat data stok...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && items.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nama Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID Produk / SKU
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Harga
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stok Saat Ini
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.product_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      Rp {item.price?.toLocaleString("id-ID")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.stock > 10
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pesan jika tidak ada data */}
        {!loading && items.length === 0 && selectedBranch && (
          <p className="text-gray-500">
            Tidak ada data inventaris untuk cabang ini.
          </p>
        )}
        {!loading &&
          !selectedBranch &&
          (user.role === "superadmin" || user.role === "bisnis_manager") && (
            <p className="text-gray-500">
              Silakan pilih cabang di atas untuk melihat stok.
            </p>
          )}
      </div>
    </div>
  );
};

export default ProductsPage;
