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
        { label: "ĐANG HỢP TÁC", value: suppliers.filter(s => s.status === 'ACTIVE').length, badge: "Hợp tác", icon: "🤝", color: "#05CD99" },
        { label: "DỪNG HỢP TÁC", value: suppliers.filter(s => s.status === 'SUSPENDED').length, badge: "Dừng", icon: "⏸️", color: "#64748b" },
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

            {/* Filter & Stats Bar */}
            <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '16px', background: '#fff', borderRadius: '16px', marginBottom: '20px' }}>
                <div className="search-box" style={{ flex: 1 }}>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên NCC, MST, mã..." 
                        className="search-supplier"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e0e5f2', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    {stats.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: s.color + '10', borderRadius: '10px', border: `1px solid ${s.color}20` }}>
                            <span style={{ fontSize: '16px' }}>{s.icon}</span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#a3aed0', textTransform: 'uppercase', lineHeight: '1' }}>{s.label.split(' ')[0]}</span>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#2b3674' }}>{s.value}</span>
                            </div>
                        </div>
                    ))}
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
                                            const statusConfig = {
                                                'ACTIVE': { label: 'Đang hợp tác', class: 'active' },
                                                'SUSPENDED': { label: 'Dừng hợp tác', class: 'paused' }
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