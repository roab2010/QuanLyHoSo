import React from "react";

export default function Sidebar({ activeNav, setActiveNav, NAV_ITEMS, onShowModal }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Hệ thống Hồ sơ</h2>
                <span>Quản trị viên</span>
            </div>

            {NAV_ITEMS.map((label) => (
                <button
                    key={label}
                    className={`nav-item${activeNav === label ? " active" : ""}`}
                    onClick={() => setActiveNav(label)}
                >
                    {label}
                </button>
            ))}

            <button className="add-new-btn" onClick={onShowModal}>
                + Thêm hồ sơ mới
            </button>

            <div className="sidebar-bottom">
                <div className="user-avatar">NA</div>
                <div className="user-info">
                    <div className="user-name">Nguyễn Văn A</div>
                    <div className="user-email">admin@system.vn</div>
                </div>
            </div>
        </aside>
    );
}