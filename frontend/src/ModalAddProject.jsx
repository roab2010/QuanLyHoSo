import React, { useState, useEffect } from "react";
import { getAllCategories, getAllCustomers } from "./hoSoService"; 

export default function ModalAddProject({ onClose, onSubmit }) {
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: "",                   
        project_code: "",           
        start_date: (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(), 
        customer_id: "",            
        category_id: "",            
        address: "",                
        priority: "MEDIUM",         
        max_warehouse_capacity: 0,  
        supervisor_id: 1,           
        status: "DRAFT"             
    });

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                setLoading(true);
                const [catRes, custRes] = await Promise.all([
                    getAllCategories(),
                    getAllCustomers()
                ]);

                // Xử lý dữ liệu linh hoạt: lấy mảng trực tiếp hoặc từ .data
                const finalCats = Array.isArray(catRes) ? catRes : (catRes?.data || []);
                const finalCusts = Array.isArray(custRes) ? custRes : (custRes?.data || []);

                // Lọc chỉ giữ lại các danh mục Đang hoạt động (status = 1)
                setCategories(finalCats.filter(cat => cat.status === 1));
                setCustomers(finalCusts);
            } catch (e) {
                console.error("Lỗi tải dữ liệu metadata:", e);
            } finally {
                setLoading(false);
            }
        };
        loadMetadata();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Kiểm tra bắt buộc chọn Khách hàng và Loại dự án
        if (!formData.customer_id || !formData.category_id) {
            alert("Vui lòng chọn đầy đủ Khách hàng và Loại dự án!");
            return;
        }

        // Gửi toàn bộ formData đã chuẩn hóa tên cột sang App.jsx -> HoSo.js
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content project-modal">
                <div className="modal-header">
                    <h3>Thêm Hồ Sơ Dự Án Mới</h3>
                    <button type="button" className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {/* Tên dự án */}
                    <div className="form-group full-width">
                        <label>Tên dự án/hồ sơ *</label>
                        <input 
                            type="text" required 
                            placeholder="Nhập tên dự án..."
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>

                    {/* Mã hồ sơ và Ngày bắt đầu */}
                    <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Mã hồ sơ</label>
                            <input 
                                type="text" placeholder="HS-001" 
                                value={formData.project_code}
                                onChange={e => setFormData({...formData, project_code: e.target.value})} 
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Ngày bắt đầu</label>
                            <input 
                                type="date" required
                                value={formData.start_date}
                                onChange={e => setFormData({...formData, start_date: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Khách hàng và Loại dự án */}
                    <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Khách hàng *</label>
                            <select 
                                required 
                                value={formData.customer_id}
                                onChange={e => setFormData({...formData, customer_id: e.target.value})}
                            >
                                <option value="">-- Chọn khách hàng --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name || c.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Loại dự án *</label>
                            <select 
                                required 
                                value={formData.category_id}
                                onChange={e => setFormData({...formData, category_id: e.target.value})}
                            >
                                <option value="">-- Chọn loại dự án --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Độ ưu tiên và Công suất kho */}
                    <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Độ ưu tiên</label>
                            <select 
                                value={formData.priority}
                                onChange={e => setFormData({...formData, priority: e.target.value})}
                            >
                                <option value="LOW">Thấp (LOW)</option>
                                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                                <option value="HIGH">Cao (HIGH)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Công suất kho tối đa</label>
                            <input 
                                type="number" step="0.01"
                                placeholder="0.00"
                                value={formData.max_warehouse_capacity}
                                onChange={e => setFormData({...formData, max_warehouse_capacity: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="form-group full-width">
                        <label>Địa chỉ công trình</label>
                        <textarea 
                            rows="2" placeholder="Nhập địa chỉ chi tiết..."
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Đang tải..." : "Lưu hồ sơ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}