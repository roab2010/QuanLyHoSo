import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

function News() {
    const [listNews, setListNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Tất cả");

    const categories = ["Tất cả", "Thời sự", "Thế giới", "Kinh doanh", "Thể thao", "Giải trí"];

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/news')
            .then(res => {
                const data = Array.isArray(res.data)
                    ? res.data
                    : Object.values(res.data).flat();

                setListNews(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredNews = useMemo(() => {
        return filter === "Tất cả"
            ? listNews
            : listNews.filter(item => item.category === filter);
    }, [filter, listNews]);

    if (loading) {
        return (
            <div style={{ padding: "50px", textAlign: "center", fontSize: "18px" }}>
                🔄 Đang tải tin tức từ VnExpress...
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", background: "#f3f4f6", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
            
            {/* Header */}
            <div style={{ marginBottom: "25px" }}>
                <h2 style={{ marginBottom: "5px", color: "#111827" }}>📰 Bản tin tổng hợp</h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                    Cập nhật tin tức mới nhất từ VnExpress
                </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '25px',
                            border: '1px solid #2563eb',
                            background: filter === cat ? '#2563eb' : '#fff',
                            color: filter === cat ? '#fff' : '#2563eb',
                            cursor: 'pointer',
                            fontWeight: "500",
                            transition: "all 0.2s"
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* News Grid - CHỈNH 4 CỘT TẠI ĐÂY */}
            <div style={{
                display: "grid",
                // Chia cố định 4 cột, mỗi cột chiếm 1 phần bằng nhau (1fr)
                gridTemplateColumns: "repeat(4, 1fr)", 
                gap: "20px"
            }}>
                {filteredNews.map((item, index) => (
                    <div key={item.link || index} style={{
                        background: "#fff",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s"
                    }}>
                        {/* Image Container */}
                        <div style={{ position: "relative", height: "160px" }}>
                            <span style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                background: "rgba(37, 99, 235, 0.9)",
                                color: "#fff",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                zIndex: 1
                            }}>
                                {item.category}
                            </span>

                            <img
                                src={item.image}
                                alt={item.title}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/400x250?text=No+Image";
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                }}
                            />
                        </div>

                        {/* Content Container */}
                        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column" }}>
                            <h4 style={{
                                fontSize: "14px",
                                lineHeight: "1.5",
                                height: "42px", // Giới hạn chiều cao tiêu đề (khoảng 2 dòng)
                                margin: "0 0 10px 0",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                color: "#1f2937"
                            }}>
                                {item.title}
                            </h4>

                            <div style={{ marginTop: "auto" }}>
                                <p style={{
                                    fontSize: "11px",
                                    color: "#9ca3af",
                                    marginBottom: "10px"
                                }}>
                                    VnExpress • {new Date().toLocaleDateString('vi-VN')}
                                </p>

                                <button
                                    onClick={() => window.open(item.link, "_blank")}
                                    style={{
                                        width: "100%",
                                        background: "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px 0",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: "500"
                                    }}
                                >
                                    Đọc chi tiết →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredNews.length === 0 && (
                <div style={{ textAlign: "center", padding: "100px", color: "#6b7280" }}>
                    Không có tin tức nào trong danh mục này.
                </div>
            )}
        </div>
    );
}

export default News;