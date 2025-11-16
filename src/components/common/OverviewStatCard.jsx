import React from "react";

/**
 * Komponen Kartu Statistik Besar untuk Dashboard Overview.
 * Sekarang menerima `icon` sebagai komponen JSX.
 */
const OverviewStatCard = ({
  title,
  value,
  icon, // Ini akan jadi komponen, e.g., <FaWallet />
  detail,
  iconBgColor,
  iconColor, // Warna untuk ikonnya
}) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-4">
      {/* Ikon */}
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        {/* Kita render komponen ikon yang dikirim via props */}
        {React.cloneElement(icon, { className: `text-2xl ${iconColor}` })}
      </div>

      {/* Konten Teks */}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {detail && <p className="text-xs text-gray-400 mt-1">{detail}</p>}
      </div>
    </div>
  );
};

export default OverviewStatCard;
