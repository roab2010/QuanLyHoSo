import React, { useState, useEffect } from "react";
import './ModalTemplate.css';
import { getTemplatesByCategoryId, createTemplateTask, updateTemplateTask, deleteTemplateTask } from "./hoSoService"; 

export default function ModalTemplateManagement({ onClose, categoryId, categoryName }) {
  const [tasks, setTasks] = useState([]); 
  
  const [newTaskName, setNewTaskName] = useState(""); 
  const [newTaskVolume, setNewTaskVolume] = useState(""); 
  const [newTaskPriority, setNewTaskPriority] = useState(""); 

  const [editingTaskId, setEditingTaskId] = useState(null);

  // --- ĐÃ SỬA HÀM NÀY ĐỂ ĐỔ DỮ LIỆU CHUẨN ---
  const loadTemplates = async () => {
    try {
      if (categoryId) {
        const res = await getTemplatesByCategoryId(categoryId);
        
        // Laravel thường trả về { data: [...] } hoặc [...]
        // Dòng này giúp lấy đúng mảng dữ liệu dù ở trường hợp nào
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
        sort_order: Number(newTaskPriority) 
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
      const detailError = error.response?.data?.message || "Lỗi kết nối API";
      alert("Lỗi: " + detailError);
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
        alert("Đã xóa thành công!");
        loadTemplates(); 
      } catch (error) {
        alert("Không thể xóa quy trình này!");
      }
    }
  };

  return (
    <div className="modal-overlay"> 
      <div className="modal-content template-modal"> 
        
        <div className="modal-header">
          <h3>
            Quản lý quy trình mẫu: <span className="highlight-text">{categoryName}</span>
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="template-form">
          <div className="form-group">
            <label>Tên công việc mẫu</label>
            <input 
              type="text" 
              placeholder="VD: Khảo sát địa chất..." 
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Khối lượng Công Việc(%)</label>
            <input 
              type="number" 
              value={newTaskVolume}
              onChange={(e) => setNewTaskVolume(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Thứ tự ưu tiên</label>
            <input 
              type="number" 
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-add-cat btn-blue" onClick={handleSubmit}>
              {editingTaskId ? "Lưu thay đổi" : "Thêm mẫu"}
            </button>
            {editingTaskId && (
              <button className="btn-add-cat" style={{ background: '#6c757d' }} onClick={resetForm}>
                Hủy
              </button>
            )}
          </div>
        </div>

        <table className="category-table template-table">
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Tên công việc quy trình mẫu</th>
              <th>Khối lượng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.sort_order}</td>
                  <td>{task.task_name}</td>
                  <td>{task.work_volume}</td>
                  <td className="actions-cell">
                    <button className="btn-edit-small" onClick={() => handleEditClick(task)}>
                      Sửa
                    </button>
                    <button className="btn-delete-small" onClick={() => handleDeleteTask(task.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{textAlign: "center", padding: "15px"}}>
                  Chưa có quy trình mẫu nào cho danh mục này
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}