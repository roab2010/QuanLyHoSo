import React, { useState, useEffect } from "react";
import {
  getTemplatesByCategoryId,
  getTemplateDocsByCategoryId,
  getDocumentTypes,
  createTemplateTask,
  createTemplateDoc,
  deleteTemplateTask,
  deleteTemplateDoc,
} from "./hoSoService";
import { useToast } from "./Toast";

export default function ModalCategory({ onClose, onSubmit, editingCategory }) {
    const [form, setForm] = useState({
        category_code: "",
        name: "",
        status: 1
    });

    // Tab hiện tại: 'info' | 'docs' | 'tasks'
    const [activeTab, setActiveTab] = useState("info");

    // --- Tài liệu mẫu ---
    const [docTemplates, setDocTemplates] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [newDocName, setNewDocName] = useState("");
    const [selectedDocTypeId, setSelectedDocTypeId] = useState("");
    const [newDocRequired, setNewDocRequired] = useState(true);
    const [addingDoc, setAddingDoc] = useState(false);

    // --- Quy trình mẫu ---
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [newTaskName, setNewTaskName] = useState("");
    const [newTaskVolume, setNewTaskVolume] = useState("");
    const [newTaskDays, setNewTaskDays] = useState("");
    const [newTaskOrder, setNewTaskOrder] = useState(1);
    const [addingTask, setAddingTask] = useState(false);

    const toast = useToast();
    const isNew = !editingCategory;

    // Temporary IDs cho items mới (chưa có ID từ server)
    const [tempDocList, setTempDocList] = useState([]);
    const [tempTaskList, setTempTaskList] = useState([]);

    useEffect(() => {
        if (editingCategory) {
            setForm({
                category_code: editingCategory.category_code || "",
                name: editingCategory.name || "",
                status: editingCategory.status ?? 1
            });
            loadDocTemplates(editingCategory.id);
            loadTaskTemplates(editingCategory.id);
        } else {
            setTempDocList([]);
            setTempTaskList([]);
        }
        getDocumentTypes().then(setDocTypes);
    }, [editingCategory]);

    const loadDocTemplates = async (catId) => {
        try {
            const res = await getTemplateDocsByCategoryId(catId);
            setDocTemplates(res?.data || []);
        } catch (e) { console.error(e); }
    };

    const loadTaskTemplates = async (catId) => {
        try {
            const res = await getTemplatesByCategoryId(catId);
            setTaskTemplates(res?.data || []);
        } catch (e) { console.error(e); }
    };

    // Thêm tài liệu mẫu (dùng cả document_name + document_type_id)
    const handleAddDoc = async () => {
        if (!newDocName.trim()) { toast.warning("Vui lòng nhập tên tài liệu!"); return; }
        if (!selectedDocTypeId) { toast.warning("Vui lòng chọn loại tài liệu!"); return; }
        setAddingDoc(true);
        const chosenType = docTypes.find(t => String(t.id) === String(selectedDocTypeId));
        const payload = {
            document_type_id: Number(selectedDocTypeId),
            document_name:    newDocName.trim(),
            type_name:        chosenType?.type_name || '',
            is_required:      newDocRequired,
        };
        if (editingCategory) {
            try {
                await createTemplateDoc({ ...payload, category_id: editingCategory.id, is_required: newDocRequired ? 1 : 0 });
                toast.success("Đã thêm tài liệu mẫu!");
                loadDocTemplates(editingCategory.id);
                setNewDocName(""); setSelectedDocTypeId(""); setNewDocRequired(true);
            } catch (e) { toast.error(e.response?.data?.message || "Lỗi thêm tài liệu mẫu!"); }
        } else {
            setTempDocList(prev => [...prev, { _tmpId: Date.now(), ...payload }]);
            setNewDocName(""); setSelectedDocTypeId(""); setNewDocRequired(true);
        }
        setAddingDoc(false);
    };

    const handleAddTask = async () => {
        if (!newTaskName.trim() || !newTaskVolume) { toast.warning("Vui lòng nhập đầy đủ thông tin!"); return; }
        setAddingTask(true);
        if (editingCategory) {
            try {
                await createTemplateTask({
                    category_id: editingCategory.id,
                    task_name: newTaskName,
                    work_volume: Number(newTaskVolume),
                    sort_order: Number(newTaskOrder),
                    estimated_completion_date: newTaskDays ? Number(newTaskDays) : null,
                });
                toast.success("Đã thêm quy trình mẫu!");
                loadTaskTemplates(editingCategory.id);
                resetTaskForm();
            } catch (e) { toast.error("Lỗi thêm quy trình mẫu!"); }
        } else {
            setTempTaskList(prev => [...prev, {
                _tmpId: Date.now(),
                task_name: newTaskName,
                work_volume: Number(newTaskVolume),
                sort_order: Number(newTaskOrder),
                estimated_completion_date: newTaskDays ? Number(newTaskDays) : null,
            }]);
            resetTaskForm();
        }
        setAddingTask(false);
    };

    const handleDeleteDoc = async (item) => {
        if (item.id) {
            const ok = await toast.showConfirm("Xóa tài liệu mẫu này?");
            if (!ok) return;
            await deleteTemplateDoc(item.id);
            loadDocTemplates(editingCategory.id);
        } else {
            setTempDocList(prev => prev.filter(d => d._tmpId !== item._tmpId));
        }
    };

    const handleDeleteTask = async (item) => {
        if (item.id) {
            const ok = await toast.showConfirm("Xóa quy trình mẫu này?");
            if (!ok) return;
            await deleteTemplateTask(item.id);
            loadTaskTemplates(editingCategory.id);
        } else {
            setTempTaskList(prev => prev.filter(t => t._tmpId !== item._tmpId));
        }
    };

    const resetDocForm = () => {
        setNewDocName(""); setNewDocType("Khác"); setNewDocRequired(true); setNewDocOrder(1);
    };
    const resetTaskForm = () => {
        setNewTaskName(""); setNewTaskVolume(""); setNewTaskDays(""); setNewTaskOrder(1);
    };

    const handleLocalSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(form, tempDocList, tempTaskList);
    };

    const tabStyle = (tab) => ({
        padding: '8px 18px',
        border: 'none',
        borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
        background: 'transparent',
        color: activeTab === tab ? '#2563eb' : '#64748b',
        fontWeight: activeTab === tab ? 700 : 500,
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
    });

    const allDocs = editingCategory ? docTemplates : tempDocList;
    const allTasks = editingCategory ? taskTemplates : tempTaskList;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '680px', width: '95%' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingCategory ? "✏️ Chỉnh sửa danh mục" : "➕ Thêm danh mục mới"}</h3>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 20px', background: '#fafbfc' }}>
                    <button type="button" style={tabStyle("info")} onClick={() => setActiveTab("info")}>
                        📋 Thông tin
                    </button>
                    <button type="button" style={tabStyle("docs")} onClick={() => setActiveTab("docs")}>
                        📄 Tài liệu mẫu {allDocs.length > 0 && <span style={{ background: '#dbeafe', color: '#2563eb', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '4px' }}>{allDocs.length}</span>}
                    </button>
                    <button type="button" style={tabStyle("tasks")} onClick={() => setActiveTab("tasks")}>
                        ⚙️ Quy trình mẫu {allTasks.length > 0 && <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '4px' }}>{allTasks.length}</span>}
                    </button>
                </div>

                <form onSubmit={handleLocalSubmit}>
                    <div className="modal-body">

                        {/* TAB: THÔNG TIN */}
                        {activeTab === "info" && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <label className="form-label">Mã danh mục *</label>
                                        <input
                                            className="form-input"
                                            value={form.category_code}
                                            onChange={e => setForm({ ...form, category_code: e.target.value })}
                                            placeholder="VD: DM01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Trạng thái</label>
                                        <select
                                            className="form-input"
                                            value={form.status}
                                            onChange={e => setForm({ ...form, status: Number(e.target.value) })}
                                        >
                                            <option value={1}>Đang hoạt động</option>
                                            <option value={0}>Ngừng hoạt động</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Tên danh mục *</label>
                                    <input
                                        className="form-input"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Nhập tên danh mục..."
                                        required
                                    />
                                </div>
                                {isNew && (
                                    <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '13px', color: '#0369a1' }}>
                                        💡 Bạn có thể chuyển sang tab <strong>Tài liệu mẫu</strong> và <strong>Quy trình mẫu</strong> để cài đặt ngay khi tạo danh mục.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: TÀI LIỆU MẪU */}
                        {activeTab === "docs" && (
                            <div>
                                <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#2563eb', marginBottom: '10px' }}>➕ Thêm tài liệu mẫu</div>

                                    {/* Hàng 1: Tên tài liệu (full width) */}
                                    <div style={{ marginBottom: '8px' }}>
                                        <input
                                            className="form-input"
                                            type="text"
                                            placeholder="Tên tài liệu (VD: CCCD, Giấy chứng nhận QSD đất...)"
                                            value={newDocName}
                                            onChange={e => setNewDocName(e.target.value)}
                                        />
                                    </div>

                                    {/* Hàng 2: Loại + Bắt buộc + Nút */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: '8px', alignItems: 'flex-end' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Loại tài liệu *</label>
                                            <select className="form-input" value={selectedDocTypeId} onChange={e => setSelectedDocTypeId(e.target.value)}>
                                                <option value="">-- Chọn loại --</option>
                                                {docTypes.map(t => (
                                                    <option key={t.id} value={t.id}>{t.type_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Bắt buộc?</label>
                                            <select className="form-input" value={newDocRequired ? "1" : "0"} onChange={e => setNewDocRequired(e.target.value === "1")}>
                                                <option value="1">Bắt buộc</option>
                                                <option value="0">Tùy chọn</option>
                                            </select>
                                        </div>
                                        <button type="button" className="btn-submit" onClick={handleAddDoc} disabled={addingDoc} style={{ whiteSpace: 'nowrap' }}>
                                            ➕ Thêm
                                        </button>
                                    </div>
                                </div>

                                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                    {allDocs.length > 0 ? (
                                        <table className="category-table" style={{ fontSize: '13px' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '36px', textAlign: 'center' }}>STT</th>
                                                    <th>Tên tài liệu</th>
                                                    <th style={{ width: '90px', textAlign: 'center' }}>Loại</th>
                                                    <th style={{ width: '85px', textAlign: 'center' }}>Bắt buộc</th>
                                                    <th style={{ width: '50px', textAlign: 'center' }}>Xóa</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allDocs.map((doc, idx) => (
                                                    <tr key={doc.id || doc._tmpId}>
                                                        <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                                                        <td style={{ fontWeight: 500 }}>{doc.document_name}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span className="status-badge active" style={{ fontSize: '11px' }}>{doc.type_name}</span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: doc.is_required ? '#dc2626' : '#64748b', fontWeight: doc.is_required ? 600 : 400, fontSize: '12px' }}>
                                                            {doc.is_required ? 'Bắt buộc' : 'Tùy chọn'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button type="button" onClick={() => handleDeleteDoc(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>🗑</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                                            📭 Chưa có tài liệu mẫu nào
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* TAB: QUY TRÌNH MẪU */}
                        {activeTab === "tasks" && (
                            <div>
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a', marginBottom: '10px' }}>➕ Thêm quy trình mẫu</div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <input
                                            className="form-input"
                                            type="text"
                                            placeholder="Tên công việc mẫu (VD: Khảo sát thực địa...)"
                                            value={newTaskName}
                                            onChange={e => setNewTaskName(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: '8px', alignItems: 'flex-end' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Khối lượng (%)</label>
                                            <input className="form-input" type="number" min="0" max="100" placeholder="0" value={newTaskVolume} onChange={e => setNewTaskVolume(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Số ngày dự kiến</label>
                                            <input className="form-input" type="number" min="0" placeholder="0" value={newTaskDays} onChange={e => setNewTaskDays(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Thứ tự</label>
                                            <input className="form-input" type="number" min="1" value={newTaskOrder} onChange={e => setNewTaskOrder(e.target.value)} />
                                        </div>
                                        <button type="button" className="btn-submit" onClick={handleAddTask} disabled={addingTask} style={{ whiteSpace: 'nowrap', background: '#16a34a' }}>
                                            ➕ Thêm
                                        </button>
                                    </div>
                                </div>

                                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                    {allTasks.length > 0 ? (
                                        <>
                                            <table className="category-table" style={{ fontSize: '13px' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                                                        <th>Tên công việc</th>
                                                        <th style={{ width: '90px', textAlign: 'center' }}>Khối lượng</th>
                                                        <th style={{ width: '100px', textAlign: 'center' }}>Số ngày DKH</th>
                                                        <th style={{ width: '60px', textAlign: 'center' }}>Xóa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allTasks.map((task, idx) => (
                                                        <tr key={task.id || task._tmpId}>
                                                            <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                                                            <td style={{ fontWeight: 500 }}>{task.task_name}</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ background: '#dbeafe', color: '#2563eb', borderRadius: '12px', padding: '2px 10px', fontWeight: 700, fontSize: '12px' }}>{task.work_volume}%</span></td>
                                                            <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{task.estimated_completion_date > 0 ? `${task.estimated_completion_date} ngày` : '-'}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button type="button" onClick={() => handleDeleteTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>🗑</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div style={{ padding: '8px 12px', background: '#f0f9ff', fontSize: '12px', color: '#0369a1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0f2fe' }}>
                                                <span>Tổng: {allTasks.length} bước</span>
                                                <span>📅 Tổng số ngày DKH: <strong>{allTasks.reduce((s, t) => s + (t.estimated_completion_date > 0 ? t.estimated_completion_date : 0), 0)} ngày</strong></span>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                                            📭 Chưa có quy trình mẫu nào
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit">Lưu dữ liệu</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
