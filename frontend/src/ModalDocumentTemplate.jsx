import React, { useState, useEffect } from "react";
import {
  getTemplateDocsByCategoryId,
  createTemplateDoc,
  updateTemplateDoc,
  deleteTemplateDoc,
} from "./hoSoService";
import { useToast } from "./Toast";

export default function ModalDocumentTemplate({
  onClose,
  categoryId,
  categoryName,
}) {
  const [documents, setDocuments] = useState([]);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("Khác");
  const [newIsRequired, setNewIsRequired] = useState(true);
  const [newSortOrder, setNewSortOrder] = useState(1);
  const [editingDocId, setEditingDocId] = useState(null);
  const toast = useToast();

  const loadTemplates = async () => {
    try {
      if (categoryId) {
        const res = await getTemplateDocsByCategoryId(categoryId);
        const finalData = res?.data || (Array.isArray(res) ? res : []);
        setDocuments(finalData);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách tài liệu mẫu:", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [categoryId]);

  const handleSubmit = async () => {
    if (!newDocumentName || !newCategoryName || !newSortOrder) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const payload = {
        category_id: Number(categoryId),
        document_name: newDocumentName,
        category_name: newCategoryName,
        is_required: newIsRequired ? 1 : 0,
        sort_order: Number(newSortOrder),
      };

      if (editingDocId) {
        await updateTemplateDoc(editingDocId, payload);
        toast.success("Cập nhật tài liệu mẫu thành công!");
      } else {
        await createTemplateDoc(payload);
        toast.success("Thêm tài liệu mẫu thành công!");
      }

      resetForm();
      loadTemplates();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.message || "Lỗi kết nối"));
    }
  };

  const resetForm = () => {
    setNewDocumentName("");
    setNewCategoryName("Khác");
    setNewIsRequired(true);
    setNewSortOrder(1);
    setEditingDocId(null);
  };

  const handleEditClick = (doc) => {
    setNewDocumentName(doc.document_name);
    setNewCategoryName(doc.category_name || "Khác");
    setNewIsRequired(Boolean(doc.is_required));
    setNewSortOrder(doc.sort_order);
    setEditingDocId(doc.id);
  };

  const handleDeleteDoc = async (id) => {
    const ok = await toast.showConfirm("Bạn có chắc chắn muốn xóa tài liệu mẫu này?");
    if (!ok) return;
    try {
      await deleteTemplateDoc(id);
      toast.success("Đã xóa tài liệu mẫu!");
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
            📄 Quản lý tài liệu mẫu:{" "}
            <span style={{ color: "#2563eb" }}>{categoryName}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Form thêm mới */}
          <div className="template-form-grid">
            <div className="template-form-item">
              <label className="form-label">Tên tài liệu mẫu *</label>
              <input
                className="form-input"
                type="text"
                placeholder="VD: Kiểm định chất lượng..."
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
              />
            </div>
            <div className="template-form-item">
              <label className="form-label">Phân loại giấy tờ *</label>
              <select
                className="form-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              >
                <option value="Khác">Khác</option>
                <option value="Kỹ thuật">Kỹ thuật</option>
                <option value="Pháp lý">Pháp lý</option>
                <option value="Tài chính">Tài chính</option>
              </select>
            </div>
            <div className="template-form-item" style={{display: 'flex', gap: '15px', alignItems: 'flex-end'}}>
              <div style={{flex: 1}}>
                <label className="form-label">Thứ tự</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="1"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                />
              </div>
              <div style={{flex: 1}}>
                <label className="form-label">Bắt buộc?</label>
                <select
                  className="form-input"
                  value={newIsRequired ? "1" : "0"}
                  onChange={(e) => setNewIsRequired(e.target.value === "1")}
                >
                  <option value="1">Bắt buộc</option>
                  <option value="0">Tùy chọn</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '8px', paddingBottom: '2px'}}>
                <button className="btn-submit" onClick={handleSubmit}>
                  {editingDocId ? "💾 Lưu" : "➕ Thêm"}
                </button>
                {editingDocId && (
                  <button className="btn-cancel" onClick={resetForm}>
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
                  <th>Tên tài liệu mẫu</th>
                  <th style={{ width: "120px" }}>Phân loại</th>
                  <th style={{ width: "120px" }}>Bắt buộc</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{doc.sort_order}</td>
                      <td>{doc.document_name}</td>
                      <td>
                        <span className="status-badge active">{doc.category_name}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {doc.is_required ? (
                          <span style={{color: '#dc2626', fontWeight: 600}}>Bắt buộc</span>
                        ) : (
                          <span style={{color: '#64748b'}}>Tùy chọn</span>
                        )}
                      </td>
                      <td>
                        <div className="template-actions">
                          <button className="tpl-btn tpl-btn-edit" onClick={() => handleEditClick(doc)}>
                            ✏️ Sửa
                          </button>
                          <button className="tpl-btn tpl-btn-del" onClick={() => handleDeleteDoc(doc.id)}>
                            🗑 T.Hồi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-template">
                      📭 Chưa có tài liệu mẫu nào cho danh mục này
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
