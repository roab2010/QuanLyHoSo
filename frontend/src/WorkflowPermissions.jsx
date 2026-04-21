import React, { useState, useEffect } from "react";
import api from "./api";
import { useToast } from "./Toast";
import { FolderOpen, Box, Users, CheckSquare } from 'lucide-react';

export default function WorkflowPermissions() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    // Filter state
    const [scopeType, setScopeType] = useState('project');
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedScopeId, setSelectedScopeId] = useState("");

    // List data
    const [approvers, setApprovers] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [formScopeType, setFormScopeType] = useState('project');
    const [formScopeId, setFormScopeId] = useState("");
    const [formDocTypeIds, setFormDocTypeIds] = useState([]);
    const [formAssignMode, setFormAssignMode] = useState("user");
    const [formAssigneeId, setFormAssigneeId] = useState("");

    useEffect(() => { fetchMetadata(); }, []);

    useEffect(() => {
        if (selectedScopeId) fetchApprovers();
        else fetchApproversAll();
    }, [scopeType, selectedScopeId]);

    // Tự động chọn Loại tài liệu khi chọn Người/Chức vụ
    useEffect(() => {
        if (!formAssigneeId || documentTypes.length === 0) {
            setFormDocTypeIds([]);
            return;
        }

        let targetRoleId = null;
        if (formAssignMode === 'role') {
            targetRoleId = parseInt(formAssigneeId);
        } else {
            const selectedUser = users.find(u => String(u.user_id) === String(formAssigneeId));
            if (selectedUser) targetRoleId = selectedUser.role_id;
        }
        if (targetRoleId) {
            const compatible = documentTypes
                .filter(dt => Array.isArray(dt.workflow_role_ids) && dt.workflow_role_ids.includes(targetRoleId))
                .map(dt => dt.id);
            setFormDocTypeIds(compatible);
        } else {
            setFormDocTypeIds([]);
        }
    }, [formAssigneeId, formAssignMode, users, documentTypes]);

    const fetchMetadata = async () => {
        try {
            const [projRes, catRes, docTypesRes, userRes, roleRes] = await Promise.all([
                api.get('/projects'),
                api.get('/categories'),
                api.get('/workflow/document-types'), // Has workflow_role_ids
                api.get('/employees'),
                api.get('/roles')
            ]);
            setProjects(projRes.data.data || projRes.data || []);
            setCategories(catRes.data.data || catRes.data || []);
            setDocumentTypes(docTypesRes.data || []);
            setUsers(userRes.data || []);
            setRoles(roleRes.data || []);
        } catch (e) {
            console.error("Lỗi tải metadata:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchApproversAll = async () => {
        try {
            const res = await api.get(`/workflow/approvers?scope_type=${scopeType}`);
            setApprovers(res.data.data || []);
        } catch (e) { toast.error("Không thể tải danh sách quyền"); }
    };

    const fetchApprovers = async () => {
        try {
            const res = await api.get(`/workflow/approvers?scope_type=${scopeType}&scope_id=${selectedScopeId}`);
            setApprovers(res.data.data || []);
        } catch (e) { toast.error("Không thể tải danh sách quyền"); }
    };

    const handleGrant = async () => {
        if (formDocTypeIds.length === 0) return toast.warning("Vui lòng chọn ít nhất một loại tài liệu");
        if (!formScopeId) return toast.warning("Vui lòng chọn Dự án/Danh mục");
        if (!formAssigneeId) return toast.warning("Vui lòng chọn Người hoặc Chức vụ");

        const payload = {
            document_type_ids: formDocTypeIds,
            scope_type: formScopeType,
            scope_id: formScopeId,
            user_id: formAssignMode === 'user' ? formAssigneeId : null,
            role_id: formAssignMode === 'role' ? formAssigneeId : null,
        };

        setSubmitting(true);
        try {
            await api.post('/workflow/approvers', payload);
            toast.success("Cấp quyền thành công!");
            setShowModal(false);
            setFormDocTypeIds([]);
            setFormAssigneeId("");
            if (selectedScopeId) fetchApprovers(); else fetchApproversAll();
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi cấp quyền");
        }
        setSubmitting(false);
    };

    const handleRevoke = async (id) => {
        const ok = await toast.showConfirm("Gỡ quyền này? User sẽ trở lại duyệt theo phân quyền chức vụ chung.");
        if (!ok) return;
        try {
            await api.delete(`/workflow/approvers/${id}`);
            toast.success("Đã gỡ quyền!");
            if (selectedScopeId) fetchApprovers(); else fetchApproversAll();
        } catch (e) { toast.error("Lỗi khi gỡ quyền"); }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

    // Group doc types by category for display
    const docTypesByGroup = documentTypes.reduce((acc, dt) => {
        const g = dt.group_name || 'Khác';
        if (!acc[g]) acc[g] = [];
        acc[g].push(dt);
        return acc;
    }, {});

    const groupColors = {
        'Kỹ thuật':   { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
        'Pháp lý':    { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
        'Nghiệm thu': { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', dot: '#f97316' },
        'Hợp đồng':   { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', dot: '#a855f7' },
        'Tài chính':  { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#eab308' },
        'Khác':       { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', dot: '#94a3b8' },
    };

    return (
        <div style={{ width: '100%', padding: '0 10px' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>Phân Quyền Duyệt Tài Liệu</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                        Chỉ định ai được duyệt loại tài liệu nào trong dự án hoặc danh mục cụ thể
                    </p>
                </div>
                <button
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                    onClick={() => { setFormScopeType(scopeType); setFormScopeId(selectedScopeId || ""); setFormAssignMode('user'); setFormAssigneeId(""); setFormDocTypeIds([]); setShowModal(true); }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Thêm phân quyền
                </button>
            </div>

            {/* FILTER BAR */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Xem theo</label>
                    <select style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#f8fafc', outline: 'none', minWidth: 170 }} value={scopeType} onChange={e => { setScopeType(e.target.value); setSelectedScopeId(""); }}>
                        <option value="project">Dự án cụ thể</option>
                        <option value="category">Danh mục dự án</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 220 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {scopeType === 'project' ? 'Chọn dự án' : 'Chọn danh mục'}
                    </label>
                    <select style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#f8fafc', outline: 'none' }} value={selectedScopeId} onChange={e => setSelectedScopeId(e.target.value)}>
                        <option value="">— Tất cả —</option>
                        {scopeType === 'project' ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            {['Đối tượng được gán', 'Phạm vi áp dụng', 'Loại tài liệu', 'Bước duyệt tự động', ''].map((h, i) => (
                                <th key={i} style={{ padding: '12px 20px', textAlign: i === 4 ? 'center' : 'left', color: '#64748b', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #e2e8f0', width: i === 4 ? 80 : 'auto', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {approvers.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>Chưa có phân quyền đặc biệt nào</span>
                                    <span style={{ fontSize: 12 }}>Hệ thống đang chạy theo luật chung: quyền duyệt gắn với Chức vụ</span>
                                </div>
                            </td></tr>
                        ) : approvers.map(app => {
                            const scopeName = app.scope_type === 'project'
                                ? (projects.find(p => p.id == app.scope_id)?.name || `Dự án #${app.scope_id}`)
                                : (categories.find(c => c.id == app.scope_id)?.name || `Danh mục #${app.scope_id}`);
                            return (
                                <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 20px' }}>
                                        {app.user_id ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 32, height: 32, background: '#eff6ff', border: '2px solid #93c5fd', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                                                    {(app.assigned_user_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{app.assigned_user_name}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>Cá nhân</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 32, height: 32, background: '#fef3c7', border: '2px solid #fcd34d', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={14}/>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{app.assigned_role_name}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>Nhóm chức vụ</div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <span style={{ background: app.scope_type === 'project' ? '#e0e7ff' : '#fce7f3', color: app.scope_type === 'project' ? '#4338ca' : '#be185d', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, width: 'fit-content' }}>
                                                {app.scope_type === 'project' ? <FolderOpen size={10}/> : <Box size={10}/>}
                                                {app.scope_type === 'project' ? 'Dự án' : 'Danh mục'}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{scopeName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {app.document_type_name
                                            ? <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{app.document_type_name}</span>
                                            : <span style={{ color: '#94a3b8', fontSize: 12 }}>Tất cả loại</span>
                                        }
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {app.step_name
                                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, fontSize: 12, color: '#334155' }}><CheckSquare size={12} style={{ color: '#64748b' }}/>{app.step_name}</span>
                                            : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                        }
                                    </td>
                                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                        <button style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: 7, color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 12 }} onClick={() => handleRevoke(app.id)} onMouseOver={e => e.currentTarget.style.background='#fee2e2'} onMouseOut={e => e.currentTarget.style.background='#fef2f2'}>
                                            Gỡ
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 560, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2>Chỉ định Người Duyệt Tài Liệu</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* STEP 1: Assignee — first so auto-select is visible */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Bước 1 — Chọn đối tượng</div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    {[{val:'user', label:'Một người cụ thể', activeColor:'#eff6ff', activeBorder:'#93c5fd', accent:'#3b82f6'},
                                      {val:'role', label:'Nhóm chức vụ', activeColor:'#fefce8', activeBorder:'#fde047', accent:'#eab308'}].map(opt => (
                                        <label key={opt.val} style={{ flex:1, display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 14px', background: formAssignMode===opt.val ? opt.activeColor : '#fff', border:`1px solid ${formAssignMode===opt.val ? opt.activeBorder : '#e2e8f0'}`, borderRadius:8, transition:'all 0.15s' }}>
                                            <input type="radio" style={{ accentColor: opt.accent }} checked={formAssignMode===opt.val} onChange={() => { setFormAssignMode(opt.val); setFormAssigneeId(""); }}/>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <select style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #cbd5e1', outline:'none', fontSize:14, background:'#fff' }} value={formAssigneeId} onChange={e => setFormAssigneeId(e.target.value)}>
                                    <option value="">— Chọn {formAssignMode==='user' ? 'người' : 'chức vụ'} —</option>
                                    {formAssignMode === 'user'
                                        ? users.filter(u => u.role_id !== 1).map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role_name || ''})</option>)
                                        : roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                                    }
                                </select>
                                {formAssigneeId && formDocTypeIds.length > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a', display:'flex', alignItems:'center', gap:5 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        Tự động chọn {formDocTypeIds.length} loại tài liệu phù hợp
                                    </div>
                                )}
                                {formAssigneeId && formDocTypeIds.length === 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', display:'flex', alignItems:'center', gap:5 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        Chức vụ này không có trong bước duyệt của loại tài liệu nào
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: Scope */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Bước 2 — Phạm vi áp dụng</div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    {[{val:'project', label:'Một Dự án', icon:<FolderOpen size={13}/>, activeColor:'#eff6ff', activeBorder:'#93c5fd', accent:'#3b82f6'},
                                      {val:'category', label:'Cả Danh mục', icon:<Box size={13}/>, activeColor:'#fdf4ff', activeBorder:'#d8b4fe', accent:'#a855f7'}].map(opt => (
                                        <label key={opt.val} style={{ flex:1, display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 14px', background: formScopeType===opt.val ? opt.activeColor : '#fff', border:`1px solid ${formScopeType===opt.val ? opt.activeBorder : '#e2e8f0'}`, borderRadius:8, transition:'all 0.15s' }}>
                                            <input type="radio" style={{ accentColor: opt.accent }} checked={formScopeType===opt.val} onChange={() => setFormScopeType(opt.val)}/>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#334155', display:'flex', alignItems:'center', gap:4 }}>{opt.icon}{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <select style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #cbd5e1', outline:'none', fontSize:14, background:'#fff' }} value={formScopeId} onChange={e => setFormScopeId(e.target.value)}>
                                    <option value="">— Chọn {formScopeType==='project' ? 'dự án' : 'danh mục'} —</option>
                                    {formScopeType === 'project' ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* STEP 3: Document types */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bước 3 — Loại tài liệu phụ trách</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 600 }} onClick={() => setFormDocTypeIds(documentTypes.filter(dt => dt.assigned_workflow_id).map(dt => dt.id))}>Chọn tất cả</button>
                                        <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 600 }} onClick={() => setFormDocTypeIds([])}>Bỏ chọn</button>
                                    </div>
                                </div>
                                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                                    Hệ thống sẽ <strong>tự tick</strong> theo chức vụ bạn vừa chọn ở Bước 1. Loại <span style={{ color: '#94a3b8', fontStyle:'italic' }}>mờ</span> = chưa có quy trình.
                                </p>
                                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {Object.entries(docTypesByGroup).map(([group, types]) => {
                                        const c = groupColors[group] || groupColors['Khác'];
                                        return (
                                            <div key={group}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: c.dot, marginBottom: 5, display:'flex', alignItems:'center', gap:5 }}>
                                                    <span style={{ width:7, height:7, borderRadius:'50%', background:c.dot, display:'inline-block' }}/>
                                                    {group}
                                                </div>
                                                {types.map(dt => {
                                                    const hasWF = !!dt.assigned_workflow_id;
                                                    const checked = formDocTypeIds.includes(dt.id);
                                                    return (
                                                        <label key={dt.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 11px', background: checked ? c.bg : '#fff', border:`1px solid ${checked ? c.border : '#e2e8f0'}`, borderRadius:7, cursor: hasWF ? 'pointer' : 'not-allowed', opacity: hasWF ? 1 : 0.45, marginBottom:3, transition:'all 0.12s' }}>
                                                            <input type="checkbox" style={{ accentColor: c.dot, width:14, height:14 }} disabled={!hasWF} checked={checked} onChange={e => {
                                                                if (e.target.checked) setFormDocTypeIds([...formDocTypeIds, dt.id]);
                                                                else setFormDocTypeIds(formDocTypeIds.filter(id => id !== dt.id));
                                                            }}/>
                                                            <span style={{ flex:1, fontSize:13, fontWeight:500, color:c.text }}>{dt.type_name}</span>
                                                            <span style={{ fontSize:11, color: hasWF ? '#94a3b8' : '#fca5a5', fontStyle: hasWF ? 'normal' : 'italic' }}>
                                                                {hasWF ? dt.workflow_name : 'Chưa có quy trình'}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                                {formDocTypeIds.length > 0 && (
                                    <div style={{ marginTop: 10, padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                                        ✓ Đã chọn {formDocTypeIds.length} loại tài liệu
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa' }}>
                            <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: 13 }} onClick={() => setShowModal(false)}>Hủy</button>
                            <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: submitting ? '#cbd5e1' : 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, boxShadow: submitting ? 'none' : '0 4px 12px rgba(59,130,246,0.3)' }} onClick={handleGrant} disabled={submitting}>
                                {submitting ? "Đang xử lý..." : "Lưu Phân Quyền"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
