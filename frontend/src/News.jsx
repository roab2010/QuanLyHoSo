import React, { useEffect, useState } from 'react';
import axios from 'axios';

function News() {
    const [listNews, setListNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Tất cả");

    const categories = ["Tất cả", "Thời sự", "Thế giới", "Kinh doanh", "Thể thao", "Giải trí"];

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/news')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : Object.values(res.data);
                setListNews(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Lọc danh sách tin theo chuyên mục đã chọn
    const filteredNews = filter === "Tất cả" 
        ? listNews 
        : listNews.filter(item => item.category === filter);

    if (loading) {
        return <div style={{ padding: "50px", textAlign: "center" }}>🔄 Đang tải tin tổng hợp...</div>;
    }

    return (
        <div style={{ padding: "20px", background: "#f3f4f6", minHeight: "100vh" }}>
            <h2 style={{ marginBottom: "20px" }}>Bản tin tổng hợp</h2>

            {/* Bộ lọc chuyên mục */}
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
                            cursor: 'pointer',
                            transition: '0.3s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                gap: "25px" 
            }}>
                {/* Đảm bảo bên trong dấu ( ) này có code JSX của cái Card */}
                {filteredNews.map((item, index) => (
                    <div key={index} style={{ 
                        background: "#fff", 
                        borderRadius: "15px", 
                        overflow: "hidden",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        position: "relative"
                    }}>
                        <span style={{
                            position: "absolute", top: "10px", left: "10px",
                            background: "rgba(37, 99, 235, 0.9)", color: "#fff",
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold"
                        }}>
                            {item.category}
                        </span>

                        <img src={item.image} alt="" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                        
                        <div style={{ padding: "15px" }}>
                            <h4 style={{ fontSize: "16px", height: "45px", overflow: "hidden", marginBottom: "15px", lineHeight: "1.4" }}>
                                {item.title}
                            </h4>
                            <a href={item.link} target="_blank" rel="noreferrer" style={{ 
                                color: "#2563eb", textDecoration: "none", fontWeight: "bold" 
                            }}>
                                Đọc chi tiết →
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default News;