import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

function News() {
    const [listNews, setListNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Tất cả");

    const categories = ["Tất cả", "Thời sự", "Thế giới", "Kinh doanh", "Thể thao", "Giải trí"];

    useEffect(() => {

        // 🔥 gọi crawl nền (KHÔNG await)
        axios.get('http://127.0.0.1:8000/api/crawl-news');

        const fetchNews = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:8000/api/news', { timeout: 5000 });

                const data = Array.isArray(res.data)
                    ? res.data
                    : Object.values(res.data).flat();

                setListNews(data);

                localStorage.setItem("news_cache", JSON.stringify(data));

            } catch (err) {
                console.error(err);

                try {
                    const res = await axios.get('http://127.0.0.1:8000/api/news');
                    setListNews(res.data);
                } catch (e) {
                    const cache = localStorage.getItem("news_cache");
                    if (cache) {
                        setListNews(JSON.parse(cache));
                    }
                }

            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);
    const filteredNews = useMemo(() => {
        return filter === "Tất cả"
            ? listNews
            : listNews.filter(item => item && item.category === filter);
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

            {/* Filter */}
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
                            cursor: 'pointer'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px"
            }}>
                {filteredNews.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            transition: "transform 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        {/* Image */}
                        <div style={{ position: "relative", height: "160px" }}>
                            <span style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                background: "#2563eb",
                                color: "#fff",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11px"
                            }}>
                                {item.category}
                            </span>

                            <img
                                src={item.image}
                                alt={item.title}
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/400x250";
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                }}
                            />
                        </div>

                        {/* Content */}
                        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column" }}>
                            <h4 style={{
                                fontSize: "14px",
                                height: "42px",
                                overflow: "hidden"
                            }}>
                                {item.title}
                            </h4>

                            <div style={{ marginTop: "auto" }}>
                                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                                    VnExpress • {new Date().toLocaleDateString('vi-VN')}
                                </p>

                                <button
                                    onClick={() => window.open(item.link, "_blank")}
                                    style={{
                                        width: "100%",
                                        background: "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Đọc chi tiết →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty */}
            {filteredNews.length === 0 && (
                <div style={{ textAlign: "center", padding: "100px" }}>
                    Không có tin tức nào.
                </div>
            )}
        </div>
    );
}

export default News;