import React, { useState, useEffect } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./hoSoService";
import ModalCategory from "./ModalCategory";
import { useToast } from "./Toast";

export default function ProjectCategoryList() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const toast = useToast();

  // Đọc admin từ localStorage để kiểm tra quyền
  const admin = JSON.parse(localStorage.getItem("admin_user") || "null");

  const hasPermission = (permKey) => {
    if (!admin) return false;
    if (admin.role === 'admin') return true;
    try {
      const perms = JSON.parse(admin.permissions || '[]');
      if (perms.includes(permKey)) return true;
      if (!permKey.includes('.')) {
        return perms.some(p => p.startsWith(permKey + '.'));
      }
      return false;
    } catch (e) { return false; }
  };

  const canManage = hasPermission("categories.manage");
  const canDelete = hasPermission("categories.delete");

  const loadData = async () => {
    try {
      const data = await getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (payload, tempDocList = [], tempTaskList = []) => {
    try {
      let categoryId;
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success("Cập nhật danh mục thành công!");
        categoryId = editingCategory.id;
      } else {
        const res = await createCategory(payload);
        // Lấy ID của danh mục vừa tạo
        categoryId = res?.id || res?.data?.id;
        
        // Lưu tài liệu mẫu tạm (nếu có)
        if (categoryId && tempDocList.length > 0) {
          const { createTemplateDoc } = await import("./hoSoService");
          for (const doc of tempDocList) {
            await createTemplateDoc({ ...doc, category_id: categoryId }).catch(() => {});
          }
        }
        // Lưu quy trình mẫu tạm (nếu có)
        if (categoryId && tempTaskList.length > 0) {
          const { createTemplateTask } = await import("./hoSoService");
          for (const task of tempTaskList) {
            await createTemplateTask({ ...task, category_id: categoryId }).catch(() => {});
          }
        }
        const extras = tempDocList.length + tempTaskList.length;
        toast.success(`Thêm danh mục mới thành công!${extras > 0 ? ` (${extras} mục đã được lưu kèm)` : ''}`);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi lưu dữ liệu!";
      toast.error("Lỗi: " + msg);
    }
  };

  const handleDelete = async (id) => {
    const ok = await toast.showConfirm("Bạn có chắc chắn muốn xóa danh mục này?");
    if (!ok) return;
    try {
      await deleteCategory(id);
      toast.success("Đã xóa danh mục thành công!");
      loadData();
    } catch (error) {
      toast.error("Xóa thất bại! Danh mục có thể đang được sử dụng.");
    }
  };

  return (
    <div className="category-container">
      <div className="category-header">
        <h2>Danh mục dự án</h2>
        {canManage && (
        <button
          className="btn-add-cat"
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
        >
          + Thêm mới
        </button>
        )}
      </div>

      <table className="category-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã danh mục</th>
            <th>Tên danh mục</th>
            <th>Trạng thái</th>
            {(canManage || canDelete) && <th>Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, index) => (
            <tr key={cat.id}>
              <td>{index + 1}</td>
              <td>{cat.category_code}</td>
              <td>{cat.name}</td>
              <td>
                <span
                  className={`status-badge ${cat.status === 1 ? "active" : "inactive"}`}
                >
                  {cat.status === 1 ? "Hoạt động" : "Ngừng"}
                </span>
              </td>
              {(canManage || canDelete) && (
              <td className="action-cell">
                {canManage && (
                <button
                  className="btn-edit"
                  onClick={() => {
                    setEditingCategory(cat);
                    setShowModal(true);
                  }}
                  title="Sửa"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png"
                    width="20"
                    alt="Edit"
                  />
                </button>
                )}


                {canDelete && (
                <button
                  className="btn-delete-small"
                  onClick={() => handleDelete(cat.id)}
                  title="Xóa"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
                    width="20"
                    alt="Delete"
                  />
                </button>
                )}
              </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <ModalCategory
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          editingCategory={editingCategory}
        />
      )}

    </div>
  );
}
