import React from "react";

/**
 * Komponen Card terpisah untuk menampilkan detail satu pesanan.
 * Menerima data pesanan (order) dan fungsi (onAccept, onReject) sebagai props.
 */
const OrderCard = ({ order, onAccept, onReject }) => {
  const items = order.grab_payload_raw?.items || [];
  // (BARU) Ambil total harga
  const orderTotal = order.grab_payload_raw?.price?.total || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header Kartu */}
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 break-words">
          Order: {order.grab_order_id}
        </h3>
        <p className="text-sm text-gray-500">
          Masuk: {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      {/* Body Kartu (Daftar Item) */}
      <div className="p-5 h-48 overflow-y-auto">
        <h4 className="font-semibold mb-2 text-gray-700">Detail Item:</h4>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          {items.map((item, index) => (
            <li key={index}>
              <span className="font-medium">{item.quantity}x</span> {item.name}
              {item.modifiers && item.modifiers.length > 0 && (
                <span className="block text-sm text-indigo-600 pl-4">
                  - {item.modifiers[0].name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* (BARU) Tampilan Total Harga */}
      <div className="p-5 border-t border-gray-200">
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-2xl font-bold text-gray-900">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(orderTotal)}
        </p>
      </div>

      {/* Footer Kartu (Tombol Aksi) */}
      <div className="p-4 bg-gray-50 grid grid-cols-2 gap-4">
        <button
          onClick={() => onReject(order.grab_order_id)}
          className="w-full px-4 py-2 font-semibold text-sm text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none"
        >
          Tolak
        </button>
        <button
          onClick={() => onAccept(order.grab_order_id)}
          className="w-full px-4 py-2 font-semibold text-sm text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
        >
          Terima
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
