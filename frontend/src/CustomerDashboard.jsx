import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "./Toast";

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("customer_user") || "null"));
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Status Logic sync with Backend
    const STATUS_LABELS = {
        'DRAFT': 'Chờ duyệt',
        'PENDING': 'Chờ duyệt',
        'new': 'Chờ duyệt',
        'PROCESSING': 'Đang xử lý',
        'processing': 'Đang xử lý',
        'REVISION': 'Chờ duyệt',
        'COMPLETED': 'Hoàn thành',
        'done': 'Hoàn thành',
        'DONE': 'Hoàn thành'
    };

    const STATUS_COLORS = {
        'Chờ duyệt': { bg: '#fee2e2', color: '#dc2626' },
        'Đang xử lý': { bg: '#ffedd5', color: '#ea580c' },
        'Hoàn thành': { bg: '#dcfce7', color: '#16a34a' }
    };

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        image: user?.image || ""
    });
    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [news, setNews] = useState([]);
    const [activeView, setActiveView] = useState("overview"); // overview or news

    // Update profileData when user state changes (e.g. after login/refresh)
    useEffect(() => {
        if (user) {
            setProfileData({
                full_name: user.full_name || "",
                email: user.email || "",
                phone: user.phone || "",
                image: user.image || ""
            });
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }

        const fetchProjects = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/api/customer/projects/${user.id}`);
                setProjects(res.data);
            } catch (err) {
                console.error("Lỗi lấy dự án khách hàng:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchNews = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/api/news`);
                setNews(res.data);
            } catch (err) {
                console.error("Lỗi lấy tin tức:", err);
            }
        };

        fetchProjects();
        fetchNews();
    }, [user, navigate]);

    if (!user) return null;

    const handleLogout = () => {
        localStorage.removeItem("customer_user");
        navigate("/");
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('full_name', profileData.full_name);
        formData.append('email', profileData.email);
        formData.append('phone', profileData.phone);
        if (profileData.address) formData.append('address', profileData.address);

        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/customer/profile/${user.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === "success") {
                const updatedUser = { ...user, ...res.data.user };
                localStorage.setItem("customer_user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                toast.success("Đã cập nhật ảnh đại diện");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi upload ảnh đại diện: " + (err.response?.data?.message || "Lỗi hệ thống"));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/customer/profile/${user.id}`, profileData);
            if (res.data.status === "success") {
                const updatedUser = { ...user, ...res.data.user };
                localStorage.setItem("customer_user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setShowProfileModal(false);
                toast.success("Cập nhật hồ sơ thành công!");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi cập nhật hồ sơ");
        } finally {
            setUpdating(false);
        }
    };

    const getProjectProgress = (proj) => {
        if (!proj.tasks || proj.tasks.length === 0) return proj.status === 'DONE' ? 100 : 0;
        const completed = proj.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'done' || t.status === 'DONE').length;
        return Math.round((completed / proj.tasks.length) * 100);
    };

    const filteredProjects = projects.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.project_code && p.project_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const mainProject = projects[0];
    const mainProgress = mainProject ? getProjectProgress(mainProject) : 0;

    const dummyActivities = [
        { id: 'h1', name: 'DocuVault', time: 'Hôm nay', status: 'DONE', msg: 'Hệ thống đã sẵn sàng tối ưu hóa hồ sơ của bạn.' },
        { id: 'h2', name: 'Khởi tạo', time: 'Hôm qua', status: 'DONE', msg: 'Dữ liệu sơ bộ của dự án đã được đồng bộ.' },
        { id: 'h3', name: 'Platinum', time: '2 ngày trước', status: 'DONE', msg: 'Tài khoản của bạn đã được xác minh Platinum.' }
    ];

    const currentActivities = mainProject?.tasks?.length > 0 
        ? mainProject.tasks.slice(0, 3).map(t => ({ 
            id: t.id, 
            name: t.name, 
            time: t.updated_at ? new Date(t.updated_at).toLocaleDateString('vi-VN') : 'Mới đây',
            status: t.status,
            msg: t.status === 'DONE' || t.status === 'COMPLETED' ? 'Công việc đã hoàn thành.' : 'Đang triển khai thực tế.'
        }))
        : dummyActivities;

    const handleProjectFileUpload = async (projectId, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/customer/projects/${projectId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === "success") {
                toast.success("Đã gửi hồ sơ/ảnh thành công! Hồ sơ này sẽ được kĩ sư duyệt.");
            }
        } catch (err) {
            toast.error("Lỗi khi gửi hồ sơ: " + (err.response?.data?.error || "Lỗi hệ thống"));
        }
    };

    return (
        <div className="dash-root-v3">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            
            {/* Sidebar */}
            <aside className="dash-aside">
                <div className="aside-brand">
                    <div className="brand-icon">D</div>
                    <span className="brand-name">DocuVault</span>
                </div>

                <div className="aside-focus">
                    <div className="focus-chip">
                        <span className="material-symbols-outlined">apartment</span>
                    </div>
                    <div>
                        <small>DỰ ÁN HIỆN TẠI</small>
                        <h5>{mainProject?.name || "Thanh Xuân Complex"}</h5>
                    </div>
                </div>

                <nav className="aside-nav">
                    <div className="nav-sect">
                        <label>MENU</label>
                        <button 
                            className={`nav-btn-v3 ${activeView === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveView('overview')}
                        >
                            <span className="material-symbols-outlined">grid_view</span> Tổng quan
                        </button>
                        <button 
                            className={`nav-btn-v3 ${activeView === 'news' ? 'active' : ''}`}
                            onClick={() => setActiveView('news')}
                        >
                            <span className="material-symbols-outlined">newspaper</span> Tin tức thị trường
                        </button>
                    </div>

                    <div className="nav-sect">
                        <label>QUẢN TRỊ</label>
                        <button className="nav-btn-v3" onClick={() => setShowProfileModal(true)}><span className="material-symbols-outlined">shield_person</span> Cài đặt hồ sơ</button>
                        <button className="nav-btn-v3 red" onClick={handleLogout}><span className="material-symbols-outlined">logout</span> Đăng xuất</button>
                    </div>
                </nav>

                <div className="aside-card">
                    <div className="card-v3-inner">
                        <div className="card-v3-text">
                            <h5>Thành viên Platinum</h5>
                            <p>Dịch vụ ưu tiên 24/7</p>
                        </div>
                        <span className="material-symbols-outlined verified-badge">verified</span>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <div className="dash-main">
                <header className="main-header">
                    <div className="header-search">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Tìm kiến dự án, hồ sơ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="header-user">
                        <div className="user-info">
                            <strong>{user.full_name || user.username}</strong>
                            <p>Premium Customer</p>
                        </div>
                        <div className="user-icon-v3" onClick={() => setShowProfileModal(true)}>
                            {user.image ? (
                                <img src={user.image} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user.full_name?.charAt(0) || "U"
                            )}
                        </div>
                    </div>
                </header>

                <div className="main-scroll">
                    <div className="main-inner">
                        {activeView === 'overview' ? (
                            <>
                                <section className="banner-v3">
                                    <div className="banner-info">
                                        <span className="banner-tag">{mainProject?.name || "DocuVault"}</span>
                                        <h1>Chào {user.full_name?.split(' ').pop() || "Bảo"},</h1>
                                        <p>Tiến độ dự án hiện tại đạt <strong>{mainProgress}%</strong>. Mọi công việc đang được kiểm soát chặt chẽ bởi đội ngũ kĩ sư.</p>
                                        <div className="banner-btns">
                                            <button className="btn-v3-blue">Chi tiết dự án</button>
                                            <button className="btn-v3-ghost">Lịch sử thi công</button>
                                        </div>
                                    </div>
                                    <div className="banner-visual">
                                        <div className="ring-container">
                                            <svg viewBox="0 0 100 100" className="ring-svg">
                                                <circle cx="50" cy="50" r="45" stroke="#ffffff10" strokeWidth="8" fill="none" />
                                                <circle 
                                                    cx="50" cy="50" r="45" 
                                                    stroke="#2563eb" strokeWidth="8" fill="none" 
                                                    strokeDasharray="283" 
                                                    style={{ strokeDashoffset: 283 - (283 * mainProgress) / 100 }}
                                                    strokeLinecap="round"
                                                />
                                                <circle 
                                                    cx="50" cy="5" r="3" 
                                                    fill="#fff" 
                                                    style={{ transformOrigin: '50px 50px', transform: `rotate(${(mainProgress * 3.6)}deg)` }}
                                                />
                                            </svg>
                                            <span className="ring-value">{mainProgress}%</span>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid-v3">
                                    <div className="col-left">
                                        <div className="sect-head">
                                            <h3>Hồ sơ đang triển khai</h3>
                                            <span className="v3-live">Live</span>
                                        </div>

                                        {loading ? (
                                            <div className="v3-msg">Đang đồng bộ...</div>
                                        ) : filteredProjects.length === 0 ? (
                                            <div className="v3-msg">Không có hồ sơ.</div>
                                        ) : (
                                            <div className="proj-list-v3">
                                                {filteredProjects.map((proj) => {
                                                    const label = STATUS_LABELS[proj.status] || 'Chờ duyệt';
                                                    const colors = STATUS_COLORS[label];
                                                    const prog = getProjectProgress(proj);
                                                    return (
                                                        <div key={proj.id} className="proj-item-v3">
                                                            <div className="item-v3-top">
                                                                <span className="v3-type">THIẾT KẾ & XÂY DỰNG</span>
                                                                <span className="v3-st" style={{ background: colors.bg, color: colors.color }}>{label}</span>
                                                            </div>
                                                            <h4>{proj.name}</h4>
                                                            <div className="item-v3-meta">
                                                                <div className="meta-line">
                                                                    <span className="material-symbols-outlined">fingerprint</span>
                                                                    {proj.project_code || "HS-XXXX"}
                                                                </div>
                                                                <div className="meta-line">
                                                                    <span className="material-symbols-outlined">location_on</span>
                                                                    {proj.address}
                                                                </div>
                                                                <div className="meta-line">
                                                                    <span className="material-symbols-outlined">analytics</span>
                                                                    Tiến độ: {prog}%
                                                                </div>
                                                            </div>
                                                            <div className="item-v3-prog">
                                                                <div className="v3-bar"><div className="v3-fill" style={{ width: prog + '%' }}></div></div>
                                                            </div>

                                                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                                                                <label className="btn-v3-upload">
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                                                                    Gửi ảnh/Hồ sơ
                                                                    <input 
                                                                        type="file" 
                                                                        hidden 
                                                                        onChange={(e) => handleProjectFileUpload(proj.id, e.target.files[0])} 
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-right">
                                        <div className="card-v3">
                                            <h4>Hoạt động gần nhất</h4>
                                            <div className="act-v3-list">
                                                {currentActivities.map(act => (
                                                    <div key={act.id} className="act-v3-item">
                                                        <div className="act-dot"></div>
                                                        <div className="act-v3-info">
                                                            <small>{act.time}</small>
                                                            <p><strong>{act.name}</strong></p>
                                                            <p className="act-m">{act.msg}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="btn-v3-full" onClick={() => setActiveView('activities')}>Xem tất cả</button>
                                        </div>

                                        <div className="card-v3" style={{ marginTop: '32px' }}>
                                            <h4>Tin tức thị trường</h4>
                                            <div className="news-v3-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {news.length === 0 ? (
                                                    <p style={{ fontSize: '13px', color: 'var(--dim)' }}>Đang cập nhật tin tức...</p>
                                                ) : (
                                                    news.slice(0, 3).map(item => (
                                                        <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px' }}>
                                                            <img src={item.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                                                            <div>
                                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', lineHeight: '1.3' }}>{item.title}</p>
                                                                <small style={{ fontSize: '10px', color: 'var(--primary)' }}>{item.category}</small>
                                                            </div>
                                                        </a>
                                                    ))
                                                )}
                                            </div>
                                            <button className="btn-v3-full" onClick={() => setActiveView('news')}>Xem thêm tin tức</button>
                                        </div>

                                        <div className="team-v3">
                                            <div className="team-v3-icon">JS</div>
                                            <div>
                                                <strong>Đội ngũ kĩ sư</strong>
                                                <p>Đang trực tuyến</p>
                                            </div>
                                            <span className="material-symbols-outlined">chat</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : activeView === 'news' ? (
                            <div className="news-full-view animate-fade-in">
                                <div className="sect-head">
                                    <h3>Bản tin thị trường</h3>
                                    <button className="btn-v3-ghost" style={{ color: 'var(--text)', borderColor: '#e2e8f0' }} onClick={() => setActiveView('overview')}> Quay lại</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', marginTop: '32px' }}>
                                    {news.length > 0 ? (
                                        news.map(item => (
                                            <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="card-v3" style={{ textDecoration: 'none', color: 'inherit', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: '0.3s' }}>
                                                <img src={item.image} alt="" style={{ width: '100%', height: '200px', borderRadius: '20px', objectFit: 'cover' }} />
                                                <div>
                                                    <small style={{ color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>{item.category}</small>
                                                    <h4 style={{ margin: '8px 0 0', lineHeight: '1.4', fontSize: '16px' }}>{item.title}</h4>
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--dim)', marginBottom: '16px' }}>pending</span>
                                            <p style={{ color: 'var(--dim)', fontWeight: '600' }}>Đang lấy tin tức mới nhất từ VnExpress...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="activities-full-view animate-fade-in">
                                <div className="sect-head">
                                    <h3>Tất cả hoạt động</h3>
                                    <button className="btn-v3-ghost" style={{ color: 'var(--text)', borderColor: '#e2e8f0' }} onClick={() => setActiveView('overview')}> Quay lại</button>
                                </div>
                                <div className="card-v3" style={{ marginTop: '32px' }}>
                                    <div className="act-v3-list">
                                        {(mainProject?.tasks || []).map(act => (
                                            <div key={act.id} className="act-v3-item" style={{ padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <div className="act-dot"></div>
                                                <div className="act-v3-info">
                                                    <small>{act.updated_at ? new Date(act.updated_at).toLocaleString('vi-VN') : 'Mới đây'}</small>
                                                    <p style={{ fontSize: '16px' }}><strong>{act.name}</strong></p>
                                                    <p className="act-m" style={{ fontSize: '14px' }}>Trạng thái: <strong>{STATUS_LABELS[act.status] || act.status}</strong>. {act.status === 'DONE' ? 'Công việc đã được nghiệm thu hoàn tất.' : 'Đội ngũ kỹ sư đang triển khai theo tiến độ.'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!mainProject?.tasks || mainProject.tasks.length === 0) && (
                                            <p style={{ color: 'var(--dim)', textAlign: 'center', padding: '40px' }}>Chưa có hoạt động nào được ghi lại.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="v3-modal-overlay">
                    <div className="v3-modal">
                        <div className="modal-v3-head">
                            <h3>Cài đặt tài khoản</h3>
                            <button onClick={() => setShowProfileModal(false)}><span className="material-symbols-outlined">close</span></button>
                        </div>

                        {/* Avatar Section */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', color: '#2563eb', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    {user.image ? (
                                        <img src={user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.full_name?.charAt(0) || "U"
                                    )}
                                </div>
                                <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#2563eb', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>camera_alt</span>
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                                </label>
                                {uploadingAvatar && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#2563eb', fontWeight: '800' }}>...</div>}
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="modal-v3-form">
                            <div className="v3-group">
                                <label>Họ và tên</label>
                                <input type="text" value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} />
                            </div>
                            <div className="v3-group">
                                <label>Email</label>
                                <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} />
                            </div>
                            <div className="v3-group">
                                <label>Số điện thoại</label>
                                <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                            </div>
                            <div className="modal-v3-foot">
                                <button type="button" className="v3-no" onClick={() => setShowProfileModal(false)}>Hủy</button>
                                <button type="submit" className="v3-yes" disabled={updating}>{updating ? "Đang lưu..." : "Lưu thay đổi"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                :root {
                    --aside: #ffffff;
                    --main: #f8fafc;
                    --primary: #2563eb;
                    --text: #0f172a;
                    --dim: #64748b;
                    --radius: 20px;
                }

                .dash-root-v3 { display: flex; height: 100vh; background: var(--main); color: var(--text); font-family: 'Inter', sans-serif; }

                /* Explicit Sidebar */
                .dash-aside { width: 280px; background: var(--aside); border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 40px 24px; flex-shrink: 0; }
                .aside-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
                .brand-icon { width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
                .brand-name { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 20px; }

                .aside-focus { background: var(--main); padding: 16px; border-radius: 16px; display: flex; gap: 12px; margin-bottom: 32px; }
                .focus-chip { width: 36px; height: 36px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .aside-focus small { display: block; font-size: 10px; font-weight: 800; color: var(--dim); }
                .aside-focus h5 { margin: 0; font-size: 13px; font-weight: 800; }

                .nav-sect { margin-bottom: 24px; }
                .nav-sect label { display: block; font-size: 10px; font-weight: 800; color: var(--dim); padding: 0 12px 12px; }
                .nav-btn-v3 { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: none; background: transparent; color: var(--dim); font-weight: 600; font-size: 14px; cursor: pointer; border-radius: 12px; text-align: left; }
                .nav-btn-v3.active { background: #eff6ff; color: var(--primary); }
                .nav-btn-v3.red { color: #ef4444; }

                .aside-card { 
                    margin-top: auto; 
                    background: #111827; 
                    color: white; 
                    padding: 24px; 
                    border-radius: 28px; 
                    position: relative; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .card-v3-inner {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .card-v3-text h5 { 
                    margin: 0; 
                    font-size: 16px; 
                    font-weight: 800; 
                    font-family: 'Manrope', sans-serif;
                }
                .card-v3-text p { 
                    margin: 4px 0 0; 
                    font-size: 11px; 
                    opacity: 0.5; 
                    font-weight: 600;
                }
                .verified-badge { 
                    font-size: 28px; 
                    color: #fbbf24; 
                    font-variation-settings: 'FILL' 1;
                }

                /* Main Scroll */
                .dash-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .main-header { height: 80px; padding: 0 40px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: white; }
                .header-search { position: relative; display: flex; align-items: center; background: #f1f5f9; border-radius: 12px; padding: 0 12px; width: 400px; }
                .header-search input { height: 40px; border: none; background: transparent; outline: none; padding-left: 12px; flex: 1; font-size: 14px; }
                .header-user { display: flex; align-items: center; gap: 16px; }
                .user-info { text-align: right; }
                .user-info strong { display: block; font-size: 14px; }
                .user-info p { font-size: 11px; color: var(--dim); margin: 0; }
                .user-icon-v3 { width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; cursor: pointer; }

                .main-scroll { flex: 1; overflow-y: auto; }
                .main-inner { padding: 40px; max-width: 1300px; margin: 0 auto; }

                /* Banner V3 */
                .banner-v3 { background: #0f172a; border-radius: 32px; color: white; padding: 60px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; position: relative; overflow: hidden; }
                .banner-info { position: relative; z-index: 2; flex: 1; }
                .banner-tag { display: inline-block; background: #2563eb30; color: var(--primary); padding: 4px 12px; border-radius: 100px; font-weight: 800; font-size: 10px; margin-bottom: 16px; }
                .banner-v3 h1 { font-family: 'Manrope', sans-serif; font-size: 48px; font-weight: 800; margin: 0 0 16px; }
                .banner-v3 p { font-size: 17px; opacity: 0.7; line-height: 1.6; max-width: 500px; margin-bottom: 32px; }
                
                /* Banner Buttons Refined */
                .banner-btns { display: flex; gap: 20px; }
                .btn-v3-blue { 
                    background: var(--primary); 
                    border: none; 
                    color: white; 
                    padding: 16px 32px; 
                    border-radius: 16px; 
                    font-weight: 900; 
                    font-size: 15px;
                    font-family: 'Manrope', sans-serif;
                    cursor: pointer; 
                    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
                    transition: 0.3s;
                }
                .btn-v3-ghost { 
                    background: transparent; 
                    border: 1.5px solid #ffffff30; 
                    color: white; 
                    padding: 16px 32px; 
                    border-radius: 16px; 
                    font-weight: 900; 
                    font-size: 15px;
                    font-family: 'Manrope', sans-serif;
                    cursor: pointer; 
                    transition: 0.3s;
                }
                .btn-v3-blue:hover { transform: translateY(-2px); background: #1d4ed8; }
                .btn-v3-ghost:hover { background: #ffffff10; border-color: white; }

                .banner-visual { position: relative; z-index: 2; width: 200px; display: flex; align-items: center; justify-content: center; }
                .ring-container { position: relative; width: 150px; height: 150px; }
                .ring-value { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; font-family: 'Manrope', sans-serif; }

                /* Proj List */
                .grid-v3 { display: grid; grid-template-columns: 1fr 340px; gap: 40px; align-items: flex-start; }
                .sect-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .sect-head h3 { font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 800; margin: 0; }
                .v3-live { background: #ecfdf5; color: #10b981; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 100px; }

                .proj-list-v3 { display: flex; flex-direction: column; gap: 24px; }
                .proj-item-v3 { background: white; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 16px; }
                .item-v3-top { display: flex; justify-content: space-between; align-items: center; }
                .v3-type { font-size: 11px; font-weight: 800; color: var(--dim); }
                .v3-st { font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 100px; }
                .proj-item-v3 h4 { font-family: 'Manrope', sans-serif; font-size: 18px; margin: 0; font-weight: 800; }
                
                .item-v3-meta { display: flex; flex-direction: column; gap: 10px; }
                .meta-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--dim); }
                .meta-line span { color: var(--primary); font-size: 18px; }

                .item-v3-prog { margin-top: 10px; }
                .v3-bar { height: 8px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
                .v3-fill { height: 100%; background: var(--primary); transition: 1s; }

                /* Sidebar Card */
                .card-v3 { background: white; padding: 32px; border-radius: 32px; border: 1px solid #e2e8f0; }
                .card-v3 h4 { margin: 0 0 24px; font-size: 18px; font-weight: 800; }
                .act-v3-list { display: flex; flex-direction: column; gap: 24px; }
                .act-v3-item { display: flex; gap: 16px; }
                .act-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-top: 6px; flex-shrink: 0; }
                .act-v3-info small { font-size: 10px; font-weight: 800; color: var(--dim); text-transform: uppercase; }
                .act-v3-info p { margin: 4px 0 0; font-size: 13px; }
                .act-m { color: var(--dim); line-height: 1.4; }

                .btn-v3-full { width: 100%; margin-top: 32px; padding: 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 800; color: var(--dim); cursor: pointer; }
                
                .team-v3 { display: flex; align-items: center; gap: 16px; background: #f1f5f990; padding: 20px; border-radius: 20px; margin-top: 32px; }
                .team-v3-icon { width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
                .team-v3 strong { display: block; font-size: 14px; }
                .team-v3 p { font-size: 12px; color: var(--dim); margin: 0; }
                .team-v3 .material-symbols-outlined { margin-left: auto; color: var(--primary); }

                /* Modal - THE BIG FIX */
                .v3-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
                .v3-modal { background: #fff; width: 450px; border-radius: 32px; box-shadow: 0 40px 100px rgba(0,0,0,0.3); padding: 40px; display: flex; flex-direction: column; gap: 0; overflow: hidden; }
                .modal-v3-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .modal-v3-head h3 { margin: 0; font-size: 22px; font-weight: 800; }
                .modal-v3-head button { border: none; background: #f1f5f9; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                
                .modal-v3-form { display: flex; flex-direction: column; gap: 24px; }
                .v3-group { display: flex; flex-direction: column; gap: 8px; }
                .v3-group label { font-size: 11px; font-weight: 800; color: var(--dim); text-transform: uppercase; }
                .v3-group input { height: 50px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 16px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; }
                .v3-group input:focus { border-color: var(--primary); background: white; }

                /* Modal Buttons Refined */
                .modal-v3-foot { display: flex; gap: 20px; margin-top: 16px; }
                .v3-no { 
                    flex: 1; 
                    height: 56px; 
                    border: 1.5px solid #e2e8f0; 
                    background: white; 
                    border-radius: 16px; 
                    font-weight: 900; 
                    font-size: 15px;
                    font-family: 'Manrope', sans-serif;
                    cursor: pointer; 
                    transition: 0.2s;
                }
                .v3-yes { 
                    flex: 1; 
                    height: 56px; 
                    border: none; 
                    background: var(--primary); 
                    color: white; 
                    border-radius: 16px; 
                    font-weight: 900; 
                    font-size: 15px;
                    font-family: 'Manrope', sans-serif;
                    cursor: pointer; 
                    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
                    transition: 0.2s;
                }
                .v3-no:hover { background: #f8fafc; border-color: var(--dim); }
                .v3-yes:hover { transform: translateY(-2px); background: #1d4ed8; }

                .btn-v3-upload {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 800;
                    color: #475569;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-v3-upload:hover {
                    background: #eff6ff;
                    border-color: #2563eb;
                    color: #2563eb;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
