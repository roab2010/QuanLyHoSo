import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getChiTietHoSo,
    createTask,
    updateTask,
    deleteTask,
    updateDocument,
    addMember,
    removeMember,
    getAllEmployees,
} from "./hoSoService";
import { useToast } from "./Toast";

const STATUS_LABELS = {
    PENDING: "Chờ duyệt",
    PROCESSING: "Đang xử lý",
    REVISION: "Cần sửa",
    COMPLETED: "Đã xong",
};
const STATUS_CLASS = {
    PENDING: "st-wait",
    PROCESSING: "st-processing",
    REVISION: "st-reject",
    COMPLETED: "st-done",
};

const TASK_COLS = [
    { id: "TODO", title: "CHƯA LÀM", color: "#6b7280" },
    { id: "DOING", title: "ĐANG LÀM", color: "#f59e0b" },
    { id: "DONE", title: "HOÀN THÀNH", color: "#16a34a" },
];
const TASK_ORDER = { TODO: 1, DOING: 2, DONE: 3 };

export default function ChiTietHoSo() {
    const toast = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState("thong-tin");
    const [loading, setLoading] = useState(true);

    // Task modal
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({ task_name: "", work_volume: 0 });

    // Member modal
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");

    // Drag state
    const dragItem = useRef(null);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const data = await getChiTietHoSo(id);
        if (data) setProject(data);
        if (showLoading) setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    /* ─── TASK HANDLERS ─── */
    const handleAddTask = () => {
        setEditingTask(null);
        setTaskForm({ task_name: "", work_volume: 0 });
        setShowTaskModal(true);
    };
    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskForm({ task_name: task.task_name, work_volume: task.work_volume });
        setShowTaskModal(true);
    };
    const handleSaveTask = async () => {
        if (!taskForm.task_name.trim()) return toast.warning("Vui lòng nhập tên công việc");
        try {
            if (editingTask) {
                await updateTask(id, editingTask.id, taskForm);
            } else {
                await createTask(id, taskForm);
            }
            setShowTaskModal(false);
            fetchData(false);
            toast.success(editingTask ? "Cập nhật công việc thành công" : "Thêm công việc thành công");
        } catch (e) {
            toast.error(e.response?.data?.message || "Lỗi khi lưu công việc");
        }
    };
    const handleDeleteTask = async (taskId) => {
        const isConfirmed = await toast.showConfirm("Bạn chắc chắn muốn xóa công việc này?");
        if (!isConfirmed) return;
        try {
            await deleteTask(id, taskId);
            fetchData(false);
            toast.success("Đã xóa công việc");
        } catch (e) {
            toast.error("Lỗi khi xóa công việc");
        }
    };

    /* ─── DRAG & DROP (forward only) ─── */
    const handleDragStart = (e, task) => {
        dragItem.current = task;
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        const task = dragItem.current;
        if (!task || task.status === targetStatus) return;
        const curOrd = TASK_ORDER[task.status];
        const newOrd = TASK_ORDER[targetStatus];
        if (newOrd < curOrd) return toast.warning("Không được kéo ngược trạng thái!");
        if (newOrd > curOrd + 1)
            return toast.warning("Chỉ được chuyển sang trạng thái kế tiếp!");

        // Optimistic UI: Cập nhật giao diện ngay lập tức mà không cần chờ API
        setProject(prev => {
            const newTasks = prev.tasks.map(t => 
                t.id === task.id ? { ...t, status: targetStatus } : t
            );
            return { ...prev, tasks: newTasks };
        });

        try {
            await updateTask(id, task.id, { status: targetStatus });
            fetchData(false); // Cập nhật ngầm dữ liệu để lấy phần trăm tiến độ mới
        } catch (e) {
            toast.error(e.response?.data?.message || "Lỗi khi cập nhật trạng thái");
            fetchData(false); // Nếu lỗi, tự động tải lại (hoàn tác UI)
        }
        dragItem.current = null;
    };

    /* ─── DOCUMENT HANDLERS ─── */
    const handleDocAction = async (docId, status) => {
        try {
            await updateDocument(id, docId, { status });
            fetchData();
            toast.success("Trạng thái tài liệu đã được cập nhật");
        } catch (e) {
            toast.error("Lỗi khi cập nhật tài liệu");
        }
    };

    /* ─── MEMBER HANDLERS ─── */
    const handleOpenAddMember = async () => {
        const emps = await getAllEmployees();
        setEmployees(emps);
        setSelectedEmployee("");
        setShowMemberModal(true);
    };
    const handleAddMember = async () => {
        if (!selectedEmployee) return toast.warning("Vui lòng chọn nhân viên");
        try {
            await addMember(id, { employee_id: selectedEmployee });
            setShowMemberModal(false);
            fetchData();
            toast.success("Đã phân công thành viên mới vào dự án");
        } catch (e) {
            toast.error(e.response?.data?.error || "Lỗi khi thêm thành viên");
        }
    };
    const handleRemoveMember = async (memberId) => {
        const isConfirmed = await toast.showConfirm("Xóa thành viên này khỏi dự án?");
        if (!isConfirmed) return;
        try {
            await removeMember(id, memberId);
            fetchData();
            toast.success("Đã xóa thành viên khỏi dự án");
        } catch (e) {
            toast.error("Lỗi khi xóa thành viên");
        }
    };

    if (loading)
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    if (!project)
        return (
            <div className="loading-screen">
                <p>Không tìm thấy hồ sơ</p>
                <button className="btn-back-main" onClick={() => navigate("/")}>
                    ← Quay lại
                </button>
            </div>
        );

    const tasks = project.tasks || [];
    const documents = project.documents || [];
    const members = project.members || [];
    const equipments = project.equipments || [];
    const supervisorName = project.supervisor?.full_name || "—";
    const customerName =
        project.customer?.full_name || project.customer?.name || "—";
    const startDateFormatted = project.start_date
        ? new Date(project.start_date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "—";

    return (
        <div className="detail-container">
            {/* Header */}
            <div className="detail-header">
                <div className="breadcrumb">DỰ ÁN / CHI TIẾT HỒ SƠ</div>
                <div className="header-main">
                    <h2>
                        Chi tiết hồ sơ #{project.project_code}: {project.name}
                    </h2>

                </div>
                <p className="sub-text">
                    Hệ thống quản lý hồ sơ kỹ thuật và vận hành thi công.
                </p>
            </div>

            <div className="detail-content">
                {/* Sidebar */}
                <div className="detail-sidebar">
                    {[
                        { key: "thong-tin", label: "Thông tin chung", icon: "📊" },
                        { key: "phap-ly", label: "Tài liệu pháp lý", icon: "📄" },
                        { key: "nhan-su", label: "Nhân sự & Thành viên", icon: "👥" },
                        { key: "vat-tu", label: "Vật tư & Thiết bị", icon: "🏗️" },
                        { key: "tien-do", label: "Tiến độ thi công", icon: "📋" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={activeTab === tab.key ? "active" : ""}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="tab-icon">{tab.icon}</span> {tab.label}
                            {activeTab === tab.key && <span className="tab-arrow">›</span>}
                        </button>
                    ))}
                    <button className="btn-back" onClick={() => navigate("/")}>
                        ← Quay lại bảng
                    </button>
                </div>

                {/* Nội dung chính */}
                <div className="detail-main">
                    {/* ═══ TAB: THÔNG TIN CHUNG (DASHBOARD) ═══ */}
                    {activeTab === "thong-tin" && (
                        <div className="dashboard-layout animate-fade-in">
                            <div className="dashboard-left">
                                <section className="info-section">
                                    <div className="section-header">
                                        <h3>Thông tin dự án</h3>
                                        <button className="btn-edit">✎ Sửa thông tin</button>
                                    </div>
                                    <div className="info-grid big-grid">
                                        <div className="info-item">
                                            <label>TÊN DỰ ÁN</label>
                                            <p>{project.name}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>KỸ SƯ TRƯỞNG</label>
                                            <p>👤 {supervisorName}</p>
                                        </div>
                                        <div className="info-item full">
                                            <label>ĐỊA CHỈ</label>
                                            <p>{project.address}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>CHỦ ĐẦU TƯ</label>
                                            <p>{customerName}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>NGÀY KHỞI CÔNG</label>
                                            <p>{startDateFormatted}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Tài liệu pháp lý preview */}
                                <section className="info-section" style={{ marginTop: 20 }}>
                                    <div className="section-header">
                                        <h3>Tài liệu pháp lý</h3>
                                        <button
                                            className="btn-edit"
                                            onClick={() => setActiveTab("phap-ly")}
                                        >
                                            Xem tất cả →
                                        </button>
                                    </div>
                                    {documents.length > 0 ? (
                                        <table className="doc-table">
                                            <thead>
                                                <tr>
                                                    <th>TÊN TÀI LIỆU</th>
                                                    <th>NGÀY TẢI LÊN</th>
                                                    <th>TRẠNG THÁI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {documents.slice(0, 3).map((doc) => (
                                                    <tr key={doc.id}>
                                                        <td>📄 {doc.document_name}</td>
                                                        <td>
                                                            {doc.uploaded_at
                                                                ? new Date(doc.uploaded_at).toLocaleDateString(
                                                                    "vi-VN",
                                                                )
                                                                : "—"}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={
                                                                    STATUS_CLASS[doc.status] || "st-wait"
                                                                }
                                                            >
                                                                {STATUS_LABELS[doc.status] || doc.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="empty-text">Chưa có tài liệu</p>
                                    )}
                                </section>

                                {/* Tiến độ Kanban preview */}
                                <section className="info-section" style={{ marginTop: 20 }}>
                                    <div className="section-header">
                                        <h3>Tiến độ thi công (Kanban)</h3>
                                        <button
                                            className="btn-edit"
                                            onClick={() => setActiveTab("tien-do")}
                                        >
                                            Xem chi tiết →
                                        </button>
                                    </div>
                                    <div className="kanban-preview">
                                        {TASK_COLS.map((col) => {
                                            const colTasks = tasks.filter((t) => t.status === col.id);
                                            return (
                                                <div className="kanban-preview-col" key={col.id}>
                                                    <div className="kanban-col-header">
                                                        <span
                                                            className="kanban-dot"
                                                            style={{ background: col.color }}
                                                        ></span>
                                                        <span className="kanban-col-title">
                                                            {col.title}
                                                        </span>
                                                        <span className="kanban-col-count">
                                                            {colTasks.length}
                                                        </span>
                                                    </div>
                                                    {colTasks.slice(0, 2).map((t) => (
                                                        <div className="kanban-mini-card" key={t.id}>
                                                            {t.task_name}
                                                        </div>
                                                    ))}
                                                    {colTasks.length > 2 && (
                                                        <span className="kanban-more">
                                                            +{colTasks.length - 2} khác
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>

                            {/* Progress widget */}
                            <div className="detail-right">
                                <div className="progress-widget">
                                    <h4>Tiến độ tổng</h4>
                                    <p className="progress-desc">
                                        Dự án đang trong giai đoạn thi công phần thô theo đúng kế
                                        hoạch đề ra.
                                    </p>
                                    <div className="progress-circle">
                                        <svg viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="52" className="progress-bg" />
                                            <circle
                                                cx="60"
                                                cy="60"
                                                r="52"
                                                className="progress-fill"
                                                style={{
                                                    strokeDasharray: `${(project.progress / 100) * 327} 327`,
                                                }}
                                            />
                                        </svg>
                                        <span className="progress-number">{project.progress}%</span>
                                    </div>
                                    <button
                                        className="btn-progress-detail"
                                        onClick={() => setActiveTab("tien-do")}
                                    >
                                        Xem báo cáo chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB: TÀI LIỆU PHÁP LÝ ═══ */}
                    {activeTab === "phap-ly" && (
                        <section className="document-section animate-fade-in">
                            <div className="section-header">
                                <h3>Danh sách hồ sơ pháp lý</h3>
                            </div>
                            {documents.length > 0 ? (
                                <table className="doc-table">
                                    <thead>
                                        <tr>
                                            <th>TÊN TÀI LIỆU</th>
                                            <th>NGÀY TẢI LÊN</th>
                                            <th>TRẠNG THÁI</th>
                                            <th>HÀNH ĐỘNG</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc.id}>
                                                <td>📄 {doc.document_name}</td>
                                                <td>
                                                    {doc.uploaded_at
                                                        ? new Date(doc.uploaded_at).toLocaleDateString(
                                                            "vi-VN",
                                                        )
                                                        : "—"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={STATUS_CLASS[doc.status] || "st-wait"}
                                                    >
                                                        {STATUS_LABELS[doc.status] || doc.status}
                                                    </span>
                                                </td>
                                                <td className="doc-actions">
                                                    {doc.file_url && (
                                                        <a
                                                            href={doc.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn-doc btn-doc-view"
                                                        >
                                                            👁 Xem
                                                        </a>
                                                    )}
                                                    {doc.status !== "COMPLETED" && (
                                                        <button
                                                            className="btn-doc btn-doc-approve"
                                                            onClick={() =>
                                                                handleDocAction(doc.id, "COMPLETED")
                                                            }
                                                        >
                                                            ✓ Duyệt
                                                        </button>
                                                    )}
                                                    {doc.status !== "REVISION" && (
                                                        <button
                                                            className="btn-doc btn-doc-reject"
                                                            onClick={() =>
                                                                handleDocAction(doc.id, "REVISION")
                                                            }
                                                        >
                                                            ✗ Từ chối
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-text">Chưa có tài liệu pháp lý nào.</p>
                            )}
                        </section>
                    )}

                    {/* ═══ TAB: NHÂN SỰ & THÀNH VIÊN ═══ */}
                    {activeTab === "nhan-su" && (
                        <section className="members-section animate-fade-in">
                            <div className="section-header">
                                <h3>Thành viên dự án</h3>
                                <button
                                    className="btn-add-member"
                                    onClick={handleOpenAddMember}
                                >
                                    👤+ Thêm thành viên
                                </button>
                            </div>
                            <div className="members-stats">
                                <div className="stat-box">
                                    <span className="stat-number">{members.length}</span>
                                    <span className="stat-label">Tổng số nhân sự</span>
                                </div>
                            </div>
                            <div className="members-grid">
                                {members.map((m) => {
                                    const emp = m.employee || {};
                                    const initials = (emp.full_name || "?")
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(-2);
                                    return (
                                        <div className="member-card" key={m.id}>
                                            <div className="member-avatar">{initials}</div>
                                            <span className="member-role-badge">
                                                {emp.job_title || "Nhân viên"}
                                            </span>
                                            <h4 className="member-name">{emp.full_name || "—"}</h4>
                                            <p className="member-email">{emp.email || "—"}</p>
                                            <div className="member-footer">
                                                <span className="member-date">
                                                    📞 {emp.phone || "—"}
                                                </span>
                                                <button
                                                    className="member-menu"
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    title="Xóa thành viên"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Card thêm thành viên */}
                                <div
                                    className="member-card add-card"
                                    onClick={handleOpenAddMember}
                                >
                                    <span className="add-icon">+</span>
                                    <p>Mời thành viên mới</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ═══ TAB: VẬT TƯ & THIẾT BỊ ═══ */}
                    {activeTab === "vat-tu" && (
                        <section className="equipment-section animate-fade-in">
                            <div className="section-header">
                                <h3>Quản lý Vật tư & Thiết bị</h3>
                            </div>
                            {equipments.length > 0 ? (
                                <div className="equipment-grid">
                                    {equipments.map((eq) => {
                                        const prod = eq.product || {};
                                        const statusClass =
                                            eq.status === "IN_USE"
                                                ? "eq-in-use"
                                                : eq.status === "FULLY_RETURNED"
                                                    ? "eq-returned"
                                                    : "eq-partial";
                                        const statusLabel =
                                            eq.status === "IN_USE"
                                                ? "Đang sử dụng"
                                                : eq.status === "FULLY_RETURNED"
                                                    ? "Đã trả"
                                                    : "Trả 1 phần";
                                        return (
                                            <div className="equipment-card" key={eq.id}>
                                                <div className="eq-header">
                                                    <span className="eq-icon">
                                                        {prod.type === "RETURNABLE" ? "🏗️" : "🧱"}
                                                    </span>
                                                    <span className={`eq-status ${statusClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <h4 className="eq-name">{prod.name || "—"}</h4>
                                                <div className="eq-details">
                                                    <div className="eq-detail">
                                                        <label>Số lượng xuất</label>
                                                        <span>{eq.quantity_dispatched}</span>
                                                    </div>
                                                    <div className="eq-detail">
                                                        <label>Đã trả</label>
                                                        <span>{eq.quantity_returned}</span>
                                                    </div>
                                                    <div className="eq-detail">
                                                        <label>Đơn vị</label>
                                                        <span>{prod.unit || "—"}</span>
                                                    </div>
                                                    <div className="eq-detail">
                                                        <label>Ngày xuất</label>
                                                        <span>
                                                            {eq.dispatched_date
                                                                ? new Date(
                                                                    eq.dispatched_date,
                                                                ).toLocaleDateString("vi-VN")
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="empty-text">Chưa có vật tư / thiết bị nào.</p>
                            )}
                        </section>
                    )}

                    {/* ═══ TAB: TIẾN ĐỘ THI CÔNG (KANBAN) ═══ */}
                    {activeTab === "tien-do" && (
                        <section className="progress-section animate-fade-in">
                            <div className="section-header">
                                <h3>Tiến độ thi công</h3>
                                <button className="btn-add-member" onClick={handleAddTask}>
                                    + Thêm công việc
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-summary">
                                <div className="progress-bar-wrap">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">
                                    {project.progress}% hoàn thành (
                                    {tasks.filter((t) => t.status === "DONE").length}/
                                    {tasks.length} công việc)
                                </span>
                            </div>

                            {/* Kanban Board */}
                            <div className="kanban-board">
                                {TASK_COLS.map((col) => {
                                    const colTasks = tasks.filter((t) => t.status === col.id);
                                    return (
                                        <div
                                            className="kanban-column"
                                            key={col.id}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                        >
                                            <div className="kanban-col-header">
                                                <span
                                                    className="kanban-dot"
                                                    style={{ background: col.color }}
                                                ></span>
                                                <span className="kanban-col-title">{col.title}</span>
                                                <span className="kanban-col-count">
                                                    {colTasks.length}
                                                </span>
                                            </div>
                                            <div className="kanban-cards">
                                                {colTasks.map((task) => (
                                                    <div
                                                        className="kanban-task-card"
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task)}
                                                    >
                                                        <div className="task-card-top">
                                                            <span className="task-name">
                                                                {task.task_name}
                                                            </span>
                                                        </div>
                                                        {task.work_volume > 0 && (
                                                            <span className="task-volume">
                                                                KL: {task.work_volume}
                                                            </span>
                                                        )}
                                                        <div className="task-card-actions">
                                                            <button
                                                                className="task-btn task-btn-edit"
                                                                onClick={() => handleEditTask(task)}
                                                                title="Sửa"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button
                                                                className="task-btn task-btn-del"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Xóa"
                                                            >
                                                                🗑
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* ═══ MODALS ═══ */}

            {/* Modal Thêm/Sửa Công việc */}
            {showTaskModal && (
                <div 
                    className="modal-overlay" 
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setShowTaskModal(false);
                    }}
                >
                    <div className="modal-box">
                        <h3>{editingTask ? "Sửa công việc" : "Thêm công việc mới"}</h3>
                        <div className="form-group">
                            <label>Tên công việc</label>
                            <input
                                className="form-input"
                                value={taskForm.task_name}
                                onChange={(e) =>
                                    setTaskForm({ ...taskForm, task_name: e.target.value })
                                }
                                placeholder="Nhập tên công việc..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Khối lượng</label>
                            <input
                                className="form-input"
                                type="number"
                                value={taskForm.work_volume}
                                onChange={(e) =>
                                    setTaskForm({ ...taskForm, work_volume: e.target.value })
                                }
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowTaskModal(false)}
                            >
                                Hủy
                            </button>
                            <button className="btn-submit" onClick={handleSaveTask}>
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thêm Thành viên */}
            {showMemberModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setShowMemberModal(false);
                    }}
                >
                    <div className="modal-box">
                        <h3>Thêm thành viên vào dự án</h3>
                        <div className="form-group">
                            <label>Chọn nhân viên</label>
                            <select
                                className="form-input"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                                <option value="">— Chọn nhân viên —</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name} - {emp.job_title || "N/A"}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowMemberModal(false)}
                            >
                                Hủy
                            </button>
                            <button className="btn-submit" onClick={handleAddMember}>
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
