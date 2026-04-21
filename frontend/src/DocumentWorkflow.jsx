import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

const STATUS_CONFIG = {
    PENDING:    { label: 'Chờ duyệt',    bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
    PROCESSING: { label: 'Đang duyệt',   bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
    REVISION:   { label: 'Cần sửa',      bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
    COMPLETED:  { label: 'Hoàn thành',   bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
    REJECTED:   { label: 'Từ chối',      bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af' },
};

const ACTION_CONFIG = {
    SUBMIT:    { label: 'Đã nộp',       icon: '📤', color: '#3b82f6' },
    APPROVE:   { label: 'Đã duyệt',     icon: '✅', color: '#22c55e' },
    REVISE:    { label: 'Yêu cầu sửa',  icon: '🔄', color: '#f59e0b' },
    REJECT:    { label: 'Từ chối',      icon: '❌', color: '#ef4444' },
    RESUBMIT:  { label: 'Nộp lại',     icon: '📎', color: '#8b5cf6' },
};

export default function DocumentWorkflow({ admin }) {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingDocs, setPendingDocs] = useState([]);
    const [allDocs, setAllDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');

    // Modal states
    const [actionModal, setActionModal] = useState(null); // { doc, type: 'approve'|'reject'|'revise' }
    const [timelineModal, setTimelineModal] = useState(null); // doc
    const [resubmitModal, setResubmitModal] = useState(null); // doc
    const [comment, setComment] = useState('');
    const [resubmitFile, setResubmitFile] = useState(null);
    const [resubmitComment, setResubmitComment] = useState('');
    const [logs, setLogs] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const userId = admin?.id;

    const headers = { 'X-User-ID': userId };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/workflow/pending-approvals`, { headers });
            setPendingDocs(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    }, [userId]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/workflow/all-documents`, {
                headers,
                params: { status: filterStatus, search }
            });
            setAllDocs(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    }, [userId, filterStatus, search]);

    useEffect(() => {
        if (activeTab === 'pending') fetchPending();
        else fetchAll();
    }, [activeTab, fetchPending, fetchAll]);

    const openTimeline = async (doc) => {
        setTimelineModal(doc);
        try {
            const res = await axios.get(`${API}/workflow/documents/${doc.id}/logs`, { headers });
            setLogs(res.data.data || []);
        } catch (e) { setLogs([]); }
    };

    const handleAction = async () => {
        if (!actionModal) return;
        const { doc, type } = actionModal;

        if ((type === 'reject' || type === 'revise') && !comment.trim()) {
            alert('Bắt buộc phải nhập lý do!');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API}/workflow/documents/${doc.id}/${type}`, { comment }, { headers });
            alert(type === 'approve' ? 'Đã duyệt thành công!' : type === 'reject' ? 'Đã từ chối!' : 'Đã yêu cầu sửa!');
            setActionModal(null);
            setComment('');
            if (activeTab === 'pending') fetchPending(); else fetchAll();
        } catch (e) {
            alert(e.response?.data?.error || 'Lỗi hệ thống!');
        } finally { setSubmitting(false); }
    };

    const handleResubmit = async () => {
        if (!resubmitModal) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            if (resubmitFile) formData.append('file', resubmitFile);
            formData.append('comment', resubmitComment || 'Đã sửa và nộp lại');
            await axios.post(`${API}/workflow/documents/${resubmitModal.id}/resubmit`, formData, { headers });
            alert('Đã nộp lại thành công!');
            setResubmitModal(null);
            setResubmitFile(null);
            setResubmitComment('');
            fetchAll();
        } catch (e) {
            alert(e.response?.data?.error || 'Lỗi khi nộp lại!');
        } finally { setSubmitting(false); }
    };

    const docs = activeTab === 'pending' ? pendingDocs : allDocs;

    return (
        <div className="category-container" style={{ fontFamily: "'Inter', sans-serif", padding: '28px', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                    🗂️ Duyệt Tài Liệu
                </h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                    Quản lý quy trình phê duyệt tài liệu dự án
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#fff', padding: '6px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content' }}>
                {[
                    { key: 'pending', label: `Chờ tôi duyệt`, badge: pendingDocs.length },
                    { key: 'all', label: 'Tất cả tài liệu' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                            fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                            background: activeTab === tab.key ? '#2563eb' : 'transparent',
                            color: activeTab === tab.key ? '#fff' : '#64748b',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {tab.label}
                        {tab.badge > 0 && (
                            <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#ef4444', color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Filter bar (chỉ ở tab "tất cả") */}
            {activeTab === 'all' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        placeholder="🔍 Tìm tên tài liệu..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '260px', background: '#fff' }}
                    />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', background: '#fff', color: '#374151' }}
                    >
                        <option value="">— Tất cả trạng thái —</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Danh sách tài liệu */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>⏳ Đang tải...</div>
            ) : docs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8', background: '#fff', borderRadius: '16px' }}>
                    {activeTab === 'pending' ? '✅ Không có tài liệu nào đang chờ bạn duyệt!' : '📭 Không tìm thấy tài liệu nào.'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {docs.map(doc => {
                        const st = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING;
                        const totalSteps = doc.total_steps || 0;
                        const currentOrder = doc.current_step_order || 0;
                        const progress = totalSteps > 0
                            ? (doc.status === 'COMPLETED' ? 100 : Math.round(((currentOrder - 1) / totalSteps) * 100))
                            : 0;

                        return (
                            <div key={doc.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                {/* Left: Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{doc.document_name}</span>
                                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                                            {st.label}
                                        </span>
                                        {doc.type_name && (
                                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                                {doc.type_name}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <span>📁 {doc.project_name}</span>
                                        {doc.current_step_name && <span>📍 Bước hiện tại: <b style={{ color: '#1d4ed8' }}>{doc.current_step_name}</b></span>}
                                        {doc.completed_at && <span>✅ Hoàn thành: {new Date(doc.completed_at).toLocaleDateString('vi-VN')}</span>}
                                    </div>

                                    {/* Progress bar */}
                                    {totalSteps > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                                <span>Tiến độ duyệt</span>
                                                <span>{doc.status === 'COMPLETED' ? `${totalSteps}/${totalSteps}` : `${Math.max(currentOrder - 1, 0)}/${totalSteps}`} bước</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${progress}%`, background: doc.status === 'COMPLETED' ? '#22c55e' : doc.status === 'REJECTED' ? '#ef4444' : '#3b82f6', borderRadius: '4px', transition: 'width 0.4s' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, alignItems: 'flex-end' }}>
                                    {/* Nút Xem lịch sử */}
                                    <button
                                        onClick={() => openTimeline(doc)}
                                        style={{ padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}
                                    >
                                        📋 Lịch sử
                                    </button>

                                    {/* Nút Preview/Download file */}
                                    {doc.file_url && (
                                        <button
                                            onClick={() => window.open(`${API}/documents/view-file?url=${encodeURIComponent(doc.file_url)}`, '_blank')}
                                            style={{ padding: '7px 14px', background: '#eff6ff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#2563eb' }}
                                        >
                                            👁️ Xem file
                                        </button>
                                    )}

                                    {/* Hành động duyệt - chỉ hiện khi đang chờ MÌNH duyệt */}
                                    {activeTab === 'pending' && (doc.status === 'PENDING' || doc.status === 'PROCESSING') && (
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => { setActionModal({ doc, type: 'approve' }); setComment(''); }}
                                                style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}
                                            >
                                                ✅ Duyệt
                                            </button>
                                            <button
                                                onClick={() => { setActionModal({ doc, type: 'revise' }); setComment(''); }}
                                                style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                                            >
                                                🔄 Yêu cầu sửa
                                            </button>
                                            <button
                                                onClick={() => { setActionModal({ doc, type: 'reject' }); setComment(''); }}
                                                style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </div>
                                    )}

                                    {/* Nút Nộp lại - chỉ hiện ở tab "tất cả" khi cần sửa */}
                                    {activeTab === 'all' && doc.status === 'REVISION' && (
                                        <button
                                            onClick={() => setResubmitModal(doc)}
                                            style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                                        >
                                            📎 Nộp lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ======================== MODAL DUYỆT/TỪ CHỐI/SỬA ======================== */}
            {actionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            {actionModal.type === 'approve' ? '✅ Xác nhận Duyệt' : actionModal.type === 'revise' ? '🔄 Yêu cầu Sửa lại' : '❌ Xác nhận Từ chối'}
                        </h3>
                        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
                            Tài liệu: <b style={{ color: '#0f172a' }}>{actionModal.doc.document_name}</b>
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                Ghi chú {actionModal.type !== 'approve' && <span style={{ color: '#ef4444' }}>* (Bắt buộc)</span>}
                            </label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder={actionModal.type === 'approve' ? 'Ghi chú thêm (tùy chọn)...' : 'Nhập lý do rõ ràng để nhân viên biết cần làm gì...'}
                                rows={4}
                                style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setActionModal(null); setComment(''); }}
                                style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={submitting}
                                style={{
                                    padding: '10px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, color: '#fff',
                                    background: actionModal.type === 'approve' ? '#22c55e' : actionModal.type === 'revise' ? '#f59e0b' : '#ef4444',
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== MODAL TIMELINE LỊCH SỬ ======================== */}
            {timelineModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '560px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>📋 Lịch sử duyệt</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{timelineModal.document_name}</p>
                            </div>
                            <button onClick={() => setTimelineModal(null)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>

                        {logs.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Chưa có lịch sử duyệt nào.</p>
                        ) : (
                            <div style={{ position: 'relative', paddingLeft: '28px' }}>
                                {/* Đường kẻ dọc */}
                                <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', background: '#e2e8f0' }} />

                                {logs.map((log, idx) => {
                                    const ac = ACTION_CONFIG[log.action] || { label: log.action, icon: '•', color: '#64748b' };
                                    return (
                                        <div key={log.id} style={{ position: 'relative', marginBottom: '20px' }}>
                                            {/* Chấm tròn */}
                                            <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: ac.color, border: '3px solid #fff', boxShadow: '0 0 0 2px ' + ac.color + '33' }} />

                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 700, color: ac.color, fontSize: '13px' }}>
                                                        {ac.icon} {ac.label} — {log.step_name}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        {new Date(log.created_at).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                                                    👤 {log.processor_name || 'Hệ thống'}
                                                </div>
                                                {log.comment && (
                                                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', fontStyle: 'italic' }}>
                                                        "{log.comment}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================== MODAL NỘP LẠI ======================== */}
            {resubmitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>📎 Nộp lại tài liệu</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
                            Tài liệu: <b style={{ color: '#0f172a' }}>{resubmitModal.document_name}</b>
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                Đính kèm file mới (tùy chọn)
                            </label>
                            <input
                                type="file"
                                onChange={e => setResubmitFile(e.target.files[0])}
                                style={{ width: '100%', padding: '10px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                Ghi chú (đã sửa những gì?)
                            </label>
                            <textarea
                                value={resubmitComment}
                                onChange={e => setResubmitComment(e.target.value)}
                                placeholder="Mô tả những thay đổi bạn đã thực hiện..."
                                rows={3}
                                style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setResubmitModal(null); setResubmitFile(null); setResubmitComment(''); }}
                                style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleResubmit}
                                disabled={submitting}
                                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, opacity: submitting ? 0.7 : 1 }}
                            >
                                {submitting ? 'Đang nộp...' : '📤 Nộp lại'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
