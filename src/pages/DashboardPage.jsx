// src/pages/DashboardPage.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  getAllOrders,
  acceptOrder,
  rejectOrder,
  markOrderReady,
} from "../api/orderService";
import {
  getAllBranches,
  getListBMs,
  getBranchesByArea,
} from "../api/branchService";
import { getCurrentUser } from "../api/authService";

import OrderCard from "../components/common/OrderCard";
import OverviewStatCard from "../components/common/OverviewStatCard";
// Tambah FaTimesCircle untuk ikon Cancel
import {
  FaWallet,
  FaBox,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaDownload,
} from "react-icons/fa";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

// --- DEFINISI VARIABEL ---
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

const STATUS_COLORS = {
  INCOMING: "bg-indigo-100 text-indigo-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  READY_FOR_PICKUP: "bg-blue-100 text-blue-800",
  COLLECTED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

// --- HELPER LOGIKA HARGA ---
const calculateDisplayTotal = (order) => {
  const payload = order.grab_payload_raw || {};
  const items = payload.items || [];
  const priceData = payload.price || {};

  let rawPrice =
    priceData.total || priceData.eaterPayment || priceData.subtotal || 0;

  if (rawPrice === 0 && items.length > 0) {
    rawPrice = items.reduce((sum, item) => {
      const itemPrice = item.price || 1500000;
      return sum + itemPrice * item.quantity;
    }, 0);
  }
  return rawPrice / 100;
};

// --- KOMPONEN KARTU ---
const SimpleOrderCard = ({ order }) => {
  const payload = order.grab_payload_raw || {};
  const items = payload.items || [];
  const colorClass = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800";
  const displayTotal = calculateDisplayTotal(order);
  const displayID =
    payload.shortOrderNumber || order.grab_order_id?.slice(-6) || "ID";

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 break-words">
          #{displayID}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(order.created_at).toLocaleString("id-ID")}
        </p>
        <span
          className={`mt-2 inline-block text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}
        >
          {order.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="p-5 h-36 overflow-y-auto flex-grow bg-gray-50/50">
        <ul className="space-y-2 text-gray-800 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="font-bold bg-white px-2 rounded border border-gray-200 h-fit">
                {item.quantity}x
              </span>
              <span>{item.name || `Item Simulator #${index + 1}`}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-5 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
        <p className="text-xl font-extrabold text-gray-900">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(displayTotal)}
        </p>
      </div>
    </div>
  );
};

const PreparingOrderCard = ({ order, onMarkReady }) => {
  const payload = order.grab_payload_raw || {};
  const items = payload.items || [];
  const displayTotal = calculateDisplayTotal(order);
  const displayID =
    payload.shortOrderNumber || order.grab_order_id?.slice(-6) || "ID";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border-l-4 border-yellow-400">
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">#{displayID}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleString("id-ID")}
            </p>
          </div>
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
            SEDANG DISIAPKAN
          </span>
        </div>
      </div>
      <div className="p-5 h-48 overflow-y-auto flex-grow bg-yellow-50/30">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
          Detail Item:
        </h4>
        <ul className="space-y-3 text-gray-800 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 items-start">
              <span className="font-bold bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                {item.quantity}x
              </span>
              <span className="font-medium pt-1">
                {item.name || `Item Simulator #${index + 1}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 bg-white border-t border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-500">Total</p>
          <p className="text-xl font-extrabold text-gray-900">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(displayTotal)}
          </p>
        </div>
        <button
          onClick={() => onMarkReady(order.grab_order_id)}
          className="w-full px-4 py-3 font-bold text-sm text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          ✅ Tandai Siap Dijemput
        </button>
      </div>
    </div>
  );
};

// --- KOMPONEN FILTER ---
const DashboardFilters = ({ user, onFilterChange }) => {
  const [bmList, setBmList] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [selectedBM, setSelectedBM] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loadingBMs, setLoadingBMs] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    const loadFilterData = async () => {
      if (user.role === "superadmin") {
        setLoadingBMs(true);
        try {
          const bms = await getListBMs();
          setBmList(bms || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingBMs(false);
        }
      } else if (user.role === "bisnis_manager") {
        setLoadingBranches(true);
        try {
          const branches = await getAllBranches();
          setBranchList(branches || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingBranches(false);
        }
      }
    };
    loadFilterData();
  }, [user.role]);

  const handleBMChange = async (event, newValue) => {
    setSelectedBM(newValue);
    setSelectedBranch(null);
    setBranchList([]);
    if (newValue) {
      setLoadingBranches(true);
      try {
        const branches = await getBranchesByArea(newValue.area_kota);
        setBranchList(branches || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBranches(false);
      }
      onFilterChange({ filter_area_kota: newValue.area_kota });
    } else {
      onFilterChange({});
    }
  };

  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue);
    if (newValue) {
      onFilterChange({ filter_branch_id: newValue.branch_id });
    } else {
      if (user.role === "superadmin" && selectedBM) {
        onFilterChange({ filter_area_kota: selectedBM.area_kota });
      } else {
        onFilterChange({});
      }
    }
  };

  if (user.role === "admin_cabang") return null;

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-lg flex flex-wrap gap-4 items-center">
      <h2 className="text-lg font-semibold text-gray-800 shrink-0">
        Filter Data:
      </h2>
      {user.role === "superadmin" && (
        <>
          <Autocomplete
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
            options={branchList}
            loading={loadingBranches}
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={!selectedBM}
            getOptionLabel={(option) =>
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
      {user.role === "bisnis_manager" && (
        <Autocomplete
          options={branchList}
          loading={loadingBranches}
          value={selectedBranch}
          onChange={handleBranchChange}
          getOptionLabel={(option) =>
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

// --- KOMPONEN UTAMA DASHBOARD ---
const DashboardPage = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const [allOrders, setAllOrders] = useState([]);

  const [ordersByStatus, setOrdersByStatus] = useState({
    INCOMING: [],
    PREPARING: [],
    READY_FOR_PICKUP: [],
    COLLECTED: [],
    DELIVERED: [],
    CANCELLED: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeFilters, setActiveFilters] = useState({});
  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: () => {},
  });
  const [errorToast, setErrorToast] = useState({ open: false, message: "" });

  const filtersRef = useRef(activeFilters);
  useEffect(() => {
    filtersRef.current = activeFilters;
  }, [activeFilters]);

  const processOrderData = (data) => {
    return {
      INCOMING: data.filter((o) => o.status === "INCOMING"),
      PREPARING: data.filter((o) => o.status === "PREPARING"),
      READY_FOR_PICKUP: data.filter((o) => o.status === "READY_FOR_PICKUP"),
      COLLECTED: data.filter((o) => o.status === "COLLECTED"),
      DELIVERED: data.filter((o) => o.status === "DELIVERED"),
      // Gabungkan CANCELLED dan REJECTED di satu tempat
      CANCELLED: data.filter(
        (o) => o.status === "CANCELLED" || o.status === "REJECTED"
      ),
    };
  };

  const fetchOrders = useCallback(
    async (filtersToFetch, showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const allData = await getAllOrders(filtersToFetch);
        if (Array.isArray(allData)) {
          setAllOrders(allData);
          setOrdersByStatus(processOrderData(allData));
        } else {
          setAllOrders([]);
        }
      } catch (err) {
        setError("Gagal mengambil data pesanan.");
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(activeFilters, true);
  }, [activeFilters, fetchOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      getAllOrders(filtersRef.current)
        .then((allData) => {
          if (Array.isArray(allData)) {
            setAllOrders(allData);
            setOrdersByStatus(processOrderData(allData));
          }
        })
        .catch((err) => console.error("Gagal refresh interval:", err));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };
  const handleCloseModal = () => {
    setModal({ ...modal, open: false });
  };
  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") return;
    setErrorToast({ ...errorToast, open: false });
  };

  // Action Handlers
  const executeAction = async (actionFn, id, successMsg, failMsg) => {
    try {
      await actionFn(id);
      fetchOrders(activeFilters, false);
    } catch (err) {
      setErrorToast({ open: true, message: `${failMsg}: ${err.message}` });
    }
    handleCloseModal();
  };

  const handleAccept = (id) => {
    setModal({
      open: true,
      title: "Terima Pesanan?",
      content: `Terima pesanan #${id.slice(-6)}?`,
      onConfirm: () =>
        executeAction(acceptOrder, id, "Pesanan diterima", "Gagal menerima"),
    });
  };

  const handleReject = (id) => {
    setModal({
      open: true,
      title: "Tolak Pesanan?",
      content: `Tolak pesanan #${id.slice(-6)}?`,
      onConfirm: () =>
        executeAction(rejectOrder, id, "Pesanan ditolak", "Gagal menolak"),
    });
  };

  const handleMarkReady = (id) => {
    setModal({
      open: true,
      title: "Tandai Siap?",
      content: `Pesanan #${id.slice(-6)} siap dijemput?`,
      onConfirm: () =>
        executeAction(
          markOrderReady,
          id,
          "Pesanan siap",
          "Gagal update status"
        ),
    });
  };

  // --- CSV DOWNLOAD ---
  const handleDownloadCSV = () => {
    // Ambil data sesuai tab yang aktif
    const ordersToExport =
      activeTab === "ALL" ? allOrders : ordersByStatus[activeTab] || [];

    if (ordersToExport.length === 0) {
      setErrorToast({
        open: true,
        message: "Tidak ada data untuk di-download.",
      });
      return;
    }

    const headers = ["Order ID", "Status", "Total", "Tanggal", "Items"];
    const rows = ordersToExport.map((order) => {
      const id =
        order.grab_payload_raw?.shortOrderNumber || order.grab_order_id;
      const status = order.status;
      const total = calculateDisplayTotal(order);
      const date = new Date(order.created_at).toLocaleString("id-ID");
      const items = (order.grab_payload_raw?.items || [])
        .map((i) => `${i.quantity}x ${i.name || "Item"}`)
        .join("; ");

      return [id, status, total, `"${date}"`, `"${items}"`].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Report_Grab_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ordersToDisplay =
    activeTab === "ALL" ? allOrders : ordersByStatus[activeTab] || [];
  const getTabClass = (tab) =>
    activeTab === tab.apiKey
      ? `pb-2 border-b-2 font-semibold ${tab.color}`
      : "pb-2 border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700";

  // FIX: Total Revenue Bulat
  const totalRevenue = useMemo(() => {
    const rawTotal = ordersByStatus.DELIVERED.reduce((acc, order) => {
      let orderRaw =
        order.grab_payload_raw?.price?.total ||
        order.grab_payload_raw?.price?.eaterPayment ||
        0;
      if (orderRaw === 0 && order.grab_payload_raw?.items) {
        orderRaw = order.grab_payload_raw.items.reduce(
          (sum, item) => sum + (item.price || 1500000) * item.quantity,
          0
        );
      }
      return acc + orderRaw;
    }, 0);

    // Bagi 100 di akhir dan bulatkan ke bawah
    const totalRupiah = Math.floor(rawTotal / 100);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(totalRupiah);
  }, [ordersByStatus.DELIVERED]);

  return (
    <div className="p-6 min-h-full">
      <section className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 text-sm">
              Ringkasan penjualan hari ini
            </p>
          </div>
          {/* TOMBOL DOWNLOAD */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <FaDownload /> Download Report
          </button>
        </div>

        {/* --- STATISTIK LENGKAP (5 KOLOM) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <OverviewStatCard
            title="Total Revenue"
            value={totalRevenue}
            detail="Completed"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            icon={<FaWallet />}
          />
          <OverviewStatCard
            title="Total Orders"
            value={allOrders.length}
            detail="Today"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            icon={<FaBox />}
          />
          <OverviewStatCard
            title="Completed"
            value={ordersByStatus.DELIVERED.length}
            detail="Orders"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            icon={<FaCheckCircle />}
          />
          <OverviewStatCard
            title="Active"
            value={
              ordersByStatus.PREPARING.length +
              ordersByStatus.READY_FOR_PICKUP.length
            }
            detail="In Progress"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            icon={<FaSpinner />}
          />
          {/* KARTU BARU: CANCELLED */}
          <OverviewStatCard
            title="Cancelled"
            value={ordersByStatus.CANCELLED.length}
            detail="Rejected/Void"
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            icon={<FaTimesCircle />}
          />
        </div>
      </section>

      <DashboardFilters user={user} onFilterChange={handleFilterChange} />

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Order Status
        </h2>
        <nav className="flex space-x-6 border-b border-gray-200 bg-white p-4 rounded-lg shadow overflow-x-auto">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.apiKey}
              onClick={() => setActiveTab(tab.apiKey)}
              className={`text-sm md:text-base flex-shrink-0 ${getTabClass(
                tab
              )}`}
            >
              {tab.label} (
              {tab.apiKey === "ALL"
                ? allOrders.length
                : ordersByStatus[tab.apiKey]?.length || 0}
              )
            </button>
          ))}
        </nav>
      </section>

      <section>
        {loading && (
          <div className="flex justify-center items-center h-64">
            <CircularProgress size={60} />
          </div>
        )}
        {!loading && ordersToDisplay.length === 0 && (
          <p className="text-gray-500 text-center py-10">Tidak ada pesanan.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading &&
            ordersToDisplay.map((order, i) => {
              const key = order.grab_order_id || i;
              if (activeTab === "INCOMING" || order.status === "INCOMING") {
                return (
                  <OrderCard
                    key={key}
                    order={order}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                );
              }
              if (activeTab === "PREPARING" || order.status === "PREPARING") {
                return (
                  <PreparingOrderCard
                    key={key}
                    order={order}
                    onMarkReady={handleMarkReady}
                  />
                );
              }
              return <SimpleOrderCard key={key} order={order} />;
            })}
        </div>
      </section>

      <Dialog open={modal.open} onClose={handleCloseModal}>
        <DialogTitle>{modal.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{modal.content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Batal</Button>
          <Button onClick={modal.onConfirm} autoFocus>
            Ya
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={errorToast.open} onClose={handleCloseToast}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorToast.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseToast}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
