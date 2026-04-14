import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/customer/ho-so/${id}`)
      .then((res) => res.json())
      .then((res) => setData(res));
  }, []);

  if (!data) return <p>Đang tải...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>{data.name}</h2>
      <p>Trạng thái: {data.status}</p>

      <button
        onClick={() => (window.location.href = "/customer")}
        style={styles.btn}
      >
        ← Quay lại
      </button>
    </div>
  );
}

const styles = {
  btn: {
    marginTop: "20px",
    padding: "10px 20px",
  },
};