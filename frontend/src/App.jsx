import { useState } from "react";
import "./App.css";
import useHoSo from "./HoSo.js"; 
import Sidebar from "./Sidebar";
import KanbanBoard from "./KanbanBoard";
import ProjectCategoryList from "./ProjectCategoryList";
import News from "./News";
import ModalAddProject from "./ModalAddProject"; // Đảm bảo bạn đã tạo file này

const COLUMNS = [
    { id: "new",         title: "Mới tạo",    color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done",        title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Dashboard", "Danh mục dự án", "Báo cáo", "Tin tức", "Cài đặt"];

export default function App() {
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    
    // 1. Lấy tất cả các hàm xử lý từ hook useHoSo
    const { 
        loading, 
        error, 
        cardsByCol, 
        xoaHoSo, 
        moveCard, 
        fetchAll, 
        themHoSo // Hàm này bạn đã định nghĩa trong HoSo.js
    } = useHoSo();

    // 2. Hàm xử lý khi người dùng nhấn "Lưu" trong Modal thêm mới
    const handleSaveProject = async (formData) => {
        const result = await themHoSo(formData);
        if (result.ok) {
            setShowModal(false); // Đóng modal sau khi thêm thành công
            // Chú ý: Trong HoSo.js của bạn, themHoSo đã có setCards nên UI sẽ tự cập nhật
        } else {
            alert(result.message || "Không thể tạo hồ sơ");
        }
    };

    return (
        <div className="app">
            {/* Sidebar điều hướng và nút mở Modal */}
            <Sidebar 
                activeNav={activeNav} 
                setActiveNav={setActiveNav} 
                NAV_ITEMS={NAV_ITEMS} 
                onShowModal={() => setShowModal(true)} 
            />

            <div className="main">
                {/* Thanh công cụ phía trên */}
                <div className="topbar">
                    <span className="topbar-title">Quản Lý Hồ Sơ</span>
                    <input 
                        className="search-input" 
                        placeholder="Tìm kiếm mã hồ sơ hoặc tên dự án..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <div className="topbar-right">
                        <button className="icon-btn" onClick={fetchAll} title="Làm mới dữ liệu">
                            ↻ Làm mới
                        </button>
                    </div>
                </div>

                {/* Hiển thị thông báo khi đang xử lý API */}
                {loading && <div className="state-banner loading">⏳ Đang xử lý...</div>}
                {error && <div className="state-banner error">⚠️ {error}</div>}

                {/* Phần nội dung thay đổi theo Sidebar */}
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
                    ) : activeNav === "Danh mục dự án" ? (
                        <ProjectCategoryList />
                    ) : activeNav === "Tin tức" ? (
                        <News />
                    ) : (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <h3>Trang {activeNav}</h3>
                            <p>Tính năng đang được phát triển...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Modal thêm hồ sơ mới */}
            {showModal && (
                <ModalAddProject 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSaveProject} 
                />
            )}
        </div>
    );
}