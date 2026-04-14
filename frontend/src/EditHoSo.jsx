import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChiTietHoSo, updateHoSo, getAllCategories } from "./hoSoService";
import { useToast } from "./Toast";
import Sidebar from "./Sidebar";
import './App.css';

const NAV_ITEMS = ["Bảng điều khiển", "Danh sách hồ sơ", "Danh mục dự án", "Báo cáo", "Tin tức", "Quản lý kho"];

const STATUS_LABELS = {
    DRAFT: "Chờ duyệt",
    PENDING: "Chờ duyệt",
    new: "Chờ duyệt",
    PROCESSING: "Đang xử lý",
    processing: "Đang xử lý",
    REVISION: "Chờ duyệt",
    COMPLETED: "Hoàn thành",
    done: "Hoàn thành"
};

const STATUS_COLORS = {
    'Chờ duyệt': { bg: '#fee2e2', color: '#dc2626' },
    'Đang xử lý': { bg: '#ffedd5', color: '#ea580c' },
    'Hoàn thành': { bg: '#dcfce7', color: '#16a34a' }
};

export default function EditHoSo({ setActiveAppNav, refreshData }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [project, setProject] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [lastUpdated, setLastUpdated] = useState('Chưa rõ');
    const [createdAt, setCreatedAt] = useState('15/10/2023');

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        address: ""
    });

    const [debouncedAddress, setDebouncedAddress] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedAddress(formData.address);
        }, 1200);
        return () => clearTimeout(timer);
    }, [formData.address]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [projData, cats] = await Promise.all([
                getChiTietHoSo(id),
                getAllCategories()
            ]);

            if (projData) {
                setProject(projData);
                setFormData({
                    name: projData.name || "",
                    category_id: projData.category_id || "",
                    address: projData.address || ""
                });

                if (projData.status_updated_at) {
                    setLastUpdated(new Date(projData.status_updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }));
                } else if (projData.updated_at) {
                    setLastUpdated(new Date(projData.updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }));
                }

                if (projData.created_at) {
                    setCreatedAt(new Date(projData.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }));
                }
            }
            if (cats) setCategories(cats.filter(c => c.status == 1));
            setLoading(false);
        };
        loadData();
    }, [id]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await updateHoSo(id, formData);
            if (refreshData) refreshData(); // Cập nhật lại state global ở App.jsx
            toast.success("Cập nhật hồ sơ thành công!");

            // Lấy lại data để có History và Status mới nhất
            const projData = await getChiTietHoSo(id);
            if (projData) {
                setProject(projData);
                if (projData.status_updated_at) {
                    setLastUpdated(new Date(projData.status_updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }));
                } else if (projData.updated_at) {
                    setLastUpdated(new Date(projData.updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }));
                }
            }
        } catch (error) {
            toast.error("Lỗi cập nhật: " + (error.response?.data?.message || ""));
        }
    };

    const modernStyles = {
        container: {
            padding: '40px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            animation: 'fadeIn 0.6s ease-out',
        },
        header: {
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
        },
        title: {
            fontSize: '32px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-1px',
            margin: '0 0 8px 0',
        },
        subtitle: {
            fontSize: '16px',
            color: '#64748b',
            margin: 0,
        },
        mainGrid: {
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr',
            gap: '32px',
            alignItems: 'start',
        },
        card: {
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            border: '1px solid #f1f5f9',
            marginBottom: '32px',
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        inputGroup: {
            marginBottom: '24px',
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
            borderRadius: '14px',
            border: '2px solid #f1f5f9',
            fontSize: '15px',
            color: '#0f172a',
            transition: 'all 0.2s',
            outline: 'none',
            background: '#f8fafc',
        },
        buttonPrimary: {
            background: '#2563eb',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '14px',
            border: 'none',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
        },
        buttonSecondary: {
            background: 'white',
            color: '#64748b',
            padding: '14px 24px',
            borderRadius: '14px',
            border: '2px solid #f1f5f9',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '12px',
        },
        statusBadge: (status) => ({
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: STATUS_COLORS[STATUS_LABELS[status]]?.bg || '#f1f5f9',
            color: STATUS_COLORS[STATUS_LABELS[status]]?.color || '#64748b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
        }),
        historyItem: {
            padding: '16px',
            borderLeft: '3px solid #e2e8f0',
            marginBottom: '16px',
            position: 'relative',
            background: '#f8fafc',
            borderRadius: '0 12px 12px 0',
        },
        historyDot: (active) => ({
            position: 'absolute',
            left: '-6px',
            top: '20px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: active ? '#2563eb' : '#cbd5e1',
            border: '2px solid white',
        })
    };

    if (loading)
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '16px', fontWeight: '600', color: '#64748b' }}>Đang tối ưu dữ liệu...</p>
            </div>
        );

    if (!project)
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <h3 style={{ color: '#1e293b' }}>Hồ sơ không tồn tại hoặc đã bị xóa.</h3>
                <button onClick={() => navigate(-1)} style={modernStyles.buttonSecondary}>← Quay lại trang chủ</button>
            </div>
        );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', width: '100%', overflowY: 'auto' }}>
            <div style={modernStyles.container}>
                {/* Header Section */}
                <header style={modernStyles.header}>
                    <div>
                        <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                            QUẢN LÝ DỰ ÁN › CHỈNH SỬA
                        </p>
                        <h1 style={modernStyles.title}>Hồ sơ thi công #{project.project_code}</h1>
                        <p style={modernStyles.subtitle}>Mã hệ thống: <span style={{ color: '#0f172a', fontWeight: '600' }}>{project.id}</span> • Khởi tạo: {createdAt}</p>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} style={modernStyles.buttonSecondary}>Hủy bỏ</button>
                        <button onClick={handleSave} style={modernStyles.buttonPrimary}>Cập nhật hồ sơ</button>
                    </div>
                </header>

                <div style={modernStyles.mainGrid}>
                    {/* Left Column: Editor */}
                    <main>
                        <div style={modernStyles.card}>
                            <h3 style={modernStyles.sectionTitle}>
                                <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '10px' }}>📄</span>
                                Nội dung chi tiết dự án
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={modernStyles.inputGroup}>
                                    <label style={modernStyles.label}>Tên gọi dự án</label>
                                    <input 
                                        style={modernStyles.input} 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleFormChange} 
                                        placeholder="VD: Căn hộ cao cấp Saigon Centre..."
                                    />
                                </div>
                                <div style={modernStyles.inputGroup}>
                                    <label style={modernStyles.label}>Loại hình công trình</label>
                                    <select 
                                        style={modernStyles.input} 
                                        name="category_id" 
                                        value={formData.category_id} 
                                        onChange={handleFormChange}
                                    >
                                        <option value="">— Chưa phân loại —</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={modernStyles.inputGroup}>
                                <label style={modernStyles.label}>Địa điểm thi công (Địa chỉ đầy đủ)</label>
                                <input 
                                    style={modernStyles.input} 
                                    name="address" 
                                    value={formData.address} 
                                    onChange={handleFormChange}
                                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                                />
                            </div>
                        </div>

                        <div style={modernStyles.card}>
                            <h3 style={modernStyles.sectionTitle}>
                                <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '10px' }}>📍</span>
                                Định vị không gian (Maps)
                            </h3>
                            <div style={{ height: '400px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                {debouncedAddress ? (
                                    <iframe
                                        width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                                        allowFullScreen title="Bản đồ"
                                    ></iframe>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', background: '#f8fafc' }}>
                                        <span style={{ fontSize: '40px', marginBottom: '16px' }}>🗺️</span>
                                        <p style={{ fontWeight: '600' }}>Nhập địa chỉ để tự động lấy định vị Google Maps</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* Right Column: Status & Stats */}
                    <aside>
                        <div style={modernStyles.card}>
                            <label style={modernStyles.label}>Trạng thái hiện tại</label>
                            <div style={{ marginTop: '16px' }}>
                                <div style={modernStyles.statusBadge(project.status)}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                                    {STATUS_LABELS[project.status] || 'Đang cập nhật'}
                                </div>
                            </div>
                            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', fontSize: '14px' }}>
                                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Ngày bắt đầu:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{createdAt}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Cập nhật lần cuối:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{lastUpdated}</span>
                                </div>
                            </div>
                        </div>

                        <div style={modernStyles.card}>
                            <h3 style={modernStyles.sectionTitle}>Nhật ký hồ sơ</h3>
                            <div style={{ maxHeight: '430px', overflowY: 'auto', paddingRight: '8px' }}>
                                {project.histories && project.histories.length > 0 ? (
                                    project.histories.map((h, i) => (
                                        <div key={i} style={modernStyles.historyItem}>
                                            <div style={modernStyles.historyDot(i === 0)}></div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                                                {h.action.includes('Thay đổi trạng thái sang') 
                                                    ? `Đổi trạng thái › ${STATUS_LABELS[h.action.split('"')[1]] || 'Mới'}`
                                                    : h.action}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>👤 {h.actor}</span>
                                                <span>{new Date(h.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(h.created_at).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Chưa có thay đổi nào được ghi lại.</p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}
