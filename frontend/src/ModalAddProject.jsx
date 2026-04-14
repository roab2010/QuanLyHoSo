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

    const modernStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease-out',
        },
        modal: {
            background: '#ffffff',
            width: '850px',
            borderRadius: '32px',
            padding: '34px 40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            animation: 'slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1)',
            maxHeight: '95vh',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE 10+
        },
        header: {
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        title: {
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-1px',
            margin: 0,
        },
        closeButton: {
            background: '#f1f5f9',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
        },
        formGroup: {
            marginBottom: '20px',
        },
        fullWidth: {
            gridColumn: '1 / -1',
        },
        label: {
            display: 'block',
            fontSize: '12px',
            fontWeight: '700',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
        },
        input: {
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: '2px solid #f1f5f9',
            fontSize: '15px',
            color: '#1e293b',
            background: '#f8fafc',
            outline: 'none',
            transition: 'all 0.2s',
        },
        footer: {
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
        },
        btnSave: {
            background: '#2563eb',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '16px',
            border: 'none',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.2s',
        },
        btnCancel: {
            background: 'white',
            color: '#64748b',
            padding: '16px 32px',
            borderRadius: '16px',
            border: '2px solid #f1f5f9',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }
    };

    return (
        <div style={modernStyles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modernStyles.modal}>
                <header style={modernStyles.header}>
                    <h2 style={modernStyles.title}>Tạo hồ sơ dự án mới</h2>
                    <button style={modernStyles.closeButton} onClick={onClose}>×</button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div style={modernStyles.formGrid}>
                        {/* Hàng 1: Tên dự án */}
                        <div style={{ ...modernStyles.formGroup, ...modernStyles.fullWidth }}>
                            <label style={modernStyles.label}>Tên dự án hoặc tên gọi hồ sơ *</label>
                            <input
                                style={modernStyles.input}
                                type="text" required
                                placeholder="VD: Thi công chung cư Alpha Hill..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                autoFocus
                            />
                        </div>

                        {/* Hàng 2: Mã và Ngày */}
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Mã hồ sơ tự động</label>
                            <input
                                style={{ ...modernStyles.input, background: '#f1f5f9', color: '#94a3b8' }}
                                type="text" placeholder="Hệ thống tự cấp..."
                                disabled
                            />
                        </div>
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Ngày khởi công dự kiến *</label>
                            <input
                                style={modernStyles.input}
                                type="date" required
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>

                        {/* Hàng 3: Khách hàng và Danh mục */}
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Chủ đầu tư / Khách hàng *</label>
                            <select
                                style={modernStyles.input}
                                required
                                value={formData.customer_id}
                                onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                            >
                                <option value="">— Lựa chọn đối tác —</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name || c.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Phân loại quy trình *</label>
                            <select
                                style={modernStyles.input}
                                required
                                value={formData.category_id}
                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">— Chọn danh mục dự án —</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Hàng 4: Ưu tiên và Công suất */}
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Mức độ ưu tiên *</label>
                            <select
                                style={modernStyles.input}
                                required
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="LOW">Thấp (LOW)</option>
                                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                                <option value="HIGH">CAO (HIGH)</option>
                            </select>
                        </div>
                        <div style={modernStyles.formGroup}>
                            <label style={modernStyles.label}>Dự toán kho vật tư (m³ / kg) *</label>
                            <input
                                style={modernStyles.input}
                                type="number" step="0.01" required
                                placeholder="Công suất tối đa..."
                                value={formData.max_warehouse_capacity}
                                onChange={e => setFormData({ ...formData, max_warehouse_capacity: e.target.value })}
                            />
                        </div>

                        {/* Hàng 5: Địa chỉ */}
                        <div style={{ ...modernStyles.formGroup, ...modernStyles.fullWidth }}>
                            <label style={modernStyles.label}>Địa chỉ triển khai công trình *</label>
                            <textarea
                                style={{ ...modernStyles.input, height: '100px', resize: 'none' }}
                                required
                                placeholder="Nhập địa chỉ chính xác để tích hợp bản đồ tự động..."
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <footer style={modernStyles.footer}>
                        <button type="button" style={modernStyles.btnCancel} onClick={onClose} disabled={loading}>Hủy bỏ</button>
                        <button 
                            type="submit" 
                            style={{ 
                                ...modernStyles.btnSave, 
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }} 
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Khởi tạo dự án ngay"}
                        </button>
                    </footer>
                </form>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(40px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    div::-webkit-scrollbar { display: none; }
                    select { appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,<svg%20width%3D"14"%20height%3D"8"%20viewBox%3D"0%200%2014%208"%20fill%3D"none"%20xmlns%3D"http%3A//www.w3.org/2000/svg"><path%20d%3D"M1%201L7%207L13%201"%20stroke%3D"%2394A3B8"%20stroke-width%3D"2"%20stroke-linecap%3D"round"%20stroke-linejoin%3D"round"/></svg>'); background-repeat: no-repeat; background-position: right 20px center; }
                `}</style>
            </div>
        </div>
    );
}