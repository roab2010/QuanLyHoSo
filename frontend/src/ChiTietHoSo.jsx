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
    getProjectExportedItems,
    returnItemsToWarehouse,
    getAllWarehouses,
} from "./hoSoService";
import { useToast } from "./Toast";

const STATUS_LABELS = {
    'new': 'Chờ duyệt',
    'DRAFT': 'Chờ duyệt',
    'PENDING': 'Chờ duyệt',
    'processing': 'Đang xử lý',
    'PROCESSING': 'Đang xử lý',
    'done': 'Hoàn thành',
    'COMPLETED': 'Hoàn thành',
    'REVISION': 'Chờ duyệt'
};
const STATUS_CLASS = {
    'new': 'st-reject',
    'DRAFT': 'st-reject',
    'PENDING': 'st-reject',
    'processing': 'st-processing',
    'PROCESSING': 'st-processing',
    'done': 'st-done',
    'COMPLETED': 'st-done',
    'REVISION': 'st-reject'
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

    // Vat tu & thiet bi state
    const [vatTuItems, setVatTuItems] = useState([]);
    const [vatTuLoading, setVatTuLoading] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [returnWarehouseId, setReturnWarehouseId] = useState("");
    const [returnQuantities, setReturnQuantities] = useState({});
    const [returning, setReturning] = useState(false);
    // Track which single item is being returned (null = return all)
    const [singleReturnItem, setSingleReturnItem] = useState(null);

    // Drag state
    const dragItem = useRef(null);

    const isProjectCompleted = project?.status === 'COMPLETED' || project?.status === 'done' || project?.progress === 100;

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const data = await getChiTietHoSo(id);
        if (data) setProject(data);
        if (showLoading) setLoading(false);
    };

    const fetchVatTu = async () => {
        setVatTuLoading(true);
        const res = await getProjectExportedItems(id);
        if (res?.success) setVatTuItems(res.items || []);
        setVatTuLoading(false);
    };

    const getActionTheme = (action) => {
        const text = action.toLowerCase();
        if (text.includes("khởi tạo")) return "#16a34a";
        if (text.includes("trạng thái")) return "#ea580c";
        if (text.includes("cập nhật") || text.includes("thay đổi")) return "#2563eb";
        return "#64748b";
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (activeTab === "vat-tu") {
            fetchVatTu();
        }
    }, [activeTab]);

    /* ─── Mở modal hoàn trả ─── */
    const openReturnModal = async (filterItem = null) => {
        const whs = await getAllWarehouses();
        setWarehouses(whs);
        setSingleReturnItem(filterItem);

        const initQty = {};
        const listToUse = filterItem ? [filterItem] : vatTuItems;
        listToUse.forEach(item => { 
            if (item.type === 'RETURNABLE' || item.type === 'EQUIPMENT') {
                initQty[item.product_id] = item.qty_at_project;
            } else {
                initQty[item.product_id] = 0; 
            }
        });
        setReturnQuantities(initQty);
        setReturnWarehouseId("");
        setShowReturnModal(true);
    };

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

        setProject(prev => {
            const newTasks = prev.tasks.map(t =>
                t.id === task.id ? { ...t, status: targetStatus } : t
            );
            const total = newTasks.length;
            const done = newTasks.filter(t => t.status === "DONE").length;
            const newProgress = total > 0 ? Math.round((done / total) * 100) : 0;
            return { ...prev, tasks: newTasks, progress: newProgress };
        });

        try {
            await updateTask(id, task.id, { status: targetStatus });
            fetchData(false);
        } catch (e) {
            toast.error(e.response?.data?.message || "Lỗi khi cập nhật trạng thái");
            fetchData(false);
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

    /* ─── RETURN HANDLER ─── */
    const handleConfirmReturn = async () => {
        if (!returnWarehouseId) return toast.warning("Vui lòng chọn kho nhập!");

        const listToCheck = singleReturnItem ? [singleReturnItem] : vatTuItems;
        const items = listToCheck
            .filter(item => (returnQuantities[item.product_id] || 0) > 0)
            .map(item => ({
                product_id: item.product_id,
                quantity: returnQuantities[item.product_id]
            }));

        if (items.length === 0) return toast.warning("Vui lòng nhập số lượng cần trả!");

        for (const orig of listToCheck) {
            const retQty = returnQuantities[orig.product_id] || 0;
            if (retQty > orig.qty_at_project) {
                return toast.warning(
                    `Số lượng trả "${orig.product_name}" vượt quá số lượng tại dự án!`
                );
            }
        }

        setReturning(true);
        try {
            const res = await returnItemsToWarehouse({
                project_id: id,
                warehouse_id: returnWarehouseId,
                items
            });
            if (res?.success) {
                toast.success("Đã hoàn trả vật tư về kho thành công!");
                setShowReturnModal(false);
                fetchVatTu();
            } else {
                toast.error(res?.message || "Lỗi khi hoàn trả!");
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || "Lỗi khi hoàn trả vật tư");
        } finally {
            setReturning(false);
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
                <button className="btn-back-main" onClick={() => navigate("/admin")}>
                    ← Quay lại
                </button>
            </div>
        );

    const tasks = project.tasks || [];
    const documents = project.documents || [];
    const members = project.members || [];
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

    // Items shown in return modal
    const returnModalItems = singleReturnItem ? [singleReturnItem] : vatTuItems;

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
                    <button className="btn-back" onClick={() => navigate("/admin")}>
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
                                        <button className="btn-edit" onClick={() => navigate(`/admin/ho-so/${id}/edit`)}>✎ Sửa thông tin</button>
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
                                        <div className="info-item">
                                            <label>DANH MỤC DỰ ÁN</label>
                                            <p>📂 {project.category?.name || "—"}</p>
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
                                        <div className="info-item">
                                            <label>CHI PHÍ DỰ KIẾN</label>
                                            <p style={{ color: '#2563eb', fontWeight: '700' }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.estimated_budget || 0)}
                                            </p>
                                        </div>
                                        <div className="info-item">
                                            <label>GIÁ TRỊ HỢP ĐỒNG</label>
                                            <p style={{ color: '#16a34a', fontWeight: '700' }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.contract_value || 0)}
                                            </p>
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
                            {/* Header section */}
                            <div className="section-header">
                                <h3>Quản lý Vật tư & Thiết bị</h3>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <button
                                        className="btn-add-member"
                                        onClick={fetchVatTu}
                                        disabled={vatTuLoading}
                                        style={{ background: "#475569" }}
                                    >
                                        🔄 Làm mới
                                    </button>
                                    {vatTuItems.length > 0 && !isProjectCompleted && (
                                        <button
                                            className="btn-add-member"
                                            disabled
                                            style={{ background: "#9ca3af", cursor: "not-allowed" }}
                                            title="Chỉ có thể hoàn trả vật tư khi dự án đã hoàn thành"
                                        >
                                            🔒 Hoàn trả vật tư (Chờ hoàn thành)
                                        </button>
                                    )}
                                    {vatTuItems.length > 0 && isProjectCompleted && (
                                        <button
                                            className="btn-add-member"
                                            onClick={() => openReturnModal(null)}
                                            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
                                        >
                                            📦 Hoàn trả vật tư
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Summary cards */}
                            {vatTuItems.length > 0 && (
                                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                                    <div style={{
                                        background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                                        borderRadius: 12, padding: "14px 22px", color: "#fff",
                                        minWidth: 130, boxShadow: "0 4px 15px rgba(59,130,246,0.3)"
                                    }}>
                                        <div style={{ fontSize: 26, fontWeight: 700 }}>{vatTuItems.length}</div>
                                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Loại vật tư</div>
                                    </div>
                                    <div style={{
                                        background: "linear-gradient(135deg,#f59e0b,#d97706)",
                                        borderRadius: 12, padding: "14px 22px", color: "#fff",
                                        minWidth: 130, boxShadow: "0 4px 15px rgba(245,158,11,0.3)"
                                    }}>
                                        <div style={{ fontSize: 26, fontWeight: 700 }}>
                                            {vatTuItems.reduce((s, i) => s + i.qty_at_project, 0).toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Tổng số lượng</div>
                                    </div>
                                    <div style={{
                                        background: "linear-gradient(135deg,#10b981,#059669)",
                                        borderRadius: 12, padding: "14px 22px", color: "#fff",
                                        minWidth: 160, boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                                    }}>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
                                                .format(vatTuItems.reduce((s, i) => s + i.qty_at_project * i.price, 0))}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Tổng giá trị</div>
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            {vatTuLoading ? (
                                <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
                                    <div className="spinner" style={{ margin: "0 auto 14px" }}></div>
                                    <p>Đang tải dữ liệu vật tư...</p>
                                </div>
                            ) : vatTuItems.length === 0 ? (
                                <div style={{
                                    textAlign: "center", padding: "60px 20px",
                                    background: "#f8fafc", borderRadius: 16,
                                    border: "2px dashed #e2e8f0"
                                }}>
                                    <div style={{ fontSize: 52, marginBottom: 14 }}>📦</div>
                                    <p style={{ color: "#64748b", fontSize: 15, fontWeight: 500 }}>
                                        Chưa có vật tư / thiết bị nào được xuất cho dự án này.
                                    </p>
                                    <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>
                                        Vật tư sẽ hiển thị tại đây khi có phiếu xuất kho (TO_PROJECT) cho dự án.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                                    <table className="doc-table" style={{ minWidth: 720 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40, textAlign: "center" }}>#</th>
                                                <th>TÊN VẬT TƯ</th>
                                                <th>MÃ SKU</th>
                                                <th style={{ textAlign: "center" }}>SL TẠI DỰ ÁN</th>
                                                <th style={{ textAlign: "center" }}>ĐƠN VỊ</th>
                                                <th style={{ textAlign: "right" }}>ĐƠN GIÁ</th>
                                                <th style={{ textAlign: "right" }}>GIÁ TRỊ</th>
                                                <th style={{ textAlign: "center" }}>HÀNH ĐỘNG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vatTuItems.map((item, idx) => (
                                                <tr key={item.product_id}>
                                                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                                                            📦 {item.product_name}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            background: "#f1f5f9", padding: "2px 8px",
                                                            borderRadius: 6, fontSize: 12,
                                                            fontFamily: "monospace", color: "#475569"
                                                        }}>
                                                            {item.sku}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span style={{
                                                            background: "#fef3c7", color: "#92400e",
                                                            padding: "3px 12px", borderRadius: 20,
                                                            fontWeight: 700, fontSize: 14
                                                        }}>
                                                            {item.qty_at_project}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#64748b" }}>
                                                        {item.unit || "—"}
                                                    </td>
                                                    <td style={{ textAlign: "right", color: "#475569", fontSize: 13 }}>
                                                        {new Intl.NumberFormat("vi-VN").format(item.price)} ₫
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                                                        {new Intl.NumberFormat("vi-VN").format(
                                                            item.qty_at_project * item.price
                                                        )} ₫
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {isProjectCompleted ? (
                                                            <button
                                                                onClick={() => openReturnModal(item)}
                                                                style={{
                                                                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                                                                    color: "#fff", border: "none",
                                                                    borderRadius: 8, padding: "6px 14px",
                                                                    cursor: "pointer", fontSize: 12,
                                                                    fontWeight: 600, whiteSpace: "nowrap",
                                                                    transition: "opacity .15s"
                                                                }}
                                                                onMouseOver={e => e.currentTarget.style.opacity = ".85"}
                                                                onMouseOut={e => e.currentTarget.style.opacity = "1"}
                                                            >
                                                                🔄 Hoàn trả
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: 12, color: "#94a3b8" }} title="Chỉ được hoàn trả khi dự án hoàn thành">
                                                                Chờ hoàn thành
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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

            {/* Modal Hoàn trả vật tư về kho */}
            {showReturnModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !returning) setShowReturnModal(false);
                    }}
                >
                    <div className="modal-box" style={{ maxWidth: 660, width: "95vw" }}>
                        {/* Modal header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <span style={{ fontSize: 26 }}>📦</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>Hoàn trả vật tư về kho</h3>
                                <p style={{ margin: 0, fontSize: 12, color: "#64748b", marginTop: 3 }}>
                                    {singleReturnItem
                                        ? `Hoàn trả: ${singleReturnItem.product_name}`
                                        : `Hoàn trả ${vatTuItems.length} loại vật tư`}
                                </p>
                            </div>
                        </div>

                        {/* Chọn kho nhập */}
                        <div className="form-group">
                            <label style={{ fontWeight: 600 }}>
                                Kho nhập về <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                                className="form-input"
                                value={returnWarehouseId}
                                onChange={(e) => setReturnWarehouseId(e.target.value)}
                            >
                                <option value="">— Chọn kho —</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Bảng vật tư cần trả */}
                        <div style={{
                            border: "1px solid #e2e8f0", borderRadius: 10,
                            overflow: "hidden", marginBottom: 12
                        }}>
                            <div style={{
                                background: "#f8fafc", padding: "10px 14px",
                                borderBottom: "1px solid #e2e8f0",
                                fontSize: 12, fontWeight: 600, color: "#64748b",
                                display: "grid",
                                gridTemplateColumns: "1fr 110px 130px",
                                gap: 8
                            }}>
                                <span>TÊN VẬT TƯ</span>
                                <span style={{ textAlign: "center" }}>CÒN TẠI DỰ ÁN</span>
                                <span style={{ textAlign: "center" }}>SỐ LƯỢNG TRẢ</span>
                            </div>
                            <div style={{ maxHeight: 320, overflowY: "auto" }}>
                                {returnModalItems.map((item, idx) => (
                                    <div
                                        key={item.product_id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 110px 130px",
                                            gap: 8,
                                            padding: "12px 14px",
                                            alignItems: "center",
                                            borderBottom: idx < returnModalItems.length - 1 ? "1px solid #f1f5f9" : "none",
                                            background: idx % 2 === 0 ? "#fff" : "#fafafa"
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                                                {item.product_name}
                                            </div>
                                            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                                                {item.sku} • {item.unit}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <span style={{
                                                background: "#fef3c7", color: "#92400e",
                                                padding: "3px 10px", borderRadius: 20,
                                                fontWeight: 700, fontSize: 13
                                            }}>
                                                {item.qty_at_project}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <input
                                                type="number"
                                                min={0}
                                                max={item.qty_at_project}
                                                step={0.01}
                                                readOnly={item.type === 'RETURNABLE' || item.type === 'EQUIPMENT'}
                                                value={returnQuantities[item.product_id] ?? 0}
                                                onChange={(e) =>
                                                    setReturnQuantities(prev => ({
                                                        ...prev,
                                                        [item.product_id]: parseFloat(e.target.value) || 0
                                                    }))
                                                }
                                                style={{
                                                    width: 90, padding: "6px 8px",
                                                    textAlign: "center",
                                                    border: "1.5px solid #e2e8f0",
                                                    borderRadius: 8, fontSize: 14,
                                                    outline: "none", fontWeight: 600,
                                                    backgroundColor: (item.type === 'RETURNABLE' || item.type === 'EQUIPMENT') ? '#f1f5f9' : '#fff',
                                                    cursor: (item.type === 'RETURNABLE' || item.type === 'EQUIPMENT') ? 'not-allowed' : 'text'
                                                }}
                                                onFocus={e => { if (item.type !== 'RETURNABLE' && item.type !== 'EQUIPMENT') e.target.style.borderColor = "#3b82f6" }}
                                                onBlur={e => { if (item.type !== 'RETURNABLE' && item.type !== 'EQUIPMENT') e.target.style.borderColor = "#e2e8f0" }}
                                            />
                                        </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        {/* Hint */}
                        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>
                            ⚠️ Thiết bị bắt buộc phải hoàn trả toàn bộ. Vật tư chỉ hoàn trả số dư thừa.
                            Sau khi xác nhận, số lượng sẽ được cộng về kho đã chọn.
                        </p>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowReturnModal(false)}
                                disabled={returning}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-submit"
                                disabled={returning}
                                style={{
                                    background: returning
                                        ? "#9ca3af"
                                        : "linear-gradient(135deg,#16a34a,#15803d)",
                                    cursor: returning ? "not-allowed" : "pointer"
                                }}
                                onClick={handleConfirmReturn}
                            >
                                {returning ? "⏳ Đang xử lý..." : "✔ Xác nhận hoàn trả"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
