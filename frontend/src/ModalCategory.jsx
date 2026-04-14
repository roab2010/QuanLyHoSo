import React, { useState, useEffect } from "react";
import { getTemplatesByCategoryId } from "./hoSoService";

export default function ModalCategory({ onClose, onSubmit, editingCategory }) {
    const [form, setForm] = useState({ 
        category_code: "", 
        name: "", 
        status: 1 
    });
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Nếu là Sửa, đổ dữ liệu cũ vào Form và tải Quy trình
    useEffect(() => {
        if (editingCategory) {
            setForm({
                category_code: editingCategory.category_code || "",
                name: editingCategory.name || "",
                status: editingCategory.status ?? 1
            });

            // Tải quy trình mẫu (Template Tasks)
            loadTemplates(editingCategory.id);
        } else {
            setTemplates([]);
        }
    }, [editingCategory]);

    const loadTemplates = async (categoryId) => {
        setLoadingTemplates(true);
        try {
            const res = await getTemplatesByCategoryId(categoryId);
            // res.data chứa danh sách tasks mẫu
            setTemplates(res.data || []);
        } catch (error) {
            console.error("Lỗi tải quy trình mẫu:", error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleLocalSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h3>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleLocalSubmit}>
                    <div className="modal-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label className="form-label">Mã danh mục</label>
                                <input 
                                    className="form-input" 
                                    value={form.category_code} 
                                    onChange={e => setForm({...form, category_code: e.target.value})} 
                                    placeholder="VD: DM01"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="form-label">Trạng thái</label>
                                <select 
                                    className="form-input" 
                                    value={form.status} 
                                    onChange={e => setForm({...form, status: Number(e.target.value)})}
                                >
                                    <option value={1}>Đang hoạt động</option>
                                    <option value={0}>Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>
                        
                        <label className="form-label" style={{marginTop: '15px'}}>Tên danh mục</label>
                        <input 
                            className="form-input" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="Nhập tên..."
                            required 
                        />

                        {/* PHẦN HIỂN THỊ QUY TRÌNH (CHỈ KHI SỬA) */}
                        {editingCategory && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>⚙️ Quy trình mẫu (Template Tasks)</h4>
                                {loadingTemplates ? (
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Đang tải quy trình...</p>
                                ) : templates.length > 0 ? (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Tên công việc</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Khối lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {templates.map((t, idx) => (
                                                    <tr key={t.id || idx}>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{t.task_name}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{t.work_volume || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Chưa thiết lập quy trình cho danh mục này.</p>
                                )}
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>
                                    * Để chỉnh sửa quy trình mẫu, vui lòng sử dụng tính năng "Quản lý Quy trình" (đang phát triển).
                                </p>
                            </div>
                        )}
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
