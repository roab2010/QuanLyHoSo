import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import useHoSo from "./HoSo.js";
import Sidebar from "./Sidebar";
import KanbanBoard from "./KanbanBoard";
import ProjectCategoryList from "./ProjectCategoryList";
import ChiTietHoSo from "./ChiTietHoSo";
import News from "./News";
import ModalAddProject from "./ModalAddProject";
import InventoryDashboard from "./InventoryDashboard";
import QuanLyVatTu from "./QuanLyVatTu";
import QuanLyNhaCungCap from "./QuanLyNhaCungCap";
import DanhSachHoSo from "./DanhSachHoSo";
import EditHoSo from "./EditHoSo";
import LoginPage from "./LoginPage";
import HomePortal from "./HomePortal";
import CustomerDashboard from "./CustomerDashboard";
import QuanLyKhachHang from "./QuanLyKhachHang";

const COLUMNS = [
    { id: "new", title: "Mới tạo", color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done", title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Bảng điều khiển", "Danh sách hồ sơ", "Danh mục dự án","Quản lý khách hàng", "Báo cáo", "Quản lý kho"];

const styles = {
    logoutBtn: {
        background: '#ef4444',
        color: '#fff',
        border: 'none',
        padding: '8px 18px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

// --- TÁCH COMPONENT ĐỂ TRÁNH RE-MOUNT ---

const AdminLayout = ({ 
    admin, activeNav, setActiveNav, NAV_ITEMS, 
    setShowModal, showModal, loading, error, cards, cardsByCol, 
    xoaHoSo, moveCard, themHoSo, fetchAll, inventoryView, setInventoryView, 
    handleSaveProject, location, navigate 
}) => {
    if (!admin) return <Navigate to="/admin/login" />;

    return (
        <div className="app">
            <Sidebar
                admin={admin}
                activeNav={activeNav}
                setActiveNav={(nav) => {
                    setActiveNav(nav);
                    if (location.pathname !== "/admin") {
                        navigate("/admin");
                    }
                }}
                NAV_ITEMS={NAV_ITEMS}
                onShowModal={() => setShowModal(true)}
                onLogout={() => { localStorage.removeItem("admin_user"); navigate("/admin/login"); }}
            />

            <div className="main">
                <div className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="topbar-title">QUẢN LÝ DỰ ÁN</span>
                    </div>
                </div>

                {loading && <div className="state-banner loading">⏳ Đang xử lý...</div>}
                {error && <div className="state-banner error">⚠️ {error}</div>}

                <div className="content-container" style={{ flex: 1, overflow: "auto" }}>
                    {activeNav === "Bảng điều khiển" ? (
                        <KanbanBoard
                            COLUMNS={COLUMNS}
                            cardsByCol={cardsByCol}
                            onDelete={xoaHoSo}
                            onMoveCard={moveCard}
                            onShowModal={() => setShowModal(true)}
                        />
                    ):activeNav === "Quản lý khách hàng" ? (
                        <QuanLyKhachHang />
                    ): activeNav === "Chi Tiết" ? (
                         <ChiTietHoSo />
                    ) : activeNav === "Chỉnh sửa" ? (
                         <EditHoSo setActiveAppNav={setActiveNav} refreshData={fetchAll} />
                    ) : activeNav === "Danh sách hồ sơ" ? (
                        <DanhSachHoSo 
                            cards={cards} 
                            xoaHoSo={xoaHoSo} 
                            loading={loading} 
                            error={error} 
                        />
                    ) : activeNav === "Danh mục dự án" ? (
                        <ProjectCategoryList />
                    ) : activeNav === "Tin tức" ? (
                        <News />
                    ) : activeNav === "Quản lý kho" ? (
                        inventoryView === "selection" ? (
                            <InventoryDashboard onSelect={setInventoryView} />
                        ) : (
                            <div style={{ padding: "20px" }}>
                                <button className="btn-back-selection" onClick={() => setInventoryView("selection")}>
                                    ← Quay lại chọn danh mục
                                </button>
                                {inventoryView === "vat-tu" ? <QuanLyVatTu /> : <QuanLyNhaCungCap />}
                            </div>
                        )
                    ) : (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <h3>Trang {activeNav}</h3>
                            <p>Tính năng đang được phát triển...</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <ModalAddProject
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSaveProject}
                />
            )}
        </div>
    );
};

export default function App() {
    const [activeNav, setActiveNav] = useState("Bảng điều khiển");
    const [showModal, setShowModal] = useState(false);
    const [inventoryView, setInventoryView] = useState("selection");
    
    const location = useLocation();
    const navigate = useNavigate();

    // Đọc user từ localStorage (Không dùng memo [] để đảm bảo cập nhật khi chuyển trang)
    const admin = JSON.parse(localStorage.getItem("admin_user") || "null");
    const customer = JSON.parse(localStorage.getItem("customer_user") || "null");

    const {
        cards,
        loading,
        error,
        cardsByCol,
        xoaHoSo,
        moveCard,
        themHoSo,
        fetchAll
    } = useHoSo();

    useEffect(() => {
        const path = location.pathname;
        
        // --- 1. Cập nhật Title trình duyệt ---
        if (path.includes("/admin")) {
            document.title = "DocuVault - Quản Trị Hệ Thống";
        } else if (path.includes("/customer")) {
            document.title = "DocuVault - Cổng Khách Hàng";
        } else {
            document.title = "DocuVault - Hệ Thống Quản Lý Hồ Sơ";
        }

        // --- 2. Cập nhật Favicon (Logo nhỏ trên Tab) ---
        let faviconUrl = "/vite.svg"; // Mặc định
        if (path.includes("/admin")) {
            // Logo Admin: Hình chiếc khiên bảo mật (SVG Data URI)
            faviconUrl = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>`;
        } else if (path.includes("/customer")) {
            // Logo Khách hàng: Hình người/tài khoản (SVG Data URI)
            faviconUrl = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👤</text></svg>`;
        }

        const link = document.querySelector("link[rel~='icon']");
        if (link) {
            link.href = faviconUrl;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = faviconUrl;
            document.getElementsByTagName('head')[0].appendChild(newLink);
        }

        // --- 3. Điều hướng Nav ---
        if (path.includes("/ho-so/")) {
            if (path.endsWith("/edit")) {
                setActiveNav("Chỉnh sửa");
            } else {
                setActiveNav("Chi Tiết");
            }
        } else if (path === "/admin") {
            if (activeNav === "Chi Tiết" || activeNav === "Chỉnh sửa") {
                setActiveNav("Bảng điều khiển");
            }
        }
    }, [location.pathname]);

    const handleSaveProject = async (formData) => {
        const result = await themHoSo(formData);
        if (result.ok) setShowModal(false);
        else alert(result.message || "Không thể tạo hồ sơ");
    };

    const adminProps = {
        admin, activeNav, setActiveNav, NAV_ITEMS, 
        setShowModal, showModal, loading, error, cards, cardsByCol, 
        xoaHoSo, moveCard, themHoSo, fetchAll, inventoryView, setInventoryView, 
        handleSaveProject, location, navigate 
    };

    return (
        <Routes>
            <Route path="/" element={<HomePortal />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout {...adminProps} />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/ho-so/:id" element={<AdminLayout {...adminProps} />} />
            <Route path="/admin/ho-so/:id/edit" element={<AdminLayout {...adminProps} />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
