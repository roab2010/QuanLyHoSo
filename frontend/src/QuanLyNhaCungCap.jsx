import React from "react";

export default function QuanLyNhaCungCap() {
    // Dữ liệu các thẻ thống kê phía trên
    const stats = [
        { label: "TỔNG NHÀ CUNG CẤP", value: "1,248", trend: "+12%", icon: "👥", color: "#4318FF" },
        { label: "NHÀ CUNG CẤP CHIẾN LƯỢC", value: "42", badge: "Vàng", icon: "⭐", color: "#FFB547" },
        { label: "ĐƠN HÀNG ĐANG THỰC HIỆN", value: "156", badge: "Active", icon: "🛒", color: "#39B8FF" },
        { label: "GIÁ TRỊ NHẬP THÁNG NÀY", value: "8.2B", badge: "VND", icon: "💵", color: "#05CD99" },
    ];

    // Dữ liệu danh sách nhà cung cấp (giả lập giống hình mẫu)
    const suppliers = [
        { name: "Công ty CP Thép Việt Nhật", mst: "0102030405", type: "Thép xây dựng", phone: "024 3942 1234", email: "sales@vietnhatsteel.vn", rating: "Tin cậy", stars: 5, status: "Đang hợp tác" },
        { name: "Xi măng Holcim Việt Nam", mst: "0301020304", type: "Xi măng, Bê tông", phone: "028 3824 4111", email: "contact@holcim.com.vn", rating: "Tiềm năng", stars: 5, status: "Đang hợp tác" },
        { name: "Gạch ngói Đồng Tâm", mst: "0405060708", type: "Vật liệu thô", phone: "0272 387 2213", email: "info@dongtam.com.vn", rating: "Cần xem xét", stars: 4, status: "Tạm dừng" },
    ];

    return (
        <div className="supplier-container animate-fade-in">
            {/* Phần tiêu đề và nút bấm phía trên */}
            <div className="supplier-header">
                <div>
                    <h1>Danh sách Nhà cung cấp</h1>
                    <p className="sub-text">Hệ thống hồ sơ quản lý đối tác cung ứng chiến lược</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-outline">📥 Xuất báo cáo</button>
                    <button className="btn-add-supplier">👤+ Thêm nhà cung cấp mới</button>
                </div>
            </div>

            {/* Các thẻ chỉ số (Stats) */}
            <div className="supplier-stats-grid">
                {stats.map((s, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: s.color + '15', color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <label>{s.label}</label>
                            <div className="val-row">
                                <span className="value">{s.value}</span>
                                {s.trend && <span className="trend-up">{s.trend}</span>}
                                {s.badge && <span className="stat-badge">{s.badge}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Thanh lọc và tìm kiếm */}
            <div className="filter-bar">
                <div className="search-box">
                    <input type="text" placeholder="Tìm tên nhà cung cấp, mã số thuế..." className="search-supplier" />
                </div>
                <select className="filter-select"><option>Tất cả loại vật tư</option></select>
                <select className="filter-select"><option>Mọi trạng thái</option></select>
                <div className="view-mode">
                    <button className="mode-btn">☰</button>
                    <button className="mode-btn active">▦</button>
                </div>
            </div>

            {/* Bảng danh sách */}
            <div className="supplier-table-wrapper">
                <table className="supplier-table">
                    <thead>
                        <tr>
                            <th>NHÀ CUNG CẤP</th>
                            <th>LOẠI VẬT TƯ</th>
                            <th>LIÊN HỆ</th>
                            <th>ĐÁNH GIÁ</th>
                            <th>TRẠNG THÁI</th>
                            <th>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((sup, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div className="sup-name-cell">
                                        <div className="sup-logo">{sup.name.charAt(0)}</div>
                                        <div>
                                            <div className="name">{sup.name}</div>
                                            <div className="mst">MST: {sup.mst}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="type-tag">{sup.type}</span></td>
                                <td>
                                    <div className="contact-info">{sup.phone}</div>
                                    <div className="mst">{sup.email}</div>
                                </td>
                                <td>
                                    <span className={`rating-tag ${sup.rating === 'Tin cậy' ? 'reliable' : sup.rating === 'Tiềm năng' ? 'potential' : 'review'}`}>
                                        {sup.rating}
                                    </span>
                                    <div className="stars">{"⭐".repeat(sup.stars)}</div>
                                </td>
                                <td>
                                    <span className={`status-pill ${sup.status === 'Đang hợp tác' ? 'active' : 'paused'}`}>
                                        {sup.status}
                                    </span>
                                </td>
                                <td><button className="btn-more-action">•••</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Phân trang giả lập */}
                <div className="table-pagination">
                    <span>Hiển thị 1-10 trong số 1,248 kết quả</span>
                    <div className="pages">
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <button className="page-btn">3</button>
                        <span>...</span>
                        <button className="page-btn">125</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
















