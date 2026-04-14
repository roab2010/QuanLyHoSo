import React, { useState, useEffect, useMemo } from "react";
import api from "./api";

const styleSheet = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.spinner-mini { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #4318FF; border-radius: 50%; animation: spin 1s linear infinite; }
.animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.stat-card { padding: 20px; background: #fff; borderRadius: 16px; boxShadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s; }
.error-text { color: #EE5D50; fontSize: 11px; marginTop: 4px; display: block; font-weight: 500; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { fontSize: 12px; fontWeight: bold; color: #2b3674; }
.form-input { padding: 10px; borderRadius: 8px; border: 1px solid #ddd; outline: none; transition: border 0.2s; }
.form-input:focus { border-color: #4318FF; }
`;

export default function QuanLyVatTu() {
    const [inventory, setInventory] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterWarehouse, setFilterWarehouse] = useState("ALL");
    const [errors, setErrors] = useState({});

    const initialFormState = {
        name: '', sku: '', unit: 'Cái', type: 'CONSUMABLE', category_name: 'Vật tư tiêu hao',
        price: '', current_stock: '', min_stock_level: '10', warehouse_id: '', supplier_id: '',
        status: 1, received_at: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);

    const loadData = async () => {
        try {
            const [invRes, wareRes, supRes] = await Promise.all([
                api.get("/inventory"),
                api.get("/warehouses"),
                api.get("/suppliers")
            ]);
            
            // Kiểm tra kỹ cấu trúc trả về, ép nó về mảng
            const invData = invRes.data?.inventory || invRes.data || [];
            setInventory(Array.isArray(invData) ? invData : []);
            
            setStatsData(invRes.data?.stats || null);
            setWarehouses(Array.isArray(wareRes.data) ? wareRes.data : []);
            setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
        } catch (err) { 
            console.error("Lỗi load data:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        loadData();
        const styleTag = document.createElement("style");
        styleTag.innerHTML = styleSheet;
        document.head.appendChild(styleTag);
    }, []);

    // --- HÀM TÍNH TOÁN SỨC CHỨA (DUY NHẤT) ---
    const getWarehouseInfo = (warehouseId) => {
        if (!warehouseId) return { used: 0, total: 0, remaining: 0, percent: 0 };
        
        const warehouse = warehouses.find(w => Number(w.id) === Number(warehouseId));
        const total = Number(warehouse?.capacity || 1000); 

        // SỬA DÒNG NÀY: Ép về Number để filter không bị sót
        const used = inventory
            .filter(item => Number(item.warehouse_id) === Number(warehouseId))
            .reduce((sum, item) => sum + Number(item.current_stock || item.stock || 0), 0);
            
        const remaining = total - used;
        return {
            used,
            total,
            remaining: remaining < 0 ? 0 : remaining,
            percent: (used / total) * 100
        };
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Tên vật tư không được để trống";
        if (!formData.sku.trim()) newErrors.sku = "Mã SKU là bắt buộc";
        if (!formData.warehouse_id) newErrors.warehouse_id = "Vui lòng chọn kho";
        if (!formData.supplier_id) newErrors.supplier_id = "Vui lòng chọn nhà cung cấp";
        if (formData.current_stock === "") newErrors.current_stock = "Vui lòng nhập số lượng";
        if (formData.price === "") newErrors.price = "Vui lòng nhập giá";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDelete = async (id) => {
        if (window.confirm("⚠️ Ông có chắc chắn muốn xóa vật tư này không? Hành động này không thể hoàn tác!")) {
            try {
                // Thay đổi đường dẫn API tùy theo backend của ông (thường là /products/:id hoặc /inventory/:id)
                await api.delete(`/products/${id}`); 
                alert("Đã xóa thành công!");
                await loadData(); // Load lại dữ liệu để bảng cập nhật mới nhất
            } catch (err) {
                console.error("Lỗi khi xóa:", err);
                alert("Không thể xóa vật tư này. Vui lòng kiểm tra lại!");
            }
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

        // 1. ĐỊNH NGHĨA BIẾN (Đây là chỗ ông đang thiếu)
        const selectedWhId = Number(formData.warehouse_id);
        const inputQty = Number(formData.current_stock);

        // 2. LẤY THÔNG TIN KHO & CHẶN NGAY LẬP TỨC
        const info = getWarehouseInfo(selectedWhId);

        if (inputQty > info.remaining) {
            alert(
                `❌ KHO KHÔNG ĐỦ CHỖ!\n` +
                `--------------------------\n` +
                `Hiện tại chỉ còn trống: ${info.remaining} cái\n` +
                `Số lượng ông muốn nhập: ${inputQty} cái\n` +
                `--------------------------\n` +
                `Vui lòng nhập ít hơn hoặc chọn kho khác!`
            );
            return; // Dừng tại đây, không cho chạy xuống API bên dưới
        }

        // 3. VALIDATE CÁC TRƯỜNG CÒN LẠI (Tên, SKU, NCC...)
        if (!validateForm()) return;

        try {
            const dataToSend = {
                ...formData,
                price: Number(formData.price),
                current_stock: inputQty,
                min_stock_level: Number(formData.min_stock_level),
                warehouse_id: selectedWhId,
                supplier_id: Number(formData.supplier_id)
            };

            const response = await api.post("/products", dataToSend);
            
            if (response.data) {
                // 1. Đóng modal và reset form ngay lập tức cho người dùng rảnh tay
                setIsModalOpen(false);
                setFormData(initialFormState);
                alert("🎉 Nhập kho thành công!");

                // 2. CẬP NHẬT "MỀM" TRÊN GIAO DIỆN (KHÔNG LOAD LẠI TRANG)
                const newProduct = response.data.product || { ...dataToSend, id: Date.now() }; // Lấy data từ server trả về
                
                // Thêm vào danh sách hiện tại
                setInventory(prev => [newProduct, ...prev]);

                // 3. TỰ TÍNH LẠI CÁC CON SỐ STATS (Đỡ phải gọi API stats)
                setStatsData(prev => ({
                    ...prev,
                    total_types: (prev.total_types || 0) + 1,
                    total_value: (prev.total_value || 0) + (Number(dataToSend.price) * Number(dataToSend.current_stock))
                }));

                // 4. (Tùy chọn) Chạy loadData ngầm để đồng bộ chuẩn xác với DB
                // Không dùng await ở đây để nó chạy ngầm, không gây khựng
                loadData(); 
            }
        } catch (err) {
          console.error("Lỗi chi tiết:", err);
        
        // LẤY CÂU THÔNG BÁO TỪ BACKEND GỬI VỀ
        const serverMessage = err.response?.data?.message || "Lỗi không xác định khi nhập kho!";
        
        // Hiển thị thông báo lỗi thật (Ví dụ: "Kho không đủ chỗ!...")
        alert("❌ LỖI: " + serverMessage);
        }
    };
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || (item.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            const matchesWarehouse = filterWarehouse === "ALL" || String(item.warehouse_id) === String(filterWarehouse);
            return matchesSearch && matchesWarehouse;
        });
    }, [searchTerm, filterWarehouse, inventory]);

    return (
        <div className="animate-fade-in" style={{padding: '20px', backgroundColor: '#f4f7fe', minHeight: '100vh', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems: 'center'}}>
                <h1 style={{margin: 0, color: '#2b3674', fontSize: '24px', fontWeight: 'bold'}}>Hệ thống Quản lý Kho</h1>
               <button 
                    style={{padding: '12px 24px', background: '#4318FF', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}} 
                    onClick={async () => { 
                        setIsModalOpen(true);
                        setErrors({});
                         // Cho nó xoay xoay tí để lấy data mới
                        await loadData(); // Ép nó quét lại kho xem có ai vừa nhập 1000 cái chưa
                         
                    }}
                >
                    Nhập kho +
                </button>
            </div>

            {/* Stats Dashboard */}
            <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>TỔNG LOẠI</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2b3674' }}>{statsData?.total_types || 0}</div>
                </div>
                <div className="stat-card" style={{borderLeft: '4px solid #EE5D50'}}>
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>SẮP HẾT</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#EE5D50' }}>{statsData?.low_stock || 0}</div>
                </div>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>HẾT HÀNG</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFB547' }}>{statsData?.out_of_stock || 0}</div>
                </div>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>GIÁ TRỊ KHO</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#05CD99' }}>{new Intl.NumberFormat('vi-VN').format(statsData?.total_value || 0)}đ</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', background: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '20px' }}>
                <input type="text" placeholder="Tìm tên hoặc SKU..." style={{ flex: 2, padding: '12px', borderRadius: '10px', border: '1px solid #e0e5f2' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e0e5f2' }} value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}>
                    <option value="ALL">Tất cả kho</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead style={{background: '#f8f9fa'}}>
                        <tr>
                            <th style={{padding: '15px', textAlign: 'left', color: '#a3aed0'}}>VẬT TƯ</th>
                            <th style={{padding: '15px', textAlign: 'left', color: '#a3aed0'}}>VỊ TRÍ</th>
                            <th style={{padding: '15px', textAlign: 'left', color: '#a3aed0'}}>SỐ LƯỢNG</th>
                            <th style={{padding: '15px', textAlign: 'left', color: '#a3aed0'}}>TRẠNG THÁI</th>
                            <th style={{padding: '15px', textAlign: 'center', color: '#a3aed0'}}>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{padding: '50px', textAlign: 'center'}}><div className="spinner-mini" style={{margin:'auto'}}></div></td></tr>
                        ) : filteredInventory.map((item) => {
                            const stockVal = Number(item.current_stock ?? item.stock ?? item.quantity ?? 0);
                            const minVal = Number(item.min_stock_level ?? 10);
                            
                            let sttText = "CÒN HÀNG", sttColor = "#05CD99", sttBg = "#e6fff1";
                            if (stockVal <= 0) { sttText = "HẾT HÀNG"; sttColor = "#EE5D50"; sttBg = "#fff1f0"; }
                            else if (stockVal <= minVal) { sttText = "SẮP HẾT"; sttColor = "#FFB547"; sttBg = "#fff8ed"; }

                            return (
                                <tr key={item.id} style={{borderTop: '1px solid #f4f7fe'}}>
                                    <td style={{padding: '15px'}}>
                                        <div style={{fontWeight: 'bold', color: '#2b3674'}}>{item.name}</div>
                                        <div style={{fontSize: '12px', color: '#a3aed0'}}>{item.sku}</div>
                                    </td>
                                    <td style={{padding: '15px'}}>
                                        <div>📍 {warehouses.find(w => w.id == item.warehouse_id)?.name || 'N/A'}</div>
                                    </td>
                                    <td style={{padding: '15px'}}>
                                        <div style={{fontWeight: 'bold'}}>{stockVal} {item.unit || 'Cái'}</div>
                                        <div style={{fontSize: '11px', color: '#a3aed0'}}>{new Intl.NumberFormat('vi-VN').format(Number(item.price || 0))}đ</div>
                                    </td>
                                    <td style={{padding: '15px'}}>
                                        <span style={{padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: sttBg, color: sttColor}}>
                                            {sttText}
                                        </span>
                                    </td>
                                    <td style={{padding: '15px', textAlign: 'center'}}>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#fff',
                                                color: '#EE5D50',
                                                border: '1px solid #EE5D50',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => { e.target.style.background = '#EE5D50'; e.target.style.color = '#fff'; }}
                                            onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#EE5D50'; }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Nhập Kho */}
            {/* Modal Nhập Kho - Bản đầy đủ không thiếu ô nào */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ color: '#2b3674', marginTop: 0 }}>📦 Nhập vật tư mới</h2>
                        <form onSubmit={handleAddProduct}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {/* Hàng 1 */}
                                <div className="form-group">
                                    <label>Tên vật tư</label>
                                    <input className="form-input" style={{borderColor: errors.name ? '#EE5D50' : '#ddd'}} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Mã SKU</label>
                                    <input className="form-input" style={{borderColor: errors.sku ? '#EE5D50' : '#ddd'}}
                                        onChange={e => setFormData({...formData, sku: e.target.value})} />
                                    {errors.sku && <span className="error-text">{errors.sku}</span>}
                                </div>

                                {/* Hàng 2 */}
                                <div className="form-group">
                                    <label>Kho hàng</label>
                                    <select className="form-input" style={{borderColor: errors.warehouse_id ? '#EE5D50' : '#ddd'}}
                                        onChange={e => setFormData({...formData, warehouse_id: e.target.value})}>
                                        <option value="">-- Chọn kho --</option>
                                        {warehouses.map(w => {
                                            const info = getWarehouseInfo(w.id);
                                            return (
                                                <option key={w.id} value={w.id}>
                                                    {w.name} 
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {errors.warehouse_id && <span className="error-text">{errors.warehouse_id}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Nhà cung cấp</label>
                                    <select className="form-input" style={{borderColor: errors.supplier_id ? '#EE5D50' : '#ddd'}}
                                        onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                                        <option value="">-- Chọn NCC --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {errors.supplier_id && <span className="error-text">{errors.supplier_id}</span>}
                                </div>

                                {/* Hàng 3: Đưa số lượng tối thiểu vào đây */}
                                <div className="form-group">
                                    <label>Số lượng nhập</label>
                                    <input type="number" className="form-input" style={{borderColor: errors.current_stock ? '#EE5D50' : '#ddd'}}
                                        onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                                    {errors.current_stock && <span className="error-text">{errors.current_stock}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Số lượng tối thiểu (Cảnh báo hết hàng)</label>
                                    <input type="number" className="form-input" 
                                        value={formData.min_stock_level}
                                        onChange={e => setFormData({...formData, min_stock_level: e.target.value})} />
                                </div>

                                {/* Hàng 4 */}
                                <div className="form-group">
                                    <label>Giá nhập (đ)</label>
                                    <input type="number" className="form-input" style={{borderColor: errors.price ? '#EE5D50' : '#ddd'}}
                                        onChange={e => setFormData({...formData, price: e.target.value})} />
                                    {errors.price && <span className="error-text">{errors.price}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Đơn vị tính</label>
                                    <input className="form-input" value={formData.unit}
                                        onChange={e => setFormData({...formData, unit: e.target.value})} />
                                </div>
                                {/* Hàng 5: Loại vật tư (Enum) & Danh mục */}
                                <div className="form-group">
                                    <label>Loại hình vật tư</label>
                                    <select 
                                        className="form-input" 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        style={{ background: formData.type === 'RETURNABLE' ? '#fff5f5' : '#fff' }}
                                    >
                                        <option value="CONSUMABLE">📦 Tiêu hao</option>
                                        <option value="RETURNABLE">🔄 Thu hồi</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Danh mục sản phẩm</label>
                                    <input 
                                        className="form-input" 
                                        placeholder="VD: Linh kiện, Bảo hộ lao động..."
                                        value={formData.category_name}
                                        onChange={e => setFormData({...formData, category_name: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {/* Tìm đến đoạn nút bấm trong Modal và thay thế bằng đoạn này */}
                            <div style={{ marginTop: '25px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} 
                                    style={{padding:'10px 20px', borderRadius:'10px', border:'1px solid #ddd', background:'#fff'}}>Hủy</button>
                                
                                <button 
                                    type="submit" 
                                    disabled={Number(formData.current_stock) > getWarehouseInfo(formData.warehouse_id).remaining}
                                    style={{
                                        padding: '10px 25px', 
                                        background: Number(formData.current_stock) > getWarehouseInfo(formData.warehouse_id).remaining ? '#ccc' : '#4318FF', 
                                        color: '#fff', 
                                        border: 'none', 
                                        borderRadius: '10px', 
                                        fontWeight: 'bold',
                                        cursor: Number(formData.current_stock) > getWarehouseInfo(formData.warehouse_id).remaining ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {Number(formData.current_stock) > getWarehouseInfo(formData.warehouse_id).remaining ? 'Kho không đủ chỗ' : 'Xác nhận nhập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}