import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    User, 
    Fingerprint, 
    Phone, 
    Building2, 
    ShieldCheck, 
    Star, 
    Tag,
    Globe,
    CheckCircle2,
    X,
    AlertCircle,
    Award,
    Package
} from "lucide-react";

export default function ModalAddSupplier({ onClose, onSave, editingData }) {
    const [formData, setFormData] = useState({
        supplier_code: editingData ? "" : "NCC-",
        name: "",
        tax_code: "",
        phone: "",
        status: "ACTIVE",
        materials_string: ""
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editingData) setFormData({ 
            ...editingData,
            materials_string: "" // We don't edit existing materials here, they have their own modal
        });
    }, [editingData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
        // Xóa lỗi của field khi người dùng nhập lại
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const url = editingData 
                ? `http://127.0.0.1:8000/api/suppliers/${editingData.id}` 
                : "http://127.0.0.1:8000/api/suppliers";
            
            const method = editingData ? "put" : "post";
            const res = await axios[method](url, formData);
            
            onSave(res.data.data || res.data, editingData ? 'edit' : 'add');
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert("Lỗi: " + (error.response?.data?.message || "Thao tác thất bại"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal modal-wide">
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            background: '#eff6ff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#2563eb'
                        }}>
                            {editingData ? <Award size={24} /> : <User size={24} />}
                        </div>
                        <h3>{editingData ? "Cập nhật hồ sơ đối tác" : "Thêm nhà cung cấp mới"}</h3>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose} disabled={loading}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="sections-row">
                            {/* Column 1: Info & Contact */}
                            <div className="section-column">
                                <div className="form-section-title" style={{ marginTop: 0 }}>
                                    <Fingerprint size={16} /> Thông tin nhà cung cấp
                                </div>
                                
                                <div className="input-group-premium">
                                    <label>Mã NCC <span className="req-mark">*</span></label>
                                    <div className="form-input-wrapper" style={{ borderColor: errors.supplier_code ? '#EE5D50' : '' }}>
                                        <Tag size={18} />
                                        <input 
                                            name="supplier_code" 
                                            className="form-input"
                                            placeholder="Ví dụ: NCC-STEEL-001"
                                            value={formData.supplier_code} 
                                            onChange={handleChange} 
                                            required 
                                            disabled={!!editingData}
                                        />
                                    </div>
                                    {errors.supplier_code && <span style={{ color: '#EE5D50', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>⚠️ {errors.supplier_code[0]}</span>}
                                </div>

                                <div className="input-group-premium">
                                    <label>Tên nhà cung cấp <span className="req-mark">*</span></label>
                                    <div className="form-input-wrapper" style={{ borderColor: errors.name ? '#EE5D50' : '' }}>
                                        <Building2 size={18} />
                                        <input 
                                            name="name" 
                                            className="form-input"
                                            placeholder="Tên đơn vị cung cấp"
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    {errors.name && <span style={{ color: '#EE5D50', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>⚠️ {errors.name[0]}</span>}
                                </div>

                                <div className="input-group-premium">
                                    <label>Mã số thuế</label>
                                    <div className="form-input-wrapper" style={{ borderColor: errors.tax_code ? '#EE5D50' : '' }}>
                                        <ShieldCheck size={18} />
                                        <input 
                                            name="tax_code" 
                                            className="form-input"
                                            placeholder="10 hoặc 13 chữ số"
                                            value={formData.tax_code} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9-]/g, '');
                                                setFormData(p => ({...p, tax_code: val}));
                                            }} 
                                        />
                                    </div>
                                    {errors.tax_code && <span style={{ color: '#EE5D50', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>⚠️ {errors.tax_code[0]}</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                                    <div className="input-group-premium">
                                        <label>Số điện thoại <span className="req-mark">*</span></label>
                                        <div className="form-input-wrapper">
                                            <Phone size={18} />
                                            <input 
                                                name="phone" 
                                                className="form-input"
                                                placeholder="Ví dụ: 098..."
                                                value={formData.phone} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    if (val.length <= 11) setFormData(p => ({...p, phone: val}));
                                                }} 
                                                required
                                            />
                                        </div>
                                        {errors.phone && <span style={{ color: '#EE5D50', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>⚠️ {errors.phone[0]}</span>}
                                    </div>

                                    <div className="input-group-premium">
                                        <label>Trạng thái</label>
                                        <div className="form-input-wrapper">
                                            <CheckCircle2 size={18} />
                                            <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                                                <option value="ACTIVE">Đang hợp tác</option>
                                                <option value="SUSPENDED">Dừng hợp tác</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Materials */}
                            {!editingData && (
                                <div className="section-column">
                                    <div className="form-section-title" style={{ marginTop: 0 }}>
                                        <Package size={16} /> Lĩnh vực cung ứng (Tạo phiếu giá)
                                    </div>
                                    <div className="input-group-premium" style={{ height: 'calc(100% - 30px)' }}>
                                        <label>Danh sách vật tư (ngăn cách bởi dấu phẩy)</label>
                                        <div className="form-input-wrapper" style={{ height: 'calc(100% - 40px)' }}>
                                            <textarea 
                                                name="materials_string" 
                                                className="form-input"
                                                placeholder="Ví dụ: Thép hộp 40x80, Xi măng PCB40, Gạch ốp 60x60..."
                                                value={formData.materials_string} 
                                                onChange={handleChange} 
                                                style={{ height: '100%', minHeight: '180px', padding: '12px', paddingLeft: '14px', resize: 'none' }}
                                            />
                                        </div>
                                        <small style={{ color: '#64748b', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                                            Hệ thống sẽ tự động tạo phiếu giá 0đ cho các vật tư này để bạn cập nhật sau.
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="confirm-btn confirm-cancel" onClick={onClose} disabled={loading}>
                            Đóng lại
                        </button>
                        <button type="submit" className="confirm-btn confirm-ok" style={{ background: '#2563eb' }} disabled={loading}>
                            {loading ? "Đang xử lý..." : (editingData ? "Cập nhật hồ sơ" : "Lưu nhà cung cấp")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}