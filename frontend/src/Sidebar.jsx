import React, { useState, useEffect } from "react";
import { LayoutDashboard, FolderOpen, Settings, Users, Box, UsersRound, FileText, FileSpreadsheet, LogOut, Camera, User } from 'lucide-react';
import api from "./api";
import { getPendingMaterialRequests } from "./hoSoService";

export default function Sidebar({ admin, activeNav, setActiveNav, NAV_ITEMS, onShowModal, onLogout }) {
    const [uploading, setUploading] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: admin?.full_name || "",
        email: admin?.email || "",
        phone: admin?.phone || ""
    });
    const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
    const [changingPassword, setChangingPassword] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    useEffect(() => {
        if (hasPermission("inventory")) {
            const fetchPendingCount = async () => {
                const res = await getPendingMaterialRequests();
                if (res?.success && res.requests) {
                    setPendingRequestsCount(res.requests.length);
                }
            };
            fetchPendingCount();
            
            // Periodically check for new requests every 30 seconds
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [admin]);

    const getInitials = () => {
        if (admin?.full_name) {
            const parts = admin.full_name.split(" ");
            if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            return admin.full_name.substring(0, 2).toUpperCase();
        }
        return admin?.username?.substring(0, 2).toUpperCase() || "AD";
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !admin?.id) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post(`/admin/profile/${admin.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 200) {
                const updatedAdmin = { ...admin, image: res.data.user.image };
                localStorage.setItem("admin_user", JSON.stringify(updatedAdmin));
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi upload ảnh đại diện");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await api.post(`/admin/profile/${admin.id}`, profileData);
            if (res.status === 200) {
                const updatedAdmin = { ...admin, ...res.data.user };
                localStorage.setItem("admin_user", JSON.stringify(updatedAdmin));
                setShowProfileModal(false);
                window.location.reload();
            }
        } catch (err) {
            alert("Lỗi cập nhật thông tin cá nhân");
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (passwordData.new_password.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        setChangingPassword(true);
        try {
            const res = await api.post(`/admin/change-password/${admin.id}`, passwordData);
            if (res.status === 200) {
                alert("Đổi mật khẩu thành công!");
                setIsEditingPassword(false);
                setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đổi mật khẩu");
        } finally {
            setChangingPassword(false);
        }
    };

    const hasPermission = (permKey) => {
        if (!admin) return false;
        if (admin.role === 'admin') return true;
        try {
            const perms = JSON.parse(admin.permissions || '[]');
            // Exact match
            if (perms.includes(permKey)) return true;
            // Prefix match: hasPermission("projects") matches "projects.view", "projects.edit", etc.
            if (!permKey.includes('.')) {
                return perms.some(p => p.startsWith(permKey + '.'));
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    const getVisibleNavItems = () => {
        return NAV_ITEMS.filter(label => {
            if (label === "Bảng điều khiển") return true;
            if (label === "Danh sách hồ sơ") return hasPermission("projects");
            if (label === "Danh mục dự án") return hasPermission("categories");
            if (label === "Quản lý khách hàng") return hasPermission("customers");
            if (label === "Quản lý nhân viên") return hasPermission("hr");
            if (label === "Quản lý kho") return hasPermission("inventory") || hasPermission("suppliers");
            if (label === "Báo cáo" || label === "Quản lý tài liệu") return hasPermission("documents");
            if (label === "Nhật ký hệ thống") return hasPermission("system_log");
            return true;
        });
    };

    return (
        <>
        <aside className="sidebar">
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '24px', marginBottom: '10px' }}>
                <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                    color: 'white', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                    flexShrink: 0
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M9 15h6"></path>
                        <path d="M9 11h6"></path>
                        <path d="M9 19h6"></path>
                    </svg>
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', margin: 0, color: '#1e293b' }}>DocuVault</h2>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hệ thống Quản trị</span>
                </div>
            </div>

            <nav className="sidebar-nav" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                marginBottom: '10px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                <style>
                    {`.sidebar-nav::-webkit-scrollbar { display: none; }`}
                </style>
                {getVisibleNavItems().map((label) => (
                    <button
                        key={label}
                        className={`nav-item${activeNav === label ? " active" : ""}`}
                        onClick={() => setActiveNav(label)}
                    >
                        <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                            {label === "Bảng điều khiển" ? <LayoutDashboard size={20} color="#6366f1" /> :
                                label === "Danh sách hồ sơ" ? <FolderOpen size={20} color="#eab308" /> :
                                    label === "Danh mục dự án" ? <Settings size={20} color="#9ca3af" /> :
                                        label === "Quản lý tài liệu" ? <FileSpreadsheet size={20} color="#3b82f6" /> :
                                            label === "Quản lý khách hàng" ? <Users size={20} color="#f59e0b" /> :
                                                label === "Quản lý nhân viên" ? <UsersRound size={20} color="#10b981" /> :
                                                    label === "Báo cáo" ? <FileText size={20} color="#f97316" /> :
                                                        label === "Nhật ký hệ thống" ? <FileText size={20} color="#10b981" /> :
                                                            label === "Tin tức" ? <FileText size={20} color="#3b82f6" /> :
                                                            label === "Quản lý kho" ? <Box size={20} color="#8b5cf6" /> :
                                                                <FolderOpen size={20} />}
                        </span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                        {label === "Quản lý kho" && pendingRequestsCount > 0 && admin?.role === 'admin' && (
                            <span style={{
                                background: '#ef4444', color: 'white', fontSize: '11px',
                                padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                            }}>
                                {pendingRequestsCount}
                            </span>
                        )}
                        {label === "Quản lý kho" && pendingRequestsCount > 0 && admin?.role !== 'admin' && (
                            <span style={{
                                background: '#f59e0b', color: 'white', fontSize: '11px',
                                padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                            }}>
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                ))}

                {hasPermission("projects.create") && (
                    <div style={{ padding: '12px 0' }}>
                        <button className="add-new-btn" onClick={onShowModal} style={{ 
                            width: '100%', 
                            borderRadius: '12px', 
                            margin: 0, 
                            height: '42px', 
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            + Thêm hồ sơ
                        </button>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-section" style={{ cursor: 'pointer' }} onClick={() => {
                    setProfileData({
                        full_name: admin?.full_name || "",
                        email: admin?.email || "",
                        phone: admin?.phone || ""
                    });
                    setShowProfileModal(true);
                }}>
                    <div className="profile-top">
                        <div className="avatar-container" onClick={(e) => e.stopPropagation()}>
                            <div className="avatar-circle" style={{ opacity: uploading ? 0.5 : 1 }}>
                                {admin?.image ? (
                                    <img src={admin.image} alt="Avatar" className="user-avatar-img" />
                                ) : (
                                    getInitials()
                                )}
                                {uploading && <span style={{ position: 'absolute', fontSize: '10px' }}>⏳</span>}
                            </div>
                            <label className="avatar-edit-icon" title="Cập nhật ảnh đại diện">
                                <Camera size={12} />
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div className="user-text-info">
                            <div className="user-full-name">{admin?.full_name || "Quản trị viên"}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ 
                                    fontSize: '10px', 
                                    background: admin?.role_color || '#3b82f6', 
                                    color: '#fff', 
                                    padding: '2px 8px', 
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {admin?.role || "ADMIN"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button className="logout-button-sidebar" onClick={onLogout} style={{ marginTop: '12px' }}>
                    <LogOut size={16} /> Đăng xuất
                </button>
            </div>

        </aside>
        {/* Profile Edit Modal */}
        {showProfileModal && (
            <div className="modal-overlay" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}>
                <div className="modal-box" style={{ maxWidth: '400px', padding: '32px', position: 'relative', zIndex: 10000 }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden' }}>
                                {admin?.image ? <img src={admin.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials()}
                            </div>
                            <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Camera size={14} />
                                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <h3 style={{ margin: 0 }}>Chỉnh sửa hồ sơ</h3>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Cập nhật thông tin cá nhân của bạn</p>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                        <button
                            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: !isEditingPassword ? '2px solid #3b82f6' : '2px solid transparent', color: !isEditingPassword ? '#3b82f6' : '#6b7280', fontWeight: '600', cursor: 'pointer' }}
                            onClick={() => setIsEditingPassword(false)}
                        >Thông tin</button>
                        <button
                            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: isEditingPassword ? '2px solid #3b82f6' : '2px solid transparent', color: isEditingPassword ? '#3b82f6' : '#6b7280', fontWeight: '600', cursor: 'pointer' }}
                            onClick={() => setIsEditingPassword(true)}
                        >Mật khẩu</button>
                    </div>

                    {!isEditingPassword ? (
                        <>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Họ và Tên</label>
                                <input 
                                    className="form-input" 
                                    value={profileData.full_name} 
                                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Email</label>
                                <input 
                                    className="form-input" 
                                    value={profileData.email} 
                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label>Số điện thoại</label>
                                <input 
                                    className="form-input" 
                                    value={profileData.phone} 
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowProfileModal(false)}>Hủy</button>
                                <button className="btn-submit" style={{ flex: 1 }} onClick={handleUpdateProfile}>Lưu thay đổi</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Mật khẩu hiện tại</label>
                                <input 
                                    type="password"
                                    className="form-input" 
                                    value={passwordData.current_password} 
                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Mật khẩu mới</label>
                                <input 
                                    type="password"
                                    className="form-input" 
                                    value={passwordData.new_password} 
                                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label>Xác nhận mật khẩu mới</label>
                                <input 
                                    type="password"
                                    className="form-input" 
                                    value={passwordData.new_password_confirmation} 
                                    onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setIsEditingPassword(false)}>Hủy</button>
                                <button className="btn-submit" style={{ flex: 1 }} disabled={changingPassword} onClick={handleChangePassword}>
                                    {changingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </>
    );
}