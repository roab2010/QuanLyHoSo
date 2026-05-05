import React, { useState, useEffect } from "react";
import api from "./api"; // Axios instance
import { useToast } from "./Toast";
import { ShieldCheck, UserPlus, Users, Settings2, Search, Plus, Palette, ArrowLeft, ChevronRight, Check, Save, RotateCcw, Mail, Phone, Briefcase, Hash, Info, UserCheck, Trash2 } from 'lucide-react';

export default function QuanLyNhanVien({ admin }) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("members"); // "members" | "roles"
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Role Management State
    const [selectedRole, setSelectedRole] = useState(null);
    const [editRoleData, setEditRoleData] = useState(null); 
    const [roleDetailTab, setRoleDetailTab] = useState("display");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State for New Employee
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberFormData, setMemberFormData] = useState({ full_name: "", email: "", phone: "", role_id: "" });
    const [submitting, setSubmitting] = useState(false);

    // Modal State for Employee Details
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeProjects, setEmployeeProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Permission Check
    const userPermissions = React.useMemo(() => {
        try {
            return JSON.parse(admin?.permissions || '[]');
        } catch (e) {
            return [];
        }
    }, [admin]);

    const hasPermission = (permKey) => {
        if (!admin) return false;
        if (admin.role === 'admin') return true;
        // Exact match
        if (userPermissions.includes(permKey)) return true;
        // Prefix match: hasPermission("projects") matches "projects.view", "projects.edit", etc.
        if (!permKey.includes('.')) {
            return userPermissions.some(p => p.startsWith(permKey + '.'));
        }
        return false;
    };

    if (!hasPermission("hr")) {
        return (
            <div style={{ padding: "80px", textAlign: "center", background: "#f8fafc", height: "100%" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <ShieldCheck size={40} />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Truy cập bị từ chối</h2>
                <p style={{ color: "#64748b", fontWeight: "500" }}>Bạn không có quyền truy cập vào khu vực Quản lý nhân sự.</p>
            </div>
        );
    }

    // Cấu hình PREMIUM font: Áp dụng Be Vietnam Pro cho toàn bộ trang
    const FONT_PREMIUM = "'Be Vietnam Pro', sans-serif";

    const PERMISSION_GROUPS = [
        {
            group: "📁 Hồ sơ dự án",
            modules: [
                { id: "projects.view", name: "Xem dự án", desc: "Xem danh sách và chi tiết các hồ sơ dự án công trình." },
                { id: "projects.create", name: "Tạo dự án mới", desc: "Khởi tạo hồ sơ công trình mới vào hệ thống." },
                { id: "projects.edit", name: "Chỉnh sửa dự án", desc: "Sửa thông tin, cập nhật tiến độ và trạng thái hồ sơ." },
                { id: "projects.delete", name: "Xóa dự án", desc: "Xóa vĩnh viễn hồ sơ dự án khỏi hệ thống. Hành động nguy hiểm." },
            ]
        },
        {
            group: "📂 Danh mục dự án",
            modules: [
                { id: "categories.view", name: "Xem danh mục", desc: "Xem danh sách các loại danh mục dự án." },
                { id: "categories.manage", name: "Thêm/Sửa danh mục", desc: "Tạo mới hoặc chỉnh sửa thông tin danh mục dự án." },
                { id: "categories.delete", name: "Xóa danh mục", desc: "Xóa danh mục dự án. Hành động nguy hiểm." },
            ]
        },
        {
            group: "📄 Tài liệu",
            modules: [
                { id: "documents.view", name: "Xem & Tải tài liệu", desc: "Xem và tải xuống các tài liệu pháp lý, kỹ thuật." },
                { id: "documents.upload", name: "Tải lên tài liệu", desc: "Upload tài liệu mới vào hồ sơ dự án." },
                { id: "documents.edit", name: "Chỉnh sửa tài liệu", desc: "Sửa thông tin, cập nhật lại nội dung tài liệu." },
                { id: "documents.delete", name: "Xóa tài liệu", desc: "Xóa tài liệu khỏi hệ thống. Hành động nguy hiểm." },
            ]
        },
        {
            group: "📦 Kho & Vật tư",
            modules: [
                { id: "inventory.view", name: "Xem kho", desc: "Xem tồn kho, danh sách vật tư và thiết bị." },
                { id: "inventory.manage", name: "Nhập/Xuất kho", desc: "Thực hiện nhập xuất vật tư, duyệt yêu cầu cấp phát." },
                { id: "inventory.delete", name: "Xóa vật tư", desc: "Xóa sản phẩm/vật tư khỏi hệ thống kho." },
            ]
        },
        {
            group: "🏭 Nhà cung cấp",
            modules: [
                { id: "suppliers.view", name: "Xem nhà cung cấp", desc: "Xem danh sách nhà cung cấp và bảng giá." },
                { id: "suppliers.manage", name: "Thêm/Sửa NCC", desc: "Thêm mới, cập nhật thông tin nhà cung cấp." },
                { id: "suppliers.delete", name: "Xóa nhà cung cấp", desc: "Xóa nhà cung cấp khỏi hệ thống." },
            ]
        },
        {
            group: "👥 Nhân sự",
            modules: [
                { id: "hr.view", name: "Xem nhân viên", desc: "Xem danh sách nhân viên và thông tin cơ bản." },
                { id: "hr.manage", name: "Thêm/Sửa nhân viên", desc: "Cấp phát tài khoản, cập nhật thông tin nhân viên." },
                { id: "hr.roles", name: "Quản lý chức vụ", desc: "Tạo, sửa chức vụ và phân quyền hệ thống. Chỉ dành cho cấp quản lý." },
                { id: "hr.delete", name: "Xóa nhân viên", desc: "Xóa nhân viên và thu hồi tài khoản. Hành động nguy hiểm." },
            ]
        },
        {
            group: "🤝 Khách hàng",
            modules: [
                { id: "customers.view", name: "Xem khách hàng", desc: "Xem danh sách và thông tin khách hàng." },
                { id: "customers.manage", name: "Thêm/Sửa khách hàng", desc: "Cập nhật thông tin, tạo tài khoản khách hàng mới." },
            ]
        },
        {
            group: "⚙️ Vận hành",
            modules: [
                { id: "kanban.drag", name: "Kéo thả Kanban", desc: "Thay đổi trạng thái tiến độ trên bảng Kanban." },
                { id: "tasks.manage", name: "Quản lý công việc", desc: "Thêm, sửa công việc trong dự án." },
                { id: "tasks.delete", name: "Xóa công việc", desc: "Xóa công việc khỏi dự án." },
                { id: "logs.manage", name: "Quản lý nhật ký thi công", desc: "Thêm, xóa nhật ký thi công và hình ảnh tiến độ." },
                { id: "members.manage", name: "Quản lý thành viên", desc: "Phân công, gỡ thành viên khỏi dự án." },
            ]
        },
        {
            group: "🔒 Hệ thống",
            modules: [
                { id: "system_log.view", name: "Nhật ký hệ thống", desc: "Xem lịch sử hoạt động và nhật ký kiểm toán toàn hệ thống." },
            ]
        },
    ];

    // Flatten for backward compatibility
    const ALL_MODULES = PERMISSION_GROUPS.flatMap(g => g.modules);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, roleRes, docTypesRes] = await Promise.all([
                api.get("/manage/employees"),
                api.get("/roles"),
                api.get("/workflow/document-types")
            ]);
            setEmployees(empRes.data || []);
            const fetchedRoles = roleRes.data || [];
            setRoles(fetchedRoles);
            
            // Lọc ra các loại tài liệu có quy trình
            const validDocTypes = (docTypesRes.data || []).filter(dt => dt.assigned_workflow_id);
            setDocumentTypes(validDocTypes);
            
            if (fetchedRoles.length > 0 && !selectedRole) {
                const initialRole = fetchedRoles[0];
                handleSelectRole(initialRole);
            }
        } catch (error) {
            console.error("Lỗi fetch data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectRole = async (role, force = false) => {
        if (!force && hasChanges()) {
            const confirmed = await toast.showConfirm("Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất thay đổi?");
            if (!confirmed) return;
        }

        let globalDocTypeIds = [];
        if (role.id !== 'temp') {
            try {
                const res = await api.get(`/workflow/approvers?scope_type=global&role_id=${role.id}`);
                globalDocTypeIds = (res.data?.data || []).map(a => a.document_type_id);
            } catch(e) {
                console.error("Lỗi fetch approvers:", e);
            }
        }

        setSelectedRole(role);
        setEditRoleData({
            ...role,
            isNew: role.id === 'temp',
            permissions: role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [],
            global_document_type_ids: globalDocTypeIds,
            originalGlobalDocTypeIds: globalDocTypeIds
        });
    };

    const handleReset = async () => {
        if (editRoleData?.isNew) {
            const confirmed = await toast.showConfirm("Huỷ bỏ chức vụ mới đang tạo?");
            if (!confirmed) return;
            setRoles(roles.filter(r => r.id !== 'temp'));
            const first = roles.find(r => r.id !== 'temp');
            handleSelectRole(first, true);
            return;
        }
        handleSelectRole(selectedRole, true);
    };

    const handleSaveRole = async () => {
        if (!editRoleData) return;
        setSubmitting(true);
        try {
            if (editRoleData.isNew) {
                await api.post("/roles", {
                    name: editRoleData.name,
                    color: editRoleData.color,
                    permissions: editRoleData.permissions,
                    global_document_type_ids: editRoleData.global_document_type_ids || []
                });
            } else {
                await api.put(`/roles/${editRoleData.id}`, {
                    name: editRoleData.name,
                    color: editRoleData.color,
                    permissions: editRoleData.permissions,
                    global_document_type_ids: editRoleData.global_document_type_ids || []
                });
            }
            // Refresh
            const roleRes = await api.get("/roles");
            const freshRoles = roleRes.data || [];
            setRoles(freshRoles);
            
            const updated = freshRoles.find(r => r.name === editRoleData.name);
            handleSelectRole(updated, true);
            toast.success("Lưu chức vụ thành công!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi khi lưu");
        }
        setSubmitting(false);
    };

    const handleDeleteRole = async (roleId) => {
        const confirmed = await toast.showConfirm("Bạn có chắc chắn muốn xoá chức vụ này?");
        if (!confirmed) return;
        try {
            const res = await api.delete(`/roles/${roleId}`);
            if (res.status === 200) {
                toast.success("Xoá chức vụ thành công");
                if (editRoleData && editRoleData.id === roleId) {
                    setEditRoleData(null);
                }
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi khi xoá chức vụ");
        }
    };

    const handleCreateRole = async () => {
        if (roles.find(r => r.id === 'temp')) return;
        
        if (hasChanges()) {
            const confirmed = await toast.showConfirm("Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất thay đổi?");
            if (!confirmed) return;
        }

        const newRole = {
            id: 'temp',
            name: "New chức vụ",
            color: "#3b82f6",
            permissions: [],
            global_document_type_ids: [],
            isNew: true
        };
        
        setRoles([...roles, newRole]);
        setSelectedRole(newRole);
        setEditRoleData({...newRole, permissions: [], global_document_type_ids: []});
        setRoleDetailTab("display");
    };

    const togglePermission = (moduleId) => {
        if (editRoleData.name === 'admin' && !editRoleData.isNew) return;
        const current = [...editRoleData.permissions];
        const newPerms = current.includes(moduleId) 
            ? current.filter(id => id !== moduleId) 
            : [...current, moduleId];
        setEditRoleData({ ...editRoleData, permissions: newPerms });
    };

    const toggleGlobalDocType = (dtId) => {
        if (editRoleData.name === 'admin' && !editRoleData.isNew) return;
        const current = [...(editRoleData.global_document_type_ids || [])];
        const newTypes = current.includes(dtId)
            ? current.filter(id => id !== dtId)
            : [...current, dtId];
        setEditRoleData({ ...editRoleData, global_document_type_ids: newTypes });
    };

    const toggleGroupGlobalDocTypes = (groupDocs) => {
        if (editRoleData.name === 'admin' && !editRoleData.isNew) return;
        const groupDocIds = groupDocs.map(dt => dt.id);
        const current = [...(editRoleData.global_document_type_ids || [])];
        const allSelected = groupDocIds.every(id => current.includes(id));
        let newTypes;
        if (allSelected) {
            newTypes = current.filter(id => !groupDocIds.includes(id));
        } else {
            newTypes = [...new Set([...current, ...groupDocIds])];
        }
        setEditRoleData({ ...editRoleData, global_document_type_ids: newTypes });
    };

    const hasChanges = () => {
        if (!selectedRole || !editRoleData) return false;
        if (editRoleData.isNew) return true;

        const parsedOrig = selectedRole.permissions ? (typeof selectedRole.permissions === 'string' ? JSON.parse(selectedRole.permissions).sort() : selectedRole.permissions.sort()) : [];
        const originalPerms = JSON.stringify(parsedOrig);
        const currentPerms = JSON.stringify([...editRoleData.permissions].sort());
        
        // selectedRole không chứa global_document_type_ids (vì fetch lúc sau), 
        // nhưng ta có thể tạm bỏ qua check changes phức tạp cho phần global doc bằng cách so sánh state ban đầu.
        // Để đơn giản, ta chỉ compare role base changes nếu cần. 
        // Vì global doc_types load riêng nên khó compare chính xác trừ khi ta lưu lại originalDocTypeIds.
        // Tạm mượn trick: nếu editRoleData.global_document_type_ids thay đổi so với originalGlobalDocTypeIds thì return true.
        // Do đó ta sẽ thêm 1 property "originalGlobalDocTypeIds" vào editRoleData ngay khi load. 
        const origDocs = JSON.stringify([...(editRoleData.originalGlobalDocTypeIds || [])].sort());
        const currDocs = JSON.stringify([...(editRoleData.global_document_type_ids || [])].sort());

        return selectedRole.name !== editRoleData.name || 
               selectedRole.color !== editRoleData.color || 
               originalPerms !== currentPerms ||
               origDocs !== currDocs;
    };

    const handleSaveMember = async () => {
        if (!memberFormData.full_name || !memberFormData.email || !memberFormData.role_id) {
            toast.warning("Vui lòng điền đủ thông tin bắt buộc");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/manage/employees", memberFormData);
            setShowMemberModal(false);
            setMemberFormData({ full_name: "", email: "", phone: "", role_id: "" });
            fetchData();
            toast.success("Thêm nhân viên và cấp tài khoản thành công!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi khi lưu");
        }
        setSubmitting(false);
    };

    const handleDeleteEmployee = async (id, name, e) => {
        if (e) e.stopPropagation();
        const confirmed = await toast.showConfirm(`Bạn có chắc chắn muốn xóa nhân viên "${name}"? Thao tác này sẽ xóa cả tài khoản đăng nhập và không thể hoàn tác.`);
        if (!confirmed) return;

        try {
            const res = await api.delete(`/manage/employees/${id}`);
            if (res.status === 200) {
                toast.success("Xóa nhân viên thành công");
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa nhân viên");
        }
    };

    const handleOpenEmployeeDetails = async (emp) => {
        setSelectedEmployee(emp);
        setShowEmployeeModal(true);
        setLoadingProjects(true);
        try {
            const { data } = await api.get(`/manage/employees/${emp.id}/projects`);
            setEmployeeProjects(data || []);
        } catch (error) {
            toast.error("Lỗi khi tải thông tin dự án của nhân viên");
            setEmployeeProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleUpdateEmployeeRole = async (empId, newRoleId) => {
        try {
            const res = await api.put(`/manage/employees/${empId}`, { role_id: newRoleId });
            if (res.status === 200) {
                toast.success('Cập nhật chức vụ thành công!');
                // Update local list
                fetchData();
                
                // Update selected employee object to reflect change in the current open modal
                const updatedRole = roles.find(r => String(r.id) === String(newRoleId));
                setSelectedEmployee(prev => ({
                    ...prev,
                    role_id: newRoleId,
                    role_name: updatedRole ? updatedRole.name : prev.role_name,
                    role_color: updatedRole ? updatedRole.color : prev.role_color
                }));
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi cập nhật chức vụ');
        }
    };

    const STATUS_COLORS = {
        'Chờ duyệt': { bg: '#fee2e2', color: '#dc2626' },
        'Đang xử lý': { bg: '#ffedd5', color: '#ea580c' },
        'Hoàn thành': { bg: '#dcfce7', color: '#16a34a' },
        'DRAFT': { bg: '#fee2e2', color: '#dc2626' },
        'PROCESSING': { bg: '#ffedd5', color: '#ea580c' },
        'DONE': { bg: '#dcfce7', color: '#16a34a' }
    };

    const Switch = ({ checked, onChange, disabled }) => (
        <div 
            onClick={() => !disabled && onChange()}
            style={{
                width: '44px', height: '26px', borderRadius: '13px',
                background: checked ? '#10b981' : '#e2e8f0',
                position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: disabled ? 0.6 : 1,
                border: checked ? 'none' : '2px solid #cbd5e1'
            }}
        >
            <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: checked ? '4px' : '2px', left: checked ? '22px' : '2px',
                transition: 'all 0.2s'
            }} />
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', position: 'relative', fontFamily: FONT_PREMIUM }}>
            
            <div style={{ background: '#ffffff', padding: '0 40px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '32px', height: '100%' }}>
                    <button onClick={() => setActiveTab("members")} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '700', color: activeTab === 'members' ? '#0f172a' : '#94a3b8', cursor: 'pointer', borderBottom: activeTab === 'members' ? '4px solid #0f172a' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontFamily: FONT_PREMIUM }}>
                        <Users size={18} /> NHÂN VIÊN
                    </button>
                    {hasPermission("hr.roles") && (
                    <button onClick={() => setActiveTab("roles")} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '700', color: activeTab === 'roles' ? '#0f172a' : '#94a3b8', cursor: 'pointer', borderBottom: activeTab === 'roles' ? '4px solid #0f172a' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontFamily: FONT_PREMIUM }}>
                        <ShieldCheck size={18} /> CHỨC VỤ HỆ THỐNG
                    </button>
                    )}
                </div>
                {activeTab === 'members' && hasPermission("hr.manage") && (
                    <button className="btn-submit" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowMemberModal(true)}>
                        <UserPlus size={18} /> THÊM NHÂN VIÊN
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                {activeTab === "members" ? (
                    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                            {employees.map(emp => (
                                <div key={emp.id} onClick={() => handleOpenEmployeeDetails(emp)} style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: emp.role_color || '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px', overflow: 'hidden' }}>
                                                {emp.image ? (
                                                    <img src={emp.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    emp.full_name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '18px' }}>{emp.full_name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>@{emp.username || 'Chưa cập nhật'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ background: (emp.role_color || '#94a3b8') + '20', color: emp.role_color || '#64748b', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                                                {emp.role_name || 'KHÔNG CÓ QUYỀN'}
                                            </div>
                                            {emp.role_name !== 'admin' && hasPermission("hr.delete") && (
                                                <button 
                                                    onClick={(e) => handleDeleteEmployee(emp.id, emp.full_name, e)}
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', zIndex: 10 }}
                                                    title="Xóa nhân viên"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f8fafc', paddingTop: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                            <Hash size={16} color="#94a3b8" /> {emp.employee_code}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                            <Mail size={16} color="#94a3b8" /> {emp.email || 'Chưa cập nhật'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                            <Phone size={16} color="#94a3b8" /> {emp.phone || 'Chưa cập nhật'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', background: '#fff', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '24px' }}><span style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>DANH SÁCH CHỨC VỤ</span></div>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {roles.map(r => (
                                    <div key={r.id} onClick={() => handleSelectRole(r)} style={{ padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: selectedRole?.id === r.id ? '#0f172a' : 'transparent', color: selectedRole?.id === r.id ? '#ffffff' : '#475569', transition: 'all 0.2s', fontWeight: '700', fontSize: '15px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color || '#94a3b8' }} />
                                        <span style={{ textTransform: 'capitalize' }}>{r.name}</span>
                                        {selectedRole?.id === r.id && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleCreateRole} style={{ marginTop: '24px', width: '100%', padding: '16px', borderRadius: '16px', border: '2px dashed #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontFamily: FONT_PREMIUM }}>
                                <Plus size={18} /> THÊM CHỨC VỤ MỚI
                            </button>
                        </div>

                        {editRoleData && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative' }}>
                                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.8px' }}>
                                                <Settings2 size={16} /> CẤU HÌNH HỆ THỐNG
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                                                Chức vụ: <span style={{ color: editRoleData.color || '#2563eb', textTransform: 'capitalize' }}>{editRoleData.name}</span>
                                            </h3>
                                        </div>
                                        {!editRoleData.isNew && editRoleData.name !== 'admin' && (
                                            <button 
                                                onClick={() => handleDeleteRole(editRoleData.id)}
                                                style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}
                                            >
                                                <Trash2 size={16} /> XOÁ CHỨC VỤ
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '32px' }}>
                                        <button onClick={() => setRoleDetailTab("display")} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '800', color: roleDetailTab === 'display' ? '#0f172a' : '#cbd5e1', cursor: 'pointer', borderBottom: roleDetailTab === 'display' ? '3px solid #0f172a' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s', textTransform: 'uppercase', fontFamily: FONT_PREMIUM }}>HIỂN THỊ & MÀU</button>
                                        <button onClick={() => setRoleDetailTab("permissions")} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '800', color: roleDetailTab === 'permissions' ? '#0f172a' : '#cbd5e1', cursor: 'pointer', borderBottom: roleDetailTab === 'permissions' ? '3px solid #0f172a' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s', textTransform: 'uppercase', fontFamily: FONT_PREMIUM }}>QUYỀN HẠN TRUY CẬP</button>
                                        <button onClick={() => setRoleDetailTab("workflows")} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '800', color: roleDetailTab === 'workflows' ? '#0f172a' : '#cbd5e1', cursor: 'pointer', borderBottom: roleDetailTab === 'workflows' ? '3px solid #0f172a' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s', textTransform: 'uppercase', fontFamily: FONT_PREMIUM }}>QUY TRÌNH DUYỆT TÀI LIỆU</button>
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', paddingBottom: '120px' }}>
                                    {roleDetailTab === "display" ? (
                                        <div style={{ maxWidth: '440px' }}>
                                            <div style={{ marginBottom: '32px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Tên hiển thị chức vụ</label>
                                                <input className="form-input" value={editRoleData.name} onChange={(e) => setEditRoleData({...editRoleData, name: e.target.value})} disabled={editRoleData.name === 'admin' && !editRoleData.isNew} style={{ padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#f8fafc', fontWeight: '700', fontSize: '15px', fontFamily: FONT_PREMIUM }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Chọn màu đại diện</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                                    {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#2563eb', '#8b5cf6', '#ec4899', '#6366f1', '#64748b', '#0f172a'].map(c => (
                                                        <div key={c} onClick={() => (editRoleData.name !== 'admin' || editRoleData.isNew) && setEditRoleData({...editRoleData, color: c})} style={{ height: '44px', borderRadius: '12px', background: c, cursor: 'pointer', border: editRoleData.color === c ? '3px solid #fff' : 'none', boxShadow: editRoleData.color === c ? `0 0 0 2px #0f172a` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>{editRoleData.color === c && <Check size={20} color="#fff" />}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : roleDetailTab === "permissions" ? (
                                        <div style={{ maxWidth: '800px' }}>
                                            <div style={{ position: 'relative', marginBottom: '32px' }}><Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} size={20} /><input placeholder="Lọc quyền hạn nhanh..." style={{ width: '100%', padding: '14px 18px 14px 50px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', outline: 'none', fontWeight: '600', fontSize: '15px', fontFamily: FONT_PREMIUM }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                                {PERMISSION_GROUPS.map(group => {
                                                    const filtered = group.modules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                                    if (filtered.length === 0) return null;
                                                    return (
                                                        <div key={group.group}>
                                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {group.group}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {filtered.map(mod => {
                                                                    const isDanger = mod.id.endsWith('.delete');
                                                                    return (
                                                                        <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '14px', border: isDanger ? '2px solid #fecaca' : '2px solid #f1f5f9', background: isDanger ? '#fef2f2' : '#fff', transition: 'all 0.2s' }}>
                                                                            <div style={{ flex: 1, paddingRight: '40px' }}>
                                                                                <div style={{ color: isDanger ? '#dc2626' : '#0f172a', fontSize: '15px', fontWeight: '800', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    {mod.name}
                                                                                    {isDanger && <span style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>NGUY HIỂM</span>}
                                                                                </div>
                                                                                <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.5', fontWeight: '500' }}>{mod.desc}</div>
                                                                            </div>
                                                                            <Switch checked={editRoleData.name === 'admin' || (editRoleData.permissions && editRoleData.permissions.includes(mod.id))} onChange={() => togglePermission(mod.id)} disabled={editRoleData.name === 'admin' && !editRoleData.isNew} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ maxWidth: '800px' }}>
                                            <div style={{ marginBottom: '24px', background: '#e0e7ff', padding: '16px 20px', borderRadius: '12px', color: '#3730a3', fontSize: '14px', fontWeight: '600', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <div style={{ lineHeight: '1.6' }}>
                                                    <strong>Mặc định hệ thống:</strong> Đánh dấu vào loại tài liệu mà chức vụ này được quyền xem và phê duyệt trên toàn hệ thống (Chức vụ này sẽ đóng vai trò là Cửa Ngõ Đầu Tiên của các loại tài liệu trên). Khuyến khích sử dụng cho các vị trí quản lý tổng quát.
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                                {Object.keys(
                                                    documentTypes.reduce((acc, dt) => {
                                                        const group = dt.group_name || 'Khác';
                                                        if (!acc[group]) acc[group] = [];
                                                        acc[group].push(dt);
                                                        return acc;
                                                    }, {})
                                                ).map(group => {
                                                    const groupDocs = documentTypes.filter(dt => (dt.group_name || 'Khác') === group);
                                                    return (
                                                        <div key={group}>
                                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    📁 {group}
                                                                </div>
                                                                <Switch 
                                                                    checked={editRoleData.name === 'admin' || groupDocs.every(dt => editRoleData.global_document_type_ids && editRoleData.global_document_type_ids.includes(dt.id))}
                                                                    onChange={() => toggleGroupGlobalDocTypes(groupDocs)}
                                                                    disabled={editRoleData.name === 'admin' && !editRoleData.isNew}
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {groupDocs.map(dt => (
                                                                    <div key={dt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '14px', border: '2px solid #f1f5f9', background: '#fff', transition: 'all 0.2s' }}>
                                                                        <div style={{ flex: 1, paddingRight: '40px' }}>
                                                                            <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                {dt.type_name}
                                                                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>Quy trình: {dt.workflow_name || 'Đã liên kết'}</span>
                                                                            </div>
                                                                            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Cấp quyền tham gia xét duyệt các hồ sơ thuộc loại tài liệu này.</div>
                                                                        </div>
                                                                        <Switch 
                                                                            checked={editRoleData.name === 'admin' || (editRoleData.global_document_type_ids && editRoleData.global_document_type_ids.includes(dt.id))} 
                                                                            onChange={() => toggleGlobalDocType(dt.id)} 
                                                                            disabled={editRoleData.name === 'admin' && !editRoleData.isNew} 
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {hasChanges() && (
                                    <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', background: '#0f172a', borderRadius: '20px', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.5)', animation: 'slide-up 0.4s ease-out', zIndex: 100 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} /><span style={{ color: '#fff', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DỮ LIỆU ĐANG THAY ĐỔI</span></div>
                                        <div style={{ display: 'flex', gap: '16px' }}><button onClick={handleReset} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '12px 28px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: FONT_PREMIUM }}>HUỶ</button><button onClick={handleSaveRole} disabled={submitting} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', fontFamily: FONT_PREMIUM }}>{submitting ? 'ĐANG LƯU...' : <><Save size={18} /> LƯU THAY ĐỔI</>}</button></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Member Modal - Fixed select height and replaced alerts */}
            {showMemberModal && (
                <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', zIndex: 2000 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowMemberModal(false); }}>
                    <div className="modal-box" style={{ maxWidth: '480px', padding: '52px', borderRadius: '32px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', fontFamily: FONT_PREMIUM }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><UserCheck size={40} /></div>
                            <h3 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>Thêm Nhân Viên</h3>
                            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '10px', fontWeight: '600' }}>Cấp tài khoản & mã NV tự động</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', color: '#475569', textTransform: 'uppercase' }}>Họ tên đầy đủ</label>
                                <input className="form-input" placeholder="Nguyễn Văn A" style={{ padding: '14px 20px', borderRadius: '14px', border: '2px solid #f1f5f9', fontWeight: '700', fontFamily: FONT_PREMIUM, width: '100%', height: '52px' }} value={memberFormData.full_name} onChange={(e) => setMemberFormData({...memberFormData, full_name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', color: '#475569', textTransform: 'uppercase' }}>Địa chỉ Email</label>
                                <input className="form-input" placeholder="email@gmail.com" style={{ padding: '14px 20px', borderRadius: '14px', border: '2px solid #f1f5f9', fontWeight: '700', fontFamily: FONT_PREMIUM, width: '100%', height: '52px' }} value={memberFormData.email} onChange={(e) => setMemberFormData({...memberFormData, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', color: '#475569', textTransform: 'uppercase' }}>Chức vụ hệ thống</label>
                                <select 
                                    className="form-input" 
                                    style={{ 
                                        padding: '0 20px', borderRadius: '14px', border: '2px solid #f1f5f9', background: '#fff',
                                        fontWeight: '700', fontFamily: FONT_PREMIUM, width: '100%', height: '52px', color: '#0f172a',
                                        cursor: 'pointer', appearance: 'auto'
                                    }} 
                                    value={memberFormData.role_id} 
                                    onChange={(e) => setMemberFormData({...memberFormData, role_id: e.target.value})}
                                >
                                    <option value="">-- Chọn chức vụ --</option>
                                    {roles.filter(r => r.id !== 'temp').map(r => (
                                        <option key={r.id} value={r.id} style={{ color: '#0f172a' }}>
                                            {r.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '48px' }}>
                            <button className="btn-cancel" style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: '800', color: '#94a3b8' }} onClick={() => setShowMemberModal(false)}>HỦY</button>
                            <button className="btn-submit" style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: '900', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }} onClick={handleSaveMember} disabled={submitting}>XÁC NHẬN</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Details Modal */}
            {showEmployeeModal && selectedEmployee && (
                <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowEmployeeModal(false); }}>
                    <div className="modal-box" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '32px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', fontFamily: FONT_PREMIUM, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Header Details */}
                        <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px', alignItems: 'center', position: 'relative' }}>
                            <button onClick={() => setShowEmployeeModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#e2e8f0', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}><Check size={18} style={{ transform: 'rotate(45deg)' }} /></button>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: selectedEmployee.role_color || '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '32px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                {selectedEmployee.image ? (
                                    <img src={selectedEmployee.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    selectedEmployee.full_name.substring(0, 1).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{selectedEmployee.full_name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>#{selectedEmployee.employee_code}</span>
                                    {hasPermission('hr.manage') ? (
                                        <select 
                                            value={selectedEmployee.role_id || ''}
                                            onChange={(e) => handleUpdateEmployeeRole(selectedEmployee.id, e.target.value)}
                                            style={{
                                                background: (selectedEmployee.role_color || '#94a3b8') + '20',
                                                color: selectedEmployee.role_color || '#64748b',
                                                padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                                                border: `1px solid ${selectedEmployee.role_color || '#64748b'}`,
                                                textTransform: 'uppercase', outline: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            {roles.filter(r => r.id !== 'temp').map(r => (
                                                <option key={r.id} value={r.id} style={{ color: '#000', textTransform: 'none' }}>{r.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ background: (selectedEmployee.role_color || '#94a3b8') + '20', color: selectedEmployee.role_color || '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{selectedEmployee.role_name || 'KHÔNG CÓ QUYỀN'}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="#94a3b8" /> {selectedEmployee.email || 'Chưa cập nhật'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="#94a3b8" /> {selectedEmployee.phone || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Projects List */}
                        <div style={{ padding: '40px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={20} color="#2563eb" /> DỰ ÁN ĐANG THAM GIA</h4>
                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>{employeeProjects.length} dự án</span>
                            </div>

                            {loadingProjects ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '600' }}>Đang tải danh sách dự án...</div>
                            ) : employeeProjects.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 40px', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><Briefcase size={28} /></div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>Chưa tham gia dự án</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Nhân viên này hiện chưa được phân công vào dự án nào.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {employeeProjects.map((proj) => {
                                        const statusLabel = proj.status === 'DONE' || proj.status === 'COMPLETED' ? 'Hoàn thành' : 
                                                            proj.status === 'PROCESSING' ? 'Đang xử lý' : 
                                                            proj.status === 'DRAFT' || proj.status === 'PENDING' ? 'Chờ duyệt' : proj.status;
                                        const colorObj = STATUS_COLORS[statusLabel] || STATUS_COLORS[proj.status] || { bg: '#f1f5f9', color: '#64748b' };
                                        
                                        return (
                                            <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', transition: 'all 0.2s' }}>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{proj.project_name}</div>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>#{proj.project_code}</span>
                                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={14} /> Chức danh: <strong>{proj.position_in_project}</strong></span>
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', padding: '6px 12px', borderRadius: '100px', background: colorObj.bg, color: colorObj.color }}>
                                                    {statusLabel}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .form-input:focus {
                    border-color: #2563eb !important;
                    outline: none;
                    background: #fff !important;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
}
