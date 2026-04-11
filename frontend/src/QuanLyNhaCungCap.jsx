import React, { useState, useEffect } from "react";
import axios from "axios";
import ModalAddSupplier from "./ModalAddSupplier";

export default function QuanLyNhaCungCap() {
    // 1. Khai báo tất cả States ở đây (Chỉ khai báo 1 lần)
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("Tất cả");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null); 

    // 2. Lấy dữ liệu từ API
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://127.0.0.1:8000/api/suppliers");
            setSuppliers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi lấy danh sách NCC:", error);
            setLoading(false);
        }
    };

    // 3. Các hàm xử lý Logic (Thêm, Sửa, Xóa)
    const handleSaveSuccess = (data, action) => {
        if (action === 'add') {
            setSuppliers([data, ...suppliers]);
        } else {
            const updatedList = suppliers.map(s => s.id === data.id ? data : s);
            setSuppliers(updatedList);
        }
        setShowModal(false);
        setEditingSupplier(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/suppliers/${id}`);
                setSuppliers(suppliers.filter(s => s.id !== id));
            } catch (error) {
                alert("Không thể xóa nhà cung cấp này!");
            }
        }
    };

    const handleAdd = () => {
        setEditingSupplier(null); 
        setShowModal(true);
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setShowModal(true);
    };

    // 4. Bộ lọc dữ liệu
    const filteredSuppliers = suppliers.filter(sup => {
        const nameMatch = sup.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const taxMatch = sup.tax_code?.includes(searchTerm);
        const matchType = filterType === "Tất cả" || sup.main_material_type === filterType;
        return (nameMatch || taxMatch) && matchType;
    });

    // 5. Thống kê
    const stats = [
        { label: "TỔNG NHÀ CUNG CẤP", value: suppliers.length, icon: "👥", color: "#4318FF" },
        { label: "NCC CHIẾN LƯỢC", value: suppliers.filter(s => s.is_strategic).length, badge: "Vàng", icon: "⭐", color: "#FFB547" },
        { label: "ĐANG HỢP TÁC", value: suppliers.filter(s => s.status === 'ACTIVE').length, badge: "Active", icon: "🤝", color: "#05CD99" },
        { label: "ĐIỂM ĐÁNH GIÁ TB", value: (suppliers.reduce((acc, s) => acc + (s.rating_stars || 0), 0) / (suppliers.length || 1)).toFixed(1), badge: "Stars", icon: "📈", color: "#39B8FF" },
    ];

    return (
        <div className="supplier-container animate-fade-in">
            <div className="supplier-header">
                <div>
                    <h1>Danh sách Nhà cung cấp</h1>
                    <p className="sub-text">Hệ thống hồ sơ quản lý đối tác cung ứng chiến lược</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-outline" onClick={() => window.print()}>📥 In danh sách</button>
                    <button className="btn-add-supplier" onClick={handleAdd}>+ Thêm NCC mới</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="supplier-stats-grid">
                {stats.map((s, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: s.color + '15', color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <label>{s.label}</label>
                            <div className="val-row">
                                <span className="value">{s.value}</span>
                                {s.badge && <span className="stat-badge">{s.badge}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Tìm tên nhà cung cấp, mã số thuế..." 
                        className="search-supplier"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="filter-select" onChange={(e) => setFilterType(e.target.value)}>
                    <option value="Tất cả">Tất cả loại vật tư</option>
                    {[...new Set(suppliers.map(s => s.main_material_type))].filter(Boolean).map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="supplier-table-wrapper">
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
                ) : (
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
                            {filteredSuppliers.map((sup) => (
                                <tr key={sup.id}>
                                    <td>
                                        <div className="sup-name-cell">
                                            <div className="sup-logo">{sup.name.charAt(0)}</div>
                                            <div>
                                                <div className="name">
                                                    {sup.name} 
                                                    {sup.is_strategic ? <span title="Chiến lược"> ⭐</span> : ""}
                                                </div>
                                                <div className="mst">MST: {sup.tax_code} | Mã: {sup.supplier_code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="type-tag">{sup.main_material_type || 'N/A'}</span></td>
                                    <td>
                                        <div className="contact-info">{sup.phone}</div>
                                        <div className="mst">{sup.email}</div>
                                    </td>
                                   <td>
                                        {(() => {
                                            // Định nghĩa màu sắc cho từng loại nhãn
                                            const tagStyles = {
                                                'Tin cậy': { class: 'reliable', icon: '✅' },
                                                'Tiềm năng': { class: 'potential', icon: '📈' },
                                                'Cần xem xét': { class: 'review', icon: '⚠️' }
                                            };

                                            const currentTag = tagStyles[sup.evaluation_tag] || { class: '', icon: '' };

                                            return (
                                                <div>
                                                    <span className={`rating-tag ${currentTag.class}`}>
                                                        {currentTag.icon} {sup.evaluation_tag || 'Chưa đánh giá'}
                                                    </span>
                                                    <div className="stars" style={{ marginTop: '4px' }}>
                                                        {"⭐".repeat(Math.floor(sup.rating_stars || 0))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        {(() => {
                                            // Cấu hình hiển thị theo giá trị từ Database
                                            const statusConfig = {
                                                'ACTIVE': { label: 'Đang hợp tác', class: 'active' },
                                                'SUSPENDED': { label: 'Tạm dừng', class: 'paused' },
                                                'PENDING': { label: 'Đang chờ', class: 'pending' }
                                            };

                                            // Lấy cấu hình dựa trên sup.status, nếu không có thì để mặc định
                                            const currentStatus = statusConfig[sup.status] || { label: sup.status, class: '' };

                                            return (
                                                <span className={`status-pill ${currentStatus.class}`}>
                                                    {currentStatus.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEdit(sup)} className="btn-edit-small">✏️</button>
                                            <button onClick={() => handleDelete(sup.id)} className="btn-delete-small">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <ModalAddSupplier 
                    onClose={() => {
                        setShowModal(false);
                        setEditingSupplier(null);
                    }} 
                    onSave={handleSaveSuccess} 
                    editingData={editingSupplier} 
                />
            )}
        </div>
    );
}