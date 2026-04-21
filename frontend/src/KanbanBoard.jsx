import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useToast } from "./Toast";

/* Icons giữ nguyên */
const CalendarIcon = () => (
    <svg viewBox="0 0 12 12" fill="currentColor"><path d="M9 1V0H8v1H4V0H3v1H1a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H9zm1 10H2V4h8v7z" /></svg>
);
const ClockIcon = () => (
    <svg viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" fill="none" /><path d="M6 3v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" /></svg>
);
const CheckCircleIcon = () => (
    <svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#16a34a" strokeWidth="1" /><path d="M3 6l2 2 4-4" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// Helper kiểm tra quyền
const getPermissionHelper = () => {
    const admin = JSON.parse(localStorage.getItem("admin_user") || "null");
    return (permKey) => {
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
};

function KanbanCard({ card, onDelete, onMoveCard, COLUMNS }) {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const hasPermission = getPermissionHelper();
    
    // Yêu cầu quyền projects.edit để kéo thả thay đổi trạng thái Dự án (Hồ sơ) 
    const canDelete = hasPermission("projects.delete");
    const canDrag = hasPermission("projects.edit");

    // Logic chặn menu ba chấm: Chỉ hiện nút chuyển nếu đi từ 'new' sang 'processing'
    const canMoveTo = (targetColId) => {
        return card.colId === 'new' && targetColId === 'processing';
    };

    const handleCardClick = (e) => {
        if (e.target.closest('.card-menu-btn') || e.target.closest('.card-menu-dropdown')) {
            return;
        }
        navigate(`/ho-so/${card.id}`);
    };

    const showMenuBtn = canDrag || canDelete;

    return (
        <div 
            className={`card ${card.colId}`} 
            draggable={canDrag ? "true" : "false"}
            onClick={handleCardClick}
            style={{ cursor: canDrag ? 'grab' : 'pointer' }}
            onDragStart={canDrag ? (e) => {
                e.dataTransfer.setData("cardId", String(card.id));
                e.dataTransfer.setData("fromColId", card.colId);
            } : undefined}
        >
            <div className="card-top">
                <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="card-id">#{card.ma_ho_so}</span>
                    {showMenuBtn && (
                    <div style={{ position: "relative" }}>
                        <button className="card-menu-btn" onClick={() => setShowMenu(!showMenu)}>···</button>
                        {showMenu && (
                            <div className="card-menu-dropdown" onMouseLeave={() => setShowMenu(false)}>
                                {canDrag && COLUMNS.filter((c) => c.id !== card.colId && canMoveTo(c.id)).map((c) => (
                                    <button key={c.id} onClick={() => { onMoveCard(card.id, c.id); setShowMenu(false); }}>
                                        Chuyển → {c.title}
                                    </button>
                                ))}
                                {canDelete && (
                                <button className="danger" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(window.confirm("Xóa hồ sơ này?")) onDelete(card.id); 
                                }}>🗑 Xóa</button>
                                )}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>
            <div className="card-title">{card.title}</div>
            <div className="card-sub">{card.sub}</div>
            <div className="card-footer">
                {card.waitText ? <span className="card-wait"><ClockIcon />{card.waitText}</span> : card.done ? <span className="card-date done"><CheckCircleIcon />{card.date}</span> : <span className="card-date"><CalendarIcon />{card.date}</span>}
                {card.avatar && <div className="card-av" style={{ background: card.avatarBg, color: card.avatarColor }}>{card.avatar}</div>}
            </div>
        </div>
    );
}

export default function KanbanBoard({ COLUMNS, cardsByCol, onDelete, onMoveCard, onShowModal }) {
    const [dragOverCol, setDragOverCol] = useState(null);
    const toast = useToast();
    const hasPermission = getPermissionHelper();
    
    // Yêu cầu quyền projects.edit để kéo thả thay đổi trạng thái Dự án (Hồ sơ)
    const canDrag = hasPermission("projects.edit");

    const handleDrop = (e, targetColId) => {
        e.preventDefault();
        setDragOverCol(null);
        
        if (!canDrag) {
            toast.error("Bạn không có quyền chuyển trạng thái Hồ sơ dự án!");
            return;
        }

        const cardId = Number(e.dataTransfer.getData("cardId"));
        const fromColId = e.dataTransfer.getData("fromColId");

        // Kiểm tra quy tắc kéo thả: CHỈ TỪ 'new' SANG 'processing'
        if (fromColId !== targetColId) {
            if (fromColId === 'new' && targetColId === 'processing') {
                onMoveCard(cardId, targetColId);
            } else {
                toast.error("Không thể thực hiện thao tác! Bạn chỉ được phép chuyển từ 'Mới tạo' sang 'Đang xử lý'.");
            }
        }
    };

    return (
        <div className="board">
            {COLUMNS.map((col) => (
                <div 
                    key={col.id} 
                    className={`col ${dragOverCol === col.id ? " col-drag-over" : ""}`}
                    data-col-id={col.id} 
                    onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="col-header">
                        <div className="col-dot" style={{ background: col.color }} />
                        <span className="col-title">{col.title}</span>
                        <span className="col-count">{String(cardsByCol(col.id).length).padStart(2, "0")}</span>
                    </div>
                    <div className="cards">
                        {cardsByCol(col.id).map((card) => (
                            <KanbanCard 
                                key={card.id} 
                                card={card} 
                                onDelete={onDelete} 
                                onMoveCard={onMoveCard} 
                                COLUMNS={COLUMNS} 
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}