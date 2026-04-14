import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Đăng ký thành công");

        // 👉 chuyển sang login
        window.location.href = "/customer/login";
      } else {
        alert(data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h2>Đăng ký tài khoản</h2>

          <input name="full_name" placeholder="Họ tên" onChange={handleChange} style={styles.input} />
          <input name="email" placeholder="Email" onChange={handleChange} style={styles.input} />
          <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} style={styles.input} />
          <input name="phone" placeholder="SĐT" onChange={handleChange} style={styles.input} />
          <input name="address" placeholder="Địa chỉ" onChange={handleChange} style={styles.input} />

          <button onClick={handleRegister} style={styles.button}>
            Đăng ký
          </button>

          <p>
            Đã có tài khoản? <a href="/customer/login">Đăng nhập</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    width: "360px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },
};