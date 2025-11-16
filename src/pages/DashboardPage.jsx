import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
// (UPDATE) Impor service yang baru dan yang diubah
import {
  getAllOrders, // <-- Service ini sudah di-upgrade
  // getOrdersByStatus, // <-- Dihapus, kita filter di frontend
  acceptOrder,
  rejectOrder,
  markOrderReady,
} from "../api/orderService";
import {
  getAllBranches, // <-- (BARU) Untuk filter BM
  getListBMs, // <-- (BARU) Untuk filter Superadmin
  getBranchesByArea, // <-- (BARU) Untuk filter Superadmin
} from "../api/branchService";
import { getCurrentUser } from "../api/authService"; // <-- (BARU) Untuk cek role

import OrderCard from "../components/common/OrderCard";
import OverviewStatCard from "../components/common/OverviewStatCard";
// Impor ikon-ikon
import { FaWallet, FaBox, FaCheckCircle, FaSpinner } from "react-icons/fa";

// (BARU) Impor komponen filter dari MUI (seperti di ProductsPage)
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
// (FIX) Impor komponen Modal pengganti alert/confirm
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

// --- DEFINISI VARIABEL (Tidak Berubah) ---
const TAB_CONFIG = [
  { label: "All Order", apiKey: "ALL", color: "border-gray-600 text-gray-700" },
  {
    label: "Incoming Order",
    apiKey: "INCOMING",
    color: "border-indigo-600 text-indigo-600",
  },
  {
    label: "Order Being Prepared",
    apiKey: "PREPARING",
    color: "border-yellow-600 text-yellow-600",
  },
  {
    label: "Ready for Pickup",
    apiKey: "READY_FOR_PICKUP",
    color: "border-blue-600 text-blue-600",
  },
  {
    label: "Order In Delivery",
    apiKey: "COLLECTED",
    color: "border-purple-600 text-purple-600",
  },
  {
    label: "Order Completed",
    apiKey: "DELIVERED",
    color: "border-green-600 text-green-600",
  },
  {
    label: "Cancellation",
    apiKey: "CANCELLED",
    color: "border-red-600 text-red-600",
  },
];

const cardColors = {
  ALL: { bgColor: "bg-gray-100", textColor: "text-gray-700" },
  INCOMING: { bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
  PREPARING: { bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  READY_FOR_PICKUP: { bgColor: "bg-blue-100", textColor: "text-blue-700" },
  COLLECTED: { bgColor: "bg-purple-100", textColor: "text-purple-700" },
  DELIVERED: { bgColor: "bg-green-100", textColor: "text-green-700" },
  CANCELLED: { bgColor: "bg-red-100", textColor: "text-red-800" },
};

const STATUS_COLORS = {
  INCOMING: "bg-indigo-100 text-indigo-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  READY_FOR_PICKUP: "bg-blue-100 text-blue-800",
  COLLECTED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

// --- KOMPONEN INTERNAL (Tidak Berubah) ---
const StatusCard = ({ title, count, bgColor, textColor }) => {
  return (
    <div className={`p-4 rounded-lg ${bgColor}`}>
      <p className={`text-sm font-medium ${textColor}`}>{title}</p>
      <p className={`text-3xl font-bold mt-1 ${textColor}`}>{count}</p>
    </div>
  );
};

const SimpleOrderCard = ({ order }) => {
  const items = order.grab_payload_raw?.items || [];
  const colorClass = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800";
  const orderTotal = order.grab_payload_raw?.price?.total || 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 break-words">
          Order: {order.grab_order_id}
        </h3>
        <p className="text-sm text-gray-500">
          Masuk: {new Date(order.created_at).toLocaleString()}
        </p>
        <span
          className={`mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}
        >
          {order.status}
        </span>
      </div>
      <div className="p-5 h-36 overflow-y-auto flex-grow">
        <h4 className="font-semibold mb-2 text-gray-700">Detail Item:</h4>
        <ul className="list-disc pl-5 space-y-2 text-gray-800 text-sm">
          {items.map((item, index) => (
            <li key={index}>
              <span className="font-medium">{item.quantity}x</span> {item.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-5 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-2xl font-bold text-gray-900">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(orderTotal)}
        </p>
      </div>
    </div>
  );
};

const PreparingOrderCard = ({ order, onMarkReady }) => {
  const items = order.grab_payload_raw?.items || [];
  const orderTotal = order.grab_payload_raw?.price?.total || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 break-words">
          Order: {order.grab_order_id}
        </h3>
        <p className="text-sm text-gray-500">
          Masuk: {new Date(order.created_at).toLocaleString()}
        </p>
        <span className="mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
          {order.status}
        </span>
      </div>
      <div className="p-5 h-48 overflow-y-auto flex-grow">
        <h4 className="font-semibold mb-2 text-gray-700">Detail Item:</h4>
        <ul className="list-disc pl-5 space-y-2 text-gray-800 text-sm">
          {items.map((item, index) => (
            <li key={index}>
              <span className="font-medium">{item.quantity}x</span> {item.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(orderTotal)}
          </p>
        </div>
        <button
          onClick={() => onMarkReady(order.grab_order_id)}
          className="w-full px-4 py-3 font-semibold text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Siap Dijemput
        </button>
      </div>
    </div>
  );
};

/* =====================================================
  (BARU) KOMPONEN INTERNAL UNTUK FILTER DROPDOWN
=====================================================
*/
const DashboardFilters = ({ user, onFilterChange }) => {
  // State untuk data dropdown
  const [bmList, setBmList] = useState([]);
  const [branchList, setBranchList] = useState([]);

  // State untuk nilai yang dipilih
  const [selectedBM, setSelectedBM] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // State loading untuk dropdown
  const [loadingBMs, setLoadingBMs] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Efek untuk memuat data dropdown saat komponen pertama kali muncul
  useEffect(() => {
    const loadFilterData = async () => {
      if (user.role === "superadmin") {
        setLoadingBMs(true);
        try {
          const bms = await getListBMs();
          setBmList(bms);
        } catch (err) {
          console.error("Gagal memuat daftar BM:", err);
        } finally {
          setLoadingBMs(false);
        }
      } else if (user.role === "bisnis_manager") {
        setLoadingBranches(true);
        try {
          const branches = await getAllBranches(); // API ini otomatis filter by area BM
          setBranchList(branches);
        } catch (err) {
          console.error("Gagal memuat daftar cabang BM:", err);
        } finally {
          setLoadingBranches(false);
        }
      }
    };
    loadFilterData();
  }, [user.role]);

  // Handler untuk Superadmin: saat memilih BM
  const handleBMChange = async (event, newValue) => {
    setSelectedBM(newValue);
    setSelectedBranch(null); // Reset pilihan cabang
    setBranchList([]); // Kosongkan daftar cabang

    if (newValue) {
      // Jika BM dipilih, ambil cabang di areanya
      setLoadingBranches(true);
      try {
        const branches = await getBranchesByArea(newValue.area_kota);
        setBranchList(branches);
      } catch (err) {
        console.error("Gagal memuat cabang berdasarkan area:", err);
      } finally {
        setLoadingBranches(false);
      }
      // Kirim filter ke parent (berdasarkan area BM)
      onFilterChange({ filter_area_kota: newValue.area_kota });
    } else {
      // Jika BM di-reset, kirim filter kosong
      onFilterChange({});
    }
  };

  // Handler untuk Superadmin/BM: saat memilih Cabang
  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue);

    if (newValue) {
      // Jika cabang dipilih, filter berdasarkan ID cabang
      onFilterChange({ filter_branch_id: newValue.branch_id });
    } else {
      // Jika cabang di-reset:
      if (user.role === "superadmin" && selectedBM) {
        // Superadmin: kembali ke filter area BM
        onFilterChange({ filter_area_kota: selectedBM.area_kota });
      } else {
        // BM atau Superadmin (tanpa BM): kembali ke filter default (kosong)
        onFilterChange({});
      }
    }
  };

  // --- Render Tampilan Filter ---
  if (user.role === "admin_cabang") {
    return null; // Admin cabang tidak bisa filter
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-lg flex flex-wrap gap-4 items-center">
      <h2 className="text-lg font-semibold text-gray-800 shrink-0">
        Filter Data:
      </h2>

      {/* === FILTER SUPER ADMIN === */}
      {user.role === "superadmin" && (
        <>
          <Autocomplete
            id="bm-select"
            options={bmList}
            loading={loadingBMs}
            value={selectedBM}
            onChange={handleBMChange}
            getOptionLabel={(option) =>
              `BM: ${option.username} (${option.area_kota})`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="1. Pilih Bisnis Manager"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingBMs ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            style={{ minWidth: "300px" }}
          />
          <Autocomplete
            id="branch-select-sa"
            options={branchList}
            loading={loadingBranches}
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={!selectedBM} // <-- Hanya aktif jika BM sudah dipilih
            getOptionLabel={(option) =>
              // (FIX) Menambahkan kota
              `${option.branch_name} - ${option.kota} (ID: ${option.branch_id})`
            }
            isOptionEqualToValue={(option, value) =>
              option.branch_id === value.branch_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="2. (Opsional) Pilih Apotek"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingBranches ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            style={{ minWidth: "300px" }}
          />
        </>
      )}

      {/* === FILTER BISNIS MANAGER === */}
      {user.role === "bisnis_manager" && (
        <Autocomplete
          id="branch-select-bm"
          options={branchList}
          loading={loadingBranches}
          value={selectedBranch}
          onChange={handleBranchChange}
          getOptionLabel={(option) =>
            // (FIX) Menambahkan kota, sama seperti di ProductsPage
            `${option.branch_name} - ${option.kota} (ID: ${option.branch_id})`
          }
          isOptionEqualToValue={(option, value) =>
            option.branch_id === value.branch_id
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Pilih Apotek (Opsional)"
              size="small"
              helperText="Kosongkan untuk melihat semua apotek di area Anda"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingBranches ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          style={{ minWidth: "300px" }}
        />
      )}
    </div>
  );
};

// --- KOMPONEN UTAMA ---
const DashboardPage = () => {
  // (BARU) Ambil data user, bungkus dengan useMemo agar tidak re-render
  const user = useMemo(() => getCurrentUser(), []);

  // --- (UPDATE) States ---
  const [allOrders, setAllOrders] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [readyForPickupOrders, setReadyForPickupOrders] = useState([]);
  const [collectedOrders, setCollectedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");

  // (BARU) State untuk menyimpan filter yang dipilih
  const [activeFilters, setActiveFilters] = useState({});

  // (FIX) State untuk Modal Konfirmasi (menggantikan alert/confirm)
  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: () => {},
  });

  // (FIX) State untuk Notifikasi Error (menggantikan alert)
  const [errorToast, setErrorToast] = useState({ open: false, message: "" });

  /* =====================================================
    (FIX) LOGIKA BARU PENGAMBILAN DATA (FIX BUG FILTER)
  =====================================================
  */

  // (FIX) Gunakan ref untuk menyimpan filter terbaru untuk interval
  // Ini memastikan interval selalu mendapat filter terbaru tanpa trigger re-render
  const filtersRef = useRef(activeFilters);
  useEffect(() => {
    filtersRef.current = activeFilters;
  }, [activeFilters]);

  // (FIX) Buat fungsi fetchOrders yang stabil (tanpa dependensi)
  // Ini akan dipanggil oleh interval dan oleh filter change
  const fetchOrders = useCallback(
    async (filtersToFetch, showLoading = true) => {
      if (showLoading) {
        setLoading(true); // Hanya set loading jika dipicu manual (bukan interval)
      }
      setError(null);
      try {
        const allData = await getAllOrders(filtersToFetch);

        setAllOrders(allData);
        setIncomingOrders(allData.filter((o) => o.status === "INCOMING"));
        setPreparingOrders(allData.filter((o) => o.status === "PREPARING"));
        setReadyForPickupOrders(
          allData.filter((o) => o.status === "READY_FOR_PICKUP")
        );
        setCollectedOrders(allData.filter((o) => o.status === "COLLECTED"));
        setDeliveredOrders(allData.filter((o) => o.status === "DELIVERED"));
        // (FIX) Gabungkan CANCELLED dan REJECTED
        setCancelledOrders(
          allData.filter(
            (o) => o.status === "CANCELLED" || o.status === "REJECTED"
          )
        );
      } catch (err) {
        setError("Gagal mengambil data pesanan.");
        console.error(err);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  ); // <-- Dependensi kosong, fungsi ini stabil

  // (FIX) Buat Effect terpisah untuk memanggil data saat filter berubah
  useEffect(() => {
    console.log("Filter berubah, memuat ulang data:", activeFilters);
    fetchOrders(activeFilters, true); // true = tunjukkan loading spinner
  }, [activeFilters, fetchOrders]); // <-- Akan jalan saat activeFilters berubah

  // (FIX) Buat Effect terpisah untuk interval (hanya jalan sekali)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(
        "Interval refresh, fetching dengan filter:",
        filtersRef.current
      );
      // Panggil API di background tanpa set loading (showLoading = false)
      getAllOrders(filtersRef.current)
        .then((allData) => {
          setAllOrders(allData);
          setIncomingOrders(allData.filter((o) => o.status === "INCOMING"));
          setPreparingOrders(allData.filter((o) => o.status === "PREPARING"));
          setReadyForPickupOrders(
            allData.filter((o) => o.status === "READY_FOR_PICKUP")
          );
          setCollectedOrders(allData.filter((o) => o.status === "COLLECTED"));
          setDeliveredOrders(allData.filter((o) => o.status === "DELIVERED"));
          setCancelledOrders(
            allData.filter(
              (o) => o.status === "CANCELLED" || o.status === "REJECTED"
            )
          );
        })
        .catch((err) => {
          console.error("Gagal refresh interval:", err);
          // Tampilkan error toast jika gagal refresh
          setErrorToast({
            open: true,
            message: "Gagal refresh data otomatis.",
          });
        });
    }, 30000); // refresh tiap 30 detik

    return () => clearInterval(interval);
  }, []); // <-- Dependensi kosong, hanya jalan sekali saat mount

  // (BARU) Handler saat komponen filter berubah
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    // Saat filter berubah, data akan otomatis di-fetch ulang oleh useEffect di atas
  };

  // --- Handlers (FIX - Menggunakan Modal) ---
  const handleCloseModal = () => {
    setModal({ ...modal, open: false });
  };

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setErrorToast({ ...errorToast, open: false });
  };

  const handleAccept = async (grabOrderId) => {
    setModal({
      open: true,
      title: "Terima Pesanan?",
      content: `Anda yakin ingin menerima pesanan ${grabOrderId}? Stok akan dikurangi.`,
      onConfirm: async () => {
        try {
          await acceptOrder(grabOrderId);
          fetchOrders(activeFilters, false); // Panggil ulang (tanpa loading)
        } catch (err) {
          setErrorToast({
            open: true,
            message: `Gagal menerima pesanan: ${err.message}`,
          });
        }
        handleCloseModal();
      },
    });
  };

  const handleReject = async (grabOrderId) => {
    setModal({
      open: true,
      title: "Tolak Pesanan?",
      content: `Anda yakin ingin menolak pesanan ${grabOrderId}?`,
      onConfirm: async () => {
        try {
          await rejectOrder(grabOrderId);
          fetchOrders(activeFilters, false); // Panggil ulang (tanpa loading)
        } catch (err) {
          setErrorToast({
            open: true,
            message: `Gagal menolak pesanan: ${err.message}`,
          });
        }
        handleCloseModal();
      },
    });
  };

  const handleMarkReady = async (grabOrderId) => {
    setModal({
      open: true,
      title: "Tandai Siap?",
      content: `Anda yakin ingin menandai pesanan ${grabOrderId} siap dijemput?`,
      onConfirm: async () => {
        try {
          await markOrderReady(grabOrderId);
          fetchOrders(activeFilters, false); // Panggil ulang (tanpa loading)
        } catch (err) {
          setErrorToast({
            open: true,
            message: `Gagal menandai siap: ${err.message}`,
          });
        }
        handleCloseModal();
      },
    });
  };

  // --- Helper (Tidak Berubah) ---
  const ordersByTab = {
    ALL: allOrders,
    INCOMING: incomingOrders,
    PREPARING: preparingOrders,
    READY_FOR_PICKUP: readyForPickupOrders,
    COLLECTED: collectedOrders,
    DELIVERED: deliveredOrders,
    CANCELLED: cancelledOrders,
  };

  const displayedOrders = useMemo(
    () => ordersByTab[activeTab] || [],
    [
      activeTab,
      allOrders,
      incomingOrders,
      preparingOrders,
      readyForPickupOrders,
      collectedOrders,
      deliveredOrders,
      cancelledOrders,
    ]
  );

  const getTabClass = (tabConfig) => {
    const isActive = activeTab === tabConfig.apiKey;
    if (isActive) {
      return `pb-2 border-b-2 font-semibold ${tabConfig.color}`;
    } else {
      return "pb-2 border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700";
    }
  };

  // --- Logika Statistik (Tidak Berubah) ---
  const totalRevenue = useMemo(() => {
    const revenue = deliveredOrders.reduce((acc, order) => {
      const orderTotal = order.grab_payload_raw?.price?.total || 0;
      return acc + orderTotal;
    }, 0);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(revenue);
  }, [deliveredOrders]);

  const totalOrdersToday = allOrders.length;
  const completedToday = deliveredOrders.length;
  const activeOrders = preparingOrders.length + readyForPickupOrders.length;

  // --- Fungsi Download CSV (FIX - ganti alert) ---
  const handleDownloadCSV = () => {
    if (displayedOrders.length === 0) {
      setErrorToast({
        open: true,
        message: "Tidak ada data untuk di-download.",
      });
      return;
    }
    const headers = [
      "Order ID",
      "Status",
      "Total (Rp)",
      "Waktu Masuk",
      "Items",
    ];
    const rows = displayedOrders.map((order) => {
      const orderId = order.grab_order_id || "N/A";
      const status = order.status || "N/A";
      const total = order.grab_payload_raw?.price?.total || 0;
      const time = new Date(order.created_at).toLocaleString("id-ID");
      const items = (order.grab_payload_raw?.items || [])
        .map((item) => `"${item.quantity}x ${item.name.replace(/"/g, '""')}"`)
        .join("; ");
      return [orderId, status, total, time, items].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Render ---
  return (
    <div className="p-6 min-h-full">
      {/* --- Section Header & Overview (Tidak Berubah) --- */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-500">
              Real-time statistics and insights
            </p>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Download CSV Report
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <OverviewStatCard
            title="Total Revenue"
            value={totalRevenue}
            detail="From completed orders"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            icon={<FaWallet />}
          />
          <OverviewStatCard
            title="Total Orders Today"
            value={totalOrdersToday}
            detail="All order statuses"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            icon={<FaBox />}
          />
          <OverviewStatCard
            title="Completed Orders"
            value={completedToday}
            detail={`${
              totalOrdersToday > 0
                ? Math.round((completedToday / totalOrdersToday) * 100)
                : 0
            }% completion rate`}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            icon={<FaCheckCircle />}
          />
          <OverviewStatCard
            title="Active Orders"
            value={activeOrders}
            detail="Preparing + Ready for Pickup"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            icon={<FaSpinner />}
          />
        </div>
      </section>

      {/* =====================================================
        (BARU) TAMPILKAN KOMPONEN FILTER DI SINI
      =====================================================
      */}
      <DashboardFilters user={user} onFilterChange={handleFilterChange} />

      {/* --- Order Status Breakdown (Tidak Berubah) --- */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Order Status Breakdown
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {TAB_CONFIG.map((tab) => {
              const colors = cardColors[tab.apiKey] || cardColors.ALL;
              return (
                <StatusCard
                  key={tab.apiKey}
                  title={tab.label}
                  count={ordersByTab[tab.apiKey]?.length || 0}
                  bgColor={colors.bgColor}
                  textColor={colors.textColor}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Navigasi TAB FILTER (Tidak Berubah) --- */}
      <nav className="flex space-x-6 border-b border-gray-200 mb-6 bg-white p-4 rounded-lg shadow overflow-x-auto">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.apiKey}
            onClick={() => setActiveTab(tab.apiKey)}
            className={`text-sm md:text-base flex-shrink-0 ${getTabClass(tab)}`}
          >
            {tab.label} ({ordersByTab[tab.apiKey]?.length || 0})
          </button>
        ))}
      </nav>

      {/* --- Bagian Search (Tidak Berubah) --- */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by Order ID"
          className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Search
        </button>
      </div>

      {/* --- Daftar Pesanan (Tidak Berubah) --- */}
      <section>
        <p className="text-gray-600 mb-4">
          Showing {displayedOrders.length} Results
        </p>

        {/* (UPDATE) Tampilkan loading spinner jika sedang loading */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <CircularProgress size={60} />
            <p className="ml-4 text-lg text-gray-600">Memuat data pesanan...</p>
          </div>
        )}

        {!loading && error && (
          <p className="text-red-500 text-center">{error}</p>
        )}

        {!loading && displayedOrders.length === 0 && !error && (
          <p className="text-gray-500 text-center">
            Tidak ada pesanan untuk status atau filter ini.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading &&
            !error &&
            activeTab === "INCOMING" &&
            displayedOrders.map((order, index) => (
              <OrderCard
                key={order.grab_order_id || index}
                order={order}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}

          {!loading &&
            !error &&
            activeTab === "PREPARING" &&
            displayedOrders.map((order, index) => (
              <PreparingOrderCard
                key={order.grab_order_id || index}
                order={order}
                onMarkReady={handleMarkReady}
              />
            ))}

          {!loading &&
            !error &&
            activeTab !== "INCOMING" &&
            activeTab !== "PREPARING" &&
            displayedOrders.map((order, index) => (
              <SimpleOrderCard
                key={order.grab_order_id || index}
                order={order}
              />
            ))}
        </div>
      </section>

      {/* (FIX) Modal Konfirmasi */}
      <Dialog open={modal.open} onClose={handleCloseModal}>
        <DialogTitle>{modal.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{modal.content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Batal
          </Button>
          <Button onClick={modal.onConfirm} color="primary" autoFocus>
            Ya, Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* (FIX) Toast Notifikasi Error (menggunakan Dialog sederhana) */}
      <Dialog open={errorToast.open} onClose={handleCloseToast}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorToast.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseToast} color="primary" autoFocus>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
