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

function KanbanCard({ card, onDelete, onMoveCard, COLUMNS }) {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate(); // THÊM DÒNG NÀY

    // Logic chặn menu ba chấm: Chỉ hiện nút chuyển nếu đi từ 'new' sang 'processing'
    const canMoveTo = (targetColId) => {
        return card.colId === 'new' && targetColId === 'processing';
    };

    // THÊM HÀM NÀY VÀO
    const handleCardClick = (e) => {
        // Nếu bấm vào nút menu hoặc menu dropdown thì không chuyển trang
        if (e.target.closest('.card-menu-btn') || e.target.closest('.card-menu-dropdown')) {
            return;
        }
        navigate(`/ho-so/${card.id}`);
    };

    return (
        <div 
            className={`card ${card.colId}`} 
            draggable 
            onClick={handleCardClick} // THÊM DÒNG NÀY
            style={{ cursor: 'pointer' }} // THÊM DÒNG NÀY cho đẹp
            onDragStart={(e) => {
                e.dataTransfer.setData("cardId", String(card.id));
                e.dataTransfer.setData("fromColId", card.colId);
            }}
        >
            <div className="card-top">
                <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="card-id">#{card.ma_ho_so}</span>
                    <div style={{ position: "relative" }}>
                        <button className="card-menu-btn" onClick={() => setShowMenu(!showMenu)}>···</button>
                        {showMenu && (
                            <div className="card-menu-dropdown" onMouseLeave={() => setShowMenu(false)}>
                                {COLUMNS.filter((c) => c.id !== card.colId && canMoveTo(c.id)).map((c) => (
                                    <button key={c.id} onClick={() => { onMoveCard(card.id, c.id); setShowMenu(false); }}>
                                        Chuyển → {c.title}
                                    </button>
                                ))}
                                <button className="danger" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(window.confirm("Xóa hồ sơ này?")) onDelete(card.id); 
                                }}>🗑 Xóa</button>
                            </div>
                        )}
                    </div>
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

    const handleDrop = (e, targetColId) => {
        e.preventDefault();
        setDragOverCol(null);
        
        const cardId = Number(e.dataTransfer.getData("cardId"));
        const fromColId = e.dataTransfer.getData("fromColId");

        // Cho phép kéo thả giữa các cột khác nhau
        if (fromColId !== targetColId) {
            onMoveCard(cardId, targetColId);
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