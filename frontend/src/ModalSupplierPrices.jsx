import React, { useState, useRef } from "react";
import axios from "axios";
import { X, PackagePlus, Save, History, Tag, Edit3, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";

export default function ModalSupplierPrices({ supplier, onClose, onRefresh }) {
    const [materials, setMaterials] = useState(supplier.materials || []);
    const [loading, setLoading] = useState(false);
    
    // States for adding new material
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ material_name: "", unit: "", current_price: "" });

    // States for editing price
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editData, setEditData] = useState({ new_price: 0, note: "", unit: "" });

    // States for viewing history
    const [historyMaterialId, setHistoryMaterialId] = useState(null);
    
    const fileInputRef = useRef(null);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/suppliers/${supplier.id}/materials`, newMaterial);
            setMaterials([...materials, res.data.data]);
            setShowAddForm(false);
            setNewMaterial({ material_name: "", unit: "", current_price: "" });
            if (onRefresh) onRefresh();
        } catch (error) {
            alert("Lỗi thêm vật tư: " + (error.response?.data?.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleEditPriceSave = async (materialId) => {
        setLoading(true);
        try {
            const res = await axios.put(`http://127.0.0.1:8000/api/supplier-materials/${materialId}/price`, editData);
            const updatedMaterial = res.data.data;
            setMaterials(materials.map(m => m.id === materialId ? updatedMaterial : m));
            setEditingMaterialId(null);
            if (onRefresh) onRefresh();
        } catch (error) {
            alert("Lỗi cập nhật giá: " + (error.response?.data?.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (materialId) => {
        if (!window.confirm("Bạn có chắc muốn xóa vật tư này khỏi phiếu giá?")) return;
        setLoading(true);
        try {
            await axios.delete(`http://127.0.0.1:8000/api/supplier-materials/${materialId}`);
            setMaterials(materials.filter(m => m.id !== materialId));
            if (onRefresh) onRefresh();
        } catch (error) {
            alert("Lỗi xóa vật tư");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                // Lọc và chuẩn hóa data (Làm cho việc nhận diện cột linh hoạt hơn)
                const payload = jsonData.map(row => {
                    // Chuẩn hóa tất cả key (tiêu đề cột) về chữ thường và xóa khoảng trắng thừa
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = String(key).trim().toLowerCase();
                        normalizedRow[normalizedKey] = row[key];
                    });

                    // Hàm tìm giá trị dựa trên danh sách các tên cột khả thi
                    const findValue = (possibleNames) => {
                        for (let name of possibleNames) {
                            if (normalizedRow[name] !== undefined && normalizedRow[name] !== "") {
                                return normalizedRow[name];
                            }
                        }
                        return "";
                    };

                    const nameStr = findValue(['tên vật tư', 'tên', 'tên sản phẩm', 'vật tư', 'material', 'name', 'material name']);
                    const unitStr = findValue(['đơn vị', 'đơn vị tính', 'đv', 'dvt', 'unit']);
                    const priceValue = findValue(['giá', 'giá tiền', 'giá hiện tại', 'đơn giá', 'price', 'rate']);
                    
                    // Xử lý giá tiền (xóa ký tự không phải số như VNĐ, dấu phẩy...)
                    const cleanPrice = String(priceValue).replace(/[^0-9.]/g, "");
                    
                    return {
                        material_name: String(nameStr).trim(),
                        unit: String(unitStr).trim() || "Cái",
                        current_price: cleanPrice ? Number(cleanPrice) : 0,
                        changed_at: new Date().toISOString()
                    };
                }).filter(item => item.material_name.length > 0);

                if (payload.length === 0) {
                    alert("Không tìm thấy dữ liệu hợp lệ! Vui lòng kiểm tra tiêu đề các cột (Tên vật tư, Đơn vị, Giá).");
                    setLoading(false);
                    return;
                }

                const res = await axios.post(`http://127.0.0.1:8000/api/suppliers/${supplier.id}/materials/bulk`, {
                    materials: payload
                });

                alert(res.data.message);
                setMaterials(res.data.data.materials || []);
                if (onRefresh) onRefresh();

            } catch (err) {
                console.error(err);
                alert("Lỗi xử lý file Excel: " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa có";
        const d = new Date(dateString);
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'});
    };

    return (
        <div className="modal-overlay">
            <div className="modal modal-wide" style={{ width: '800px', maxWidth: '95%' }}>
                <div className="modal-header" style={{ paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag size={20} color="#2563eb" /> Phiếu giá: {supplier.name}
                        </h3>
                        <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                            Mã: {supplier.supplier_code} | Quản lý giá vật tư & lịch sử thay đổi
                        </span>
                    </div>
                    <button className="modal-close" onClick={onClose} disabled={loading}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ background: '#f8fafc', padding: '20px' }}>
                    
                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#1b2559' }}>
                            Tổng số: {materials.length} vật tư
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls, .csv" 
                                style={{ display: 'none' }} 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                style={{ background: '#fff', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
                            >
                                <Upload size={16} /> Import Excel/CSV
                            </button>
                            <button 
                                onClick={() => setShowAddForm(!showAddForm)}
                                disabled={loading}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
                            >
                                <PackagePlus size={16} /> Nhập thủ công
                            </button>
                        </div>
                    </div>

                    {/* Add Form Refined - Using DIV instead of FORM to bypass global CSS overrides */}
                    {showAddForm && (
                        <div style={{ 
                            background: '#fff', 
                            padding: '24px', 
                            borderRadius: '16px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            border: '1px solid #e2e8f0', 
                            marginBottom: '24px',
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 100px',
                            gap: '20px',
                            alignItems: 'flex-end',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div className="input-group-premium" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1b2559', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Tag size={14} /> Tên vật tư <span style={{ color: '#ee5d50' }}>*</span>
                                </label>
                                <input 
                                    required 
                                    className="form-input" 
                                    style={{ width: '100%', height: '42px', paddingLeft: '14px' }} 
                                    placeholder="VD: Thép xây dựng D10" 
                                    value={newMaterial.material_name} 
                                    onChange={e => setNewMaterial({...newMaterial, material_name: e.target.value})} 
                                />
                            </div>
                            <div className="input-group-premium" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1b2559', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    Đơn vị tính <span style={{ color: '#ee5d50' }}>*</span>
                                </label>
                                <input 
                                    required 
                                    className="form-input" 
                                    style={{ width: '100%', height: '42px', paddingLeft: '14px' }} 
                                    placeholder="VD: kg, cây..." 
                                    value={newMaterial.unit} 
                                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} 
                                />
                            </div>
                            <div className="input-group-premium" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1b2559', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    Giá khởi tạo <span style={{ color: '#ee5d50' }}>*</span>
                                </label>
                                <input 
                                    required 
                                    type="number" 
                                    className="form-input" 
                                    style={{ width: '100%', height: '42px', textAlign: 'right', paddingRight: '14px' }} 
                                    min="0" 
                                    placeholder="0" 
                                    value={newMaterial.current_price} 
                                    onChange={e => setNewMaterial({...newMaterial, current_price: e.target.value})} 
                                />
                            </div>
                            <button 
                                onClick={handleAddSubmit}
                                disabled={loading} 
                                style={{ 
                                    background: 'linear-gradient(135deg, #05cd99 0%, #04b486 100%)', 
                                    color: '#fff', 
                                    border: 'none', 
                                    height: '42px', 
                                    width: '100%',
                                    borderRadius: '12px', 
                                    cursor: 'pointer', 
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(5, 205, 153, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? "..." : <><PackagePlus size={18} /> Thêm</>}
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e5f2', overflow: 'hidden' }}>
                        <table className="v3-table-clean" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e0e5f2' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>TÊN VẬT TƯ</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>ĐƠN VỊ</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>GIÁ HIỆN TẠI</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px 20px', color: '#a3aed0' }}>
                                            Chưa có vật tư nào trong phiếu giá. Hãy thêm mới.
                                        </td>
                                    </tr>
                                ) : materials.map((mat) => (
                                    <React.Fragment key={mat.id}>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px', fontWeight: 600, color: '#1b2559' }}>{mat.material_name}</td>
                                            <td style={{ padding: '16px', color: '#64748b' }}>{mat.unit || '---'}</td>
                                            
                                            {/* Price Column */}
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                {editingMaterialId === mat.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            style={{ width: '140px', height: '32px', textAlign: 'right' }} 
                                                            value={editData.new_price} 
                                                            onChange={e => setEditData({...editData, new_price: e.target.value})}
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="form-input" 
                                                            style={{ width: '140px', height: '28px', fontSize: '12px' }} 
                                                            placeholder="Ghi chú (Tùy chọn)"
                                                            value={editData.note} 
                                                            onChange={e => setEditData({...editData, note: e.target.value})}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>{formatCurrency(mat.current_price)}</div>
                                                        <div style={{ fontSize: '11px', color: '#a3aed0' }}>Cập nhật: {formatDate(mat.updated_at)}</div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions Column */}
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    {editingMaterialId === mat.id ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleEditPriceSave(mat.id)}
                                                                style={{ background: '#05cd99', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                                                title="Lưu giá mới"
                                                            ><Save size={16} /></button>
                                                            <button 
                                                                onClick={() => setEditingMaterialId(null)}
                                                                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                                            ><X size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingMaterialId(mat.id);
                                                                    setEditData({ new_price: mat.current_price, note: "", unit: mat.unit || "" });
                                                                }}
                                                                style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                                                title="Báo giá mới"
                                                            ><Edit3 size={16} /></button>
                                                            
                                                            <button 
                                                                onClick={() => setHistoryMaterialId(historyMaterialId === mat.id ? null : mat.id)}
                                                                style={{ background: historyMaterialId === mat.id ? '#1b2559' : '#f8fafc', color: historyMaterialId === mat.id ? '#fff' : '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                                                title="Lịch sử giá"
                                                            ><History size={16} /></button>

                                                            <button 
                                                                onClick={() => handleDelete(mat.id)}
                                                                style={{ background: '#fef2f2', color: '#ee5d50', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                                                title="Xóa vật tư"
                                                            ><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* History Dropdown row */}
                                        {historyMaterialId === mat.id && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: 0 }}>
                                                    <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1b2559' }}>Lịch sử biến động giá</h4>
                                                        {(!mat.price_histories || mat.price_histories.length === 0) ? (
                                                            <span style={{ fontSize: '13px', color: '#64748b' }}>Chưa có biến động giá.</span>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {mat.price_histories.map((h, i) => (
                                                                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px outset #f0f2f8' }}>
                                                                        <div style={{ color: '#64748b', fontSize: '12px', minWidth: '140px' }}>
                                                                            {formatDate(h.changed_at)}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <span style={{ color: '#a3aed0', textDecoration: 'line-through' }}>{formatCurrency(h.old_price)}</span>
                                                                            <span>→</span>
                                                                            <span style={{ color: '#10b981', fontWeight: 700 }}>{formatCurrency(h.new_price)}</span>
                                                                        </div>
                                                                        {h.note && (
                                                                            <div style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#475569' }}>
                                                                                {h.note}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
