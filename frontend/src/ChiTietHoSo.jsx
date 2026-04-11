import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChiTietHoSo } from "./hoSoService";

export default function ChiTietHoSo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState("thong-tin");

    useEffect(() => {
        const fetchData = async () => {
            setProject({
                project_code: "HS-9021",
                name: "Tòa nhà Landmark 81",
                supervisor: "Nguyễn Văn Nam",
                address: "720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh",
                investor: "Vingroup JSC",
                start_date: "15 tháng 06, 2024",
                progress: 65
            });
        };
        fetchData();
    }, [id]);

    if (!project) return <div className="loading">Đang tải...</div>;

    return (
        <div className="detail-container">
            {/* Header */}
            <div className="detail-header">
                <div className="breadcrumb">DỰ ÁN / CHI TIẾT HỒ SƠ</div>
                <div className="header-main">
                    <h2>Chi tiết hồ sơ #{project.project_code}: {project.name}</h2>
                    <div className="header-btns">
                        <button className="btn-share">Chia sẻ</button>
                        <button className="btn-export">Xuất file PDF</button>
                    </div>
                </div>
                <p className="sub-text">Hệ thống quản lý hồ sơ kỹ thuật và vận hành thi công.</p>
            </div>

            <div className="detail-content">
                {/* Sidebar */}
                <div className="detail-sidebar">
                    <button className={activeTab === "thong-tin" ? "active" : ""} onClick={() => setActiveTab("thong-tin")}>
                        Thông tin chung <span>›</span>
                    </button>
                    <button className={activeTab === "phap-ly" ? "active" : ""} onClick={() => setActiveTab("phap-ly")}>
                        Tài liệu pháp lý
                    </button>
                    <button className={activeTab === "nhan-su" ? "active" : ""} onClick={() => setActiveTab("nhan-su")}>
                        Nhân sự & Thành viên
                    </button>
                    <button className={activeTab === "vat-tu" ? "active" : ""} onClick={() => setActiveTab("vat-tu")}>
                        Vật tư & Thiết bị
                    </button>
                    <button className={activeTab === "tien-do" ? "active" : ""} onClick={() => setActiveTab("tien-do")}>
                        Tiến độ thi công
                    </button>
                    <button className="btn-back" onClick={() => navigate("/")} style={{marginTop: '20px'}}>
                        ← Quay lại bảng
                    </button>
                </div>

                {/* Nội dung chính */}
                <div className="detail-main">
                    {/* Tab Thông tin chung */}
                    {activeTab === "thong-tin" && (
                        <section className="info-section animate-fade-in">
                            <div className="section-header">
                                <h3>Thông tin dự án chi tiết</h3>
                                <button className="btn-edit">✎ Chỉnh sửa hồ sơ</button>
                            </div>
                            <div className="info-grid big-grid">
                                <div className="info-item"><label>TÊN DỰ ÁN</label><p>{project.name}</p></div>
                                <div className="info-item"><label>KỸ SƯ TRƯỞNG</label><p>👤 {project.supervisor}</p></div>
                                <div className="info-item full"><label>ĐỊA CHỈ CÔNG TRÌNH</label><p>{project.address}</p></div>
                                <div className="info-item"><label>CHỦ ĐẦU TƯ</label><p>{project.investor}</p></div>
                                <div className="info-item"><label>NGÀY KHỞI CÔNG</label><p>{project.start_date}</p></div>
                            </div>
                        </section>
                    )}

                    {/* Tab Pháp lý */}
                    {activeTab === "phap-ly" && (
                        <section className="document-section animate-fade-in">
                            <div className="section-header">
                                <h3>Danh sách hồ sơ pháp lý</h3>
                                <button className="btn-upload">↑ Tải hồ sơ mới</button>
                            </div>
                            <table className="doc-table">
                                <thead>
                                    <tr>
                                        <th>TÊN TÀI LIỆU</th>
                                        <th>NGÀY TẢI LÊN</th>
                                        <th>TRẠNG THÁI</th>
                                        <th>HÀNH ĐỘNG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>📄 Giấy phép xây dựng #GP-88</td>
                                        <td>12/06/2024</td>
                                        <td><span className="st-done">ĐÃ XONG</span></td>
                                        <td><button className="btn-icon">⬇</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Tab Nhân sự mới */}
                    {activeTab === "nhan-su" && (
                        <section className="document-section animate-fade-in">
                            <div className="section-header">
                                <h3>Đội ngũ nhân sự dự án</h3>
                                <button className="btn-upload">+ Thêm thành viên</button>
                            </div>
                            <table className="doc-table">
                                <thead>
                                    <tr>
                                        <th>HỌ VÀ TÊN</th>
                                        <th>CHỨC VỤ</th>
                                        <th>SỐ ĐIỆN THOẠI</th>
                                        <th>TRẠNG THÁI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>👤 Nguyễn Văn Nam</td>
                                        <td>Kỹ sư trưởng</td>
                                        <td>0901.234.xxx</td>
                                        <td><span className="st-done">ĐANG TRỰC</span></td>
                                    </tr>
                                    <tr>
                                        <td>👤 Trần Thị Bé</td>
                                        <td>Kế toán công trình</td>
                                        <td>0908.777.xxx</td>
                                        <td><span className="st-done">ĐANG TRỰC</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Tab Vật tư mới */}
                    {activeTab === "vat-tu" && (
                        <section className="document-section animate-fade-in">
                            <div className="section-header">
                                <h3>Quản lý Vật tư & Thiết bị</h3>
                                <button className="btn-upload">+ Nhập vật tư</button>
                            </div>
                            <table className="doc-table">
                                <thead>
                                    <tr>
                                        <th>TÊN VẬT TƯ / THIẾT BỊ</th>
                                        <th>SỐ LƯỢNG</th>
                                        <th>ĐƠN VỊ</th>
                                        <th>TÌNH TRẠNG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>🏗️ Cần cẩu tháp Potain</td>
                                        <td>02</td>
                                        <td>Bộ</td>
                                        <td><span className="st-done">ỔN ĐỊNH</span></td>
                                    </tr>
                                    <tr>
                                        <td>🧱 Xi măng Holcim</td>
                                        <td>500</td>
                                        <td>Tấn</td>
                                        <td><span className="st-wait">SẮP HẾT</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Tab Tiến độ */}
                    {activeTab === "tien-do" && (
                        <section className="progress-details animate-fade-in">
                            <div className="section-header">
                                <h3>Tiến độ thi công thực tế</h3>
                            </div>
                            <div className="progress-big-card">
                                <p>Hiện trạng: <strong>Đang thi công phần thô tầng 5</strong></p>
                                <div className="big-progress-bar">
                                    <div className="fill" style={{width: `${project.progress}%`}}></div>
                                </div>
                                <span className="big-percent">{project.progress}% Hoàn thành</span>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div> 
    );
}

