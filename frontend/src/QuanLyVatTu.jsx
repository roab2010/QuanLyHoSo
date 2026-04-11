import React from "react";

export default function QuanLyVatTu() {
    // Thống kê vật tư
    const stats = [
        { label: "TỔNG LOẠI VẬT TƯ", value: "856", icon: "📦", color: "#4318FF" },
        { label: "VẬT TƯ SẮP HẾT", value: "12", badge: "Cảnh báo", icon: "⚠️", color: "#EE5D50" },
        { label: "YÊU CẦU NHẬP KHO", value: "05", badge: "Mới", icon: "🚚", color: "#39B8FF" },
        { label: "GIÁ TRỊ TỒN KHO", value: "2.4B", badge: "VND", icon: "💰", color: "#05CD99" },
    ];

    // Danh sách vật tư giả lập
    const inventory = [
        { name: "Xi măng Holcim", code: "VT-001", unit: "Tấn", quantity: 500, minStock: 100, location: "Kho A1", status: "Còn hàng" },
        { name: "Thép Việt Nhật Ø10", code: "VT-042", unit: "Cây", quantity: 1500, minStock: 200, location: "Bãi tập kết số 2", status: "Còn hàng" },
        { name: "Gạch thẻ Đồng Tâm", code: "VT-088", unit: "Viên", quantity: 50, minStock: 500, location: "Kho B3", status: "Sắp hết" },
        { name: "Sơn Dulux nội thất", code: "VT-102", unit: "Thùng", quantity: 0, minStock: 20, location: "Kho C1", status: "Hết hàng" },
    ];

    return (
        <div className="supplier-container animate-fade-in">
            {/* Header */}
            <div className="supplier-header">
                <div>
                    <h1>Quản lý vật tư tồn kho</h1>
                    <p className="sub-text">Theo dõi số lượng và vị trí vật tư thực tế tại công trình</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-outline">📥 Xuất file kho</button>
                    <button className="btn-add-supplier">📦+ Nhập vật tư mới</button>
                </div>
            </div>

            {/* Stats */}
            <div className="supplier-stats-grid">
                {stats.map((s, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: s.color + '15', color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <label>{s.label}</label>
                            <div className="val-row">
                                <span className="value">{s.value}</span>
                                {s.badge && <span className="stat-badge" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.badge}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <div className="search-box">
                    <input type="text" placeholder="Tìm tên vật tư, mã vật tư..." className="search-supplier" />
                </div>
                <select className="filter-select"><option>Tất cả kho</option></select>
                <select className="filter-select"><option>Trạng thái tồn</option></select>
                <div className="view-mode">
                    <button className="mode-btn">☰</button>
                    <button className="mode-btn active">▦</button>
                </div>
            </div>

            {/* Table */}
            <div className="supplier-table-wrapper">
                <table className="supplier-table">
                    <thead>
                        <tr>
                            <th>VẬT TƯ / MÃ VT</th>
                            <th>ĐƠN VỊ</th>
                            <th>SỐ LƯỢNG</th>
                            <th>VỊ TRÍ KHO</th>
                            <th>TRẠNG THÁI</th>
                            <th>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div className="sup-name-cell">
                                        <div className="sup-logo">📦</div>
                                        <div>
                                            <div className="name">{item.name}</div>
                                            <div className="mst">Mã: {item.code}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="type-tag">{item.unit}</span></td>
                                <td>
                                    <div className="name">{item.quantity.toLocaleString()}</div>
                                    <div className="mst">Mức tối thiểu: {item.minStock}</div>
                                </td>
                                <td>
                                    <div className="contact-info">{item.location}</div>
                                </td>
                                <td>
                                    <span className={`rating-tag ${item.status === 'Còn hàng' ? 'reliable' : item.status === 'Sắp hết' ? 'potential' : 'review'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td><button className="btn-more-action">•••</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}