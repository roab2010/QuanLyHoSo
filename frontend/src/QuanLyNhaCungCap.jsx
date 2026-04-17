import React, { useState, useEffect } from "react";
import axios from "axios";
import ModalAddSupplier from "./ModalAddSupplier";
import ModalSupplierPrices from "./ModalSupplierPrices";

export default function QuanLyNhaCungCap() {
    // 1. Khai báo tất cả States ở đây (Chỉ khai báo 1 lần)
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("Tất cả");
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null); 
    
    // Price Modal states
    const [showPricesModal, setShowPricesModal] = useState(false);
    const [activeSupplierForPrices, setActiveSupplierForPrices] = useState(null);

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
        // Because of eager loaded nested relationships, it's safer to just fetch again
        // after add/edit to get all the structure beautifully.
        fetchSuppliers();
        setShowModal(false);
        setEditingSupplier(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này? Toàn bộ danh sách vật tư và phiếu giá liên quan sẽ bị xóa!")) {
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

    const handleOpenPrices = (supplier) => {
        setActiveSupplierForPrices(supplier);
        setShowPricesModal(true);
    };

    // 4. Bộ lọc dữ liệu
    const filteredSuppliers = suppliers.filter(sup => {
        const nameMatch = sup.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const taxMatch = sup.tax_code?.includes(searchTerm);
        // Note: Filter by specific material if needed. For now, we skip material type filtering as it's complex 
        // to filter an array inside an object here, or we can just return true.
        return (nameMatch || taxMatch);
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
                                <th>SỐ LƯỢNG VẬT TƯ</th>
                                <th>LIÊN HỆ</th>
                                <th>ĐÁNH GIÁ</th>
                                <th>TRẠNG THÁI</th>
                                <th style={{ textAlign: 'center' }}>THAO TÁC</th>
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
                                    <td>
                                        <span className="type-tag" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                                            {sup.materials ? sup.materials.length : 0} loại
                                        </span>
                                    </td>
                                    <td>
                                        <div className="contact-info">📞 {sup.phone || 'Chưa cập nhật'}</div>
                                    </td>
                                   <td>
                                        {(() => {
                                            const tagStyles = {
                                                'TIN_CAY': { class: 'reliable', icon: '✅' },
                                                'TIEM_NANG': { class: 'potential', icon: '📈' },
                                                'CAN_XEM_SET': { class: 'review', icon: '⚠️' }
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
                                            const statusConfig = {
                                                'ACTIVE': { label: 'Đang hợp tác', class: 'active' },
                                                'SUSPENDED': { label: 'Tạm dừng', class: 'paused' },
                                                'PENDING': { label: 'Đang chờ', class: 'pending' }
                                            };

                                            const currentStatus = statusConfig[sup.status] || { label: sup.status, class: '' };

                                            return (
                                                <span className={`status-pill ${currentStatus.class}`}>
                                                    {currentStatus.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => handleOpenPrices(sup)} className="btn-edit-small" style={{ background: '#eff6ff', color: '#2563eb' }} title="Quản lý Phiếu giá">
                                                📋
                                            </button>
                                            <button onClick={() => handleEdit(sup)} className="btn-edit-small" title="Sửa hồ sơ">✏️</button>
                                            <button onClick={() => handleDelete(sup.id)} className="btn-delete-small" title="Xóa NCC">🗑️</button>
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

            {showPricesModal && activeSupplierForPrices && (
                <ModalSupplierPrices
                    supplier={activeSupplierForPrices}
                    onClose={() => {
                        setShowPricesModal(false);
                        setActiveSupplierForPrices(null);
                    }}
                    onRefresh={fetchSuppliers} // Fetch when prices/materials change to sync numbers
                />
            )}
        </div>
    );
}