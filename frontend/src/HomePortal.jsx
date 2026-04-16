import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HomePortal() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [news, setNews] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);

    // Cào tin tức chuyên biệt về Bất động sản
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:8000/api/news");
                // Chỉ lấy tin thuộc danh mục Bất động sản
                const realEstateNews = res.data.filter(n => n.category === 'Bất động sản' || n.category === 'Kinh doanh').slice(0, 3);
                setNews(realEstateNews.length > 0 ? realEstateNews : res.data.slice(0, 3));
            } catch (err) {
                console.error("Lỗi nạp tin tức:", err);
            } finally {
                setLoadingNews(false);
            }
        };
        fetchNews();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://127.0.0.1:8000/api/login", { email, password });
            if (res.data.status === "success") {
                const userData = res.data.user;
                if (userData.role === 'customer') {
                    localStorage.setItem("customer_user", JSON.stringify(userData));
                    navigate("/customer/dashboard");
                } else {
                    localStorage.setItem("user", JSON.stringify(userData));
                    navigate("/admin");
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
        }
    };

    return (
        <div className="portal-page">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            {/* Nav */}
            <nav className="p-nav">
                <div className="p-nav-inner">
                    <div className="brand-group">
                        <span className="b-name">DocuVault</span>
                        <span className="b-tag">Intelligent Document Management</span>
                    </div>
                    <div className="nav-links">
                        <a href="#news">Thị trường</a>
                        <a href="#features">Tính năng</a>
                        <a href="#footer">Liên hệ</a>
                    </div>
                </div>
            </nav>

            <main className="p-main">
                {/* Refined Hero & Login Section */}
                <section className="p-hero">
                    <div className="p-hero-grid">
                        <div className="p-hero-left">
                            <span className="p-badge">HỆ THỐNG QUẢN LÝ HỒ SƠ THÔNG MINH</span>
                            <h1>Minh bạch hóa <br /> quy trình xây dựng.</h1>
                            <p>Chào mừng bạn đến với DocuVault. Nền tảng hiện đại giúp khách hàng theo dõi tiến độ, quản lý hồ sơ pháp lý và cập nhật thông tin dự án thời gian thực.</p>

                            <div className="p-stats">
                                <div className="s-card"><strong>2.4k+</strong><span>Hồ sơ đã xử lý</span></div>
                                <div className="s-card"><strong>98%</strong><span>Đúng tiến độ</span></div>
                                <div className="s-card"><strong>24/7</strong><span>Hỗ trợ kỹ thuật</span></div>
                            </div>
                        </div>

                        <div className="p-login-container">
                            <div className="p-login-card">
                                <div className="p-card-head-premium">
                                    <div className="head-icon">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div className="head-txt">
                                        <h2>Cổng Khách hàng</h2>
                                    </div>
                                    <div className="head-line"></div>
                                </div>
                                <form onSubmit={handleLogin} className="p-login-form">
                                    <div className="p-field">
                                        <label>Email đăng ký</label>
                                        <input
                                            type="email"
                                            placeholder="example@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="p-field">
                                        <div className="f-row">
                                            <label>Mật khẩu</label>
                                            <a href="#" className="f-link">Quên mật khẩu?</a>
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="p-btn-submit">
                                        Đăng nhập hệ thống <span className="material-symbols-outlined">bolt</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* News Section */}
                <section id="news" className="p-news">
                    <div className="p-section-inner">
                        <div className="p-section-head">
                            <div className="h-left">
                                <h2>Tin tức Bất động sản</h2>
                                <p>Cập nhật thị trường và pháp lý mới nhất từ VnExpress</p>
                            </div>
                            <button className="p-btn-more" onClick={() => navigate("/news")}>
                                Xem tất cả <span className="material-symbols-outlined">arrow_right_alt</span>
                            </button>
                        </div>

                        <div className="p-news-grid">
                            {loadingNews ? (
                                Array(3).fill(0).map((_, i) => <div key={i} className="p-news-skeleton"></div>)
                            ) : news.map((item, idx) => (
                                <article 
                                    key={idx} 
                                    className="p-news-card" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => window.open(item.link, "_blank")}
                                >
                                    <div className="p-news-thumb">
                                        <img src={item.image} alt={item.title} />
                                        <span className="p-news-cat">{item.category}</span>
                                    </div>
                                    <div className="p-news-info">
                                        <h3>{item.title}</h3>
                                        <div className="p-news-meta">
                                            <span>Ban biên tập DocuVault</span>
                                            <span>• Hôm nay</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section - RESTORED & POLISHED */}
                <section id="features" className="features-section">
                    <div className="section-container grid-2">
                        <div className="feature-visual">
                            <div className="visual-box">
                                <img src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop" alt="Dashboard" />
                                <div className="security-badge">
                                    <span className="material-symbols-outlined">security</span>
                                </div>
                            </div>
                        </div>
                        <div className="feature-text">
                            <h2>Quản lý dự án của bạn <br /> một cách thông minh</h2>
                            <p>Hệ thống DocuVault được thiết kế để tối ưu hóa sự tương tác giữa khách hàng và các đơn vị chuyên môn. Mọi thay đổi đều được thông báo tức thì.</p>

                            <ul className="feature-list">
                                <li>
                                    <div className="box-icon"><span className="material-symbols-outlined">verified</span></div>
                                    <div>
                                        <h4>Dữ liệu chuẩn xác</h4>
                                        <p>Thông tin hồ sơ được cập nhật trực tiếp từ hệ thống quản lý trung tâm.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="box-icon"><span className="material-symbols-outlined">chat_bubble</span></div>
                                    <div>
                                        <h4>Phản hồi nhanh chóng</h4>
                                        <p>Kết nối trực tiếp với chuyên viên xử lý hồ sơ ngay trên ứng dụng.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="box-icon"><span className="material-symbols-outlined">cloud_done</span></div>
                                    <div>
                                        <h4>Lưu trữ bảo mật</h4>
                                        <p>Toàn bộ tài liệu pháp lý được mã hóa và lưu trữ trên nền tảng đám mây.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            <footer id="footer" className="portal-footer">
                <div className="footer-links">
                    <a href="#">Điều khoản</a>
                    <a href="#">Bảo mật</a>
                    <a href="#">Liên hệ</a>
                </div>
                <div className="social-icons">
                    <a href="#" className="s-icon"><span className="material-symbols-outlined">social_leaderboard</span></a>
                    <a href="#" className="s-icon"><span className="material-symbols-outlined">alternate_email</span></a>
                    <a href="#" className="s-icon"><span className="material-symbols-outlined">share</span></a>
                </div>
                <div className="footer-bottom">
                    <span className="footer-brand">DocuVault</span>
                    <p>© 2024 DocuVault Systems. Tất cả quyền được bảo lưu.</p>
                </div>
            </footer>

            <style>{`
                :root {
                    --primary: #00488d;
                    --primary-dim: #00366b;
                    --p-accent: #d6e3ff;
                    --p-surface: #f8f9fa;
                    --on-surface: #191c1d;
                    --on-surface-variant: #424752;
                    --text-soft: #64748b;
                    --p-font-head: 'Manrope', sans-serif;
                    --p-font-main: 'Inter', sans-serif;
                    --radius-lg: 40px;
                    --radius-md: 24px;
                }

                .portal-page { background: var(--p-surface); color: var(--on-surface); font-family: var(--p-font-main); overflow-x: hidden; }
                
                /* Navbar Refined */
                .p-nav { height: 75px; background: rgba(255,255,255,0.85); backdrop-filter: blur(15px); border-bottom: 1px solid rgba(0,0,0,0.03); position: sticky; top: 0; z-index: 1000; }
                .p-nav-inner { max-width: 1200px; margin: 0 auto; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
                .brand-group { display: flex; flex-direction: column; }
                .b-name { font-family: var(--p-font-head); font-weight: 800; font-size: 24px; color: var(--primary); letter-spacing: -1.5px; }
                .b-tag { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: -3px; }
                .nav-links { display: flex; gap: 32px; }
                .nav-links a { text-decoration: none; color: var(--on-surface-variant); font-size: 14px; font-weight: 700; transition: 0.2s; }
                .nav-links a:hover { color: var(--primary); }

                /* Hero Section Refined */
                .p-hero { padding: 80px 40px; max-width: 1200px; margin: 0 auto; width: 100%; }
                .p-hero-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 80px; align-items: center; }
                .p-hero-left h1 { font-family: var(--p-font-head); font-size: 64px; font-weight: 800; color: var(--primary); line-height: 1.05; margin: 24px 0; letter-spacing: -3.5px; }
                .p-badge { font-size: 10px; font-weight: 800; background: var(--primary); color: white; padding: 6px 16px; border-radius: 100px; letter-spacing: 1.5px; }
                .p-hero-left p { font-size: 19px; color: var(--on-surface-variant); line-height: 1.6; max-width: 500px; margin-bottom: 48px; }
                .p-stats { display: flex; gap: 40px; }
                .s-card strong { display: block; font-size: 28px; font-weight: 800; color: var(--primary); letter-spacing: -1px; }
                .s-card span { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px; }

                /* Login Card - Restyle Top Section as requested */
                .p-login-container { perspective: 1200px; }
                .p-login-card { background: white; padding: 48px; border-radius: 40px; box-shadow: 0 50px 100px rgba(0,72,141,0.1); border: 1px solid rgba(0,0,0,0.01); }
                .p-card-head-premium { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 40px; }
                .head-icon { width: 64px; height: 64px; background: #eff6ff; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 20px; transition: 0.3s; }
                .p-login-card:hover .head-icon { transform: rotate(10deg) scale(1.1); background: var(--primary); color: white; }
                .head-icon .material-symbols-outlined { font-size: 32px; }
                .head-txt h2 { font-family: var(--p-font-head); font-size: 28px; font-weight: 800; margin: 0 0 6px; letter-spacing: -1px; }
                .head-txt p { font-size: 14px; font-weight: 600; color: #94a3b8; }
                .head-line { width: 40px; height: 4px; background: var(--primary); border-radius: 2px; margin-top: 15px; opacity: 0.1; }
                
                .p-login-form .p-field { margin-bottom: 24px; text-align: left; }
                .p-login-form label { display: block; font-family: var(--p-font-head); font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--on-surface-variant); margin-bottom: 12px; padding-left: 2px; letter-spacing: 0.5px; }
                .p-login-form input { width: 100%; background: #f8fafc; border: 2px solid #f1f5f9; padding: 18px 24px; border-radius: 18px; font-family: var(--p-font-main); font-size: 15px; font-weight: 600; outline: none; transition: 0.3s; color: var(--on-surface); }
                .p-login-form input:focus { background: white; border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,72,141,0.06); }
                .f-row { display: flex; justify-content: space-between; align-items: center; }
                .f-link { font-size: 11px; font-weight: 800; color: var(--primary); text-decoration: none; }
                .p-btn-submit { width: 100%; background: var(--primary); color: white; border: none; padding: 20px; border-radius: 100px; font-family: var(--p-font-head); font-size: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 10px; box-shadow: 0 15px 35px rgba(0,72,141,0.2); }
                .p-btn-submit:hover { transform: translateY(-4px); background: var(--primary-dim); }

                /* News Section */
                .p-news { background: white; padding: 120px 40px; }
                .p-section-inner { max-width: 1200px; margin: 0 auto; }
                .p-section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 64px; }
                .h-left h2 { font-family: var(--p-font-head); font-size: 40px; font-weight: 800; letter-spacing: -1.5px; }
                .h-left p { color: var(--on-surface-variant); font-size: 16px; font-weight: 500; margin-top: 8px; }
                .p-btn-more { background: #f1f5f9; border: none; color: var(--primary); font-family: var(--p-font-head); font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; padding: 12px 24px; border-radius: 100px; }
                .p-btn-more:hover { background: var(--primary); color: white; }
                .p-news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
                .p-news-card { background: var(--p-surface); border-radius: 32px; overflow: hidden; transition: 0.3s; border: 1px solid rgba(0,0,0,0.02); }
                .p-news-card:hover { transform: translateY(-12px); box-shadow: 0 30px 60px rgba(0,0,0,0.08); }
                .p-news-thumb { height: 230px; position: relative; overflow: hidden; }
                .p-news-thumb img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
                .p-news-card:hover .p-news-thumb img { transform: scale(1.1); }
                .p-news-cat { position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.9); color: var(--primary); padding: 6px 16px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 1px; backdrop-filter: blur(5px); }
                .p-news-info { padding: 32px; }
                .p-news-info h3 { font-family: var(--p-font-head); font-size: 20px; font-weight: 800; line-height: 1.35; margin: 0 0 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--on-surface); }
                .p-news-meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

                /* Features Section - RESTORED ORIGINAL CSS */
                .features-section { padding: 120px 0; background: var(--p-surface); }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 40px; }
                .feature-visual { position: relative; }
                .visual-box { padding: 16px; background: white; border-radius: 40px; box-shadow: 0 40px 80px rgba(0,0,0,0.05); transform: rotate(2deg); }
                .visual-box img { width: 100%; border-radius: 32px; }
                .security-badge { position: absolute; bottom: -24px; right: -24px; background: var(--primary); width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 15px 30px rgba(0,72,141,0.3); animation: bounce 3s infinite; }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .feature-text h2 { font-family: var(--p-font-head); font-size: 40px; font-weight: 800; line-height: 1.2; margin-bottom: 24px; }
                .feature-text p { font-size: 18px; color: var(--on-surface-variant); line-height: 1.6; margin-bottom: 48px; }
                .feature-list { list-style: none; padding: 0; margin: 0; }
                .feature-list li { display: flex; gap: 20px; margin-bottom: 32px; }
                .box-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--p-accent); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; margin-top: 4px; }
                .feature-list h4 { font-family: var(--p-font-head); font-size: 16px; font-weight: 800; margin-bottom: 4px; }
                .feature-list p { font-size: 14px; margin-bottom: 0; color: var(--on-surface-variant); }

                /* Footer - RESTORED ORIGINAL CSS */
                .portal-footer { padding: 80px 40px; border-top: 1px solid rgba(0,0,0,0.03); text-align: center; background: white; }
                .footer-links { display: flex; justify-content: center; gap: 32px; margin-bottom: 32px; }
                .footer-links a { text-decoration: none; color: #94a3b8; font-size: 14px; font-weight: 600; transition: 0.2s; }
                .footer-links a:hover { color: var(--on-surface); }
                .social-icons { display: flex; justify-content: center; gap: 24px; margin-bottom: 32px; }
                .s-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--p-surface); display: flex; align-items: center; justify-content: center; color: var(--on-surface-variant); text-decoration: none; transition: 0.3s; }
                .s-icon:hover { background: var(--p-accent); color: var(--primary); }
                .footer-bottom .footer-brand { display: block; font-family: var(--p-font-head); font-weight: 800; font-size: 20px; color: #cbd5e1; margin-bottom: 8px; }
                .footer-bottom p { font-size: 12px; color: #94a3b8; font-weight: 600; }
                
                @media (max-width: 1024px) {
                    .p-hero-grid, .grid-2 { grid-template-columns: 1fr; gap: 60px; text-align: center; }
                    .p-hero-left h1 { font-size: 52px; }
                    .p-hero-left p, .feature-text p { margin-left: auto; margin-right: auto; }
                    .p-stats, .social-icons, .footer-links { justify-content: center; }
                    .p-news-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
}
