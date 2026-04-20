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
    getAllProjectPositions,
    getProjectExportedItems,
    returnItemsToWarehouse,
    getAllWarehouses,
    uploadProjectDocument,
    updateProjectDocumentNew,
    deleteProjectDocument,
    requestProjectMaterials,
    getAllInventoryItems,
    getPendingMaterialRequests,
    getDocumentsMetadata,
    getConstructionLogs,
    createConstructionLog,
    deleteConstructionLog,
    addLogImages,
    deleteLogImage
} from "./hoSoService";
import { useToast } from "./Toast";
import JSZip from "jszip";

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

const calculateRemainingDays = (createdAt, estimatedDays) => {
    if (!createdAt || !estimatedDays) return 0;
    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return estimatedDays - diffDays;
};

export default function ChiTietHoSo() {
    const toast = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState("thong-tin");
    const [loading, setLoading] = useState(true);

    // Document Modal
    const [showDocModal, setShowDocModal] = useState(false);
    const [docUploading, setDocUploading] = useState(false);
    const [docTypes, setDocTypes] = useState([]);
    const [editDocId, setEditDocId] = useState(null);
    const [docForm, setDocForm] = useState({ name: "", type: "", note: "", file: null });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewScale, setPreviewScale] = useState(1);

    // Task modal
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({ task_name: "", work_volume: 0, estimated_completion_date: "" });

    // Member modal
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedPosition, setSelectedPosition] = useState("");
    const [customPosition, setCustomPosition] = useState("");

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

    // Request materials state
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [requestItems, setRequestItems] = useState([]);
    const [requesting, setRequesting] = useState(false);
    
    // Pending requests state
    const [pendingRequests, setPendingRequests] = useState([]);

    // Construction Log state
    const [constructionLogs, setConstructionLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [logForm, setLogForm] = useState({ log_date: new Date().toISOString().split('T')[0], title: '', description: '', weather: '' });
    const [logImages, setLogImages] = useState([]);
    const [savingLog, setSavingLog] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const logFileInputRef = useRef(null);
    const [addingImagesTo, setAddingImagesTo] = useState(null);
    const quickImageRef = useRef(null);

    // Drag state
    const dragItem = useRef(null);

    // Permission tracking
    const admin = JSON.parse(localStorage.getItem("admin_user") || "null");
    const hasPermission = (permKey) => {
        if (!admin) return false;
        if (admin.role === 'admin') return true;
        try {
            const perms = JSON.parse(admin.permissions || '[]');
            let hasGlobal = false;
            if (perms.includes(permKey)) hasGlobal = true;
            else if (!permKey.includes('.')) {
                hasGlobal = perms.some(p => p.startsWith(permKey + '.'));
            }

            if (hasGlobal && project) {
                const isSupervisor = project.supervisor?.user_id === admin.id;
                const isMember = project.members?.some(m => m.employee?.user_id === admin.id);
                if (!isSupervisor && !isMember) {
                    return false;
                }
            }
            return hasGlobal;
        } catch (e) { return false; }
    };

    const canEditProject = hasPermission("projects.edit");
    const canUploadDoc = hasPermission("documents.upload");
    const canEditDoc = hasPermission("documents.edit");
    const canDeleteDoc = hasPermission("documents.delete");
    const canManageMembers = hasPermission("members.manage");
    const canManageTasks = hasPermission("tasks.manage");
    const canDeleteTasks = hasPermission("tasks.delete");
    const canManageInventory = hasPermission("inventory.manage");
    const canManageLogs = hasPermission("logs.manage");
    const canDragKanban = hasPermission("kanban.drag");

    const isProjectCompleted = project?.status === 'COMPLETED' || project?.status === 'done' || project?.progress === 100;

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const data = await getChiTietHoSo(id);
        if (data) {
            let hasAutoCompleted = false;
            if (data.tasks) {
                const updatedTasks = [...data.tasks];
                for (let i = 0; i < updatedTasks.length; i++) {
                    const t = updatedTasks[i];
                    if (t.status === "DOING" && t.estimated_completion_date && t.estimated_completion_date > 0) {
                        const remaining = calculateRemainingDays(t.created_at, t.estimated_completion_date);
                        if (remaining <= 0) {
                            try {
                                await updateTask(id, t.id, { status: "DONE" });
                                updatedTasks[i].status = "DONE";
                                hasAutoCompleted = true;
                            } catch (e) { console.error(e); }
                        }
                    }
                }
                if (hasAutoCompleted) {
                    const totalTasks = updatedTasks.length;
                    const doneTasks = updatedTasks.filter(task => task.status === "DONE").length;
                    data.progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                    data.tasks = updatedTasks;
                    toast.success("Hệ thống đã tự động hoàn thành các công việc đến hạn!");
                }
            }
            setProject(data);
        }
        if (showLoading) setLoading(false);
    };

    const fetchDocMetadata = async () => {
        const metadata = await getDocumentsMetadata();
        setDocTypes(metadata.types || []);
    };

    const fetchVatTu = async () => {
        setVatTuLoading(true);
        const [resExport, resPending] = await Promise.all([
            getProjectExportedItems(id),
            getPendingMaterialRequests()
        ]);
        
        if (resExport?.success) {
            setVatTuItems(resExport.items || []);
        }
        
        if (resPending?.success) {
            const projectPending = (resPending.requests || []).filter(
                (req) => req.project_id === parseInt(id)
            );
            setPendingRequests(projectPending);
        }
        
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
        fetchDocMetadata();
    }, [id]);

    const fetchConstructionLogs = async () => {
        setLogsLoading(true);
        const res = await getConstructionLogs(id);
        if (res?.success) {
            setConstructionLogs(res.logs || []);
        }
        setLogsLoading(false);
    };

    useEffect(() => {
        if (activeTab === "vat-tu") {
            fetchVatTu();
        }
        if (activeTab === "tien-do") {
            fetchConstructionLogs();
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
        setTaskForm({ task_name: "", work_volume: 0, estimated_completion_date: "" });
        setShowTaskModal(true);
    };
    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskForm({ task_name: task.task_name, work_volume: task.work_volume, estimated_completion_date: task.estimated_completion_date || "" });
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
        
        if (!canDragKanban) {
            toast.error("Bạn không có quyền cập nhật tiến độ công việc trên bảng Kanban!");
            return;
        }

        const task = dragItem.current;
        // Cho phép Admin thay đổi trạng thái tự do
        if (!task || task.status === targetStatus) return;

        if (task.status === "DOING" && targetStatus === "DONE") {
            toast.error("Không được tự ý kéo sang HOÀN THÀNH. Hệ thống sẽ tự động chuyển khi hết ngày!");
            return;
        }

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
    const handleOpenAddDoc = () => {
        setEditDocId(null);
        setDocForm({ name: "", type: "", note: "", file: null });
        setShowDocModal(true);
    };
    
    const handleOpenEditDoc = (doc) => {
        setEditDocId(doc.id);
        setDocForm({
            name: doc.document_name,
            type: doc.document_type_id || "",
            note: doc.note || "",
            file: null
        });
        setShowDocModal(true);
    };

    const handleSaveDoc = async (e) => {
        e.preventDefault();
        // Validation handled by form required attributes, but for edit doc, file is optional.
        if (!editDocId && !docForm.file) return toast.warning("Vui lòng chọn tệp tin!");

        setDocUploading(true);
        const formData = new FormData();
        formData.append('document_name', docForm.name);
        formData.append('project_id', id);
        formData.append('document_type_id', docForm.type);
        if (docForm.note) formData.append('note', docForm.note);
        if (docForm.file) formData.append('file', docForm.file);

        try {
            if (editDocId) {
                await updateProjectDocumentNew(editDocId, formData);
                toast.success("Cập nhật tài liệu thành công");
            } else {
                await uploadProjectDocument(formData);
                toast.success("Tải lên tài liệu thành công");
            }
            setShowDocModal(false);
            fetchData(false);
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi lưu tài liệu");
        } finally {
            setDocUploading(false);
        }
    };

    const handleDocAction = async (docId, status) => {
        try {
            await updateDocument(id, docId, { status });
            fetchData(false);
            toast.success("Trạng thái tài liệu đã được cập nhật");
        } catch (e) {
            toast.error("Lỗi khi cập nhật tài liệu");
        }
    };

    const handleDeleteDoc = async (docId) => {
        const isConfirmed = await toast.showConfirm("Bạn có chắc chắn muốn xóa tài liệu này?");
        if (!isConfirmed) return;
        try {
            await deleteProjectDocument(docId);
            fetchData(false);
            toast.success("Đã xóa tài liệu");
        } catch (e) {
            toast.error("Lỗi khi xóa tài liệu");
        }
    };

    const handleDownload = async (doc) => {
        const isConfirmed = await toast.showConfirm(`Bạn muốn tải về tài liệu "${doc.document_name}" này chứ?`);
        if (!isConfirmed) return;

        try {
            const url = `http://127.0.0.1:8000/api/documents/download-file?url=${encodeURIComponent(doc.file_url)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || "Tài liệu không tồn tại hoặc có lỗi hệ thống!");
                return;
            }
            
            const blob = await response.blob();
            const extMatch = doc.file_url.match(/\.([^.]+)$/);
            const ext = extMatch ? `.${extMatch[1]}` : "";
            let safeName = doc.document_name.replace(/[<>:"\/\\|?*]+/g, '_');
            
            const urlObj = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = urlObj;
            a.download = `${safeName}${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlObj);
            document.body.removeChild(a);

            toast.success("Tải xuống thành công!");
        } catch (error) {
            console.error("Lỗi khi tải xuống:", error);
            toast.error("Lỗi kết nối khi tải tài liệu!");
        }
    };

    const handleDownloadAllDocuments = async () => {
        const docsWithFile = documents.filter(doc => doc.file_url);
        if (docsWithFile.length === 0) return toast.warning("Không có tài liệu nào để tải xuống!");
        
        const isConfirmed = await toast.showConfirm("Bạn muốn tải về tất cả tài liệu của dự án này dưới dạng file nén (.zip) chứ?");
        if (!isConfirmed) return;
        
        toast.success("Đang chuẩn bị file tải xuống, vui lòng đợi...");
        const zip = new JSZip();
        let successCount = 0;
        
        try {
            for (const doc of docsWithFile) {
                const url = `http://127.0.0.1:8000/api/documents/download-file?url=${encodeURIComponent(doc.file_url)}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    toast.warning(`Tài liệu "${doc.document_name}" không tồn tại trên máy chủ, bỏ qua...`);
                    continue;
                }
                
                const blob = await response.blob();
                const extMatch = doc.file_url.match(/\.([^.]+)$/);
                const ext = extMatch ? `.${extMatch[1]}` : "";
                
                // Lọc ký tự đặc biệt khỏi tên file
                let safeName = doc.document_name.replace(/[<>:"\/\\|?*]+/g, '_');
                const fileName = `${safeName}${ext}`;
                zip.file(fileName, blob);
                successCount++;
            }
            
            if (successCount === 0) {
                return toast.error("Không có tập tin nào tải được!");
            }

            const zipContent = await zip.generateAsync({ type: "blob" });
            const projectNameClean = project.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
            
            const urlObj = window.URL.createObjectURL(zipContent);
            const a = document.createElement("a");
            a.href = urlObj;
            a.download = `${projectNameClean}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlObj);
            document.body.removeChild(a);

            toast.success("Tải xuống hoàn tất!");
        } catch (error) {
            console.error("Lỗi khi tạo file zip:", error);
            toast.error("Có lỗi xảy ra khi đóng gói tài liệu!");
        }
    };

    /* ─── MEMBER HANDLERS ─── */
    const handleOpenAddMember = async () => {
        const emps = await getAllEmployees();
        const pos = await getAllProjectPositions();
        setEmployees(emps);
        setPositions(pos);
        setSelectedEmployee("");
        setSelectedPosition("");
        setCustomPosition("");
        setShowMemberModal(true);
    };
    const handleAddMember = async () => {
        if (!selectedEmployee) return toast.warning("Vui lòng chọn nhân viên");
        try {
            await addMember(id, { 
                employee_id: selectedEmployee,
                project_position_id: selectedPosition === "other" ? null : (selectedPosition || null),
                custom_position_name: selectedPosition === "other" ? customPosition : null
            });
            setShowMemberModal(false);
            setCustomPosition("");
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

    const openRequestModal = async () => {
        if (inventoryItems.length === 0) {
            const items = await getAllInventoryItems();
            setInventoryItems(items);
        }
        setRequestItems([]);
        setShowRequestModal(true);
    };

    const handleAddItemToRequest = (e) => {
        const productId = e.target.value;
        if (!productId) return;
        const product = inventoryItems.find(p => p.id === Number(productId));
        if (!product) return;
        
        if (requestItems.find(i => i.product_id === product.id)) {
            toast.error("Vật tư đã có trong danh sách yêu cầu!");
            e.target.value = ""; // Reset select
            return;
        }

        setRequestItems([
            ...requestItems,
            {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                unit: product.unit,
                current_stock: product.current_stock,
                quantity: 1, 
            }
        ]);
        e.target.value = ""; // Reset select
    };

    const handleUpdateQuantityRequest = (productId, qty) => {
        setRequestItems(requestItems.map(item => 
            item.product_id === productId ? { ...item, quantity: parseFloat(qty) || 0 } : item
        ));
    };

    const handleRemoveItemFromRequest = (productId) => {
        setRequestItems(requestItems.filter(item => item.product_id !== productId));
    };

    const handleRequestMaterials = async () => {
        if (requestItems.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 vật tư!");
            return;
        }
        
        const invalidItem = requestItems.find(item => item.quantity <= 0);
        if (invalidItem) {
            toast.error("Số lượng yêu cầu phải lớn hơn 0!");
            return;
        }
        
        setRequesting(true);
        try {
            const payload = {
                export_type: 'TO_PROJECT',
                project_id: id,
                items: requestItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            };
            const res = await requestProjectMaterials(payload);
            if (res.success) {
                toast.success("Đã gửi yêu cầu cấp vật tư thành công! Đang chờ duyệt.");
                setShowRequestModal(false);
                fetchVatTu(); // Refresh the lists
            } else {
                toast.error(res.message || "Lỗi khi gửi yêu cầu!");
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || "Lỗi gửi yêu cầu!");
        } finally {
            setRequesting(false);
        }
    };

    /* ─── CONSTRUCTION LOG HANDLERS ─── */
    const handleOpenLogModal = () => {
        setLogForm({ log_date: new Date().toISOString().split('T')[0], title: '', description: '', weather: '' });
        setLogImages([]);
        setShowLogModal(true);
    };

    const handleLogImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setLogImages(prev => [...prev, ...files]);
    };

    const handleRemoveLogImage = (index) => {
        setLogImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveLog = async () => {
        if (!logForm.log_date) return toast.warning("Vui lòng chọn ngày");
        if (!logForm.description && logImages.length === 0) return toast.warning("Vui lòng nhập mô tả hoặc chọn ảnh");

        setSavingLog(true);
        try {
            const formData = new FormData();
            formData.append('log_date', logForm.log_date);
            formData.append('title', logForm.title || '');
            formData.append('description', logForm.description || '');
            formData.append('weather', logForm.weather || '');
            formData.append('created_by', admin?.full_name || 'Giám sát');

            logImages.forEach((file) => {
                formData.append('images[]', file);
            });

            await createConstructionLog(id, formData);
            setShowLogModal(false);
            toast.success("Đã lưu nhật ký thi công!");
            fetchConstructionLogs();
        } catch (e) {
            toast.error(e?.response?.data?.message || "Lỗi lưu nhật ký");
        } finally {
            setSavingLog(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        const isConfirmed = await toast.showConfirm("Xóa nhật ký này và toàn bộ hình ảnh?");
        if (!isConfirmed) return;
        try {
            await deleteConstructionLog(logId);
            toast.success("Đã xóa nhật ký");
            fetchConstructionLogs();
        } catch (e) {
            toast.error("Lỗi khi xóa nhật ký");
        }
    };

    const handleQuickAddImages = async (logId, files) => {
        if (!files || files.length === 0) return;
        try {
            const formData = new FormData();
            Array.from(files).forEach(f => formData.append('images[]', f));
            await addLogImages(logId, formData);
            toast.success(`Đã thêm ${files.length} ảnh`);
            fetchConstructionLogs();
        } catch (e) {
            toast.error("Lỗi khi thêm ảnh");
        }
    };

    const handleDeleteImage = async (imageId) => {
        const isConfirmed = await toast.showConfirm("Xóa ảnh này?");
        if (!isConfirmed) return;
        try {
            await deleteLogImage(imageId);
            toast.success("Đã xóa ảnh");
            fetchConstructionLogs();
        } catch (e) {
            toast.error("Lỗi khi xóa ảnh");
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
    const expectedEndDateFormatted = project.expected_end_date
        ? new Date(project.expected_end_date).toLocaleDateString("vi-VN", {
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
                <div className="detail-sidebar" style={{ minWidth: '220px', flexShrink: 0 }}>
                    {[
                        { key: "thong-tin", label: "Thông tin chung", icon: "📊" },
                        { key: "phap-ly", label: "Tài liệu", icon: "📄" },
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
                    {/* Thêm style v3 cục bộ cho Kanban */}
                    <style>{`
                        .kb-v3-board { display: flex; gap: 20px; margin-top: 20px; overflow-x: auto; padding-bottom: 20px; }
                        .kb-v3-col { flex: 1; min-width: 280px; background: #f8fafc; border-radius: 20px; padding: 16px; border: 1px solid #e2e8f0; transition: 0.3s; }
                        .kb-v3-col.drag-over { background: #eff6ff; border-color: var(--primary); transform: scale(1.02); }
                        .kb-v3-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 0 4px; }
                        .kb-v3-dot { width: 8px; height: 8px; border-radius: 50%; }
                        .kb-v3-title { font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                        .kb-v3-count { margin-left: auto; font-size: 11px; background: #e2e8f0; color: #64748b; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
                        
                        .kb-v3-task { 
                            background: white; border-radius: 16px; padding: 16px; margin-bottom: 12px; 
                            border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); 
                            cursor: grab; transition: 0.2s; position: relative;
                        }
                        .kb-v3-task:hover { box-shadow: 0 10px 15px rgba(0,0,0,0.05); transform: translateY(-2px); border-color: var(--primary); }
                        .kb-v3-task:active { cursor: grabbing; transform: scale(0.98); opacity: 0.8; }
                        .kb-v3-task.dragging { opacity: 0.4; }
                        
                        .kb-v3-task-name { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: block; line-height: 1.4; }
                        .kb-v3-task-meta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: #94a3b8; font-weight: 600; }
                        .kb-v3-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 4px; opacity: 0; transition: 0.2s; }
                        .kb-v3-task:hover .kb-v3-actions { opacity: 1; }
                        .kb-v3-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                        .kb-v3-btn.edit { background: #eff6ff; color: #2563eb; }
                        .kb-v3-btn.del { background: #fef2f2; color: #ef4444; }
                        .kb-v3-btn:hover { transform: scale(1.1); }
                    `}</style>

                    {/* ═══ TAB: THÔNG TIN CHUNG (DASHBOARD) ═══ */}
                    {activeTab === "thong-tin" && (
                        <div className="dashboard-layout animate-fade-in">
                            <div className="dashboard-left">
                                <section className="info-section">
                                    <div className="section-header">
                                        <h3>Thông tin dự án</h3>
                                        {canEditProject && (
                                            <button className="btn-edit" onClick={() => navigate(`/admin/ho-so/${id}/edit`)}>✎ Sửa thông tin</button>
                                        )}
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
                                            <label>NGÀY HOÀN THÀNH DỰ KIẾN</label>
                                            <p>{expectedEndDateFormatted}</p>
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
                                        <h3>Tài liệu</h3>
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
                                    <div className="kb-v3-board">
                                        {TASK_COLS.map((col) => {
                                            const colTasks = tasks.filter((t) => t.status === col.id);
                                            return (
                                                <div 
                                                    className="kb-v3-col" 
                                                    key={col.id}
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                                    onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); handleDrop(e, col.id); }}
                                                >
                                                    <div className="kb-v3-header">
                                                        <span className="kb-v3-dot" style={{ background: col.color }}></span>
                                                        <span className="kb-v3-title">{col.title}</span>
                                                        <span className="kb-v3-count">{colTasks.length}</span>
                                                    </div>
                                                    <div className="kb-v3-list">
                                                        {colTasks.slice(0, 5).map((t) => (
                                                            <div 
                                                                className="kb-v3-task" 
                                                                key={t.id}
                                                                draggable={canDragKanban ? "true" : "false"}
                                                                onDragStart={canDragKanban ? (e) => handleDragStart(e, t) : undefined}
                                                                style={{ cursor: canDragKanban ? 'grab' : 'default' }}
                                                            >
                                                                <span className="kb-v3-task-name">{t.task_name}</span>
                                                                <div className="kb-v3-task-meta">
                                                                    {t.work_volume > 0 && <span>📊 {t.work_volume} KL</span>}
                                                                    {(() => {
                                                                        if (t.status === "DONE") {
                                                                            return <span style={{ color: '#16a34a', fontWeight: '600' }}>✅ Đã hoàn thành</span>;
                                                                        }
                                                                        if (t.estimated_completion_date && t.estimated_completion_date > 0) {
                                                                            const remainingDays = calculateRemainingDays(t.created_at, t.estimated_completion_date);
                                                                            const isLate = remainingDays < 0;
                                                                            return (
                                                                                <span style={{ color: isLate ? '#ef4444' : '#16a34a', fontWeight: '600' }}>
                                                                                    {isLate ? `🚨 Trễ ${Math.abs(remainingDays)} ngày` : `📅 Còn ${remainingDays} ngày`}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                    <span>#{t.id.toString().slice(-4)}</span>
                                                                </div>
                                                                <div className="kb-v3-actions">
                                                                    <button className="kb-v3-btn edit" onClick={() => handleEditTask(t)}>✎</button>
                                                                    <button className="kb-v3-btn del" onClick={() => handleDeleteTask(t.id)}>🗑</button>
                                                                </div>
                                                            </div>
                                                         ))}
                                                         {colTasks.length > 5 && (
                                                             <div className="kb-v3-more" onClick={() => setActiveTab("tien-do")} style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: '#3b82f6', fontWeight: '700', cursor: 'pointer' }}>
                                                                 +{colTasks.length - 5} công việc khác
                                                             </div>
                                                         )}
                                                     </div>
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

                    {/* ═══ TAB: TÀI LIỆU ═══ */}
                    {activeTab === "phap-ly" && (
                        <section className="document-section animate-fade-in">
                            <div className="section-header">
                                <h3>Danh sách tài liệu dự án</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-add-cat" onClick={handleDownloadAllDocuments} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                        ↓ Tải tất cả
                                    </button>
                                    {canUploadDoc && (
                                    <button className="btn-add-cat" onClick={handleOpenAddDoc} style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                        + Thêm tài liệu
                                    </button>
                                    )}
                                </div>
                            </div>
                            {documents.length > 0 ? (
                                <table className="doc-table">
                                    <thead>
                                        <tr>
                                            <th>TÊN TÀI LIỆU</th>
                                            <th>LOẠI TÀI LIỆU</th>
                                            <th>NGÀY TẢI LÊN</th>
                                            <th>TRẠNG THÁI</th>
                                            <th style={{ textAlign: "center" }}>HÀNH ĐỘNG</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc.id}>
                                                <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '250px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>📄 {doc.document_name}</span>
                                                        {doc.note && <small style={{ color: '#64748b', fontSize: '12px' }}>{doc.note}</small>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#64748b' }}>{doc.document_type?.type_name || "Chưa phân loại"}</span>
                                                </td>
                                                <td>
                                                    {doc.uploaded_at
                                                        ? new Date(doc.uploaded_at).toLocaleDateString(
                                                            "vi-VN",
                                                        )
                                                        : "—"}
                                                </td>
                                                <td style={{ verticalAlign: 'middle' }}>
                                                    <span
                                                        className={doc.file_url ? (STATUS_CLASS[doc.status] || "st-wait") : "st-reject"}
                                                        style={!doc.file_url ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' } : {}}
                                                    >
                                                        {doc.file_url ? (STATUS_LABELS[doc.status] || doc.status) : "Đang thiếu"}
                                                    </span>
                                                </td>
                                                <td className="doc-actions" style={{ verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                                                        {doc.file_url ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewUrl(`http://127.0.0.1:8000${doc.file_url}`)}
                                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: '#e0f2fe', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                                                                    title="Xem"
                                                                    onMouseOver={(e) => e.currentTarget.style.background = '#bae6fd'}
                                                                    onMouseOut={(e) => e.currentTarget.style.background = '#e0f2fe'}
                                                                >
                                                                    <img src="https://cdn-icons-png.flaticon.com/512/159/159604.png" width="18" alt="View" style={{ filter: "opacity(0.8)" }} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownload(doc)}
                                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: '#dcfce7', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                                                                    title="Tải xuống"
                                                                    onMouseOver={(e) => e.currentTarget.style.background = '#bbf7d0'}
                                                                    onMouseOut={(e) => e.currentTarget.style.background = '#dcfce7'}
                                                                >
                                                                    <img src="https://cdn-icons-png.flaticon.com/512/2926/2926214.png" width="18" alt="Download" style={{ filter: "opacity(0.8)" }} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditDoc(doc)}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: '#2563eb', cursor: 'pointer', border: 'none', transition: 'all 0.2s', color: 'white' }}
                                                                title="Tải lên tài liệu mẫu này"
                                                                onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
                                                                onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_upload</span>
                                                                <span style={{ marginLeft: '4px', fontSize: '12px', fontWeight: '600' }}>Tải lên</span>
                                                            </button>
                                                        )}
                                                        {canEditDoc && (
                                                            <button
                                                                style={{ 
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', 
                                                                    background: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? '#f3f4f6' : '#fef3c7', 
                                                                    border: 'none', 
                                                                    cursor: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? 'not-allowed' : 'pointer', 
                                                                    transition: 'all 0.2s',
                                                                    opacity: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? 0.5 : 1
                                                                }}
                                                                title={(doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? "Hồ sơ đã khóa" : "Sửa"}
                                                                onClick={() => {
                                                                    if (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') return;
                                                                    handleOpenEditDoc(doc);
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    if (doc.status !== 'PROCESSING' && doc.status !== 'COMPLETED' && doc.status !== 'REJECTED') {
                                                                        e.currentTarget.style.background = '#fde68a';
                                                                    }
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    if (doc.status !== 'PROCESSING' && doc.status !== 'COMPLETED' && doc.status !== 'REJECTED') {
                                                                        e.currentTarget.style.background = '#fef3c7';
                                                                    }
                                                                }}
                                                            >
                                                                <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" width="18" alt="Edit" style={{ filter: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? "grayscale(1)" : "opacity(0.8)" }} />
                                                            </button>
                                                        )}
                                                        {canDeleteDoc && (
                                                            <button
                                                                style={{ 
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', 
                                                                    background: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? '#f3f4f6' : '#fee2e2', 
                                                                    border: 'none', 
                                                                    cursor: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? 'not-allowed' : 'pointer', 
                                                                    transition: 'all 0.2s',
                                                                    opacity: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? 0.5 : 1
                                                                }}
                                                                title={(doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? "Hồ sơ đã khóa" : "Xóa"}
                                                                onClick={() => {
                                                                    if (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') return;
                                                                    handleDeleteDoc(doc.id);
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    if (doc.status !== 'PROCESSING' && doc.status !== 'COMPLETED' && doc.status !== 'REJECTED') {
                                                                        e.currentTarget.style.background = '#fecaca';
                                                                    }
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    if (doc.status !== 'PROCESSING' && doc.status !== 'COMPLETED' && doc.status !== 'REJECTED') {
                                                                        e.currentTarget.style.background = '#fee2e2';
                                                                    }
                                                                }}
                                                            >
                                                                <img src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png" width="18" alt="Delete" style={{ filter: (doc.status === 'PROCESSING' || doc.status === 'COMPLETED' || doc.status === 'REJECTED') ? "grayscale(1)" : "opacity(0.8)" }} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-text">Chưa có tài liệu nào.</p>
                            )}
                        </section>
                    )}

                    {/* ═══ TAB: NHÂN SỰ & THÀNH VIÊN ═══ */}
                    {activeTab === "nhan-su" && (
                        <section className="members-section animate-fade-in">
                            <div className="section-header">
                                <h3>Thành viên dự án</h3>
                                {canManageMembers && (
                                <button
                                    className="btn-add-member"
                                    onClick={handleOpenAddMember}
                                >
                                    👤+ Thêm thành viên
                                </button>
                                )}
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
                                                {m.title_name || m.position?.title_name || m.project_position_title?.title_name || emp.job_title || "Nhân viên"}
                                            </span>
                                            <h4 className="member-name">{emp.full_name || "—"}</h4>
                                            <p className="member-email">{emp.email || "—"}</p>
                                            <div className="member-footer">
                                                <span className="member-date">
                                                    📞 {emp.phone || "—"}
                                                </span>
                                                {canManageMembers && (
                                                <button
                                                    className="member-menu"
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    title="Xóa thành viên"
                                                >
                                                    🗑
                                                </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {canManageMembers && (
                                <div
                                    className="member-card add-card"
                                    onClick={handleOpenAddMember}
                                >
                                    <span className="add-icon">+</span>
                                    <p>Mời thành viên mới</p>
                                </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ═══ TAB: VẬT TƯ & THIẾT BỊ ═══ */}
                    {activeTab === "vat-tu" && (
                        <section className="equipment-section animate-fade-in">
                            {/* Header section */}
                            <div className="section-header">
                                <h3>Quản lý Vật tư & Thiết bị</h3>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                    {!isProjectCompleted && canManageInventory && (
                                        <button
                                            className="btn-add-member"
                                            onClick={openRequestModal}
                                            style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                                        >
                                            🏗️ Yêu cầu cấp vật tư
                                        </button>
                                    )}
                                    <button
                                        className="btn-add-member"
                                        onClick={fetchVatTu}
                                        disabled={vatTuLoading}
                                        style={{ background: "#475569" }}
                                    >
                                        🔄 Làm mới
                                    </button>
                                    {vatTuItems.length > 0 && !isProjectCompleted && canManageInventory && (
                                        <button
                                            className="btn-add-member"
                                            disabled
                                            style={{ background: "#9ca3af", cursor: "not-allowed" }}
                                            title="Chỉ có thể hoàn trả vật tư khi dự án đã hoàn thành"
                                        >
                                            🔒 Hoàn trả vật tư (Chờ hoàn thành)
                                        </button>
                                    )}
                                    {vatTuItems.length > 0 && isProjectCompleted && canManageInventory && (
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

                            {/* Pending Requests Section */}
                            {pendingRequests.length > 0 && (
                                <div style={{ marginBottom: 30 }}>
                                    <h4 style={{ fontSize: 16, borderBottom: "2px solid #e2e8f0", paddingBottom: 8, marginBottom: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 8 }}>
                                        <span>⏳</span> Vật tư đã yêu cầu (Khởi tạo)
                                    </h4>
                                    <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                                        <table className="doc-table" style={{ minWidth: 720 }}>
                                            <thead>
                                                <tr style={{ background: "#fffbeb" }}>
                                                    <th style={{ width: 140 }}>MÃ PHIẾU YC</th>
                                                    <th>CHI TIẾT VẬT TƯ</th>
                                                    <th>NGÀY YÊU CẦU</th>
                                                    <th style={{ textAlign: "center" }}>TRẠNG THÁI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingRequests.map(req => (
                                                    <tr key={req.id}>
                                                        <td style={{ fontWeight: 600, color: "#92400e" }}>{req.transaction_code}</td>
                                                        <td>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                                {req.details.map(d => (
                                                                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef3c7", padding: "4px 10px", borderRadius: 6, fontSize: 13 }}>
                                                                        <span style={{ fontWeight: 600, color: "#1e293b" }}>📦 {d.product?.name} ({d.product?.sku})</span>
                                                                        <span style={{ fontWeight: 700, color: "#ea580c" }}>{d.quantity} {d.product?.unit}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td style={{ color: "#64748b", fontSize: 13 }}>
                                                            {new Date(req.created_at).toLocaleString("vi-VN")}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                                                Đang chờ duyệt
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                                        Vật tư sẽ hiển thị tại đây khi được kho duyệt yêu cầu cấp vật tư.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 30 }}>
                                    <h4 style={{ fontSize: 16, borderBottom: "2px solid #e2e8f0", paddingBottom: 8, marginBottom: 12, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                                        <span>🏗️</span> Vật tư đang sử dụng
                                    </h4>
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
                                                        {isProjectCompleted && canManageInventory ? (
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
                                </div>
                            )}
                        </section>
                    )}

                    {/* ═══ TAB: TIẾN ĐỘ THI CÔNG (KANBAN) ═══ */}
                    {activeTab === "tien-do" && (
                        <section className="progress-section animate-fade-in">
                            <div className="section-header">
                                <h3>Tiến độ thi công</h3>
                                {canManageTasks && (
                                <button className="btn-add-member" onClick={handleAddTask}>
                                    + Thêm công việc
                                </button>
                                )}
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
                                <div style={{ marginTop: "12px", fontSize: "14px", color: "#2563eb", fontWeight: "600" }}>
                                    📅 Tổng số ngày dự kiến: <span style={{ color: "#0f172a" }}>{tasks.filter(t => t.status !== "DONE").reduce((sum, task) => sum + (task.estimated_completion_date && task.estimated_completion_date > 0 ? task.estimated_completion_date : 0), 0)} ngày</span>
                                </div>
                            </div>

                            {/* Kanban Board v3 Upgrade */}
                            <div className="kb-v3-board" style={{ minHeight: '600px' }}>
                                {TASK_COLS.map((col) => {
                                    const colTasks = tasks.filter((t) => t.status === col.id);
                                    return (
                                        <div
                                            className="kb-v3-col"
                                            key={col.id}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                            onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); handleDrop(e, col.id); }}
                                        >
                                            <div className="kb-v3-header">
                                                <span className="kb-v3-dot" style={{ background: col.color }}></span>
                                                <span className="kb-v3-title">{col.title}</span>
                                                <span className="kb-v3-count">{colTasks.length}</span>
                                            </div>
                                            <div className="kb-v3-list" style={{ minHeight: '400px' }}>
                                                {colTasks.map((task) => (
                                                    <div
                                                        className="kb-v3-task"
                                                        key={task.id}
                                                        draggable={canDragKanban ? "true" : "false"}
                                                        onDragStart={canDragKanban ? (e) => handleDragStart(e, task) : undefined}
                                                        style={{ cursor: canDragKanban ? 'grab' : 'default' }}
                                                    >
                                                        <span className="kb-v3-task-name">{task.task_name}</span>
                                                        <div className="kb-v3-task-meta">
                                                            {task.work_volume > 0 && <span>📊 Khối lượng: {task.work_volume}</span>}
                                                            {(() => {
                                                                if (task.status === "DONE") {
                                                                    return <span style={{ color: '#16a34a', fontWeight: '600' }}>✅ Đã hoàn thành</span>;
                                                                }
                                                                if (task.estimated_completion_date && task.estimated_completion_date > 0) {
                                                                    const remainingDays = calculateRemainingDays(task.created_at, task.estimated_completion_date);
                                                                    const isLate = remainingDays < 0;
                                                                    return (
                                                                        <span style={{ color: isLate ? '#ef4444' : '#16a34a', fontWeight: '600' }}>
                                                                            {isLate ? `🚨 Trễ ${Math.abs(remainingDays)} ngày` : `📅 Còn ${remainingDays} ngày`}
                                                                        </span>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            <span>ID: #{task.id}</span>
                                                        </div>
                                                        <div className="kb-v3-actions">
                                                            {canManageTasks && (
                                                            <button className="kb-v3-btn edit" onClick={() => handleEditTask(task)}>✎</button>
                                                            )}
                                                            {canDeleteTasks && (
                                                            <button className="kb-v3-btn del" onClick={() => handleDeleteTask(task.id)}>🗑</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {colTasks.length === 0 && (
                                                    <div style={{ padding: '60px 10px', textAlign: 'center', color: '#cbd5e1', border: '2px dashed #e2e8f0', borderRadius: '16px', fontSize: '13px' }}>
                                                        Chưa có công việc
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ═══ NHẬT KÝ THI CÔNG ═══ */}
                            <div style={{ marginTop: '48px', borderTop: '2px solid #e2e8f0', paddingTop: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>📸 Nhật ký thi công</h3>
                                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>Ghi lại tiến độ hàng ngày bằng hình ảnh và mô tả</p>
                                    </div>
                                    {canManageLogs && (
                                        <button className="btn-add-member" onClick={handleOpenLogModal}>
                                            + Thêm nhật ký
                                        </button>
                                    )}
                                </div>

                                {logsLoading && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Đang tải nhật ký...</p>}

                                {!logsLoading && constructionLogs.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                                        <span style={{ fontSize: '48px' }}>📋</span>
                                        <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '14px' }}>Chưa có nhật ký thi công nào được ghi lại.</p>
                                        {canManageLogs && (
                                            <button onClick={handleOpenLogModal} style={{ marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                                Tạo nhật ký đầu tiên
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!logsLoading && constructionLogs.length > 0 && (
                                    <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                        {/* Timeline line */}
                                        <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '3px', background: 'linear-gradient(to bottom, #2563eb, #93c5fd)', borderRadius: '10px' }}></div>

                                        {constructionLogs.map((log, idx) => (
                                            <div key={log.id} style={{ position: 'relative', marginBottom: '32px' }}>
                                                {/* Timeline dot */}
                                                <div style={{ position: 'absolute', left: '-27px', top: '8px', width: '14px', height: '14px', background: idx === 0 ? '#2563eb' : '#93c5fd', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 0 3px ' + (idx === 0 ? '#2563eb30' : '#93c5fd30') }}></div>

                                                {/* Log card */}
                                                <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: '0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>
                                                                    📅 {new Date(log.log_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </span>
                                                                {log.weather && (
                                                                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>
                                                                        {log.weather}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {log.title && <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{log.title}</h4>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            {canManageLogs && (
                                                                <>
                                                                    <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        📷 Thêm ảnh
                                                                        <input type="file" hidden multiple accept="image/*" onChange={(e) => handleQuickAddImages(log.id, e.target.files)} />
                                                                    </label>
                                                                    <button onClick={() => handleDeleteLog(log.id)} style={{ padding: '6px 10px', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {log.description && (
                                                        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{log.description}</p>
                                                    )}

                                                    {/* Photo grid */}
                                                    {log.images && log.images.length > 0 && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '12px' }}>
                                                            {log.images.map((img) => (
                                                                <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                                                                    <img
                                                                        src={`http://127.0.0.1:8000${img.image_url}`}
                                                                        alt={img.caption || 'Ảnh thi công'}
                                                                        onClick={() => setLightboxImage(img)}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }}
                                                                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                                    />
                                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '8px', color: '#fff', fontSize: '10px', fontWeight: '600' }}>
                                                                        {img.taken_at ? new Date(img.taken_at).toLocaleString('vi-VN') : ''}
                                                                    </div>
                                                                    {canManageTasks && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                                                            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}
                                                                        >✕</button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '16px' }}>
                                                        <span>👷 {log.created_by || 'Giám sát'}</span>
                                                        <span>📷 {log.images?.length || 0} ảnh</span>
                                                        <span>🕐 {new Date(log.created_at).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                        <div className="form-group">
                            <label>Ngày dự kiến hoàn thành (số ngày)</label>
                            <input
                                className="form-input"
                                type="number"
                                placeholder="0"
                                value={taskForm.estimated_completion_date}
                                onChange={(e) =>
                                    setTaskForm({ ...taskForm, estimated_completion_date: e.target.value })
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
                                        {emp.full_name} - {emp.role_name || "N/A"}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Vai trò trong dự án (Tùy chọn)</label>
                            <select
                                className="form-input"
                                value={selectedPosition}
                                onChange={(e) => setSelectedPosition(e.target.value)}
                            >
                                <option value="">— Mặc định —</option>
                                {positions.map((pos) => (
                                    <option key={pos.id} value={pos.id}>
                                        {pos.title_name}
                                    </option>
                                ))}
                                <option value="other">✎ Khác (Tự nhập)...</option>
                            </select>
                        </div>
                        {selectedPosition === "other" && (
                            <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                                <label>Nhập vai trò mới</label>
                                <input 
                                    className="form-input"
                                    placeholder="VD: Kiến trúc sư trưởng, Giám sát..."
                                    value={customPosition}
                                    onChange={(e) => setCustomPosition(e.target.value)}
                                />
                            </div>
                        )}
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
            {/* Modal Tài liệu */}
            {showDocModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '450px' }}>
                        <h4 className="modal-title" style={{ marginBottom: '20px', fontSize: '20px' }}>
                            {editDocId ? "Sửa thông tin tài liệu" : "Tải tài liệu mới lên"}
                        </h4>
                        <form onSubmit={handleSaveDoc}>
                            <div className="form-group">
                                <label>Tên tài liệu <span style={{ color: "red" }}>*</span></label>
                                <input required className="form-control" name="document_name" placeholder="Nhập tên tài liệu..." value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Loại tài liệu <span style={{ color: "red" }}>*</span></label>
                                <select required className="form-control" name="document_type_id" value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value})}>
                                    <option value="">-- Chọn loại --</option>
                                    {docTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú (nếu có)</label>
                                <input className="form-control" name="note" placeholder="VD: Bản vẽ kỹ thuật móng..." value={docForm.note} onChange={e => setDocForm({...docForm, note: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chọn file tài liệu {editDocId && "(Để trống nếu không đổi)"} {!editDocId && <span style={{ color: "red" }}>*</span>}</label>
                                <input type="file" required={!editDocId} className="form-control" style={{ padding: '8px' }} onChange={e => setDocForm({...docForm, file: e.target.files[0]})} />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '20px', padding: '0' }}>
                                <button type="button" className="btn-cancel" onClick={() => setShowDocModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-submit-form" style={{ background: '#2563eb', padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={docUploading}>
                                    {docUploading ? "Đang xử lý..." : (editDocId ? "Lưu thay đổi" : "Tải lên hệ thống")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Preview Document */}
            {previewUrl && (
                <div className="modal-overlay" style={{ zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '80%', height: '85%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <button 
                            onClick={() => { setPreviewUrl(null); setPreviewScale(1); }} 
                            style={{ position: 'absolute', top: '15px', right: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        >
                            ✕
                        </button>
                        
                        {previewUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?|#|$)/i) ? (
                            <>
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', background: '#e2e8f0' }}>
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '100%', 
                                            objectFit: 'contain', 
                                            transform: `scale(${previewScale})`,
                                            transition: 'transform 0.2s ease-in-out',
                                            transformOrigin: 'center center'
                                        }} 
                                    />
                                </div>
                                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: 'rgba(15, 23, 42, 0.8)', padding: '10px 20px', borderRadius: '30px', zIndex: 1001, alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
                                    <button onClick={() => setPreviewScale(s => Math.max(s - 0.25, 0.25))} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', outline: 'none', padding: '0 5px' }}>-</button>
                                    <span style={{ color: 'white', display: 'flex', alignItems: 'center', fontWeight: 'bold', minWidth: '45px', justifyContent: 'center' }}>{Math.round(previewScale * 100)}%</span>
                                    <button onClick={() => setPreviewScale(1)} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '18px', cursor: 'pointer', outline: 'none', padding: '0 5px' }}>↻</button>
                                    <button onClick={() => setPreviewScale(s => Math.min(s + 0.25, 5))} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', outline: 'none', padding: '0 5px' }}>+</button>
                                </div>
                            </>
                        ) : (
                            <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none', background: '#f8fafc' }} title="Document Preview" />
                        )}
                    </div>
                </div>
            )}

            {/* Modal Yêu cầu cấp vật tư */}
            {showRequestModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !requesting) setShowRequestModal(false);
                    }}
                >
                    <div className="modal-box" style={{ maxWidth: 700, width: "95vw" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <span style={{ fontSize: 26 }}>🏗️</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>Yêu cầu cấp vật tư cho dự án</h3>
                                <p style={{ margin: 0, fontSize: 12, color: "#64748b", marginTop: 3 }}>
                                    Chọn vật tư từ kho để gửi yêu cầu cấp phát. Phiếu sẽ được chuyển cho quản lý kho duyệt.
                                </p>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ fontWeight: 600 }}>Thêm vật tư vào yêu cầu</label>
                            <select
                                className="form-input"
                                onChange={handleAddItemToRequest}
                                defaultValue=""
                            >
                                <option value="">— Tìm và chọn vật tư —</option>
                                {inventoryItems.filter(p => !requestItems.some(req => req.product_id === p.id)).map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku}) - Tồn thực tế: {p.current_stock} {p.unit}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {requestItems.length > 0 ? (
                            <div style={{
                                border: "1px solid #e2e8f0", borderRadius: 10,
                                overflow: "hidden", marginBottom: 16
                            }}>
                                <div style={{
                                    background: "#f8fafc", padding: "10px 14px",
                                    borderBottom: "1px solid #e2e8f0",
                                    fontSize: 12, fontWeight: 600, color: "#64748b",
                                    display: "grid",
                                    gridTemplateColumns: "1fr 100px 100px 50px",
                                    gap: 8
                                }}>
                                    <span>TÊN VẬT TƯ</span>
                                    <span style={{ textAlign: "center" }}>TỒN KHO</span>
                                    <span style={{ textAlign: "center" }}>SỐ LƯỢNG YC</span>
                                    <span></span>
                                </div>
                                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                                    {requestItems.map((item, idx) => (
                                        <div
                                            key={item.product_id}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 100px 100px 50px",
                                                gap: 8,
                                                padding: "10px 14px",
                                                alignItems: "center",
                                                borderBottom: idx < requestItems.length - 1 ? "1px solid #f1f5f9" : "none",
                                                background: idx % 2 === 0 ? "#fff" : "#fafafa"
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                                                    {item.sku} • {item.unit}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>
                                                {item.current_stock}
                                            </div>
                                            <div style={{ textAlign: "center" }}>
                                                <input
                                                    type="number"
                                                    min={0.01}
                                                    step={0.01}
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantityRequest(item.product_id, e.target.value)}
                                                    max={item.current_stock} // optional: limit to current_stock
                                                    style={{
                                                        width: 80, padding: "6px",
                                                        textAlign: "center", border: "1.5px solid #e2e8f0",
                                                        borderRadius: 6, fontSize: 13, outline: "none"
                                                    }}
                                                />
                                            </div>
                                            <div style={{ textAlign: "center" }}>
                                                <button
                                                    onClick={() => handleRemoveItemFromRequest(item.product_id)}
                                                    style={{
                                                        background: "none", border: "none", color: "#ef4444",
                                                        cursor: "pointer", fontSize: 16
                                                    }}
                                                    title="Xóa"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "30px", background: "#f8fafc", borderRadius: 10, border: "2px dashed #e2e8f0", marginBottom: 16 }}>
                                <p style={{ color: "#94a3b8", fontSize: 14 }}>Chưa có vật tư nào được chọn.</p>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowRequestModal(false)}
                                disabled={requesting}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-submit"
                                disabled={requesting || requestItems.length === 0}
                                style={{
                                    background: (requesting || requestItems.length === 0)
                                        ? "#9ca3af"
                                        : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                                    cursor: (requesting || requestItems.length === 0) ? "not-allowed" : "pointer"
                                }}
                                onClick={handleRequestMaterials}
                            >
                                {requesting ? "⏳ Đang gửi..." : "✔ Gửi yêu cầu"}
                            </button>
                        </div>
            {/* Modal Yêu Cầu Vật Tư... */}
            {/* ... Modal Yêu Cầu Vật Tư ... (This is replaced dynamically by your tool logic, doing an inner replacement is tricky, so I'll replace the very end) */}
                    </div>
                </div>
            )}

            {/* Modal Thêm Nhật Ký Thi Công */}
            {showLogModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setShowLogModal(false);
                    }}
                >
                    <div className="modal-box" style={{ maxWidth: 600 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 20 }}>Tạo Nhật Ký Mới</h3>
                            <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="form-group">
                            <label>Ngày ghi nhận</label>
                            <input
                                type="date"
                                className="form-input"
                                value={logForm.log_date}
                                onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Tiêu đề (tuỳ chọn)</label>
                                <input
                                    className="form-input"
                                    placeholder="Vd: Đổ bê tông móng..."
                                    value={logForm.title}
                                    onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Thời tiết (tuỳ chọn)</label>
                                <input
                                    className="form-input"
                                    placeholder="Vd: Nắng đẹp, Mưa dông..."
                                    value={logForm.weather}
                                    onChange={(e) => setLogForm({ ...logForm, weather: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Mô tả công việc</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                placeholder="Ghi chú chi tiết công việc đã thực hiện..."
                                value={logForm.description}
                                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label>Hình ảnh đính kèm</label>
                            <div style={{ padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }} onClick={() => logFileInputRef.current.click()}>
                                <span style={{ fontSize: '24px' }}>📸</span>
                                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>Click để tải ảnh lên (Hỗ trợ chọn nhiều file)</p>
                                <input type="file" ref={logFileInputRef} hidden multiple accept="image/*" onChange={handleLogImageSelect} />
                            </div>
                            
                            {logImages.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                                    {logImages.map((file, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                                            <button onClick={() => handleRemoveLogImage(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 10, cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ marginTop: 24 }}>
                            <button className="btn-cancel" onClick={() => setShowLogModal(false)} disabled={savingLog}>Hủy</button>
                            <button className="btn-submit" onClick={handleSaveLog} disabled={savingLog}>
                                {savingLog ? "Đang lưu..." : "Lưu nhật ký"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Xem ảnh */}
            {lightboxImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxImage(null)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setLightboxImage(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}>&times;</button>
                        {canManageLogs && (
                            <button
                                onClick={() => handleDeleteImage(lightboxImage.id)}
                                style={{ position: 'absolute', top: -40, left: 0, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🗑 Xóa ảnh này
                            </button>
                        )}
                        <img src={`http://127.0.0.1:8000${lightboxImage.image_url}`} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} alt="Phóng to" />
                        {(lightboxImage.caption || lightboxImage.taken_at) && (
                            <div style={{ position: 'absolute', bottom: -40, left: 0, right: 0, color: '#fff', textAlign: 'center', padding: '10px' }}>
                                {lightboxImage.caption && <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{lightboxImage.caption}</p>}
                                {lightboxImage.taken_at && <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>{new Date(lightboxImage.taken_at).toLocaleString('vi-VN')}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
