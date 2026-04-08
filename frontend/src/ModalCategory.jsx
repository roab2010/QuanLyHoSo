import React, { useState, useEffect } from "react";

export default function ModalCategory({ onClose, onSubmit, editingCategory }) {
    const [form, setForm] = useState({ 
        category_code: "", 
        name: "", 
        status: 1 
    });

    // Nếu là Sửa, đổ dữ liệu cũ vào Form
    useEffect(() => {
        if (editingCategory) {
            setForm({
                category_code: editingCategory.category_code || "",
                name: editingCategory.name || "",
                status: editingCategory.status ?? 1
            });
        }
    }, [editingCategory]);

    const handleLocalSubmit = (e) => {
        e.preventDefault(); // QUAN TRỌNG: Ngăn trang web load lại
        onSubmit(form);     // Gửi dữ liệu đi
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h3>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleLocalSubmit}>
                    <div className="modal-body">
                        <label className="form-label">Mã danh mục</label>
                        <input 
                            className="form-input" 
                            value={form.category_code} 
                            onChange={e => setForm({...form, category_code: e.target.value})} 
                            placeholder="VD: DM01"
                            required 
                        />
                        
                        <label className="form-label" style={{marginTop: '10px'}}>Tên danh mục</label>
                        <input 
                            className="form-input" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="Nhập tên..."
                            required 
                        />
                        
                        <label className="form-label" style={{marginTop: '10px'}}>Trạng thái</label>
                        <select 
                            className="form-input" 
                            value={form.status} 
                            onChange={e => setForm({...form, status: Number(e.target.value)})}
                        >
                            <option value={1}>Đang hoạt động</option>
                            <option value={0}>Ngừng hoạt động</option>
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit">Lưu dữ liệu</button>
                    </div>
                </form>
            </div>
        </div>
    );
}