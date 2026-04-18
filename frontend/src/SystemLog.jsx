import React, { useState, useEffect } from "react";
import api from "./api";

const SystemLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get("/audit-logs");
                setLogs(res.data.data || []);
            } catch (error) {
                console.error("Lỗi lấy nhật ký:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getActionLabel = (log) => {
        if (log.action_type === 'CREATE') return "Khởi tạo mới";
        if (log.action_type === 'DELETE') return "Xóa dữ liệu";
        if (log.action_type === 'UPDATE') {
            if (log.new_values && log.new_values.status && log.old_values && log.old_values.status !== log.new_values.status) {
                return `Đổi trạng thái > ${log.new_values.status}`;
            }
            return "Cập nhật nội dung";
        }
        if (log.action_type === 'APPROVE_OUT') return "Duyệt phiếu yêu cầu";
        if (log.action_type === 'REJECT_OUT') return "Từ chối phiếu yêu cầu";
        return log.action_type;
    };


    const getActionColor = (log) => {
        if (log.action_type === 'CREATE') return "#10b981"; // Green
        if (log.action_type === 'DELETE') return "#ef4444"; // Red
        if (log.action_type === 'UPDATE') {
            if (log.new_values && log.new_values.status && log.old_values && log.old_values.status !== log.new_values.status) {
                return "#f59e0b"; // Orange
            }
            return "#3b82f6"; // Blue
        }
        if (log.action_type === 'APPROVE_OUT') return "#10b981"; // Green
        if (log.action_type === 'REJECT_OUT') return "#ef4444"; // Red
        return "#6b7280";
    };


    const getModuleName = (module) => {
        const mapping = {
            'PROJECT': 'Dự án / Hồ sơ',
            'CUSTOMER': 'Khách hàng',
            'EMPLOYEE': 'Nhân viên',
            'CATEGORY': 'Danh mục',
            'TASK': 'Công việc',
            'PROJECTCATEGORY': 'Loại dự án',
            'PROJECTTASK': 'Công việc dự án'
        };
        return mapping[module] || module;
    };

    const renderDiff = (log) => {
        const oldVal = log.old_values || {};
        const newVal = log.new_values || {};
        
        if (log.action_type === 'CREATE') {
            return (
                <div className="diff-container">
                    <div className="diff-header create">Dữ liệu khởi tạo:</div>
                    <div className="diff-grid">
                        {Object.entries(newVal).map(([key, val]) => (
                            <div key={key} className="diff-row">
                                <span className="diff-key">{key}:</span>
                                <span className="diff-new-val">{JSON.stringify(val)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (log.action_type === 'DELETE') {
            return (
                <div className="diff-container">
                    <div className="diff-header delete">Dữ liệu đã xóa:</div>
                    <div className="diff-grid">
                        {Object.entries(oldVal).map(([key, val]) => (
                            <div key={key} className="diff-row">
                                <span className="diff-key">{key}:</span>
                                <span className="diff-old-val">{JSON.stringify(val)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (log.action_type === 'UPDATE') {
            const changes = Object.keys(newVal).filter(key => 
                JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])
            );

            return (
                <div className="diff-container">
                    <div className="diff-header update">Thay đổi chi tiết:</div>
                    <div className="diff-grid">
                        {changes.length > 0 ? changes.map(key => (
                            <div key={key} className="diff-row update">
                                <div className="diff-key">{key}</div>
                                <div className="diff-values">
                                    <div className="old-box">
                                        <small>Cũ</small>
                                        <span>{JSON.stringify(oldVal[key]) || "N/A"}</span>
                                    </div>
                                    <div className="arrow-icon">→</div>
                                    <div className="new-box">
                                        <small>Mới</small>
                                        <span>{JSON.stringify(newVal[key]) || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        )) : <div className="no-changes">Không có sự khác biệt rõ rệt trong các trường dữ liệu.</div>}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="system-log-page" style={{ padding: '20px' }}>
            <header className="main-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Nhật ký hệ thống</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Theo dõi mọi hoạt động thay đổi trên hệ thống</p>
                </div>
            </header>

            <div className="log-timeline-container">
                {loading ? (
                    <div className="loading-state">Đang tải nhật ký...</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">Chưa có hoạt động nào được ghi lại.</div>
                ) : (
                    <div className="timeline">
                        {logs.map((log) => {
                            const color = getActionColor(log);
                            return (
                                <div 
                                    key={log.id} 
                                    className="timeline-item" 
                                    style={{ borderLeft: `5px solid ${color}`, cursor: 'pointer' }}
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <div className="timeline-dot" style={{ backgroundColor: color }}></div>
                                    <div className="timeline-content">
                                        <div className="log-header">
                                            <h3 style={{ color: color }}>
                                                {getActionLabel(log)}
                                                <span className="module-tag">{getModuleName(log.module)}</span>
                                            </h3>
                                            <span className="log-date">
                                                {new Date(log.created_at).toLocaleDateString('vi-VN')}
                                                <small>{new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                                            </span>
                                        </div>
                                        <div className="log-actor-row">
                                            <div className="log-actor">
                                                <span className="material-symbols-outlined">person</span>
                                                {log.user?.full_name || log.user?.username || "Hệ thống tự động"}
                                            </div>
                                            {log.record_id && (
                                                <div className="log-id-badge">ID bản ghi: {log.record_id}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Chi tiết */}
            {selectedLog && (
                <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="log-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-area">
                                <div className="modal-type-tag" style={{ backgroundColor: getActionColor(selectedLog) + '20', color: getActionColor(selectedLog) }}>
                                    {getActionLabel(selectedLog)}
                                </div>
                                <h2>Chi tiết hoạt động</h2>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedLog(null)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="info-section">
                                <div className="info-card">
                                    <label>Phân mục</label>
                                    <p>{getModuleName(selectedLog.module)}</p>
                                </div>
                                <div className="info-card">
                                    <label>Người thực hiện</label>
                                    <p>{selectedLog.user?.full_name || selectedLog.user?.username || "Hệ thống"}</p>
                                </div>
                                <div className="info-card">
                                    <label>Thời gian</label>
                                    <p>{new Date(selectedLog.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="info-card">
                                    <label>Địa chỉ IP</label>
                                    <p>{selectedLog.ip_address || "N/A"}</p>
                                </div>
                            </div>

                            <div className="details-section">
                                {renderDiff(selectedLog)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .log-timeline-container {
                max-width: 1000px;
                margin: 0 auto;
            }
            .timeline {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .timeline-item {
                background: white;
                border-radius: 20px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid #f1f5f9;
            }
            .timeline-item:hover {
                transform: translateY(-4px) scale(1.01);
                box-shadow: 0 12px 25px rgba(0,0,0,0.08);
                border-color: transparent;
            }
            .timeline-dot {
                position: absolute;
                left: -9px;
                top: 30px;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
            }
            .log-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }
            .log-header h3 {
                margin: 0;
                font-size: 19px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .module-tag {
                font-size: 10px;
                background: #f1f5f9;
                color: #64748b;
                padding: 3px 10px;
                border-radius: 8px;
                text-transform: uppercase;
                font-weight: 900;
                letter-spacing: 0.5px;
            }
            .log-date {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-size: 14px;
                color: #94a3b8;
                font-weight: 700;
            }
            .log-date small {
                font-size: 11px;
                opacity: 0.7;
            }
            .log-actor-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px dashed #f1f5f9;
            }
            .log-actor {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #475569;
                font-weight: 600;
                font-size: 14px;
            }
            .log-actor span {
                font-size: 20px;
                color: #94a3b8;
            }
            .log-id-badge {
                font-size: 11px;
                color: #94a3b8;
                background: #f8fafc;
                padding: 4px 12px;
                border-radius: 20px;
                font-weight: 600;
            }

            /* Modal Styles */
            .log-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.4);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                animation: fadeIn 0.3s ease;
            }
            .log-modal-content {
                background: white;
                width: 800px;
                max-width: 90vw;
                max-height: 85vh;
                border-radius: 32px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
                animation: slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            }
            .modal-header {
                padding: 24px 32px;
                border-bottom: 1px solid #f1f5f9;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #fafafa;
            }
            .modal-title-area h2 {
                margin: 0;
                font-size: 22px;
                font-weight: 800;
                color: #0f172a;
            }
            .modal-type-tag {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 800;
                margin-bottom: 8px;
                text-transform: uppercase;
            }
            .close-btn {
                background: #f1f5f9;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                color: #64748b;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .close-btn:hover {
                background: #e2e8f0;
                color: #0f172a;
            }
            .modal-body {
                padding: 32px;
                overflow-y: auto;
            }
            .info-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }
            .info-card {
                background: #f8fafc;
                padding: 16px;
                border-radius: 16px;
                border: 1px solid #f1f5f9;
            }
            .info-card label {
                display: block;
                font-size: 11px;
                font-weight: 800;
                color: #94a3b8;
                text-transform: uppercase;
                margin-bottom: 6px;
                letter-spacing: 0.5px;
            }
            .info-card p {
                margin: 0;
                font-size: 15px;
                font-weight: 700;
                color: #334155;
            }
            
            .diff-header {
                font-size: 14px;
                font-weight: 800;
                margin-bottom: 16px;
                padding-left: 12px;
                border-left: 4px solid #cbd5e1;
            }
            .diff-header.create { border-color: #10b981; color: #10b981; }
            .diff-header.update { border-color: #3b82f6; color: #3b82f6; }
            .diff-header.delete { border-color: #ef4444; color: #ef4444; }

            .diff-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .diff-row {
                background: #fdfdfd;
                padding: 14px 20px;
                border-radius: 12px;
                border: 1px solid #f1f5f9;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            .diff-key {
                min-width: 140px;
                font-weight: 700;
                color: #64748b;
                font-size: 13px;
            }
            .diff-new-val { color: #059669; font-weight: 600; font-family: 'monospace'; }
            .diff-old-val { color: #dc2626; font-weight: 600; font-family: 'monospace'; }
            
            .diff-row.update {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            .diff-values {
                display: flex;
                align-items: center;
                gap: 15px;
                width: 100%;
            }
            .old-box, .new-box {
                flex: 1;
                padding: 10px 15px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                font-family: 'monospace';
                font-size: 13px;
                word-break: break-all;
            }
            .old-box { background: #fee2e2; color: #991b1b; }
            .new-box { background: #dcfce7; color: #166534; }
            .old-box small, .new-box small { font-size: 9px; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; opacity: 0.6; }
            .arrow-icon { color: #94a3b8; font-weight: 900; }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { 
                from { opacity: 0; transform: translateY(40px) scale(0.95); } 
                to { opacity: 1; transform: translateY(0) scale(1); } 
            }

            .loading-state, .empty-state {
                text-align: center;
                padding: 100px;
                color: #64748b;
                font-weight: 600;
                background: white;
                border-radius: 32px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            }
            `}</style>
        </div>
    );
};

export default SystemLog;
