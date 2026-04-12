import React, { useState, useEffect, useMemo } from "react";
import api from "./api"; 

export default function QuanLyVatTu() {
    const [inventory, setInventory] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    
    // State cho Tìm kiếm & Lọc
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");

    // 1. State cho Form (Full 8 trường như ông yêu cầu)
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        unit: 'Cái',
        current_stock: 0,
        min_stock_level: 10,
        price: 0,
        type: 'CONSUMABLE', 
        category_name: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/inventory");
            setInventory(res.data?.inventory || []);
            setStatsData(res.data?.stats || null);
        } catch (err) {
            console.error("Lỗi kết nối API:", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Hàm Xử lý Xóa
    const handleDelete = async (id, name) => {
        if (window.confirm(`⚠️ Ông có chắc muốn xóa vật tư "${name}" không?`)) {
            try {
                const res = await api.delete(`/products/${id}`);
                if (res.data.success) {
                    alert("✅ Đã xóa xong!");
                    loadData();
                }
            } catch (err) {
                console.error("Lỗi xóa:", err);
                alert("❌ Lỗi: " + (err.response?.data?.message || "Không thể xóa vật tư này vì đã có dữ liệu xuất nhập kho!"));
            }
        }
    };

    // Logic lọc danh sách (Tìm kiếm + Lọc loại)
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                                 (item.code?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            const matchesType = filterType === "ALL" || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [searchTerm, filterType, inventory]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/products", formData);
            if (res.data.success) {
                alert("🎉 Thêm vật tư thành công!");
                setIsModalOpen(false); 
                loadData();
                setFormData({ 
                    name: '', sku: '', unit: 'Cái', 
                    current_stock: 0, min_stock_level: 10, price: 0, 
                    type: 'CONSUMABLE', category_name: '' 
                });
            }
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || "Không thể lưu vật tư"));
        }
    };

    const stats = [
        { label: "TỔNG LOẠI VẬT TƯ", value: statsData?.total_types || 0, icon: "📦", color: "#4318FF" },
        { label: "VẬT TƯ SẮP HẾT", value: statsData?.low_stock || 0, badge: "Cảnh báo", icon: "⚠️", color: "#EE5D50" },
        { label: "YÊU CẦU NHẬP KHO", value: statsData?.out_of_stock || 0, badge: "Mới", icon: "🚚", color: "#39B8FF" },
        { label: "GIÁ TRỊ TỒN KHO", value: new Intl.NumberFormat('vi-VN').format(statsData?.total_value || 0), badge: "VND", icon: "💰", color: "#05CD99" },
    ];

    if (loading) return <div className="p-10 text-center">⏳ Đang tải dữ liệu...</div>;

    return (
        <div className="supplier-container animate-fade-in">
            {/* Header */}
            <div className="supplier-header">
                <div>
                    <h1>Quản lý vật tư tồn kho</h1>
                    <p className="sub-text">Hiển thị {filteredInventory.length} vật tư phù hợp</p>
                </div>
                <div className="header-actions">
                    <button className="btn-add-supplier" onClick={() => setIsModalOpen(true)}>📦+ Nhập vật tư mới</button>
                </div>
            </div>

            {/* Stats */}
            <div className="supplier-stats-grid">
                {stats.map((s, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: s.color + '15', color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <label>{s.label}</label>
                            <div className="val-row"><span className="value">{s.value}</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Tìm tên, mã vật tư..." 
                        className="search-supplier"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="ALL">Tất cả loại</option>
                    <option value="CONSUMABLE">Vật tư tiêu hao</option>
                    <option value="RETURNABLE">Vật tư thu hồi</option>
                </select>
            </div>

            {/* Table */}
            <div className="supplier-table-wrapper">
                <table className="supplier-table">
                    <thead>
                        <tr>
                            <th>VẬT TƯ / MÃ VT</th>
                            <th style={{ textAlign: 'center' }}>LOẠI / NHÓM</th>
                            <th>SỐ LƯỢNG</th>
                            <th>TRẠNG THÁI</th>
                            <th>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    <td>
                                        <div className="sup-name-cell">
                                            <div className="sup-logo">📦</div>
                                            <div>
                                                <div className="name">{item.name}</div>
                                                <div className="mst">Mã: {item.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`type-tag ${item.type === 'RETURNABLE' ? 'potential' : 'reliable'}`}>
                                            {item.type === 'CONSUMABLE' ? 'Tiêu hao' : 'Thu hồi'}
                                        </span>
                                        <div className="mst" style={{ marginTop: '4px' }}>
                                            {item.category_name || 'Chưa phân nhóm'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="name">{item.quantity} {item.unit}</div>
                                        <div className="mst">Tối thiểu: {item.minStock}</div>
                                    </td>
                                    <td>
                                        <span className={`rating-tag ${item.status === 'Còn hàng' ? 'reliable' : 'review'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleDelete(item.id, item.name)}
                                                style={{ 
                                                    color: '#EE5D50', border: '1px solid #EE5D50', 
                                                    background: 'none', padding: '4px 8px', 
                                                    borderRadius: '4px', cursor: 'pointer', fontSize: '12px' 
                                                }}
                                            >
                                                Xóa
                                            </button>
                                            <button className="btn-more-action">•••</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}>Không tìm thấy vật tư nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal (Full 8 ô như cũ) */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>📦 Khai báo vật tư mới</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>
                        
                        <form onSubmit={handleAddProduct}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={labelStyle}>Tên vật tư</label>
                                    <input type="text" style={inputStyle} required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Mã vật tư (SKU)</label>
                                    <input type="text" style={inputStyle} required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Đơn vị tính</label>
                                    <input type="text" style={inputStyle} value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Nhóm ngành</label>
                                    <input type="text" style={inputStyle} value={formData.category_name} onChange={(e) => setFormData({...formData, category_name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Số lượng ban đầu</label>
                                    <input type="number" style={inputStyle} value={formData.current_stock} onChange={(e) => setFormData({...formData, current_stock: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Định mức tối thiểu</label>
                                    <input type="number" style={inputStyle} value={formData.min_stock_level} onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Giá nhập dự kiến</label>
                                    <input type="number" style={inputStyle} value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label style={labelStyle}>Loại vật tư</label>
                                    <select style={inputStyle} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                        <option value="CONSUMABLE">Vật tư tiêu hao</option>
                                        <option value="RETURNABLE">Vật tư thu hồi</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '25px', textAlign: 'right' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-export-outline" style={{ marginRight: '10px' }}>Hủy</button>
                                <button type="submit" className="btn-add-supplier">Lưu vật tư</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Style
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', marginTop: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#444' };