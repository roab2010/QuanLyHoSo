import { useState } from "react";
import "./App.css";
import useHoSo from "./HoSo.js";

/* ───────────────────────── Icons ───────────────────────── */
const CalendarIcon = () => (
    <svg viewBox="0 0 12 12" fill="currentColor">
        <path d="M9 1V0H8v1H4V0H3v1H1a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H9zm1 10H2V4h8v7z" />
    </svg>
);
const ClockIcon = () => (
    <svg viewBox="0 0 12 12" fill="currentColor">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M6 3v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
);
const CheckCircleIcon = () => (
    <svg viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#16a34a" strokeWidth="1" />
        <path d="M3 6l2 2 4-4" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ───────────────────────── Config ───────────────────────── */
const COLUMNS = [
    { id: "new",        title: "Mới tạo",    color: "#6b7280" },
    { id: "processing", title: "Đang xử lý", color: "#f59e0b" },
    { id: "done",       title: "Hoàn thành", color: "#16a34a" },
];

const NAV_ITEMS = ["Dashboard", "Hồ sơ", "Báo cáo", "Tin tức", "Cài đặt"];

const TEAM_AVATARS = [
    { initials: "NA", bg: "#4f46e5" },
    { initials: "TH", bg: "#0891b2" },
    { initials: "BT", bg: "#16a34a" },
    { initials: "+4", bg: "#ea580c" },
];

/* ───────────────────────── Modal Thêm ──────────────────── */
function ModalThemHoSo({ onClose, onSubmit, saving }) {
    const [form, setForm] = useState({
        ten: "",
        mo_ta: "",
        muc_do: "trung_binh",
        trang_thai: "moi_tao",
        ngay_tao: new Date().toISOString().slice(0, 10),
        nguoi_phu_trach: "",
    });
    const [err, setErr] = useState("");

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.ten.trim()) { setErr("Vui lòng nhập tên hồ sơ"); return; }
        setErr("");
        const result = await onSubmit(form);
        if (result.ok) onClose();
        else setErr(result.message);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Thêm hồ sơ mới</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {err && <div className="form-error">{err}</div>}

                    <label className="form-label">Tên hồ sơ *</label>
                    <input className="form-input" value={form.ten} onChange={set("ten")}
                        placeholder="VD: Tòa nhà Landmark 81" />

                    <label className="form-label">Mô tả</label>
                    <textarea className="form-input form-textarea" value={form.mo_ta}
                        onChange={set("mo_ta")} placeholder="Mô tả ngắn..." />

                    <div className="form-row">
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Mức độ</label>
                            <select className="form-input" value={form.muc_do} onChange={set("muc_do")}>
                                <option value="cao">Cao</option>
                                <option value="trung_binh">Trung bình</option>
                                <option value="thap">Thấp</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Trạng thái</label>
                            <select className="form-input" value={form.trang_thai} onChange={set("trang_thai")}>
                                <option value="moi_tao">Mới tạo</option>
                                <option value="dang_xu_ly">Đang xử lý</option>
                                <option value="hoan_thanh">Hoàn thành</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Ngày tạo</label>
                            <input className="form-input" type="date" value={form.ngay_tao}
                                onChange={set("ngay_tao")} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Người phụ trách</label>
                            <input className="form-input" value={form.nguoi_phu_trach}
                                onChange={set("nguoi_phu_trach")} placeholder="Tên người phụ trách" />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Card ─────────────────────────── */
function KanbanCard({ card, onDelete, onMoveCard }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            className={`card${card.processing ? " processing" : ""}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("cardId", String(card.id))}
        >
            <div className="card-top">
                <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="card-id">#{card.ma_ho_so}</span>
                    <div style={{ position: "relative" }}>
                        <button className="card-menu-btn" onClick={() => setShowMenu((v) => !v)}>
                            ···
                        </button>
                        {showMenu && (
                            <div className="card-menu-dropdown" onMouseLeave={() => setShowMenu(false)}>
                                {COLUMNS.filter((c) => c.id !== card.colId).map((c) => (
                                    <button key={c.id} onClick={() => { onMoveCard(card.id, c.id); setShowMenu(false); }}>
                                        Chuyển → {c.title}
                                    </button>
                                ))}
                                <button className="danger" onClick={(e) => { 
    e.stopPropagation(); // Thêm dòng này
    if(window.confirm("Xóa hồ sơ này?")) onDelete(card.id); 
    setShowMenu(false); 
}}>
    🗑 Xóa
</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-title">{card.title}</div>
            <div className="card-sub">{card.sub}</div>

            <div className="card-footer">
                {card.waitText ? (
                    <span className="card-wait"><ClockIcon />{card.waitText}</span>
                ) : card.done ? (
                    <span className="card-date done"><CheckCircleIcon />{card.date}</span>
                ) : (
                    <span className="card-date"><CalendarIcon />{card.date}</span>
                )}
                {card.avatar && (
                    <div className="card-av" style={{ background: card.avatarBg, color: card.avatarColor }}>
                        {card.avatar}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ───────────────────────── Column ──────────────────────── */
function KanbanColumn({ col, cards, onDelete, onMoveCard }) {
    const [dragOver, setDragOver] = useState(false);

    return (
        <div
            className={`col${dragOver ? " col-drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                onMoveCard(Number(e.dataTransfer.getData("cardId")), col.id);
                setDragOver(false);
            }}
        >
            <div className="col-header">
                <div className="col-dot" style={{ background: col.color }} />
                <span className="col-title">{col.title}</span>
                <span className="col-count">{String(cards.length).padStart(2, "0")}</span>
                <span className="col-menu">···</span>
            </div>
            <div className="cards">
                {cards.map((card) => (
                    <KanbanCard key={card.id} card={card} onDelete={onDelete} onMoveCard={onMoveCard} />
                ))}
            </div>
            <button className="add-card-btn">+ Thêm thẻ</button>
        </div>
    );
}

/* ───────────────────────── App ─────────────────────────── */
export default function App() {
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [search, setSearch]       = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]       = useState(false);

    const { loading, error, cardsByCol, themHoSo, xoaHoSo, moveCard, fetchAll } = useHoSo();

    const handleThem = async (payload) => {
        setSaving(true);
        const result = await themHoSo(payload);
        setSaving(false);
        return result;
    };

    const filteredCards = (colId) => {
        const q = search.toLowerCase();
        return cardsByCol(colId).filter(
            (c) => !q || c.title.toLowerCase().includes(q) || c.ma_ho_so.toLowerCase().includes(q)
        );
    };

    return (
        <div className="app">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Hệ thống Hồ sơ</h2>
                    <span>Quản trị viên</span>
                </div>

                {NAV_ITEMS.map((label) => (
                    <button
                        key={label}
                        className={`nav-item${activeNav === label ? " active" : ""}`}
                        onClick={() => setActiveNav(label)}
                    >
                        {label}
                    </button>
                ))}

                <button className="add-new-btn" onClick={() => setShowModal(true)}>
                    + Thêm hồ sơ mới
                </button>

                <div className="sidebar-bottom">
                    <div className="user-avatar">NA</div>
                    <div className="user-info">
                        <div className="user-name">Nguyễn Văn A</div>
                        <div className="user-email">admin@system.vn</div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="main">
                {/* Topbar */}
                <div className="topbar">
                    <span className="topbar-title">Quản Lý Hồ Sơ</span>
                    <input
                        className="search-input"
                        placeholder="Tìm kiếm tên, mã hồ sơ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="topbar-right">
                        <button className="icon-btn" onClick={fetchAll} title="Làm mới">↻</button>
                        <button className="icon-btn">🔔</button>
                        <button className="icon-btn">?</button>
                        <div className="avatars-group">
                            {TEAM_AVATARS.map((av) => (
                                <div key={av.initials} className="av" style={{ background: av.bg }}>
                                    {av.initials}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <button className="tb-btn">☰ Bộ lọc</button>
                    <button className="tb-btn">↕ Sắp xếp: Mới nhất</button>
                </div>

                {/* Trạng thái */}
                {loading && <div className="state-banner loading">⏳ Đang tải dữ liệu...</div>}
                {error   && (
                    <div className="state-banner error">
                        ⚠️ {error}
                        <button onClick={fetchAll} style={{ marginLeft: 10, background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Board */}
                <div className="board">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            col={col}
                            cards={filteredCards(col.id)}
                            onDelete={xoaHoSo}
                            onMoveCard={moveCard}
                        />
                    ))}
                </div>

                <button className="fab" onClick={() => setShowModal(true)}>+</button>
            </div>

            {/* Modal */}
            {showModal && (
                <ModalThemHoSo
                    onClose={() => setShowModal(false)}
                    onSubmit={handleThem}
                    saving={saving}
                />
            )}
        </div>
    );
}