import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ModalAddSupplier({ onClose, onSave, editingData }) {
    const [formData, setFormData] = useState({
        supplier_code: "",
        name: "",
        tax_code: "",
        main_material_type: "",
        phone: "",
        email: "",
        status: "active",
        is_strategic: false,
        rating_stars: 5,
        evaluation_tag: "Tin cậy"
    });

    useEffect(() => {
        if (editingData) setFormData({ ...editingData });
    }, [editingData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };
    const handleRatingChange = (e) => {
        const stars = parseFloat(e.target.value);
        let tag = "";

        // Logic phân loại của ông
        if (stars >= 5) {
            tag = "TIN_CAY";
        } else if (stars >= 3) {
            tag = "TIEM_NANG";
        } else {
            tag = "CAN_XEM_SET";
        }

        setFormData({
            ...formData,
            rating_stars: stars,
            evaluation_tag: tag // Tự động cập nhật nhãn
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingData 
                ? `http://127.0.0.1:8000/api/suppliers/${editingData.id}` 
                : "http://127.0.0.1:8000/api/suppliers";
            
            const method = editingData ? "put" : "post";
            const res = await axios[method](url, formData);
            
            onSave(res.data.data, editingData ? 'edit' : 'add');
            onClose();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Thao tác thất bại"));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editingData ? "✏️ Cập nhật Đối tác" : "👤 Thêm Nhà Cung Cấp"}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Mã NCC {editingData && "(Cố định)"}</label>
                            <input 
                                name="supplier_code" 
                                value={formData.supplier_code} 
                                onChange={handleChange} 
                                required 
                                disabled={!!editingData} // Khóa khi sửa
                                style={editingData ? {backgroundColor: '#eee'} : {}}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tên nhà cung cấp *</label>
                            <input name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                       <div className="form-group">
                            <label>Trạng thái</label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange}
                            >
                                <option value="ACTIVE">Đang hợp tác (ACTIVE)</option>
                                <option value="SUSPENDED">Tạm dừng (SUSPEND)</option>
                                <option value="PENDING">Đang chờ (PENDING)</option>
                            </select>
                        </div>
                            <div className="form-group">
                            <label>Đánh giá: {formData.rating_stars} Sao</label>
                            <select 
                                name="rating_stars" 
                                value={formData.rating_stars} 
                                onChange={handleRatingChange} // Dùng hàm mới này
                            >
                                <option value="5">5.0 Sao (Tin cậy)</option>
                                <option value="4">4.0 Sao (Tiềm năng)</option>
                                <option value="3">3.0 Sao (Tiềm năng)</option>
                                <option value="2">2.0 Sao (Cần xem xét)</option>
                                <option value="1">1.0 Sao (Cần xem xét)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Nhãn đánh giá (Tự động)</label>
                            <input 
                                name="evaluation_tag" 
                                value={formData.evaluation_tag} 
                                readOnly // Khóa lại không cho nhập tay để đảm bảo logic đúng
                                style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phân loại vật tư</label>
                            <input name="main_material_type" value={formData.main_material_type} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{marginTop: '15px'}}>
                        <input type="checkbox" name="is_strategic" checked={formData.is_strategic} onChange={handleChange} id="stra" />
                        <label htmlFor="stra" style={{marginLeft: '8px'}}>Nhà cung cấp chiến lược ⭐</label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-save">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
}