import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import { useToast } from "./Toast";
import {
    Plus, Trash2, GripVertical, ChevronRight, Edit3, Check, X,
    Shield, Clock, ArrowUpDown, Settings, FileText, Users,
    AlertCircle, Save, CheckSquare, PenTool
} from 'lucide-react';

const FONT = "'Be Vietnam Pro', sans-serif";

export default function WorkflowManager({ admin }) {
    const toast = useToast();
    const [workflows, setWorkflows] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedWf, setSelectedWf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [draggingStep, setDraggingStep] = useState(null);
    const [dragOverStep, setDragOverStep] = useState(null);
    const dragList = useRef([]);

    // Modal state
    const [showWfModal, setShowWfModal] = useState(false);
    const [wfForm, setWfForm] = useState({ workflow_name: '', workflow_code: '', description: '' });
    const [editingWfId, setEditingWfId] = useState(null);

    // Assignment State
    const [assignments, setAssignments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [assignForm, setAssignForm] = useState({ document_type_id: '', scope_type: 'global', scope_id: '' });

    // Inline step editing
    const [editingStep, setEditingStep] = useState(null); // { id, step_name, role_id, expected_days, has_digital_signature }
    const [showAddStep, setShowAddStep] = useState(false);
    const [newStep, setNewStep] = useState({ step_name: '', role_id: '', expected_days: 1, has_digital_signature: false });
    const [saving, setSaving] = useState(false);
    const [assignMode, setAssignMode] = useState('type'); // 'type' or 'group'
    const isAdmin = admin?.role === 'admin';

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedWf) fetchAssignments(selectedWf.id);
    }, [selectedWf?.id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [wfRes, roleRes, projRes, catRes, docTypeRes] = await Promise.all([
                api.get('/workflow/workflows'),
                api.get('/roles'),
                api.get('/projects'),
                api.get('/categories'),
                api.get('/workflow/document-types')
            ]);
            const wfs = wfRes.data || [];
            setWorkflows(wfs);
            setRoles(roleRes.data || []);
            setProjects(projRes.data.data || projRes.data || []);
            setCategories(catRes.data.data || catRes.data || []);
            setDocumentTypes(docTypeRes.data || []);
            if (!selectedWf && wfs.length > 0) {
                setSelectedWf(wfs[0]);
            } else if (selectedWf) {
                const updated = wfs.find(w => w.id === selectedWf.id);
                if (updated) setSelectedWf(updated);
            }
        } catch (e) {
            toast.error("Lỗi khi tải dữ liệu");
        }
        setLoading(false);
    };

    // --- WORKFLOW CRUD ---
    const handleSaveWorkflow = async () => {
        if (!wfForm.workflow_name || !wfForm.workflow_code) {
            toast.warning("Vui lòng nhập tên và mã quy trình");
            return;
        }
        setSaving(true);
        try {
            if (editingWfId) {
                await api.put(`/workflow/workflows/${editingWfId}`, wfForm);
                toast.success("Cập nhật quy trình thành công!");
            } else {
                const res = await api.post('/workflow/workflows', wfForm);
                toast.success("Tạo quy trình mới thành công!");
                setSelectedWf(res.data.data);
            }
            setShowWfModal(false);
            setWfForm({ workflow_name: '', workflow_code: '', description: '' });
            setEditingWfId(null);
            await fetchAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi lưu");
        }
        setSaving(false);
    };

    const handleDeleteWorkflow = async (wf) => {
        const confirmed = await toast.showConfirm(`Xóa quy trình "${wf.workflow_name}"? Thao tác không thể hoàn tác.`);
        if (!confirmed) return;
        try {
            await api.delete(`/workflow/workflows/${wf.id}`);
            toast.success("Đã xóa quy trình");
            setSelectedWf(null);
            await fetchAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi xóa");
        }
    };

    // --- STEP CRUD ---
    const handleAddStep = async () => {
        if (!newStep.step_name) {
            toast.warning("Vui lòng nhập tên bước duyệt");
            return;
        }
        setSaving(true);
        try {
            await api.post(`/workflow/workflows/${selectedWf.id}/steps`, {
                step_name: newStep.step_name,
                role_id: newStep.role_id || null,
                expected_days: newStep.expected_days || 1,
                has_digital_signature: newStep.has_digital_signature
            });
            toast.success("Thêm bước duyệt thành công!");
            setShowAddStep(false);
            setNewStep({ step_name: '', role_id: '', expected_days: 1, has_digital_signature: false });
            await fetchAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi thêm bước");
        }
        setSaving(false);
    };

    const handleSaveStep = async () => {
        if (!editingStep?.step_name) { toast.warning("Vui lòng nhập tên bước duyệt"); return; }
        
        // Deep compare to check for changes
        const original = selectedWf.steps.find(s => s.id === editingStep.id);
        const hasStepChanged = original.step_name !== editingStep.step_name || 
                             original.role_id_assigned != (editingStep.role_id || null) ||
                             original.expected_days !== editingStep.expected_days ||
                             original.has_digital_signature !== editingStep.has_digital_signature;

        if (!hasStepChanged) {
            toast.info("Bạn chưa thay đổi gì!");
            setEditingStep(null);
            return;
        }

        setSaving(true);
        try {
            await api.put(`/workflow/workflows/${selectedWf.id}/steps/${editingStep.id}`, {
                step_name: editingStep.step_name,
                role_id: editingStep.role_id || null,
                expected_days: editingStep.expected_days || 1,
                has_digital_signature: editingStep.has_digital_signature
            });
            toast.success("Cập nhật thành công!");
            setEditingStep(null);
            await fetchAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi cập nhật");
        }
        setSaving(false);
    };

    const handleDeleteStep = async (step) => {
        const confirmed = await toast.showConfirm(`Xóa bước "${step.step_name}"?`);
        if (!confirmed) return;
        try {
            await api.delete(`/workflow/workflows/${selectedWf.id}/steps/${step.id}`);
            toast.success("Đã xóa bước duyệt");
            await fetchAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi xóa");
        }
    };

    // --- ASSIGNMENTS CRUD ---
    const fetchAssignments = async (wfId) => {
        try {
            const res = await api.get(`/workflow/workflows/${wfId}/assignments`);
            setAssignments(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddAssignment = async () => {
        if (assignMode === 'type' && !assignForm.document_type_id) { toast.warning("Vui lòng chọn loại tài liệu"); return; }
        if (assignMode === 'group' && !assignForm.document_group_name) { toast.warning("Vui lòng chọn nhóm hồ sơ"); return; }
        if (assignForm.scope_type !== 'global' && !assignForm.scope_id) { toast.warning("Vui lòng chọn cụ thể dự án/danh mục"); return; }
        
        setSaving(true);
        try {
            await api.post(`/workflow/workflows/${selectedWf.id}/assignments`, {
                ...assignForm,
                document_type_id: assignMode === 'type' ? assignForm.document_type_id : null,
                document_group_name: assignMode === 'group' ? assignForm.document_group_name : null
            });
            toast.success("Áp dụng quy trình thành công!");
            setAssignForm({ document_type_id: '', document_group_name: '', scope_type: 'global', scope_id: '' });
            fetchAssignments(selectedWf.id);
        } catch (e) {
            if (e.response?.status === 422 && e.response?.data?.details) {
                const details = e.response.data.details;
                // Show a detailed toast instead of alert
                toast.error(
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '800', marginBottom: '4px' }}>KHÔNG THỂ GÁN QUY TRÌNH</div>
                        {details.map((d, i) => <div key={i} style={{ fontSize: '12px', opacity: 0.9 }}>• {d}</div>)}
                        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: '700', textDecoration: 'underline' }}>Vui lòng cấp quyền duyệt cho các chức vụ này trước.</div>
                    </div>
                );
            } else {
                toast.error(e.response?.data?.error || "Lỗi khi áp dụng");
            }
        }
        setSaving(false);
    };

    const handleRemoveAssignment = async (id) => {
        const confirmed = await toast.showConfirm("Gỡ điều kiện áp dụng này?");
        if (!confirmed) return;
        try {
            await api.delete(`/workflow/assignments/${id}`);
            toast.success("Đã gỡ");
            fetchAssignments(selectedWf.id);
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi gỡ");
        }
    };

    // --- DRAG AND DROP ---
    const handleDragStart = (e, step) => {
        setDraggingStep(step.id);
        dragList.current = [...(selectedWf?.steps || [])];
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, step) => {
        e.preventDefault();
        setDragOverStep(step.id);
    };

    const handleDrop = async (e, targetStep) => {
        e.preventDefault();
        if (!draggingStep || draggingStep === targetStep.id) return;

        const steps = [...dragList.current];
        const fromIdx = steps.findIndex(s => s.id === draggingStep);
        const toIdx = steps.findIndex(s => s.id === targetStep.id);
        if (fromIdx === -1 || toIdx === -1) return;

        const reordered = [...steps];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        // Optimistic UI update
        setSelectedWf(prev => ({ ...prev, steps: reordered }));
        setWorkflows(prev => prev.map(w => w.id === selectedWf.id ? { ...w, steps: reordered } : w));
        setDraggingStep(null);
        setDragOverStep(null);

        // Save to backend
        try {
            await api.post(`/workflow/workflows/${selectedWf.id}/steps/reorder`, {
                order: reordered.map(s => s.id)
            });
        } catch {
            toast.error("Lỗi khi cập nhật thứ tự, đang tải lại...");
            fetchAll();
        }
    };

    const getRoleInfo = (roleId) => roles.find(r => String(r.id) === String(roleId));

    if (!isAdmin) {
        return (
            <div style={{ padding: "80px", textAlign: "center" }}>
                <Shield size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ color: '#0f172a' }}>Truy cập bị từ chối</h2>
                <p style={{ color: '#64748b' }}>Chỉ Admin mới có thể quản lý quy trình duyệt.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%', fontFamily: FONT, background: '#f8fafc' }}>

            {/* LEFT PANEL - Workflow List */}
            <div style={{ width: '300px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
                        QUY TRÌNH DUYỆT
                    </div>
                    <button
                        onClick={() => { setEditingWfId(null); setWfForm({ workflow_name: '', workflow_code: '', description: '' }); setShowWfModal(true); }}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '2px dashed #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontFamily: FONT, transition: 'all 0.2s' }}
                    >
                        <Plus size={16} /> THÊM QUY TRÌNH MỚI
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {loading ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>Đang tải...</div>
                    ) : workflows.map(wf => (
                        <div
                            key={wf.id}
                            onClick={() => setSelectedWf(wf)}
                            style={{
                                padding: '14px 16px', borderRadius: '14px', marginBottom: '6px',
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: selectedWf?.id === wf.id ? '#0f172a' : 'transparent',
                                color: selectedWf?.id === wf.id ? '#fff' : '#475569'
                            }}
                        >
                            <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>{wf.workflow_name}</div>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>
                                {wf.steps?.length || 0} bước · {wf.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL - Step Editor */}
            {selectedWf ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '28px 40px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.8px' }}>
                                <Settings size={14} /> CẤU HÌNH QUY TRÌNH
                            </div>
                            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{selectedWf.workflow_name}</h2>
                            {selectedWf.description && (
                                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{selectedWf.description}</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => { setEditingWfId(selectedWf.id); setWfForm({ workflow_name: selectedWf.workflow_name, workflow_code: selectedWf.workflow_code, description: selectedWf.description || '' }); setShowWfModal(true); }}
                                style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px', color: '#475569', fontFamily: FONT }}
                            >
                                <Edit3 size={15} /> Sửa tên
                            </button>
                            <button
                                onClick={() => handleDeleteWorkflow(selectedWf)}
                                style={{ padding: '10px 18px', background: '#fee2e2', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px', color: '#ef4444', fontFamily: FONT }}
                            >
                                <Trash2 size={15} /> Xóa quy trình
                            </button>
                        </div>
                    </div>

                    {/* Content Section - Splitting into two panels */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                        
                        {/* LEFT: Steps dragging */}
                        <div style={{ flex: 6, minWidth: '400px' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ArrowUpDown size={18} color="#94a3b8" />
                                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Kéo thả để thay đổi ưu tiên bước duyệt</span>
                            </div>

                        {/* Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
                            {(selectedWf.steps || []).map((step, idx) => {
                                const role = getRoleInfo(step.role_id_assigned);
                                const isEditing = editingStep?.id === step.id;
                                const isDragOver = dragOverStep === step.id;
                                const isDragging = draggingStep === step.id;

                                return (
                                    <div
                                        key={step.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, step)}
                                        onDragOver={(e) => handleDragOver(e, step)}
                                        onDrop={(e) => handleDrop(e, step)}
                                        onDragEnd={() => { setDraggingStep(null); setDragOverStep(null); }}
                                        style={{
                                            background: '#fff',
                                            borderRadius: '18px',
                                            border: isDragOver ? '2px solid #2563eb' : '2px solid #f1f5f9',
                                            boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                                            opacity: isDragging ? 0.6 : 1,
                                            transition: 'border 0.15s, box-shadow 0.15s',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {isEditing ? (
                                            // EDIT MODE
                                            <div style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Tên bước duyệt *</label>
                                                        <input
                                                            value={editingStep.step_name}
                                                            onChange={e => setEditingStep({ ...editingStep, step_name: e.target.value })}
                                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: '700', fontFamily: FONT, fontSize: '14px' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Chức vụ phụ trách</label>
                                                        <select
                                                            value={editingStep.role_id || ''}
                                                            onChange={e => setEditingStep({ ...editingStep, role_id: e.target.value })}
                                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: '700', fontFamily: FONT, fontSize: '14px', background: '#fff' }}
                                                        >
                                                            <option value="">-- Bất kỳ (do phân quyền dự án) --</option>
                                                            {roles.filter(r => r.name !== 'admin').map(r => (
                                                                <option key={r.id} value={r.id}>{r.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <label style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>Thời gian dự kiến:</label>
                                                        <input
                                                            type="number" min="1" max="30"
                                                            value={editingStep.expected_days}
                                                            onChange={e => setEditingStep({ ...editingStep, expected_days: parseInt(e.target.value) || 1 })}
                                                            style={{ width: '60px', padding: '6px 10px', borderRadius: '8px', border: '2px solid #e2e8f0', fontWeight: '700', textAlign: 'center', fontFamily: FONT }}
                                                        />
                                                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>ngày</span>
                                                    </div>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '700' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={editingStep.has_digital_signature}
                                                            onChange={e => setEditingStep({ ...editingStep, has_digital_signature: e.target.checked })}
                                                        />
                                                        <PenTool size={14} /> Cần ký số
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button onClick={handleSaveStep} disabled={saving} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: FONT }}>
                                                        <Save size={14} /> LƯU
                                                    </button>
                                                    <button onClick={() => setEditingStep(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT }}>
                                                        HỦY
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                {/* Drag Handle */}
                                                <div style={{ cursor: 'grab', color: '#cbd5e1', padding: '4px', flexShrink: 0 }}>
                                                    <GripVertical size={20} />
                                                </div>

                                                {/* Step Number */}
                                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', flexShrink: 0 }}>
                                                    {idx + 1}
                                                </div>

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {step.step_name}
                                                        {step.has_digital_signature && (
                                                            <span style={{ fontSize: '10px', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                                                <PenTool size={10} style={{ marginRight: '3px' }} />KÝ SỐ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: role ? role.color : '#94a3b8', fontWeight: '700' }}>
                                                            <Users size={13} />
                                                            {step.role_name || 'Không giới hạn (phân quyền dự án)'}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: '600' }}>
                                                            <Clock size={13} /> {step.expected_days} ngày
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => setEditingStep({ ...step, role_id: step.role_id_assigned || '' })}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStep(step)}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* ADD STEP */}
                            {showAddStep ? (
                                <div style={{ background: '#fff', borderRadius: '18px', border: '2px solid #2563eb', padding: '20px 24px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', marginBottom: '16px' }}>
                                        + Bước mới (#{(selectedWf.steps?.length || 0) + 1})
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Tên bước duyệt *</label>
                                            <input
                                                placeholder="VD: Trưởng phòng xem xét"
                                                value={newStep.step_name}
                                                onChange={e => setNewStep({ ...newStep, step_name: e.target.value })}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: '700', fontFamily: FONT, fontSize: '14px' }}
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Chức vụ phụ trách</label>
                                            <select
                                                value={newStep.role_id}
                                                onChange={e => setNewStep({ ...newStep, role_id: e.target.value })}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: '700', fontFamily: FONT, fontSize: '14px', background: '#fff' }}
                                            >
                                                <option value="">-- Bất kỳ (do phân quyền dự án) --</option>
                                                {roles.filter(r => r.name !== 'admin').map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>Thời gian dự kiến:</label>
                                            <input
                                                type="number" min="1" max="30"
                                                value={newStep.expected_days}
                                                onChange={e => setNewStep({ ...newStep, expected_days: parseInt(e.target.value) || 1 })}
                                                style={{ width: '60px', padding: '6px 10px', borderRadius: '8px', border: '2px solid #e2e8f0', fontWeight: '700', textAlign: 'center', fontFamily: FONT }}
                                            />
                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>ngày</span>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '700' }}>
                                            <input
                                                type="checkbox"
                                                checked={newStep.has_digital_signature}
                                                onChange={e => setNewStep({ ...newStep, has_digital_signature: e.target.checked })}
                                            />
                                            <PenTool size={14} /> Cần ký số
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={handleAddStep} disabled={saving} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: FONT }}>
                                            <Plus size={14} /> THÊM BƯỚC
                                        </button>
                                        <button onClick={() => setShowAddStep(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT }}>
                                            HỦY
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddStep(true)}
                                    style={{ padding: '18px', border: '2px dashed #cbd5e1', borderRadius: '18px', background: 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontFamily: FONT, transition: 'all 0.2s', width: '100%' }}
                                >
                                    <Plus size={18} /> THÊM BƯỚC DUYỆT
                                </button>
                            )}
                        </div>
                        </div>

                        {/* RIGHT: Assignments Mapping */}
                        <div style={{ flex: 4, minWidth: '320px', background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={16} color="#0f172a" />
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>Tham chiếu tự động</h3>
                            </div>
                            
                            <div style={{ padding: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '16px', lineHeight: 1.5 }}>
                                    Cài đặt Tự Động Định Tuyến: Khi loại hồ sơ bên dưới được tạo ra, hệ thống sẽ tự động gán nó vào quy trình này.
                                </div>
                                
                                {/* Add Block */}
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Phạm vi áp dụng</label>
                                        <select 
                                            value={assignForm.scope_type} 
                                            onChange={e => setAssignForm({ ...assignForm, scope_type: e.target.value, scope_id: '' })}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '13px', fontFamily: FONT, background: '#fff' }}
                                        >
                                            <option value="global">Cả công ty (Mặc định)</option>
                                            <option value="category">Chỉ định nhóm Dự án</option>
                                            <option value="project">Chỉ định Dự án</option>
                                        </select>
                                    </div>
                                    
                                    {assignForm.scope_type !== 'global' && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Chọn {assignForm.scope_type === 'project' ? 'Dự án' : 'Nhóm'}</label>
                                            <select 
                                                value={assignForm.scope_id} 
                                                onChange={e => setAssignForm({ ...assignForm, scope_id: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '13px', fontFamily: FONT, background: '#fff' }}
                                            >
                                                <option value="">- Chọn -</option>
                                                {assignForm.scope_type === 'project' ? projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                )) : categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <button onClick={() => setAssignMode('type')} style={{ flex: 1, padding: '6px', fontSize: '11px', background: assignMode === 'type' ? '#0f172a' : '#fff', color: assignMode === 'type' ? '#fff' : '#64748b', border: assignMode === 'type' ? 'none' : '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT }}>THEO LOẠI</button>
                                        <button onClick={() => setAssignMode('group')} style={{ flex: 1, padding: '6px', fontSize: '11px', background: assignMode === 'group' ? '#0f172a' : '#fff', color: assignMode === 'group' ? '#fff' : '#64748b', border: assignMode === 'group' ? 'none' : '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT }}>THEO NHÓM</button>
                                    </div>

                                    {assignMode === 'type' ? (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Loại Giấy tờ cụ thể</label>
                                            <select 
                                                value={assignForm.document_type_id} 
                                                onChange={e => setAssignForm({ ...assignForm, document_type_id: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '13px', fontFamily: FONT, background: '#fff' }}
                                            >
                                                <option value="">- Chọn loại hồ sơ -</option>
                                                {documentTypes.map(dt => (
                                                    <option key={dt.id} value={dt.id}>[{dt.group_name}] {dt.type_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Áp dụng cho cả Nhóm</label>
                                            <select 
                                                value={assignForm.document_group_name} 
                                                onChange={e => setAssignForm({ ...assignForm, document_group_name: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '13px', fontFamily: FONT, background: '#fff' }}
                                            >
                                                <option value="">- Chọn một nhóm -</option>
                                                {[...new Set(documentTypes.map(dt => dt.group_name))].filter(Boolean).map(gn => (
                                                    <option key={gn} value={gn}>{gn}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button onClick={handleAddAssignment} disabled={saving} style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT, fontSize: '13px' }}>
                                        + CẬP NHẬT ĐIỀU KIỆN
                                    </button>
                                </div>

                                {/* List Block */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {assignments.map(ast => {
                                        let scopeLabel = "Mặc định (Cả công ty)";
                                        if (ast.scope_type === 'project') {
                                            const p = projects.find(p => p.id === ast.scope_id);
                                            scopeLabel = `Dự án: ${p ? p.name : 'Unknown'}`;
                                        } else if (ast.scope_type === 'category') {
                                            const c = categories.find(c => c.id === ast.scope_id);
                                            scopeLabel = `Nhóm: ${c ? c.name : 'Unknown'}`;
                                        }
                                        return (
                                            <div key={ast.id} style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                                                        {ast.document_group_name ? `Nhóm: ${ast.document_group_name}` : ast.type_name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>{scopeLabel}</div>
                                                </div>
                                                <button onClick={() => handleRemoveAssignment(ast.id)} style={{ padding: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {assignments.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                                            Chưa cấu hình điều kiện quy trình
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <div style={{ textAlign: 'center' }}>
                        <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                        <p style={{ fontWeight: '700', fontSize: '16px' }}>Chọn một quy trình để cấu hình</p>
                    </div>
                </div>
            )}

            {/* WORKFLOW MODAL */}
            {showWfModal && (
                <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', zIndex: 2000 }}
                    onMouseDown={e => { if (e.target === e.currentTarget) setShowWfModal(false); }}>
                    <div className="modal-box" style={{ maxWidth: '480px', padding: '48px', borderRadius: '28px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', fontFamily: FONT }}>
                        <h3 style={{ margin: '0 0 28px', fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                            {editingWfId ? 'Sửa quy trình' : 'Tạo quy trình mới'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Tên quy trình *</label>
                                <input className="form-input" placeholder="VD: Quy trình duyệt hợp đồng" value={wfForm.workflow_name} onChange={e => setWfForm({ ...wfForm, workflow_name: e.target.value })} style={{ padding: '12px 16px', borderRadius: '12px', border: '2px solid #f1f5f9', fontWeight: '700', fontFamily: FONT, width: '100%' }} />
                            </div>
                            {!editingWfId && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Mã code *</label>
                                    <input className="form-input" placeholder="VD: WF-HOPDONG" value={wfForm.workflow_code} onChange={e => setWfForm({ ...wfForm, workflow_code: e.target.value })} style={{ padding: '12px 16px', borderRadius: '12px', border: '2px solid #f1f5f9', fontWeight: '700', fontFamily: FONT, width: '100%' }} />
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Mô tả</label>
                                <textarea className="form-input" rows={3} placeholder="Mô tả ngắn về quy trình..." value={wfForm.description} onChange={e => setWfForm({ ...wfForm, description: e.target.value })} style={{ padding: '12px 16px', borderRadius: '12px', border: '2px solid #f1f5f9', fontWeight: '600', fontFamily: FONT, width: '100%', resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                            <button className="btn-cancel" onClick={() => setShowWfModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: '800' }}>HỦY</button>
                            <button className="btn-submit" onClick={handleSaveWorkflow} disabled={saving} style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: '900' }}>{saving ? 'ĐANG LƯU...' : <><Save size={16} style={{ marginRight: 6 }} />LƯU</>}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
