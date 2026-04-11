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
            // Sau này dùng API thật thì mở dòng dưới ra:
            // const data = await getChiTietHoSo(id);
            // setProject(data);
            
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
            {/* 1. Header luôn hiển thị */}
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
                {/* 2. Sidebar luôn hiển thị */}
                <div className="detail-sidebar">
                    <button 
                        className={activeTab === "thong-tin" ? "active" : ""} 
                        onClick={() => setActiveTab("thong-tin")}
                    >
                        Thông tin chung <span>›</span>
                    </button>
                    <button 
                        className={activeTab === "phap-ly" ? "active" : ""} 
                        onClick={() => setActiveTab("phap-ly")}
                    >
                        Tài liệu pháp lý
                    </button>
                    <button 
                        className={activeTab === "tien-do" ? "active" : ""} 
                        onClick={() => setActiveTab("tien-do")}
                    >
                        Tiến độ thi công
                    </button>
                    <button className="btn-back" onClick={() => navigate("/")} style={{marginTop: '20px'}}>
                        ← Quay lại bảng
                    </button>
                </div>

                {/* 3. Nội dung chính thay đổi theo Tab */}
                <div className="detail-main">
                    {activeTab === "thong-tin" && (
                        <section className="info-section animate-fade-in">
                            <div className="section-header">
                                <h3>Thông tin dự án chi tiết</h3>
                                <button className="btn-edit">✎ Chỉnh sửa hồ sơ</button>
                            </div>
                            <div className="info-grid big-grid">
                                <div className="info-item">
                                    <label>TÊN DỰ ÁN</label>
                                    <p>{project.name}</p>
                                </div>
                                <div className="info-item">
                                    <label>KỸ SƯ TRƯỞNG</label>
                                    <p>👤 {project.supervisor}</p>
                                </div>
                                <div className="info-item full">
                                    <label>ĐỊA CHỈ CÔNG TRÌNH</label>
                                    <p>{project.address}</p>
                                </div>
                                <div className="info-item">
                                    <label>CHỦ ĐẦU TƯ</label>
                                    <p>{project.investor}</p>
                                </div>
                                <div className="info-item">
                                    <label>NGÀY KHỞI CÔNG</label>
                                    <p>{project.start_date}</p>
                                </div>
                            </div>
                        </section>
                    )}

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
                                    <tr>
                                        <td>📄 Bản vẽ kiến trúc tầng 1-10</td>
                                        <td>15/06/2024</td>
                                        <td><span className="st-wait">CHỜ DUYỆT</span></td>
                                        <td>
                                            <button className="btn-approve">DUYỆT</button>
                                            <button className="btn-reject">TỪ CHỐI</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    )}

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
                </div> {/* Đóng detail-main */}
            </div> {/* Đóng detail-content */}
        </div> 
    );
}