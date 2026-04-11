import React, { useState, useEffect } from "react";
import {
  getTemplatesByCategoryId,
  createTemplateTask,
  updateTemplateTask,
  deleteTemplateTask,
} from "./hoSoService";

export default function ModalTemplateManagement({
  onClose,
  categoryId,
  categoryName,
}) {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskVolume, setNewTaskVolume] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const loadTemplates = async () => {
    try {
      if (categoryId) {
        const res = await getTemplatesByCategoryId(categoryId);
        const finalData = res?.data || (Array.isArray(res) ? res : []);
        setTasks(finalData);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách tác vụ mẫu:", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [categoryId]);

  const handleSubmit = async () => {
    if (!newTaskName || !newTaskVolume || !newTaskPriority) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const payload = {
        category_id: Number(categoryId),
        task_name: newTaskName,
        work_volume: Number(newTaskVolume),
        sort_order: Number(newTaskPriority),
      };

      if (editingTaskId) {
        await updateTemplateTask(editingTaskId, payload);
        alert("Cập nhật thành công!");
      } else {
        await createTemplateTask(payload);
        alert("Thêm tác vụ mẫu thành công!");
      }

      resetForm();
      loadTemplates();
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || "Lỗi kết nối"));
    }
  };

  const resetForm = () => {
    setNewTaskName("");
    setNewTaskVolume("");
    setNewTaskPriority("");
    setEditingTaskId(null);
  };

  const handleEditClick = (task) => {
    setNewTaskName(task.task_name);
    setNewTaskVolume(task.work_volume);
    setNewTaskPriority(task.sort_order);
    setEditingTaskId(task.id);
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa quy trình này?")) {
      try {
        await deleteTemplateTask(id);
        loadTemplates();
      } catch (error) {
        alert("Không thể xóa!");
      }
    }
  };

  return (
    <div className="modal-overlay">
      {/* Tao dùng class 'modal' và inline style để đảm bảo nó to và đẹp */}
      <div className="modal" style={{ width: "850px", maxWidth: "95%" }}>
        <div className="modal-header">
          <h3>
            Quản lý quy trình mẫu:{" "}
            <span style={{ color: "#2563eb" }}>{categoryName}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Form thêm mới - Tao dùng grid cho gọn */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "10px",
              background: "#f8fafc",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label className="form-label">Tên công việc mẫu</label>
              <input
                className="form-input"
                type="text"
                placeholder="VD: Khảo sát..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Khối lượng (%)</label>
              <input
                className="form-input"
                type="number"
                value={newTaskVolume}
                onChange={(e) => setNewTaskVolume(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Thứ tự</label>
              <input
                className="form-input"
                type="number"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "5px" }}
            >
              <button
                className="btn-submit"
                onClick={handleSubmit}
                style={{ width: "100%" }}
              >
                {editingTaskId ? "Lưu" : "Thêm"}
              </button>
              {editingTaskId && (
                <button className="btn-cancel" onClick={resetForm}>
                  Hủy
                </button>
              )}
            </div>
          </div>

          {/* Bảng danh sách - Dùng class category-table để đồng bộ layout */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="category-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Thứ tự</th>
                  <th>Tên công việc quy trình mẫu</th>
                  <th style={{ width: "120px" }}>Khối lượng</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td style={{ textAlign: "center" }}>{task.sort_order}</td>
                      <td>{task.task_name}</td>
                      <td>{task.work_volume}%</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditClick(task)}
                          style={{
                            marginRight: "15px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#2563eb",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#dc2626",
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#94a3b8",
                      }}
                    >
                      Chưa có quy trình mẫu nào cho danh mục này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
