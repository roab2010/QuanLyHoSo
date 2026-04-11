import React from "react";

const InventoryDashboard = ({ onSelect }) => {
    // Danh sách các lựa chọn trong kho
    const inventoryOptions = [
        {
            id: "vat-tu",
            title: "Quản lý vật tư tồn kho",
            desc: "Theo dõi số lượng, tình trạng nhập - xuất và vị trí vật tư thực tế tại công trình.",
            icon: "🏗️",
            className: "card-vattu",
            titleColor: "#0052cc"
        },
        {
            id: "nha-cung-cap",
            title: "Quản lý nhà cung cấp",
            desc: "Quản lý danh bạ đối tác, đánh giá uy tín và lịch sử cung ứng vật tư cho dự án.",
            icon: "🤝",
            className: "card-ncc",
            titleColor: "#16a34a"
        }
    ];

    return (
        <div className="inventory-selection-container animate-fade-in">
            <h2 className="inventory-title">Hệ Thống Quản Lý Kho</h2>
            
            <div className="inventory-grid">
                {inventoryOptions.map((option) => (
                    <div 
                        key={option.id} 
                        className={`inventory-card ${option.className}`}
                        onClick={() => onSelect(option.id)}
                    >
                        <span className="icon">{option.icon}</span>
                        <h3 style={{ color: option.titleColor }}>{option.title}</h3>
                        <p>{option.desc}</p>
                    </div>
                ))}
            </div>

            {/* Chỗ này có thể thêm các thông số tóm tắt nếu muốn */}
            <div className="inventory-footer-note">
                <p>Vui lòng chọn danh mục để tiếp tục quản lý dữ liệu kho.</p>
            </div>
        </div>
    );
};

export default InventoryDashboard;