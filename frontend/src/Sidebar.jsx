import React, { useState } from "react";

export default function Sidebar({ admin, activeNav, setActiveNav, NAV_ITEMS, onShowModal, onLogout }) {
    const [uploading, setUploading] = useState(false);

    // Lấy ký tự đầu của tên để hiển thị avatar dự phòng
    const getInitials = () => {
        if (admin?.full_name) {
            const parts = admin.full_name.split(" ");
            if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
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
            const res = await fetch(`http://127.0.0.1:8000/api/admin/profile/${admin.id}`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                // Cập nhật lại localStorage và báo hiệu cho App.jsx
                const updatedAdmin = { ...admin, image: data.user.image };
                localStorage.setItem("admin_user", JSON.stringify(updatedAdmin));
                window.location.reload(); // Cách đơn giản nhất để đồng bộ toàn bộ App
            } else {
                alert("Lỗi upload: " + (data.message || "Không xác định"));
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server khi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Hệ thống Quản lý</h2>
                <span>Dinh Doc Lap Project</span>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1 }}>
                {NAV_ITEMS.map((label) => (
                    <button
                        key={label}
                        className={`nav-item${activeNav === label ? " active" : ""}`}
                        onClick={() => setActiveNav(label)}
                    >
                        <span style={{ marginRight: '12px', fontSize: '18px' }}>
                            {label === "Bảng điều khiển" ? "📊" : 
                             label === "Danh sách hồ sơ" ? "📂" : 
                             label === "Danh mục dự án" ? "⚙️" : 
                             label === "Tin tức" ? "📰" : 
                             label === "Quản lý kho" ? "📦" : "📁"}
                        </span>
                        {label}
                    </button>
                ))}
            </nav>

            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <button className="add-new-btn" onClick={onShowModal} style={{ width: '100%', borderRadius: '16px' }}>
                    + Thêm hồ sơ mới
                </button>
            </div>

            <div className="sidebar-footer">
                <div className="user-profile-section">
                    <div className="profile-top">
                        <div className="avatar-container">
                            <div className="avatar-circle" style={{ opacity: uploading ? 0.5 : 1 }}>
                                {admin?.image ? (
                                    <img src={admin.image} alt="Avatar" className="user-avatar-img" />
                                ) : (
                                    getInitials()
                                )}
                                {uploading && <span style={{ position: 'absolute', fontSize: '10px' }}>⏳</span>}
                            </div>
                            <label className="avatar-edit-icon" title="Cập nhật ảnh đại diện">
                                📷
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
                            <div className="user-email-text">{admin?.email || "admin@system.vn"}</div>
                        </div>
                    </div>
                    
                    <button className="logout-button-sidebar" onClick={onLogout}>
                        <span style={{ marginRight: '8px' }}>🚪</span> Đăng xuất
                    </button>
                </div>
            </div>
        </aside>
    );
}