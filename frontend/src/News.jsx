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
            <div style={{ padding: "50px", textAlign: "center" }}>
                🔄 Đang tải tin tức...
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", background: "#f3f4f6", minHeight: "100vh" }}>
            
            {/* Header */}
            <h2 style={{ marginBottom: "5px" }}>📰 Bản tin tổng hợp</h2>
            <p style={{ marginBottom: "20px", color: "#6b7280" }}>
                Nguồn: VnExpress
            </p>

            {/* Filter */}
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
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
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "25px"
            }}>
                {filteredNews.map(item => (
                    <div key={item.link} style={{
                        background: "#fff",
                        borderRadius: "15px",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ position: "relative" }}>
                            <span style={{
                                position: "absolute",
                                top: "10px",
                                left: "10px",
                                background: "#2563eb",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px"
                            }}>
                                {item.category}
                            </span>

                            <img
                                src={item.image}
                                alt=""
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/400x250";
                                }}
                                style={{
                                    width: "100%",
                                    height: "180px",
                                    objectFit: "cover"
                                }}
                            />
                        </div>

                        <div style={{ padding: "15px" }}>
                            <h4 style={{
                                fontSize: "16px",
                                height: "50px",
                                overflow: "hidden"
                            }}>
                                {item.title}
                            </h4>

                            <p style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                margin: "5px 0"
                            }}>
                                Nguồn: VnExpress
                            </p>

                            <button
                                onClick={() => window.open(item.link, "_blank")}
                                style={{
                                    marginTop: "10px",
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                Đọc chi tiết →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default News;