import CustomerDashboard from "./CustomerDashboard";

export default function CustomerLayout() {
  const user = JSON.parse(localStorage.getItem("customer") || "null");

  // 🔥 nếu chưa login → quay lại login
  if (!user) {
    window.location.href = "/customer/login";
    return null;
  }

  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h3>Khách hàng</h3>
        <p>{user.full_name}</p>

        <button style={styles.menu}>Tiến độ hồ sơ</button>

        <button
          style={styles.logout}
          onClick={() => {
            localStorage.removeItem("customer");
            window.location.href = "/customer/login";
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        <CustomerDashboard />
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    background: "linear-gradient(180deg, #0f172a, #1e293b)",
    color: "#fff",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  content: {
    flex: 1,
    padding: "30px",
    background: "#f1f5f9",
  },
  menu: {
    width: "100%",
    padding: "12px",
    marginTop: "20px",
    borderRadius: "10px",
    border: "none",
    background: "#334155",
    color: "#fff",
    cursor: "pointer",
  },
  logout: {
    marginTop: "auto",
    background: "#ef4444",
    color: "#fff",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};