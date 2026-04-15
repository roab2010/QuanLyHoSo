import React, { useState, useEffect } from "react";
import api from "./api"; // Axios instance
import { useToast } from "./Toast";
import { ShieldCheck, UserPlus, Users, Settings2, Search, Plus, Palette, ArrowLeft, ChevronRight, Check, Save, RotateCcw, Mail, Phone, Briefcase, Hash, Info, UserCheck, Trash2 } from 'lucide-react';

export default function QuanLyNhanVien({ admin }) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("members"); // "members" | "roles"
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
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

    // Permission Check
    const userPermissions = React.useMemo(() => {
        try {
            return JSON.parse(admin?.permissions || '[]');
        } catch (e) {
            return [];
        }
    }, [admin]);

    const hasPermission = (module) => {
        if (!admin) return false;
        if (admin.role === 'admin') return true;
        return userPermissions.includes(module);
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

    const ALL_MODULES = [
        { id: "projects", name: "Xem & Quản lý Dự án", desc: "Cho phép thành viên xem danh sách và chi tiết các dự án của công ty." },
        { id: "create_project", name: "Tạo Dự án Mới", desc: "Quyền hạn khởi tạo hồ sơ công trình mới vào hệ thống." },
        { id: "documents", name: "Duyệt hồ sơ & Tài liệu", desc: "Cho phép tải lên, chỉnh sửa và phê duyệt các văn bản pháp lý." },
        { id: "inventory", name: "Quản lý vật tư & Kho", desc: "Toàn quyền kiểm soát nhập/xuất vật tư và tồn kho công trình." },
        { id: "hr", name: "Quản lý nhân sự", desc: "Quyền admin cấp phát tài khoản và thiết lập chức vụ cho nhân viên mới." },
        { id: "kanban", name: "Kéo thả Kanban", desc: "Cho phép thay đổi trạng thái tiến độ công việc trên bảng Kanban." }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, roleRes] = await Promise.all([
                api.get("/manage/employees"),
                api.get("/roles")
            ]);
            setEmployees(empRes.data || []);
            const fetchedRoles = roleRes.data || [];
            setRoles(fetchedRoles);
            
            if (fetchedRoles.length > 0 && !selectedRole) {
                const initialRole = fetchedRoles[0];
                setSelectedRole(initialRole);
                setEditRoleData({
                    ...initialRole,
                    permissions: initialRole.permissions ? (typeof initialRole.permissions === 'string' ? JSON.parse(initialRole.permissions) : initialRole.permissions) : []
                });
            }
        } catch (error) {
            console.error("Lỗi fetch data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectRole = async (role) => {
        if (hasChanges()) {
            const confirmed = await toast.showConfirm("Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất thay đổi?");
            if (!confirmed) return;
        }
        setSelectedRole(role);
        setEditRoleData({
            ...role,
            isNew: role.id === 'temp',
            permissions: role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : []
        });
    };

    const handleReset = async () => {
        if (editRoleData?.isNew) {
            const confirmed = await toast.showConfirm("Huỷ bỏ chức vụ mới đang tạo?");
            if (!confirmed) return;
            setRoles(roles.filter(r => r.id !== 'temp'));
            const first = roles.find(r => r.id !== 'temp');
            handleSelectRole(first);
            return;
        }
        handleSelectRole(selectedRole);
    };

    const handleSaveRole = async () => {
        if (!editRoleData) return;
        setSubmitting(true);
        try {
            if (editRoleData.isNew) {
                await api.post("/roles", {
                    name: editRoleData.name,
                    color: editRoleData.color,
                    permissions: editRoleData.permissions
                });
            } else {
                await api.put(`/roles/${editRoleData.id}`, {
                    name: editRoleData.name,
                    color: editRoleData.color,
                    permissions: editRoleData.permissions
                });
            }
            // Refresh
            const roleRes = await api.get("/roles");
            const freshRoles = roleRes.data || [];
            setRoles(freshRoles);
            
            const updated = freshRoles.find(r => r.name === editRoleData.name);
            setSelectedRole(updated);
            setEditRoleData({
                ...updated,
                permissions: updated.permissions ? (typeof updated.permissions === 'string' ? JSON.parse(updated.permissions) : updated.permissions) : []
            });
            toast.success("Lưu chức vụ thành công!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi khi lưu");
        }
        setSubmitting(false);
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
            isNew: true
        };
        
        setRoles([...roles, newRole]);
        setSelectedRole(newRole);
        setEditRoleData({...newRole, permissions: []});
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

    const hasChanges = () => {
        if (!selectedRole || !editRoleData) return false;
        if (editRoleData.isNew) return true;

        const parsedOrig = selectedRole.permissions ? (typeof selectedRole.permissions === 'string' ? JSON.parse(selectedRole.permissions).sort() : selectedRole.permissions.sort()) : [];
        const originalPerms = JSON.stringify(parsedOrig);
        const currentPerms = JSON.stringify([...editRoleData.permissions].sort());
        return selectedRole.name !== editRoleData.name || 
               selectedRole.color !== editRoleData.color || 
               originalPerms !== currentPerms;
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

    const handleDeleteEmployee = async (id, name) => {
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
                    <button onClick={() => setActiveTab("roles")} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '700', color: activeTab === 'roles' ? '#0f172a' : '#94a3b8', cursor: 'pointer', borderBottom: activeTab === 'roles' ? '4px solid #0f172a' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontFamily: FONT_PREMIUM }}>
                        <ShieldCheck size={18} /> CHỨC VỤ HỆ THỐNG
                    </button>
                </div>
                {activeTab === 'members' && (
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
                                <div key={emp.id} style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'relative' }}>
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
                                            {emp.role_name !== 'admin' && (
                                                <button 
                                                    onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
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
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.8px' }}>
                                            <Settings2 size={16} /> CẤU HÌNH HỆ THỐNG
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                                            Chức vụ: <span style={{ color: editRoleData.color || '#2563eb', textTransform: 'capitalize' }}>{editRoleData.name}</span>
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '32px' }}>
                                        <button onClick={() => setRoleDetailTab("display")} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '800', color: roleDetailTab === 'display' ? '#0f172a' : '#cbd5e1', cursor: 'pointer', borderBottom: roleDetailTab === 'display' ? '3px solid #0f172a' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s', textTransform: 'uppercase', fontFamily: FONT_PREMIUM }}>HIỂN THỊ & MÀU</button>
                                        <button onClick={() => setRoleDetailTab("permissions")} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '800', color: roleDetailTab === 'permissions' ? '#0f172a' : '#cbd5e1', cursor: 'pointer', borderBottom: roleDetailTab === 'permissions' ? '3px solid #0f172a' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s', textTransform: 'uppercase', fontFamily: FONT_PREMIUM }}>QUYỀN HẠN TRUY CẬP</button>
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
                                    ) : (
                                        <div style={{ maxWidth: '800px' }}>
                                            <div style={{ position: 'relative', marginBottom: '32px' }}><Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} size={20} /><input placeholder="Lọc quyền hạn nhanh..." style={{ width: '100%', padding: '14px 18px 14px 50px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', outline: 'none', fontWeight: '600', fontSize: '15px', fontFamily: FONT_PREMIUM }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '12px' }}>
                                                {ALL_MODULES.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(mod => (
                                                    <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: '18px', border: '2px solid #f1f5f9', background: '#fff', transition: 'all 0.2s' }}>
                                                        <div style={{ flex: 1, paddingRight: '40px' }}><div style={{ color: '#0f172a', fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>{mod.name}</div><div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>{mod.desc}</div></div>
                                                        <Switch checked={editRoleData.name === 'admin' || (editRoleData.permissions && editRoleData.permissions.includes(mod.id))} onChange={() => togglePermission(mod.id)} disabled={editRoleData.name === 'admin' && !editRoleData.isNew} />
                                                    </div>
                                                ))}
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
