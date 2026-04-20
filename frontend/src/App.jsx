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
import QuanLyNhanVien from "./QuanLyNhanVien";
import ProjectDocuments from "./ProjectDocuments";
import DocumentWorkflow from "./DocumentWorkflow";
import SystemLog from "./SystemLog";
import { useToast } from "./Toast";

const COLUMNS = [
    { id: "new", title: "Mới tạo", color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done", title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Bảng điều khiển", "Danh sách hồ sơ", "Danh mục dự án", "Quản lý tài liệu", "Duyệt tài liệu", "Quản lý khách hàng", "Quản lý nhân viên", "Báo cáo", "Quản lý kho", "Nhật ký hệ thống"];

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

    // Safety check: Reset navigation if user doesn't have permission for current tab
    useEffect(() => {
        const hasPermission = (permKey) => {
            if (admin.role === 'admin') return true;
            try {
                const perms = JSON.parse(admin.permissions || '[]');
                if (perms.includes(permKey)) return true;
                if (!permKey.includes('.')) {
                    return perms.some(p => p.startsWith(permKey + '.'));
                }
                return false;
            } catch (e) { return false; }
        };

        const checkAuth = () => {
            if (activeNav === "Quản lý nhân viên") {
                if (!hasPermission("hr")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Quản lý khách hàng") {
                if (!hasPermission("customers")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Danh sách hồ sơ") {
                if (!hasPermission("projects")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Danh mục dự án") {
                if (!hasPermission("categories")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Quản lý kho") {
                if (!hasPermission("inventory") && !hasPermission("suppliers")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Quản lý tài liệu" || activeNav === "Báo cáo") {
                if (!hasPermission("documents")) setActiveNav("Bảng điều khiển");
            }
            if (activeNav === "Nhật ký hệ thống") {
                if (!hasPermission("system_log")) setActiveNav("Bảng điều khiển");
            }
        };

        checkAuth();
    }, [activeNav, admin]);

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
                onLogout={() => {
                    localStorage.removeItem("admin_user");
                    setActiveNav("Bảng điều khiển");
                    navigate("/admin/login");
                }}
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
                    ) : activeNav === "Quản lý khách hàng" ? (
                        <QuanLyKhachHang />
                    ) : activeNav === "Quản lý nhân viên" ? (
                        <QuanLyNhanVien admin={admin} />
                    ) : activeNav === "Chi Tiết" ? (
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
                    ) : activeNav === "Quản lý tài liệu" ? (
                        <ProjectDocuments />
                    ) : activeNav === "Duyệt tài liệu" ? (
                        <DocumentWorkflow admin={admin} />
                    ) : activeNav === "Tin tức" ? (
                        <News />
                    ) : activeNav === "Nhật ký hệ thống" ? (
                        <SystemLog />
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
    const toast = useToast();

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
            // Logo Khách hàng: Hình tài liệu xanh
            faviconUrl = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline><path d='M9 15h6'></path><path d='M9 11h6'></path></svg>`;
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
        if (result.ok) {
            setShowModal(false);
            toast.success("Khởi tạo hồ sơ dự án mới thành công!");
        } else {
            toast.error(result.message || "Không thể tạo hồ sơ");
        }
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
            <Route path="/news" element={<News />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout {...adminProps} />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/ho-so/:id" element={<AdminLayout {...adminProps} />} />
            <Route path="/admin/ho-so/:id/edit" element={<AdminLayout {...adminProps} />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
