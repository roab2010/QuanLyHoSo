import { useEffect } from "react";

export default function CustomerHome() {
  const user = JSON.parse(localStorage.getItem("customer"));

    useEffect(() => {
      if (!user) {
        window.location.href = "/customer/login";
      }
    }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    window.location.href = "/customer/login";
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Trang khách hàng</h1>
      <h2>Xin chào {user?.full_name} 👋</h2>

      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}