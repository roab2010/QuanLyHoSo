import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import "./App.css";
import useHoSo from "./HoSo.js"; 
import Sidebar from "./Sidebar";
import KanbanBoard from "./KanbanBoard";
import ProjectCategoryList from "./ProjectCategoryList";
import ChiTietHoSo from "./ChiTietHoSo"; 
import News from "./News";
import ProfessionalInventory from "./ProfessionalInventory.jsx";
import ProductList from "./ProductList.jsx";
import ModalAddProject from "./ModalAddProject"; 
import InventoryDashboard from "./InventoryDashboard";
import QuanLyVatTu from "./QuanLyVatTu";
import QuanLyNhaCungCap from "./QuanLyNhaCungCap";

const COLUMNS = [
    { id: "new",         title: "Mới tạo",    color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done",        title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Dashboard", "Danh mục dự án", "Tin tức","Cài đặt", "Quản lý kho"];

export default function App() {
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [inventoryView, setInventoryView] = useState("selection");
    
    const { 
        loading, 
        error, 
        cardsByCol, 
        xoaHoSo, 
        moveCard, 
        themHoSo 
    } = useHoSo();

    const handleSaveProject = async (formData) => {
        const result = await themHoSo(formData);
        if (result.ok) {
            setShowModal(false);
        } else {
            alert(result.message || "Không thể tạo hồ sơ");
        }
    };

    // Component giao diện chính để dễ quản lý trong Route
    const MainLayout = () => (
        <div className="app">
            <Sidebar 
                activeNav={activeNav} 
                setActiveNav={(nav) => {
                    setActiveNav(nav);
                    setInventoryView("selection"); // Reset về bảng chọn khi đổi menu
                }} 
                NAV_ITEMS={NAV_ITEMS} 
                onShowModal={() => setShowModal(true)} 
            />

            <div className="main">
                <div className="topbar">
                    <span className="topbar-title">Quản Lý Hồ Sơ</span>
                    <input 
                        className="search-input" 
                        placeholder="Tìm kiếm mã hồ sơ hoặc tên dự án..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>

                {loading && <div className="state-banner loading">⏳ Đang xử lý...</div>}
                {error && <div className="state-banner error">⚠️ {error}</div>}

                <div className="content-container" style={{ flex: 1, overflow: "auto", padding: "20px" }}>
                    {activeNav === "Dashboard" ? (
                        <KanbanBoard 
                            COLUMNS={COLUMNS} 
                            cardsByCol={cardsByCol} 
                            search={search} 
                            onDelete={xoaHoSo} 
                            onMoveCard={moveCard} 
                            onShowModal={() => setShowModal(true)}
                        />
                    ) : activeNav === "Danh mục dự án" ? (
                        <ProjectCategoryList />
                    ) : activeNav === "Tin tức" ? (
                        <News />
                    ) : activeNav === "Quản lý kho" ? (
                        inventoryView === "selection" ? (
                            <InventoryDashboard onSelect={setInventoryView} />
                        ) : (
                            <div>
                                <button 
                                    className="btn-back-selection" 
                                    onClick={() => setInventoryView("selection")}
                                    style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer' }}
                                >
                                    ← Quay lại Dashboard Kho
                                </button>
                                
                                {inventoryView === "vat-tu" ? (
                                    <QuanLyVatTu />
                                ) : (
                                    <QuanLyNhaCungCap />
                                )}
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
                    onSave={handleSaveProject} 
                />
            )}
        </div>
    );

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />} />
                <Route path="/ho-so/:id" element={<ChiTietHoSo />} />
            </Routes>
        </Router>
    );
}