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

export default function EditHoSo({ setActiveAppNav }) {
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

    return (
        <div className="app">
            <Sidebar
                activeNav="Danh sách hồ sơ"
                setActiveNav={(nav) => {
                    if (setActiveAppNav) setActiveAppNav(nav);
                    navigate('/');
                }}
                NAV_ITEMS={NAV_ITEMS}
                onShowModal={() => { }}
            />
            <div className="main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', padding: '0', background: '#f8fafc' }}>
                {loading ? (
                    <div className="loading-screen" style={{ flex: 1 }}><div className="spinner"></div><p>Đang tải...</p></div>
                ) : !project ? (
                    <div className="loading-screen" style={{ flex: 1 }}><p>Không tìm thấy hồ sơ</p><button className="btn-back-main" onClick={() => navigate(-1)}>Quay lại</button></div>
                ) : (
                    <>
                        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Hồ sơ › Chỉnh sửa</div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#111827' }}>Chỉnh sửa hồ sơ #{project.project_code}</h2>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Cập nhật thông tin chi tiết dự án xây dựng.</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button style={{ background: 'none', border: 'none', color: '#6b7280', fontWeight: '500', marginRight: '16px', cursor: 'pointer' }} onClick={() => navigate(-1)}>Hủy</button>
                                <button style={{ background: '#0f52ba', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }} onClick={handleSave}>Cập nhật thay đổi</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '32px', padding: '32px', overflowY: 'auto', flex: 1 }}>
                            {/* Cột trái */}
                            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Box 1: Thông tin chung */}
                                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#111827' }}>
                                        <span style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a', color: 'white', borderRadius: '50%', fontSize: '14px', fontWeight: 'bold' }}>i</span>
                                        Thông tin chung
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>TÊN HỒ SƠ</label>
                                            <input className="form-input" name="name" value={formData.name} onChange={handleFormChange} style={{ background: '#f3f4f6', border: '1px solid transparent', borderRadius: '8px', padding: '12px 16px', width: '100%', fontSize: '15px' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>MÃ HỒ SƠ</label>
                                                <input className="form-input" value={project.project_code} disabled style={{ background: '#f9fafb', border: '1px solid transparent', borderRadius: '8px', padding: '12px 16px', width: '100%', color: '#6b7280', fontSize: '15px' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>LOẠI CÔNG TRÌNH</label>
                                                <select className="form-input" name="category_id" value={formData.category_id} onChange={handleFormChange} style={{ background: '#f3f4f6', border: '1px solid transparent', borderRadius: '8px', padding: '0 16px', height: '46px', width: '100%', fontSize: '15px', color: '#111827', boxSizing: 'border-box' }}>
                                                    <option value="">— Không phân loại —</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Box 2: Vị trí dự án */}
                                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#111827' }}>
                                        <span style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a', color: 'white', borderRadius: '50%', fontSize: '14px' }}>📍</span>
                                        Vị trí dự án
                                    </h3>
                                    <div style={{ display: 'flex', gap: '32px' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>ĐỊA CHỈ TỔNG HỢP</label>
                                                <input className="form-input" name="address" value={formData.address} onChange={handleFormChange} placeholder="123 Tên đường, Phường, Quận, Thành phố" style={{ background: '#f3f4f6', border: '1px solid transparent', borderRadius: '8px', padding: '12px 16px', width: '100%', fontSize: '15px' }} />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minHeight: '200px', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc' }}>
                                            {debouncedAddress ? (
                                                <iframe 
                                                    width="100%" 
                                                    height="100%" 
                                                    frameBorder="0" 
                                                    style={{ border: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
                                                    allowFullScreen
                                                    title="Bản đồ vị trí dự án"
                                                ></iframe>
                                            ) : (
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                                                    Vui lòng nhập địa chỉ để xem bản đồ
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải */}
                            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '320px' }}>
                                {/* Box 3: Trạng thái hồ sơ */}
                                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '16px', letterSpacing: '0.05em' }}>TRẠNG THÁI HỒ SƠ</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: STATUS_COLORS[STATUS_LABELS[project.status] || 'Chờ duyệt']?.bg || '#eff6ff', borderRadius: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '20px' }}>
                                            📋
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: STATUS_COLORS[STATUS_LABELS[project.status] || 'Chờ duyệt']?.color || '#1e3a8a', fontSize: '16px', marginBottom: '4px' }}>{STATUS_LABELS[project.status] || 'Chờ duyệt'}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Cập nhật lần cuối: {lastUpdated}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Box 4: Lịch sử cập nhật */}
                                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '24px', letterSpacing: '0.05em' }}>LỊCH SỬ CẬP NHẬT</label>
                                    <div style={{ position: 'relative', paddingLeft: '16px', overflowY: 'auto', maxHeight: '300px', flex: 1, paddingRight: '8px' }}>
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '3px', width: '2px', background: '#e5e7eb' }}></div>

                                        {project.histories && project.histories.length > 0 ? (
                                            project.histories.map((history, idx) => (
                                                <div key={idx} style={{ position: 'relative', marginBottom: idx === project.histories.length - 1 ? '0' : '20px' }}>
                                                    <div style={{ position: 'absolute', left: '-18px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: idx === 0 ? '#1e3a8a' : '#9ca3af', border: '2px solid white', boxShadow: `0 0 0 1px ${idx === 0 ? '#1e3a8a' : '#e5e7eb'}` }}></div>
                                                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '2px' }}>
                                                        {/* Translate status in history dynamically if it contains "Thay đổi trạng thái sang" */}
                                                        {history.action.includes('Thay đổi trạng thái sang')
                                                            ? `Thay đổi trạng thái sang "${STATUS_LABELS[history.action.split('"')[1]] || history.action.split('"')[1]}"`
                                                            : history.action}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        Bởi {history.actor} • {new Date(history.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', left: '-18px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', border: '2px solid white', boxShadow: '0 0 0 1px #e5e7eb' }}></div>
                                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '2px' }}>Khởi tạo hồ sơ mới</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Bởi Hệ thống tự động • {createdAt}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
