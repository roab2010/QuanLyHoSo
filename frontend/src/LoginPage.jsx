import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("admin_user") || "null");
    if (admin) navigate("/admin");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/admin/login", { username, password });

      if (res.status === 200) {
        localStorage.setItem("admin_user", JSON.stringify(res.data.user));
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/admin");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu quản trị.");
    }
  };

  return (
    <div className="adm-root">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div className="adm-card">
        <header className="adm-header">
          <div className="adm-logo-box">
            <div className="adm-shield">
              <span className="material-symbols-outlined adm-icon">shield_lock</span>
              <div className="adm-glow"></div>
            </div>
            <div className="adm-title">
              <h1>DocuVault <span>Admin</span></h1>
              {/* <p className="adm-desc">Hệ thống quản lý nội bộ dành cho nhân viên</p> */}
            </div>
          </div>
        </header>

        <form onSubmit={handleLogin} className="adm-form">
          <div className="adm-input-group">
            <label>TÊN ĐĂNG NHẬP</label>
            <div className="adm-field">
              <span className="material-symbols-outlined">person</span>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="adm-input-group">
            <label>MẬT KHẨU HỆ THỐNG</label>
            <div className="adm-field">
              <span className="material-symbols-outlined">lock</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="adm-btn">
            Xác thực & Truy cập <span className="material-symbols-outlined">verified</span>
          </button>
        </form>

        <footer className="adm-footer">
          <a href="/" className="adm-back">
            <span className="material-symbols-outlined">arrow_back</span> Quay lại cổng khách hàng
          </a>
        </footer>
      </div>

      <style>{`
        .adm-root {
          height: 100vh;
          background: #0f172a;
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          color: white;
          overflow: hidden;
        }

        .adm-card {
           width: 440px;
           background: rgba(30, 41, 59, 0.4);
           backdrop-filter: blur(20px);
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 40px;
           padding: 60px 48px;
           box-shadow: 0 40px 100px rgba(0,0,0,0.4);
           animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .adm-header {
           margin-bottom: 48px;
        }

        .adm-logo-box {
           display: flex;
           flex-direction: column;
           align-items: center;
           text-align: center;
           gap: 24px;
        }

        .adm-shield {
           width: 64px;
           height: 64px;
           background: #2563eb;
           border-radius: 20px;
           display: flex;
           align-items: center;
           justify-content: center;
           position: relative;
           box-shadow: 0 0 30px rgba(37, 99, 235, 0.4);
        }

        .adm-glow {
           position: absolute;
           inset: -10px;
           background: #2563eb;
           filter: blur(20px);
           opacity: 0.3;
           border-radius: 50%;
           z-index: -1;
        }

        .adm-icon {
           font-size: 32px;
           color: white;
        }

        .adm-title h1 {
           font-family: 'Manrope', sans-serif;
           font-size: 32px;
           font-weight: 800;
           margin: 0;
           letter-spacing: -1.5px;
           line-height: 1.1;
        }

        .adm-title h1 span {
           display: block;
           font-size: 26px;
           opacity: 0.8;
           font-weight: 700;
        }

        .adm-desc {
           margin: 12px auto 0;
           font-size: 13px;
           font-weight: 500;
           color: #94a3b8;
           max-width: 280px;
           line-height: 1.4;
        }

        .adm-form {
           display: flex;
           flex-direction: column;
           gap: 24px;
        }

        .adm-input-group label {
           display: block;
           font-size: 10px;
           font-weight: 800;
           color: #64748b;
           margin-bottom: 12px;
           letter-spacing: 1.5px;
           padding-left: 4px;
           text-align: left;
        }

        .adm-field {
           background: rgba(15, 23, 42, 0.6);
           border: 1px solid rgba(255, 255, 255, 0.08);
           border-radius: 18px;
           display: flex;
           align-items: center;
           padding: 0 20px;
           transition: 0.3s;
        }

        .adm-field:focus-within {
           border-color: #2563eb;
           background: rgba(15, 23, 42, 0.9);
           box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .adm-field .material-symbols-outlined {
           color: #475569;
           font-size: 20px;
        }

        .adm-field input {
           flex: 1;
           height: 56px;
           background: transparent;
           border: none;
           outline: none;
           padding-left: 12px;
           color: white;
           font-size: 15px;
           font-weight: 700;
        }

        .adm-btn {
           margin-top: 12px;
           height: 60px;
           background: #2563eb;
           border: none;
           border-radius: 18px;
           color: white;
           font-family: 'Manrope', sans-serif;
           font-size: 16px;
           font-weight: 900;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 12px;
           transition: 0.3s;
        }

        .adm-btn:hover {
           background: #1d4ed8;
           transform: translateY(-2px);
           box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }

        .adm-footer {
           margin-top: 48px;
           text-align: center;
        }

        .adm-back {
           color: #64748b;
           text-decoration: none;
           font-size: 12px;
           font-weight: 600;
           display: inline-flex;
           align-items: center;
           gap: 8px;
           transition: 0.2s;
        }

        .adm-back:hover {
           color: white;
        }

        .adm-back span {
           font-size: 16px;
        }
      `}</style>
    </div>
  );
}
