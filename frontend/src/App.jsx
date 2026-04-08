import { useState } from "react";
import "./App.css";
import useHoSo from "./HoSo.js"; 
import Sidebar from "./Sidebar";
import KanbanBoard from "./KanbanBoard";
import ProjectCategoryList from "./ProjectCategoryList";

const COLUMNS = [
    { id: "new",        title: "Mới tạo",    color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done",       title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Dashboard", "Hồ sơ", "Báo cáo", "Tin tức", "Cài đặt"];

export default function App() {
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    
    // Lấy dữ liệu từ hook useHoSo
    const { loading, error, cardsByCol, xoaHoSo, moveCard, fetchAll } = useHoSo();

    return (
        <div className="app">
            {/* Thanh Sidebar bên trái */}
            <Sidebar 
                activeNav={activeNav} 
                setActiveNav={setActiveNav} 
                NAV_ITEMS={NAV_ITEMS} 
                onShowModal={() => setShowModal(true)} 
            />

            <div className="main">
                {/* Thanh Topbar phía trên */}
                <div className="topbar">
                    <span className="topbar-title">Quản Lý Hồ Sơ</span>
                    <input 
                        className="search-input" 
                        placeholder="Tìm kiếm..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <div className="topbar-right">
                        <button className="icon-btn" onClick={fetchAll} title="Làm mới">↻</button>
                    </div>
                </div>

                {/* Thông báo trạng thái */}
                {loading && <div className="state-banner loading">⏳ Đang tải dữ liệu...</div>}
                {error && <div className="state-banner error">⚠️ {error}</div>}

                {/* Phần nội dung chính: Chuyển đổi giữa Dashboard và Hồ sơ */}
                <div className="content-container" style={{ flex: 1, overflow: "auto" }}>
                    {activeNav === "Dashboard" ? (
                        <KanbanBoard 
                            COLUMNS={COLUMNS} 
                            cardsByCol={cardsByCol} 
                            search={search} 
                            onDelete={xoaHoSo} 
                            onMoveCard={moveCard} 
                            onShowModal={() => setShowModal(true)}
                        />
                    ) : activeNav === "Hồ sơ" ? (
                        <ProjectCategoryList />
                    ) : (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <h3>Trang {activeNav}</h3>
                            <p>Giao diện đang được cập nhật...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}