import React, { useState, useEffect } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./hoSoService";
import ModalCategory from "./ModalCategory";
import ModalDocumentTemplate from "./ModalDocumentTemplate";
import { useToast } from "./Toast";

export default function ProjectCategoryList() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const toast = useToast();

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

  const handleManageDocTemplate = (cat) => {
    setSelectedCategory(cat);
    setShowDocModal(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory(payload);
        toast.success("Thêm danh mục mới thành công!");
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
        <button
          className="btn-add-cat"
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
        >
          + Thêm mới
        </button>
      </div>

      <table className="category-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã danh mục</th>
            <th>Tên danh mục</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
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
              <td className="action-cell">
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

                <button
                  className="btn-template"
                  onClick={() => handleManageDocTemplate(cat)}
                  title="Quản lý Tài liệu mẫu"
                  style={{
                    margin: "0 10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2912/2912648.png"
                    width="20"
                    alt="Document Template"
                  />
                </button>

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
              </td>
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

      {showDocModal && (
        <ModalDocumentTemplate
          categoryId={selectedCategory?.id}
          categoryName={selectedCategory?.name}
          onClose={() => setShowDocModal(false)}
        />
      )}
    </div>
  );
}
