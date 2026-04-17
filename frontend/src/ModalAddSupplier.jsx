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
        supplier_code: "",
        name: "",
        tax_code: "",
        phone: "",
        status: "ACTIVE",
        is_strategic: false,
        rating_stars: 5,
        evaluation_tag: "TIN_CAY",
        materials_string: ""
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingData) setFormData({ 
            ...editingData,
            is_strategic: Boolean(editingData.is_strategic),
            materials_string: "" // We don't edit existing materials here, they have their own modal
        });
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
            evaluation_tag: tag 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
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
            alert("Lỗi: " + (error.response?.data?.message || "Thao tác thất bại"));
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
                        <div className="sections-container">
                            
                            {/* Row 1: Định danh & Liên hệ */}
                            <div className="sections-row">
                                {/* Column 1: Identity */}
                                <div className="section-column">
                                    <div className="form-section-title" style={{ marginTop: 0 }}>
                                        <Fingerprint size={16} /> Thông tin định danh
                                    </div>
                                    
                                    <div className="input-group-premium">
                                        <label>Mã NCC <span className="req-mark">*</span></label>
                                        <div className="form-input-wrapper">
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
                                    </div>

                                    <div className="input-group-premium">
                                        <label>Mã số thuế</label>
                                        <div className="form-input-wrapper">
                                            <ShieldCheck size={18} />
                                            <input 
                                                name="tax_code" 
                                                className="form-input"
                                                placeholder="Nhập mã số thuế doanh nghiệp"
                                                value={formData.tax_code} 
                                                onChange={handleChange} 
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group-premium">
                                        <label>Tên nhà cung cấp <span className="req-mark">*</span></label>
                                        <div className="form-input-wrapper">
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
                                    </div>
                                </div>

                                {/* Column 2: Contact */}
                                <div className="section-column">
                                    <div className="form-section-title" style={{ marginTop: 0 }}>
                                        <Globe size={16} /> Liên hệ & Phân loại
                                    </div>

                                    <div className="input-group-premium">
                                        <label>Số điện thoại <span className="req-mark">*</span></label>
                                        <div className="form-input-wrapper">
                                            <Phone size={18} />
                                            <input 
                                                name="phone" 
                                                className="form-input"
                                                placeholder="Số hotline/di động (Bắt buộc)"
                                                value={formData.phone} 
                                                onChange={handleChange} 
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group-premium">
                                        <label>Trạng thái hợp tác</label>
                                        <div className="form-input-wrapper">
                                            <CheckCircle2 size={18} />
                                            <select 
                                                name="status" 
                                                className="form-input" 
                                                value={formData.status} 
                                                onChange={handleChange}
                                            >
                                                <option value="ACTIVE">Đang hợp tác (Active)</option>
                                                <option value="PENDING">Đang chờ (Pending)</option>
                                                <option value="SUSPENDED">Tạm dừng (Suspended)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Đánh giá & Vật tư */}
                            <div className="sections-row">
                                <div className="section-column">
                                    <div className="form-section-title" style={{ marginTop: 0 }}>
                                        <Star size={16} /> Đánh giá năng lực
                                    </div>
                                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="input-group-premium">
                                            <label>Xếp hạng</label>
                                            <div className="form-input-wrapper">
                                                <Star size={18} />
                                                <select 
                                                    name="rating_stars" 
                                                    className="form-input" 
                                                    value={Math.floor(formData.rating_stars)} 
                                                    onChange={handleRatingChange}
                                                >
                                                    <option value="5">⭐⭐⭐⭐⭐</option>
                                                    <option value="4">⭐⭐⭐⭐</option>
                                                    <option value="3">⭐⭐⭐</option>
                                                    <option value="2">⭐⭐</option>
                                                    <option value="1">⭐</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-group-premium">
                                            <label>Nhãn hệ thống</label>
                                            <div className="form-input-wrapper">
                                                <Award size={18} />
                                                <input 
                                                    name="evaluation_tag" 
                                                    className="form-input"
                                                    value={
                                                        formData.evaluation_tag === 'TIN_CAY' ? 'TIN CẬY' :
                                                        formData.evaluation_tag === 'TIEM_NANG' ? 'TIỀM NĂNG' :
                                                        'CẦN XEM XÉT'
                                                    }
                                                    readOnly 
                                                    style={{ 
                                                        background: '#f8fafc', 
                                                        fontWeight: '800', 
                                                        color: formData.evaluation_tag === 'CAN_XEM_SET' ? '#ee5d50' : '#05cd99' 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strategic Toggle */}
                                    <div className="full-width" style={{ marginTop: '16px' }}>
                                        <label className="strategic-toggle">
                                            <input 
                                                type="checkbox" 
                                                name="is_strategic" 
                                                checked={formData.is_strategic} 
                                                onChange={handleChange} 
                                            />
                                            <Star size={18} fill={formData.is_strategic ? "#FFB547" : "none"} color={formData.is_strategic ? "#FFB547" : "#a3aed0"} />
                                            <span>Đánh dấu Đối tác Chiến lược</span>
                                        </label>
                                    </div>
                                </div>

                                {!editingData && (
                                    <div className="section-column">
                                        <div className="form-section-title" style={{ marginTop: 0 }}>
                                            <Package size={16} /> Lĩnh vực cung ứng (Tạo phiếu giá)
                                        </div>
                                        <div className="input-group-premium" style={{ height: '100%' }}>
                                            <label>Danh sách vật tư (ngăn cách bởi dấu phẩy)</label>
                                            <div className="form-input-wrapper" style={{ height: '100%' }}>
                                                <textarea 
                                                    name="materials_string" 
                                                    className="form-input"
                                                    placeholder="Ví dụ: Thép hộp 40x80, Xi măng PCB40, Gạch ốp 60x60..."
                                                    value={formData.materials_string} 
                                                    onChange={handleChange} 
                                                    style={{ height: '100%', minHeight: '120px', padding: '12px', paddingLeft: '14px' }}
                                                />
                                            </div>
                                            <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                                                Hệ thống sẽ tự động tạo phiếu giá 0đ cho các vật tư này để bạn cập nhật sau.
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>

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