import React, { useState, useEffect } from "react";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "./hoSoService";
import ModalCategory from "./ModalCategory";

export default function ProjectCategoryList() {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const loadData = async () => {
        try {
            const data = await getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải dữ liệu", err);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (payload) => {
        try {
            if (editingCategory) {
                // Nếu đang Sửa
                await updateCategory(editingCategory.id, payload);
                alert("Cập nhật thành công!");
            } else {
                // Nếu Thêm mới
                await createCategory(payload);
                alert("Thêm mới thành công!");
            }
            setShowModal(false);
            loadData(); // Tải lại bảng để hiện dữ liệu mới
        } catch (error) {
            // Kiểm tra lỗi từ Backend (như trùng mã danh mục)
            const msg = error.response?.data?.message || "Không thể lưu dữ liệu. Vui lòng kiểm tra lại mã danh mục!";
            alert("Lỗi: " + msg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            await deleteCategory(id);
            loadData();
        }
    };

    return (
        <div className="category-container">
            <div className="category-header">
                <h2>Danh mục dự án</h2>
                <button className="btn-add-cat" onClick={() => { setEditingCategory(null); setShowModal(true); }}>
                    + Thêm mới
                </button>
            </div>
            
            <table className="category-table">
                <thead>
                    <tr>
                        <th>STT</th><th>Mã danh mục</th><th>Tên danh mục</th><th>Trạng thái</th><th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat, index) => (
                        <tr key={cat.id}>
                            <td>{index + 1}</td>
                            <td>{cat.category_code}</td>
                            <td>{cat.name}</td>
                            <td>
                                <span className={`status-badge ${cat.status === 1 ? 'active' : 'inactive'}`}>
                                    {cat.status === 1 ? "Hoạt động" : "Ngừng"}
                                </span>
                            </td>
                            <td>
                                <button className="btn-edit" onClick={() => { setEditingCategory(cat); setShowModal(true); }}>Sửa</button>
                                <button className="btn-delete-small" onClick={() => handleDelete(cat.id)}>Xóa</button>
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
        </div>
    );
}