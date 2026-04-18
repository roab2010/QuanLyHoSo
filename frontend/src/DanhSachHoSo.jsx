import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

export default function DanhSachHoSo({ cards, xoaHoSo, loading, error }) {
    const navigate = useNavigate();
    const toast = useToast();

    // Đọc admin từ localStorage để kiểm tra quyền
    const admin = JSON.parse(localStorage.getItem("admin_user") || "null");

    const hasPermission = (permKey) => {
        if (!admin) return false;
        if (admin.role === 'admin') return true;
        try {
            const perms = JSON.parse(admin.permissions || '[]');
            if (perms.includes(permKey)) return true;
            if (!permKey.includes('.')) {
                return perms.some(p => p.startsWith(permKey + '.'));
            }
            return false;
        } catch (e) { return false; }
    };

    const STATUS_LABELS = {
        'DRAFT': 'Chờ duyệt',
        'PENDING': 'Chờ duyệt',
        'new': 'Chờ duyệt',
        'PROCESSING': 'Đang xử lý',
        'processing': 'Đang xử lý',
        'REVISION': 'Chờ duyệt',
        'COMPLETED': 'Hoàn thành',
        'done': 'Hoàn thành'
    };

    const STATUS_COLORS = {
        'Chờ duyệt': { bg: '#fee2e2', color: '#dc2626' },
        'Đang xử lý': { bg: '#ffedd5', color: '#ea580c' },
        'Hoàn thành': { bg: '#dcfce7', color: '#16a34a' }
    };

    if (loading) return <div className="state-banner loading">⏳ Đang xử lý...</div>;
    if (error) return <div className="state-banner error">⚠️ {error}</div>;

    const handleDelete = async (item) => {
        const confirm = await toast.showConfirm('Bạn có chắc chắn muốn xóa hồ sơ này?');
        if (confirm) {
            try {
                await xoaHoSo(item.id);
                toast.success('Đã xóa hồ sơ thành công');
            } catch (err) {
                toast.error('Không thể xóa hồ sơ: ' + (err?.response?.data?.message || 'Lỗi không xác định'));
            }
        }
    };

    const canEdit = hasPermission("projects.edit");
    const canDelete = hasPermission("projects.delete");

    return (
        <div className="list-wrapper" style={{ padding: '20px' }}>
            <table className="doc-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>TÊN HỒ SƠ</th>
                        <th style={{ textAlign: 'left' }}>DANH MỤC</th>
                        <th style={{ textAlign: 'left' }}>NGÀY TẠO</th>
                        <th style={{ textAlign: 'left' }}>DỰ KIẾN</th>
                        <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                        {(canEdit || canDelete) && <th style={{ textAlign: 'center' }}>THAO TÁC</th>}
                    </tr>
                </thead>
                <tbody>
                    {cards.length > 0 ? cards.map((item) => (
                        <tr
                            key={item.id}
                            data-status={item.trang_thai}
                            onClick={() => navigate(`/ho-so/${item.id}`)}
                            style={{ cursor: 'pointer' }}
                            className="hoverable-row"
                        >
                            <td>
                                <strong>{item.title}</strong>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Mã: {item.ma_ho_so}</div>
                            </td>
                            <td>{item.category_name}</td>
                            <td>
                                {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td>
                                {item.expected_end_date ? new Date(item.expected_end_date).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block',
                                    minWidth: '100px',
                                    textAlign: 'center',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    backgroundColor: STATUS_COLORS[STATUS_LABELS[item.trang_thai] || 'Chờ duyệt']?.bg,
                                    color: STATUS_COLORS[STATUS_LABELS[item.trang_thai] || 'Chờ duyệt']?.color
                                }}>
                                    {STATUS_LABELS[item.trang_thai] || 'Chờ duyệt'}
                                </span>
                            </td>
                            {(canEdit || canDelete) && (
                            <td style={{ textAlign: 'center' }}>
                                {canEdit && (
                                <button
                                    className="btn-icon"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/ho-so/${item.id}/edit`); }}
                                    title="Sửa"
                                    style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    ✎
                                </button>
                                )}
                                {canDelete && (
                                <button
                                    className="btn-icon"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                    title="Xóa"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff0000ff' }}
                                >
                                    🗑
                                </button>
                                )}
                            </td>
                            )}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Không có hồ sơ nào.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
