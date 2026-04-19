import React, { useState, useEffect } from "react";
import {
  getTemplatesByCategoryId,
  createTemplateTask,
  updateTemplateTask,
  deleteTemplateTask,
} from "./hoSoService";
import { useToast } from "./Toast";

export default function ModalTemplateManagement({
  onClose,
  categoryId,
  categoryName,
}) {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskVolume, setNewTaskVolume] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("");
  const [newTaskEstimatedDate, setNewTaskEstimatedDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const toast = useToast();

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
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const payload = {
        category_id: Number(categoryId),
        task_name: newTaskName,
        work_volume: Number(newTaskVolume),
        sort_order: Number(newTaskPriority),
        estimated_completion_date: newTaskEstimatedDate || null,
      };

      if (editingTaskId) {
        await updateTemplateTask(editingTaskId, payload);
        toast.success("Cập nhật quy trình mẫu thành công!");
      } else {
        await createTemplateTask(payload);
        toast.success("Thêm quy trình mẫu thành công!");
      }

      resetForm();
      loadTemplates();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.message || "Lỗi kết nối"));
    }
  };

  const resetForm = () => {
    setNewTaskName("");
    setNewTaskVolume("");
    setNewTaskPriority("");
    setNewTaskEstimatedDate("");
    setEditingTaskId(null);
  };

  const handleEditClick = (task) => {
    setNewTaskName(task.task_name);
    setNewTaskVolume(task.work_volume);
    setNewTaskPriority(task.sort_order);
    setNewTaskEstimatedDate(task.estimated_completion_date || "");
    setEditingTaskId(task.id);
  };

  const handleDeleteTask = async (id) => {
    const ok = await toast.showConfirm("Bạn có chắc chắn muốn xóa quy trình này?");
    if (!ok) return;
    try {
      await deleteTemplateTask(id);
      toast.success("Đã xóa quy trình mẫu!");
      loadTemplates();
    } catch (error) {
      toast.error("Không thể xóa!");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            📋 Quản lý quy trình mẫu:{" "}
            <span style={{ color: "#2563eb" }}>{categoryName}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Form thêm / chỉnh sửa */}
          <div style={{
            background: editingTaskId ? '#fffbeb' : '#f8faff',
            border: `1px solid ${editingTaskId ? '#fde68a' : '#dbeafe'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '18px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: editingTaskId ? '#b45309' : '#2563eb', marginBottom: '12px' }}>
              {editingTaskId ? '✏️ Đang chỉnh sửa quy trình mẫu' : '➕ Thêm công việc quy trình mẫu'}
            </div>

            {/* Hàng 1: Tên công việc (full width) */}
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">Tên công việc mẫu *</label>
              <input
                className="form-input"
                type="text"
                placeholder="VD: Khảo sát thực địa, Lập bản vẽ thi công..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Hàng 2: 3 ô số + nút */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Khối lượng (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={newTaskVolume}
                  onChange={(e) => setNewTaskVolume(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Thứ tự</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Số ngày dự kiến</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newTaskEstimatedDate}
                  onChange={(e) => setNewTaskEstimatedDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', paddingBottom: '2px' }}>
                <button className="btn-submit" onClick={handleSubmit} style={{ whiteSpace: 'nowrap' }}>
                  {editingTaskId ? "💾 Lưu" : "➕ Thêm"}
                </button>
                {editingTaskId && (
                  <button className="btn-cancel" onClick={resetForm} style={{ whiteSpace: 'nowrap' }}>
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bảng danh sách */}
          <div className="template-table-wrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Thứ tự</th>
                  <th style={{ width: "150px" }}>Số ngày DKH</th>
                  <th>Tên công việc quy trình mẫu</th>
                  <th style={{ width: "120px" }}>Khối lượng</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{task.sort_order}</td>
                      <td style={{ textAlign: "center" }}>
                        {task.estimated_completion_date && task.estimated_completion_date > 0
                          ? `${task.estimated_completion_date} ngày`
                          : "-"}
                      </td>
                      <td>{task.task_name}</td>
                      <td>
                        <span className="volume-badge">{task.work_volume}%</span>
                      </td>
                      <td>
                        <div className="template-actions">
                          <button className="tpl-btn tpl-btn-edit" onClick={() => handleEditClick(task)}>
                            ✏️ Sửa
                          </button>
                          <button className="tpl-btn tpl-btn-del" onClick={() => handleDeleteTask(task.id)}>
                            🗑 Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-template">
                      📭 Chưa có quy trình mẫu nào cho danh mục này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {tasks.length > 0 && (
              <div style={{ padding: "16px", background: "#f0f4f8", borderRadius: "8px", marginTop: "12px", display: "flex", justifyContent: "flex-end", fontWeight: "700", fontSize: "15px" }}>
                <span style={{ marginRight: "20px" }}>
                  📅 Tổng số ngày DKH: <span style={{ color: "#2563eb" }}>{tasks.reduce((sum, task) => sum + (task.estimated_completion_date && task.estimated_completion_date > 0 ? task.estimated_completion_date : 0), 0)} ngày</span>
                </span>
              </div>
            )}
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
