import { useEffect, useState } from "react";

export default function CustomerDashboard() {
  const [data, setData] = useState([]);

  const user = JSON.parse(localStorage.getItem("customer"));

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/customer/ho-so?customer_id=${user.id}`)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch(() => alert("Lỗi load dữ liệu"));
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Tiến độ hồ sơ của bạn</h2>

      {data.length === 0 && <p>Không có hồ sơ</p>}

      {data.map((item) => (
        <div
          key={item.id}
          style={styles.card}
          onClick={() =>
            (window.location.href = `/customer/ho-so/${item.id}`)
          }
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          <h3>{item.name}</h3>
          <p>Trạng thái: {item.status}</p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: "0.3s",
    cursor: "pointer",
  },
};