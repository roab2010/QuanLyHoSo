import { useState, useEffect } from "react";
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
import EditHoSo from "./EditHoSo";
import DanhSachHoSo from "./DanhSachHoSo";

const COLUMNS = [
    { id: "new", title: "Mới tạo", color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done", title: "Hoàn thành", color: "#16a34a" },
];


const NAV_ITEMS = ["Bảng điều khiển", "Danh sách hồ sơ", "Danh mục dự án", "Báo cáo", "Tin tức", "Quản lý kho"];


export default function App() {
    const [activeNav, setActiveNav] = useState(() => localStorage.getItem('activeNav') || "Bảng điều khiển");
    useEffect(() => { localStorage.setItem('activeNav', activeNav); }, [activeNav]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [inventoryView, setInventoryView] = useState("selection");


    const {
        loading,
        error,
        cardsByCol,
        xoaHoSo,
        moveCard,
        fetchAll,
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

<<<<<<< HEAD
    // Component bọc giao diện chính
    // Component bọc giao diện chính
    const MainLayout = () => (
        <div className="app">
            <Sidebar
                activeNav={activeNav}
                setActiveNav={setActiveNav}
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

                <div className="content-container" style={{ flex: 1, overflow: "auto" }}>
                    {activeNav === "Bảng điều khiển" ? (
                        <KanbanBoard
                            COLUMNS={COLUMNS}
                            cardsByCol={cardsByCol}
                            search={search}
                            onDelete={xoaHoSo}
                            onMoveCard={moveCard}
                            onShowModal={() => setShowModal(true)}
                        />
                    ) : activeNav === "Danh sách hồ sơ" ? (
                        <DanhSachHoSo search={search} />
                    ) : activeNav === "Danh mục dự án" ? (
                        <ProjectCategoryList />
                    ) : activeNav === "Tin tức" ? (
                        <News />
                    ) : activeNav === "Quản lý kho" ? ( // ĐOẠN NÀY PHẢI VIẾT NHƯ THẾ NÀY
                        inventoryView === "selection" ? (
                            <InventoryDashboard onSelect={setInventoryView} />
                        ) : (
                            <div style={{ padding: "20px" }}>
                                <button className="btn-back-selection" onClick={() => setInventoryView("selection")}>
                                    ← Quay lại chọn danh mục
                                </button>

                                {inventoryView === "vat-tu" ? (
                                    <QuanLyVatTu />
                                ) : (
                                    <QuanLyNhaCungCap />
                                )}
                            </div>
                        )
                    ) : ( // ĐÂY LÀ DẤU ĐÓNG CUỐI CÙNG CHO CÁC TRANG KHÁC
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

    {
        showModal && (
            <ModalAddProject
                onClose={() => setShowModal(false)}
                onSave={handleSaveProject}
            />
        )
    }
        </div >
    );

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />} />


                {/* Khi bấm vào card sẽ nhảy sang đường dẫn này */}

                <Route path="/ho-so/:id" element={<ChiTietHoSo />} />

                {/* Khi bấm sửa sẽ nhảy sang đường dẫn này */}
                <Route path="/ho-so/:id/edit" element={<EditHoSo setActiveAppNav={setActiveNav} />} />
            </Routes>
        </Router>
    );
}