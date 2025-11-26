// src/components/common/OrderCard.jsx
import React from "react";

/**
 * Komponen Card untuk menampilkan detail satu pesanan.
 * Menangani konversi harga (Exponent 2) dan logika tombol berdasarkan status.
 */
const OrderCard = ({ order, onAccept, onReject, onReady }) => {
  // Ambil data item dari payload Grab
  const items = order.grab_payload_raw?.items || [];

  // ⚠️ FIX HARGA: Grab mengirim dalam 'minor units' (sen).
  // Contoh: Rp 15.000 dikirim sebagai 1500000.
  // Kita WAJIB membagi 100 agar tampilannya benar.
  const rawTotal = order.grab_payload_raw?.price?.total || 0;
  const displayTotal = rawTotal / 100;

  // Helper untuk menentukan warna badge status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "INCOMING":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "PREPARING":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "READY_FOR_PICKUP":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border border-red-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper untuk render tombol aksi berdasarkan status order
  const renderActions = () => {
    const status = order.status;

    // KASUS 1: Pesanan Baru Masuk (INCOMING) -> Butuh Terima / Tolak
    if (status === "INCOMING") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onReject(order.grab_order_id)}
            className="w-full px-4 py-2 font-semibold text-sm text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none transition-colors"
          >
            Tolak
          </button>
          <button
            onClick={() => onAccept(order.grab_order_id)}
            className="w-full px-4 py-2 font-semibold text-sm text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none transition-colors"
          >
            Terima
          </button>
        </div>
      );
    }

    // KASUS 2: Sedang Disiapkan (PREPARING) -> Butuh tombol "Pesanan Siap"
    if (status === "PREPARING") {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onReady(order.grab_order_id)}
            className="w-full px-4 py-2 font-semibold text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition-colors flex items-center justify-center gap-2"
          >
            <span>✅</span> Tandai Siap Diambil
          </button>
        </div>
      );
    }

    // KASUS 3: Siap Diambil (READY_FOR_PICKUP) -> Info saja
    if (status === "READY_FOR_PICKUP") {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="w-full px-4 py-2 font-semibold text-sm text-indigo-800 bg-indigo-50 rounded-md text-center border border-indigo-100 flex items-center justify-center gap-2">
            <span>🛵</span> Menunggu Driver...
          </div>
        </div>
      );
    }

    // Status Lainnya (Completed/Cancelled) -> Tidak ada tombol aksi
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      {/* Header Kartu */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Order ID
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 break-all leading-tight">
            #
            {order.grab_payload_raw?.shortOrderNumber ||
              order.grab_order_id.slice(-6)}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusBadgeClass(
            order.status
          )}`}
        >
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Body Kartu (Daftar Item) */}
      <div className="p-4 flex-1 overflow-y-auto max-h-60">
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded h-fit">
                    {item.quantity}x
                  </span>
                  <div>
                    <span className="block font-medium">{item.name}</span>
                    {/* Modifiers / Tambahan */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.modifiers.map((mod, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-gray-500 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {mod.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Catatan Khusus */}
                    {item.notes && (
                      <p className="text-xs text-orange-600 italic mt-1 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer: Total Harga & Tombol Aksi */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">
            Total Pesanan
          </span>
          <span className="text-xl font-extrabold text-gray-900">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(displayTotal)}
          </span>
        </div>

        {/* Render Tombol Aksi */}
        {renderActions()}
      </div>
    </div>
  );
};

export default OrderCard;
