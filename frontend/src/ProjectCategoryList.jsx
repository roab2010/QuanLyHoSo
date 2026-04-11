import React, { useState, useEffect } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./hoSoService";
import ModalCategory from "./ModalCategory";
// 1. PHẢI THÊM DÒNG NÀY ĐỂ NÓ BIẾT CÁI BẢNG TEMPLATE LÀ CÁI NÀO
import ModalTemplateManagement from "./ModalTemplateManagement";

export default function ProjectCategoryList() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // 2. THÊM 2 CÁI STATE NÀY ĐỂ QUẢN LÝ BẬT/TẮT BẢNG TEMPLATE
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Tải dữ liệu
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

  // 3. ĐỊNH NGHĨA HÀM NÀY THÌ MỚI CLICK ĐƯỢC (LỖI CỦA MÀY Ở ĐÂY)
  const handleManageTemplate = (cat) => {
    setSelectedCategory(cat); // Lưu lại cái danh mục mày vừa chọn
    setShowTemplateModal(true); // Mở cái bảng Template lên
  };

  // 3. Hàm Lưu (Thêm/Sửa danh mục dự án)
  const handleSave = async (payload) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        alert("Cập nhật thành công!");
      } else {
        await createCategory(payload);
        alert("Thêm mới thành công!");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi lưu dữ liệu!";
      alert("Lỗi: " + msg);
    }
  };

  // 4. Hàm Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(id);
        loadData();
      } catch (error) {
        alert("Xóa thất bại!");
      }
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
                  onClick={() => handleManageTemplate(cat)} // ĐỔI cat.id THÀNH cat ĐỂ LẤY CẢ TÊN
                  title="Quản lý Template"
                  style={{
                    margin: "0 10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2666/2666505.png"
                    width="20"
                    alt="Template"
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

      {/* Modal Thêm/Sửa Danh mục */}
      {showModal && (
        <ModalCategory
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          editingCategory={editingCategory}
        />
      )}

      {/* 4. PHẢI THÊM ĐOẠN NÀY ĐỂ NÓ HIỂN THỊ CÁI BẢNG QUY TRÌNH MẪU KHI CLICK */}
      {showTemplateModal && (
        <ModalTemplateManagement
          categoryId={selectedCategory?.id}
          categoryName={selectedCategory?.name}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
