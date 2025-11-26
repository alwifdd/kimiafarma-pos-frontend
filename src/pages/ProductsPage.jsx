// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "../api/authService";
import { getInventoryByBranch } from "../api/inventoryService";
import { getAllBranches } from "../api/branchService";

// Komponen UI
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { FaSearch, FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";

/**
 * Halaman Manajemen Produk & Stok.
 * Fitur: Filter Cabang (Superadmin/BM), Cari Produk, Status Stok Warna-warni.
 */
const ProductsPage = () => {
  // --- STATE ---
  const [items, setItems] = useState([]); // Data asli dari API
  const [filteredItems, setFilteredItems] = useState([]); // Data setelah difilter search
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState(null);

  const user = getCurrentUser();

  // --- LOGIKA PENGAMBILAN DATA ---

  // 1. Ambil Inventaris berdasarkan Branch ID
  const fetchInventory = useCallback(async (branchId) => {
    if (!branchId) {
      setItems([]);
      setFilteredItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryByBranch(branchId);

      // Mapping data agar struktur lebih datar (flat)
      const formattedData = data.map((inv) => ({
        id: inv.products.product_id,
        name: inv.products.product_name,
        price: inv.products.price, // Harga DB (asumsi sudah Rupiah normal)
        stock: inv.opname_stock || 0,
        category: inv.products.grab_category_id || "-",
        sku: inv.products.product_id,
      }));

      setItems(formattedData);
      setFilteredItems(formattedData); // Init filtered data
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data inventaris. Pastikan cabang memiliki data.");
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Load Data Awal (Cabang) saat komponen di-mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Jika Super Admin / Bisnis Manager -> Load daftar cabang
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
      }
      // Jika Admin Cabang -> Langsung load inventaris cabangnya
      else if (user.role === "admin_cabang" && user.branchId) {
        fetchInventory(user.branchId);
      }
    };
    loadInitialData();
  }, [user.role, user.branchId, fetchInventory]);

  // --- LOGIKA FILTER & PENCARIAN ---

  // Handler ganti cabang (Dropdown)
  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue);
    setSearchTerm(""); // Reset pencarian saat ganti cabang
    if (newValue) {
      fetchInventory(newValue.branch_id);
    } else {
      setItems([]);
      setFilteredItems([]);
    }
  };

  // Handler pencarian produk (Search Bar)
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term)
      );
      setFilteredItems(filtered);
    }
  };

  // Helper warna badge stok
  const getStockBadgeClass = (stock) => {
    if (stock === 0) return "bg-red-100 text-red-800 border border-red-200";
    if (stock < 10)
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    return "bg-green-100 text-green-800 border border-green-200";
  };

  // --- RENDER TAMPILAN ---
  return (
    <div className="p-6 min-h-full bg-gray-50/50">
      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stok & Produk</h1>
        <p className="text-gray-500 mt-1">
          Pantau ketersediaan obat di apotek Anda
        </p>
      </div>

      {/* --- AREA FILTER ATAS --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
        {/* 1. Dropdown Pilih Cabang (Hanya Superadmin/BM) */}
        {(user.role === "superadmin" || user.role === "bisnis_manager") && (
          <div className="w-full lg:w-1/3">
            <Autocomplete
              id="branch-select"
              options={branches}
              loading={loadingBranches}
              value={selectedBranch}
              onChange={handleBranchChange}
              getOptionLabel={(option) =>
                `${option.branch_name} (${option.kota})`
              }
              isOptionEqualToValue={(option, value) =>
                option.branch_id === value.branch_id
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Apotek / Cabang"
                  size="small"
                  placeholder="Cari nama cabang..."
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
            />
          </div>
        )}

        {/* Info Admin Cabang */}
        {user.role === "admin_cabang" && (
          <div className="flex items-center text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <FaBoxOpen className="mr-2" />
            <span className="font-medium">Lokasi: {user.branchName}</span>
          </div>
        )}

        {/* 2. Search Bar Produk */}
        <div className="w-full lg:w-1/3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama obat atau SKU..."
            value={searchTerm}
            onChange={handleSearch}
            disabled={loading || items.length === 0}
            className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 transition-colors"
          />
        </div>
      </div>

      {/* --- KONTEN TABEL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* State Loading */}
        {loading && (
          <div className="flex flex-col justify-center items-center h-64">
            <CircularProgress size={40} className="text-indigo-600" />
            <p className="mt-3 text-gray-500 animate-pulse">
              Mengambil data stok...
            </p>
          </div>
        )}

        {/* State Error */}
        {!loading && error && (
          <div className="flex flex-col justify-center items-center h-64 text-red-500 bg-red-50">
            <FaExclamationTriangle className="text-3xl mb-2" />
            <p>{error}</p>
          </div>
        )}

        {/* State Kosong (Belum pilih cabang) */}
        {!loading &&
          !error &&
          !selectedBranch &&
          items.length === 0 &&
          user.role !== "admin_cabang" && (
            <div className="flex flex-col justify-center items-center h-64 text-gray-400">
              <FaBoxOpen className="text-4xl mb-2 opacity-50" />
              <p>Silakan pilih cabang terlebih dahulu untuk melihat data.</p>
            </div>
          )}

        {/* Tabel Data */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    SKU / ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Harga Satuan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                      {item.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockBadgeClass(
                          item.stock
                        )}`}
                      >
                        {item.stock === 0
                          ? "Habis"
                          : item.stock < 10
                          ? "Menipis"
                          : "Tersedia"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* State Tidak Ditemukan (Search Result 0) */}
        {!loading &&
          !error &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Tidak ditemukan produk dengan kata kunci "{searchTerm}"</p>
            </div>
          )}

        {/* State Inventaris Kosong (Data Branch 0) */}
        {!loading && !error && selectedBranch && items.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>Cabang ini belum memiliki data inventaris.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
