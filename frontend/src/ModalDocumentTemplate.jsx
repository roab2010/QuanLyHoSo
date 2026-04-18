import React, { useState, useEffect } from "react";
import {
  getTemplateDocsByCategoryId,
  getDocumentTypes,
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
  const [docTypes, setDocTypes] = useState([]);

  // Form state
  const [docName, setDocName] = useState("");
  const [docTypeId, setDocTypeId] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadTemplates = async () => {
    try {
      if (categoryId) {
        const res = await getTemplateDocsByCategoryId(categoryId);
        setDocuments(res?.data || (Array.isArray(res) ? res : []));
      }
    } catch (err) {
      console.error("Lỗi tải danh sách tài liệu mẫu:", err);
    }
  };

  useEffect(() => {
    loadTemplates();
    getDocumentTypes().then(setDocTypes);
  }, [categoryId]);

  const resetForm = () => {
    setDocName("");
    setDocTypeId("");
    setIsRequired(true);
    setSortOrder(documents.length + 1);
    setEditingId(null);
  };

  const handleEditClick = (doc) => {
    setDocName(doc.document_name || "");
    setDocTypeId(doc.document_type_id ? String(doc.document_type_id) : "");
    setIsRequired(Boolean(doc.is_required));
    setSortOrder(doc.sort_order || 1);
    setEditingId(doc.id);
    // Scroll lên form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!docName.trim()) { toast.warning("Vui lòng nhập tên tài liệu!"); return; }
    if (!docTypeId) { toast.warning("Vui lòng chọn loại tài liệu!"); return; }

    setSubmitting(true);
    try {
      const payload = {
        category_id:      Number(categoryId),
        document_type_id: Number(docTypeId),
        document_name:    docName.trim(),
        is_required:      isRequired ? 1 : 0,
        sort_order:       Number(sortOrder),
      };

      if (editingId) {
        await updateTemplateDoc(editingId, payload);
        toast.success("Cập nhật tài liệu mẫu thành công!");
      } else {
        await createTemplateDoc(payload);
        toast.success("Thêm tài liệu mẫu thành công!");
      }
      resetForm();
      loadTemplates();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.message || "Lỗi kết nối"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await toast.showConfirm("Bạn có chắc chắn muốn xóa tài liệu mẫu này?");
    if (!ok) return;
    try {
      await deleteTemplateDoc(id);
      toast.success("Đã xóa tài liệu mẫu!");
      loadTemplates();
    } catch {
      toast.error("Không thể xóa!");
    }
  };

  // Group tài liệu theo loại để hiển thị gọn
  const grouped = docTypes
    .map(type => ({
      ...type,
      docs: documents.filter(d => String(d.document_type_id) === String(type.id))
    }))
    .filter(g => g.docs.length > 0);

  const ungrouped = documents.filter(d => !d.document_type_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            📄 Tài liệu mẫu:{" "}
            <span style={{ color: "#2563eb" }}>{categoryName}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* ─── FORM THÊM / SỬA ─── */}
          <div style={{
            background: editingId ? '#fffbeb' : '#f8faff',
            border: `1px solid ${editingId ? '#fde68a' : '#dbeafe'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: editingId ? '#b45309' : '#2563eb', marginBottom: '12px' }}>
              {editingId ? '✏️ Đang chỉnh sửa tài liệu mẫu' : '➕ Thêm tài liệu mẫu mới'}
            </div>

            {/* Hàng 1: Tên tài liệu (full width) */}
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">Tên tài liệu *</label>
              <input
                className="form-input"
                type="text"
                placeholder="VD: Căn cước công dân (CCCD), Giấy chứng nhận quyền sử dụng đất..."
                value={docName}
                onChange={e => setDocName(e.target.value)}
                style={{ width: '100%' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Hàng 2: Loại + Thứ tự + Bắt buộc + Nút */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Loại tài liệu *</label>
                <select
                  className="form-input"
                  value={docTypeId}
                  onChange={e => setDocTypeId(e.target.value)}
                >
                  <option value="">-- Chọn loại --</option>
                  {docTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.type_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Thứ tự</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Bắt buộc?</label>
                <select
                  className="form-input"
                  value={isRequired ? "1" : "0"}
                  onChange={e => setIsRequired(e.target.value === "1")}
                >
                  <option value="1">Bắt buộc</option>
                  <option value="0">Tùy chọn</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px', paddingBottom: '2px' }}>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {submitting ? '...' : editingId ? '💾 Lưu' : '➕ Thêm'}
                </button>
                {editingId && (
                  <button className="btn-cancel" onClick={resetForm} style={{ whiteSpace: 'nowrap' }}>
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── BẢNG DANH SÁCH (NHÓM THEO LOẠI) ─── */}
          <div className="template-table-wrap">
            {documents.length === 0 ? (
              <div className="empty-template" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                📭 Chưa có tài liệu mẫu nào cho danh mục này
              </div>
            ) : (
              <table className="category-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                    <th>Tên tài liệu</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Loại</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Bắt buộc</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Nhóm theo loại tài liệu */}
                  {grouped.map(group => (
                    <React.Fragment key={group.id}>
                      <tr>
                        <td colSpan="5" style={{
                          background: '#f0f6ff',
                          padding: '6px 14px',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#2563eb',
                          borderTop: '2px solid #dbeafe',
                          letterSpacing: '0.3px'
                        }}>
                          📂 {group.type_name}
                          <span style={{ marginLeft: '8px', background: '#dbeafe', borderRadius: '10px', padding: '1px 8px', fontSize: '11px' }}>
                            {group.docs.length} tài liệu
                          </span>
                        </td>
                      </tr>
                      {group.docs.map((doc, idx) => (
                        <tr key={doc.id} style={{ background: editingId === doc.id ? '#fffbeb' : 'transparent' }}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 500 }}>{doc.document_name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="status-badge active" style={{ fontSize: '11px' }}>{doc.type_name}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {doc.is_required ? (
                              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>Bắt buộc</span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Tùy chọn</span>
                            )}
                          </td>
                          <td>
                            <div className="template-actions">
                              <button className="tpl-btn tpl-btn-edit" onClick={() => handleEditClick(doc)}>✏️ Sửa</button>
                              <button className="tpl-btn tpl-btn-del" onClick={() => handleDelete(doc.id)}>🗑 Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                  {/* Tài liệu chưa phân loại */}
                  {ungrouped.length > 0 && (
                    <React.Fragment>
                      <tr>
                        <td colSpan="5" style={{ background: '#f8fafc', padding: '6px 14px', fontWeight: 700, fontSize: '12px', color: '#64748b', borderTop: '2px solid #e2e8f0' }}>
                          📂 Chưa phân loại
                        </td>
                      </tr>
                      {ungrouped.map((doc, idx) => (
                        <tr key={doc.id} style={{ background: editingId === doc.id ? '#fffbeb' : 'transparent' }}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 500 }}>{doc.document_name}</td>
                          <td style={{ textAlign: 'center' }}>—</td>
                          <td style={{ textAlign: 'center' }}>
                            {doc.is_required ? (
                              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>Bắt buộc</span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Tùy chọn</span>
                            )}
                          </td>
                          <td>
                            <div className="template-actions">
                              <button className="tpl-btn tpl-btn-edit" onClick={() => handleEditClick(doc)}>✏️ Sửa</button>
                              <button className="tpl-btn tpl-btn-del" onClick={() => handleDelete(doc.id)}>🗑 Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )}
                </tbody>
              </table>
            )}

            {documents.length > 0 && (
              <div style={{ padding: '10px 16px', background: '#f0f4f8', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Tổng: <strong style={{ color: '#1e293b' }}>{documents.length}</strong> tài liệu mẫu</span>
                <span>
                  Bắt buộc: <strong style={{ color: '#dc2626' }}>{documents.filter(d => d.is_required).length}</strong>
                  {' '}/ Tùy chọn: <strong>{documents.filter(d => !d.is_required).length}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Đóng cửa sổ</button>
        </div>
      </div>
    </div>
  );
}
