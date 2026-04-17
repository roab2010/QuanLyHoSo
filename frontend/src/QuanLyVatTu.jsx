import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "./api";

const styleSheet = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.spinner-mini { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #4318FF; border-radius: 50%; animation: spin 1s linear infinite; }
.animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
.error-text { color: #EE5D50; font-size: 11px; margin-top: 4px; display: block; font-weight: 500; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 12px; font-weight: bold; color: #2b3674; }
.form-input { padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; transition: border 0.2s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #4318FF; }
.stat-card { padding: 20px; background: #fff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.radio-card { border: 2px solid #e0e5f2; border-radius: 12px; padding: 14px 18px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
.radio-card.active { border-color: #4318FF; background: #f0edff; }
.radio-card-orange.active { border-color: #FF6B35; background: #fff4f0; }
.sku-suggestion { position: absolute; z-index: 200; background: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 160px; overflow-y: auto; top: 100%; left: 0; right: 0; }
.sku-suggestion-item { padding: 10px 14px; cursor: pointer; font-size: 13px; transition: background 0.15s; }
.sku-suggestion-item:hover { background: #f4f7fe; }
.export-item-row { display: grid; grid-template-columns: 1fr auto 100px; gap: 10px; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 10px; margin-bottom: 8px; }
.checkbox-item { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 10px; border: 1px solid #e0e5f2; cursor: pointer; transition: all 0.2s; }
.checkbox-item:hover { background: #f4f7fe; }
.checkbox-item.selected { background: #f0edff; border-color: #4318FF; }
`;

export default function QuanLyVatTu() {
    const [inventory, setInventory] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);

    // Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterWarehouse, setFilterWarehouse] = useState("ALL");

    // --- IMPORT STATE ---
    const [importSource, setImportSource] = useState("SUPPLIER"); // SUPPLIER | PROJECT
    const [errors, setErrors] = useState({});
    const [skuInput, setSkuInput] = useState("");
    const [skuSuggestions, setSkuSuggestions] = useState([]);
    const [matchedProduct, setMatchedProduct] = useState(null); // nếu SKU đã tồn tại
    const [showSkuDropdown, setShowSkuDropdown] = useState(false);
    const skuRef = useRef(null);

    const initialFormState = {
        name: '', sku: 'VT-', unit: 'Cái', type: 'CONSUMABLE', category_name: 'Vật tư tiêu hao',
        price: '', current_stock: '', min_stock_level: '10', warehouse_id: '', supplier_id: '',
        status: 1, hsd: '', space_coefficient: '1'
    };
    const [formData, setFormData] = useState(initialFormState);

    // Import-from-project state
    const [importProjectId, setImportProjectId] = useState('');
    const [projectItems, setProjectItems] = useState([]); // vật tư ở dự án
    const [importProjectSelections, setImportProjectSelections] = useState({}); // {product_id: qty}
    const [importWarehouseId, setImportWarehouseId] = useState('');
    const [loadingProjectItems, setLoadingProjectItems] = useState(false);
    const [isFinalReturn, setIsFinalReturn] = useState(false);

    // --- EXPORT STATE ---
    const [exportType, setExportType] = useState("TO_PROJECT"); // TO_WAREHOUSE | TO_PROJECT
    const [exportDestWarehouse, setExportDestWarehouse] = useState('');
    const [exportProjectId, setExportProjectId] = useState('');
    const [exportNote, setExportNote] = useState('');
    const [exportSelections, setExportSelections] = useState({}); // {product_id: qty}

    // --- PENDING REQUESTS STATE ---
    const [activeMainTab, setActiveMainTab] = useState("INVENTORY"); // INVENTORY | PENDING
    const [pendingRequests, setPendingRequests] = useState([]);
    const [processingRequest, setProcessingRequest] = useState(false);

    // ======================== LOAD DATA ========================
    const loadData = async () => {
        try {
            const [invRes, wareRes, supRes, projRes, pendRes] = await Promise.all([
                api.get("/inventory"),
                api.get("/warehouses"),
                api.get("/suppliers"),
                api.get("/projects"),
                api.get("/inventory/pending-requests").catch(() => ({ data: { requests: [] } }))
            ]);
            const invData = invRes.data?.inventory || invRes.data || [];
            setInventory(Array.isArray(invData) ? invData : []);
            setStatsData(invRes.data?.stats || null);
            setWarehouses(Array.isArray(wareRes.data) ? wareRes.data : []);
            setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
            // Projects: lấy data từ đúng cấu trúc
            const projData = projRes.data?.projects || projRes.data?.data || projRes.data || [];
            setProjects(Array.isArray(projData) ? projData : []);
            
            setPendingRequests(pendRes.data?.requests || []);
        } catch (err) {
            console.error("Lỗi load data:", err);
        } finally {
            setLoading(false);
        }
    };
    
    // ======================== PROCESS REQUEST ========================
    const handleProcessRequest = async (id, action) => {
        if (!window.confirm(`Bạn có chắc muốn ${action === 'APPROVE' ? 'Duyệt' : 'Từ chối'} yêu cầu này?`)) return;
        setProcessingRequest(true);
        try {
            const res = await api.post(`/inventory/requests/${id}/process`, { action });
            if (res.data.success) {
                alert(res.data.message);
                loadData();
            } else {
                alert(res.data.message || "Có lỗi xảy ra!");
            }
        } catch (e) {
            alert(e?.response?.data?.message || "Lỗi xử lý yêu cầu!");
        } finally {
            setProcessingRequest(false);
        }
    };

    useEffect(() => {
        loadData();
        const styleTag = document.createElement("style");
        styleTag.innerHTML = styleSheet;
        document.head.appendChild(styleTag);
    }, []);

    // ======================== WAREHOUSE CAPACITY ========================
    const getWarehouseInfo = (warehouseId) => {
        if (!warehouseId) return { used: 0, total: 0, remaining: 0, percent: 0 };
        const warehouse = warehouses.find(w => Number(w.id) === Number(warehouseId));
        const total = Number(warehouse?.capacity || 1000);
        const used = inventory
            .filter(item => Number(item.warehouse_id) === Number(warehouseId))
            .reduce((sum, item) => sum + (Number(item.current_stock || 0) * (Number(item.space_coefficient) || 1)), 0);
        const remaining = Math.max(0, total - used);
        return { used, total, remaining, percent: (used / total) * 100 };
    };

    // ======================== SKU SUGGESTION LOGIC ========================
    const handleSkuChange = (val) => {
        // Enforce prefix VT-
        if (!val.toUpperCase().startsWith("VT-")) {
            val = "VT-" + val.replace(/^VT\-?/i, '');
        }
        setSkuInput(val);
        setFormData(prev => ({ ...prev, sku: val }));

        if (val.trim().length < 1) {
            setSkuSuggestions([]);
            setMatchedProduct(null);
            setShowSkuDropdown(false);
            return;
        }

        const suggestions = inventory.filter(item =>
            item.sku?.toLowerCase().includes(val.toLowerCase())
        );
        setSkuSuggestions(suggestions);
        setShowSkuDropdown(suggestions.length > 0);

        // Kiểm tra SKU khớp chính xác
        const exact = inventory.find(item => item.sku?.toLowerCase() === val.toLowerCase());
        if (exact) {
            setMatchedProduct(exact);
            setFormData(prev => ({
                ...prev,
                sku: exact.sku,
                name: exact.name,
                unit: exact.unit || 'Cái',
                type: exact.type || 'CONSUMABLE',
                category_name: exact.category_name || '',
                price: exact.price || '',
                space_coefficient: exact.space_coefficient || '1',
                warehouse_id: prev.warehouse_id,
            }));
        } else {
            setMatchedProduct(null);
        }
    };

    const handlePickSuggestion = (item) => {
        setSkuInput(item.sku);
        setMatchedProduct(item);
        setFormData(prev => ({
            ...prev,
            sku: item.sku,
            name: item.name,
            unit: item.unit || 'Cái',
            type: item.type || 'CONSUMABLE',
            category_name: item.category_name || '',
            price: item.price || '',
            space_coefficient: item.space_coefficient || '1',
        }));
        setShowSkuDropdown(false);
    };

    // ======================== VALIDATE IMPORT FORM ========================
    const validateImportForm = () => {
        let errs = {};
        if (!formData.sku.trim()) errs.sku = "Mã SKU bắt buộc";
        if (!matchedProduct && !formData.name.trim()) errs.name = "Tên vật tư bắt buộc";
        if (!formData.warehouse_id) errs.warehouse_id = "Vui lòng chọn kho";
        if (!formData.supplier_id) errs.supplier_id = "Vui lòng chọn nhà cung cấp";
        if (!formData.current_stock) errs.current_stock = "Vui lòng nhập số lượng";
        if (!matchedProduct && !formData.price) errs.price = "Vui lòng nhập giá";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ======================== IMPORT HANDLER ========================
    const handleImport = async (e) => {
        e.preventDefault();
        if (!validateImportForm()) return;

        const spaceCoef = Number(formData.space_coefficient) || 1;
        const qty = Number(formData.current_stock);
        const info = getWarehouseInfo(formData.warehouse_id);

        if (qty * spaceCoef > info.remaining) {
            alert(`❌ Kho không đủ chỗ!\nCòn trống: ${info.remaining.toFixed(2)}\nCần: ${(qty * spaceCoef).toFixed(2)}`);
            return;
        }

        try {
            const res = await api.post("/products", {
                ...formData,
                price: Number(formData.price),
                current_stock: qty,
                min_stock_level: Number(formData.min_stock_level) || 10,
                warehouse_id: Number(formData.warehouse_id),
                supplier_id: Number(formData.supplier_id),
                space_coefficient: spaceCoef,
                hsd: formData.hsd || null,
            });

            if (res.data.success) {
                const msg = res.data.merged
                    ? `✅ Đã cộng thêm ${qty} vào SKU ${formData.sku}!`
                    : `🎉 Nhập kho thành công!`;
                alert(msg);
                setIsImportModalOpen(false);
                setFormData(initialFormState);
                setSkuInput('');
                setMatchedProduct(null);
                setErrors({});
                loadData();
            }
        } catch (err) {
            console.error("Import error:", err);
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
                const firstErrMsg = Object.values(err.response.data.errors)[0][0];
                alert("❌ Lỗi dữ liệu: " + firstErrMsg);
            } else {
                alert("❌ " + (err.response?.data?.message || "Lỗi nhập kho!"));
            }
        }
    };

    // ======================== IMPORT FROM PROJECT HANDLER ========================
    const handleLoadProjectItems = async (projectId) => {
        if (!projectId) { setProjectItems([]); return; }
        setLoadingProjectItems(true);
        try {
            const res = await api.get(`/inventory/project-items/${projectId}`);
            setProjectItems(res.data.items || []);
            setImportProjectSelections({});
        } catch (err) {
            alert("Không tải được vật tư dự án!");
        } finally {
            setLoadingProjectItems(false);
        }
    };

    const handleImportFromProject = async () => {
        if (!importProjectId) { alert("Vui lòng chọn dự án!"); return; }
        if (!importWarehouseId) { alert("Vui lòng chọn kho nhận!"); return; }

        const items = Object.entries(importProjectSelections)
            .filter(([, qty]) => Number(qty) > 0)
            .map(([productId, qty]) => ({ product_id: Number(productId), quantity: Number(qty) }));

        if (items.length === 0) { alert("Vui lòng chọn ít nhất 1 vật tư để nhập!"); return; }

        try {
            const res = await api.post("/inventory/import-from-project", {
                project_id: importProjectId,
                warehouse_id: importWarehouseId,
                items,
                is_final_return: isFinalReturn,
            });
            if (res.data.success) {
                alert("✅ " + res.data.message);
                setIsImportModalOpen(false);
                setImportProjectId('');
                setProjectItems([]);
                setImportProjectSelections({});
                setIsFinalReturn(false);
                loadData();
            }
        } catch (err) {
            alert("❌ " + (err.response?.data?.message || "Lỗi nhập từ dự án!"));
        }
    };

    // ======================== EXPORT HANDLER ========================
    const handleExport = async () => {
        if (exportType === 'TO_WAREHOUSE' && !exportDestWarehouse) {
            alert("Vui lòng chọn kho đích!"); return;
        }
        if (exportType === 'TO_PROJECT' && !exportProjectId) {
            alert("Vui lòng chọn dự án!"); return;
        }

        const items = Object.entries(exportSelections)
            .filter(([, qty]) => Number(qty) > 0)
            .map(([productId, qty]) => ({ product_id: Number(productId), quantity: Number(qty) }));

        if (items.length === 0) { alert("Vui lòng chọn ít nhất 1 vật tư để xuất!"); return; }

        // Validate tồn kho từng vật tư
        for (const item of items) {
            const p = inventory.find(i => i.id === item.product_id);
            if (p && Number(p.current_stock) < item.quantity) {
                alert(`❌ "${p.name}" không đủ tồn kho! Còn: ${p.current_stock}`);
                return;
            }
        }

        // Kiểm tra capacity kho đích
        if (exportType === 'TO_WAREHOUSE') {
            const info = getWarehouseInfo(exportDestWarehouse);
            const totalSpace = items.reduce((sum, item) => {
                const p = inventory.find(i => i.id === item.product_id);
                return sum + item.quantity * (Number(p?.space_coefficient) || 1);
            }, 0);
            if (totalSpace > info.remaining) {
                alert(`❌ Kho đích không đủ chỗ!\nCần: ${totalSpace.toFixed(2)} | Còn: ${info.remaining.toFixed(2)}`);
                return;
            }
        }

        try {
            const res = await api.post("/inventory/export", {
                export_type: exportType,
                destination_warehouse_id: exportType === 'TO_WAREHOUSE' ? Number(exportDestWarehouse) : undefined,
                project_id: exportType === 'TO_PROJECT' ? exportProjectId : undefined,
                items,
                note: exportNote || null,
            });
            if (res.data.success) {
                alert("✅ Xuất kho thành công!");
                setIsExportModalOpen(false);
                setExportSelections({});
                setExportNote('');
                setExportDestWarehouse('');
                setExportProjectId('');
                loadData();
            }
        } catch (err) {
            alert("❌ " + (err.response?.data?.message || "Lỗi xuất kho!"));
        }
    };

    // ======================== DELETE ========================
    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ Xóa vật tư này?")) return;
        try {
            await api.delete(`/products/${id}`);
            alert("Đã xóa!");
            loadData();
        } catch (err) {
            alert("Không thể xóa!");
        }
    };

    // ======================== VIEW DETAILS ========================
    const handleViewDetails = async (id) => {
        try {
            const res = await api.get(`/products/${id}`);
            if (res.data.success) {
                setSelectedProductDetails(res.data);
                setIsDetailModalOpen(true);
            }
        } catch (err) {
            alert("Không thể tải chi tiết vật tư!");
        }
    };

    const filteredInventory = useMemo(() => {
        return inventory
            .filter(item => {
                const matchesSearch =
                    (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                    (item.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase());
                const matchesWarehouse = filterWarehouse === "ALL" || String(item.warehouse_id) === String(filterWarehouse);
                return matchesSearch && matchesWarehouse;
            })
            .sort((a, b) => (Number(a.warehouse_id) || 0) - (Number(b.warehouse_id) || 0));
    }, [searchTerm, filterWarehouse, inventory]);

    const exportableInventory = useMemo(() => {
        return inventory.filter(item => {
            if (Number(item.current_stock) <= 0) return false; // Chỉ xuất hàng còn tồn kho
            if (exportType === 'TO_WAREHOUSE' && exportDestWarehouse) {
                if (String(item.warehouse_id) === String(exportDestWarehouse)) return false; // Bỏ qua vật tư cùng kho đích
            }
            return true;
        });
    }, [inventory, exportType, exportDestWarehouse]);

    // ======================== HELPERS ========================
    const inputSpaceCheck = () => {
        const spaceCoef = Number(formData.space_coefficient) || 1;
        const qty = Number(formData.current_stock) || 0;
        const info = getWarehouseInfo(formData.warehouse_id);
        return qty * spaceCoef > info.remaining;
    };

    const exportTotalSpace = useMemo(() => {
        return Object.entries(exportSelections).reduce((sum, [pid, qty]) => {
            const p = inventory.find(i => i.id === Number(pid));
            return sum + (Number(qty) || 0) * (Number(p?.space_coefficient) || 1);
        }, 0);
    }, [exportSelections, inventory]);

    // ======================== RENDER ========================
    return (
        <div className="animate-fade-in" style={{ padding: '20px', backgroundColor: '#f4f7fe', minHeight: '100vh', fontFamily: 'sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h1 style={{ margin: 0, color: '#2b3674', fontSize: '24px', fontWeight: 'bold' }}>Hệ thống Quản lý Kho</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        style={{ padding: '12px 24px', background: activeMainTab === 'PENDING' ? '#2563eb' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                        onClick={() => setActiveMainTab(activeMainTab === 'PENDING' ? 'INVENTORY' : 'PENDING')}
                    >
                        📑 Duyệt yêu cầu {activeMainTab === 'PENDING' ? '(Đang xem)' : ''}
                        {pendingRequests.length > 0 && (
                            <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        style={{ padding: '12px 24px', background: '#4318FF', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        onClick={() => { setIsImportModalOpen(true); setImportSource('SUPPLIER'); setErrors({}); setSkuInput(''); setMatchedProduct(null); setFormData(initialFormState); loadData(); }}
                    >
                        📦 Nhập kho
                    </button>
                    <button
                        style={{ padding: '12px 24px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        onClick={() => { setIsExportModalOpen(true); setExportSelections({}); setExportType('TO_PROJECT'); setExportNote(''); setExportDestWarehouse(''); setExportProjectId(''); loadData(); }}
                    >
                        🚚 Xuất kho
                    </button>
                </div>
            </div>

            {activeMainTab === 'INVENTORY' ? (
                <>
                    {/* Stats */}
            <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>TỔNG LOẠI</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2b3674' }}>{statsData?.total_types || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #EE5D50' }}>
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>SẮP HẾT</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#EE5D50' }}>{statsData?.low_stock || 0}</div>
                </div>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>HẾT HÀNG</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFB547' }}>{statsData?.out_of_stock || 0}</div>
                </div>
                <div className="stat-card">
                    <label style={{ fontSize: '12px', color: '#a3aed0', fontWeight: 'bold' }}>GIÁ TRỊ KHO</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#05CD99' }}>{new Intl.NumberFormat('vi-VN').format(statsData?.total_value || 0)}đ</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', background: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '20px' }}>
                <input type="text" placeholder="🔍 Tìm tên hoặc SKU..." style={{ flex: 2, padding: '12px', borderRadius: '10px', border: '1px solid #e0e5f2', outline: 'none' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <select style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e0e5f2' }} value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
                    <option value="ALL">Tất cả kho</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>VẬT TƯ</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>VỊ TRÍ</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>SỐ LƯỢNG</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#a3aed0', fontSize: '12px' }}>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center' }}><div className="spinner-mini" style={{ margin: 'auto' }}></div></td></tr>
                        ) : filteredInventory.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#a3aed0' }}>Không có vật tư nào</td></tr>
                        ) : filteredInventory.map((item) => {
                            const stockVal = Number(item.current_stock ?? 0);
                            const minVal = Number(item.min_stock_level ?? 10);
                            let sttText = "CÒN HÀNG", sttColor = "#05CD99", sttBg = "#e6fff1";
                            if (stockVal <= 0) { sttText = "HẾT HÀNG"; sttColor = "#EE5D50"; sttBg = "#fff1f0"; }
                            else if (stockVal <= minVal) { sttText = "SẮP HẾT"; sttColor = "#FFB547"; sttBg = "#fff8ed"; }
                            return (
                                <tr key={item.id} style={{ borderTop: '1px solid #f4f7fe', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => handleViewDetails(item.id)}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#2b3674' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: '#a3aed0' }}>{item.sku}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div>📍 {warehouses.find(w => w.id == item.warehouse_id)?.name || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{stockVal} {item.unit || 'Cái'}</div>
                                        <div style={{ fontSize: '11px', color: '#a3aed0' }}>{new Intl.NumberFormat('vi-VN').format(Number(item.price || 0))}đ</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: sttBg, color: sttColor }}>
                                            {sttText}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                                            style={{ padding: '6px 12px', background: '#fff', color: '#EE5D50', border: '1px solid #EE5D50', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                            onMouseOver={e => { e.target.style.background = '#EE5D50'; e.target.style.color = '#fff'; }}
                                            onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#EE5D50'; }}
                                        >Xóa</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            </>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#2b3674' }}>Danh sách yêu cầu cấp phát vật tư chờ duyệt</h3>
                    {pendingRequests.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#a3aed0" }}>
                            Không có yêu cầu nào đang chờ duyệt.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {pendingRequests.map(req => (
                                <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>Dự án: {req.project_name || 'N/A'}</span>
                                            <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '13px' }}>Ngày tạo: {new Date(req.created_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleProcessRequest(req.id, 'REJECT')}
                                                disabled={processingRequest}
                                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >Từ chối</button>
                                            <button 
                                                onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                                                disabled={processingRequest}
                                                style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >Duyệt & Xuất kho</button>
                                        </div>
                                    </div>
                                    <div style={{ padding: '0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#fff' }}>
                                                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>VẬT TƯ</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>SỐ LƯỢNG YC</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>TỒN KHO THỰC TẾ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {req.details?.map(dt => {
                                                    const stockObj = inventory.find(i => i.id === dt.product_id);
                                                    const currentStock = stockObj ? Number(stockObj.current_stock) : Number(dt.product?.current_stock || 0);
                                                    const isEnough = currentStock >= Number(dt.quantity);
                                                    return (
                                                        <tr key={dt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '10px 16px' }}>
                                                                <div style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>{dt.product?.name}</div>
                                                                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{dt.product?.sku}</div>
                                                            </td>
                                                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 'bold', color: '#d97706' }}>
                                                                {dt.quantity}
                                                            </td>
                                                            <td style={{ padding: '10px 16px', textAlign: 'center', color: isEnough ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                                                {currentStock}
                                                                {!isEnough && <span style={{display: 'block', fontSize: '10px'}}>Không đủ tồn kho!</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ======================== MODAL NHẬP KHO ======================== */}
            {isImportModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '700px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#2b3674' }}>📦 Nhập Kho</h2>
                            <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#a3aed0' }}>✖</button>
                        </div>

                        {/* Radio chọn nguồn */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <div className={`radio-card ${importSource === 'SUPPLIER' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setImportSource('SUPPLIER')}>
                                <span style={{ fontSize: '20px' }}>🏭</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2b3674' }}>Từ Nhà Cung Cấp</div>
                                    <div style={{ fontSize: '12px', color: '#a3aed0' }}>Nhập hàng mới hoặc bổ sung</div>
                                </div>
                            </div>
                            <div className={`radio-card ${importSource === 'PROJECT' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { setImportSource('PROJECT'); setImportProjectId(''); setProjectItems([]); setImportProjectSelections({}); setIsFinalReturn(false); }}>
                                <span style={{ fontSize: '20px' }}>♻️</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2b3674' }}>Từ Dự Án Trả Lại</div>
                                    <div style={{ fontSize: '12px', color: '#a3aed0' }}>Thu hồi vật tư đã xuất cho dự án</div>
                                </div>
                            </div>
                        </div>

                        {/* ---- FORM: Từ Nhà Cung Cấp ---- */}
                        {importSource === 'SUPPLIER' && (
                            <form onSubmit={handleImport}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                                    {/* SKU với gợi ý */}
                                    <div className="form-group" style={{ position: 'relative' }} ref={skuRef}>
                                        <label>Mã SKU <span style={{ color: '#05CD99', fontSize: '11px' }}>(nhập để tìm hoặc thêm mới)</span></label>
                                        <input
                                            className="form-input"
                                            style={{ borderColor: errors.sku ? '#EE5D50' : matchedProduct ? '#05CD99' : '#ddd', background: matchedProduct ? '#f8f9fa' : '#fff' }}
                                            value={skuInput}
                                            onChange={e => handleSkuChange(e.target.value)}
                                            onBlur={() => setTimeout(() => setShowSkuDropdown(false), 150)}
                                            placeholder="VD: SKU-001"
                                            autoComplete="off"
                                            readOnly={!!matchedProduct}
                                        />
                                        {showSkuDropdown && (
                                            <div className="sku-suggestion">
                                                {skuSuggestions.map(s => (
                                                    <div key={s.id} className="sku-suggestion-item" onMouseDown={() => handlePickSuggestion(s)}>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            <strong>{s.sku}</strong> — {s.name} (Tồn: {s.current_stock} {s.unit})
                                                        </div>
                                                        {s.batches && s.batches.length > 0 && (
                                                            <div style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '10px' }}>
                                                                {s.batches.map((b, i) => (
                                                                    <div key={i}>↳ Lô {i+1}: {b.quantity} {s.unit} {b.hsd ? `(HSD: ${new Date(b.hsd).toLocaleDateString('vi-VN')})` : ''}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.sku && <span className="error-text">{errors.sku}</span>}
                                        {matchedProduct && (
                                            <span style={{ fontSize: '11px', color: '#05CD99', marginTop: '3px' }}>
                                                ✅ SKU đã tồn tại — sẽ cộng dồn số lượng
                                            </span>
                                        )}
                                    </div>

                                    {/* Tên vật tư */}
                                    <div className="form-group">
                                        <label>Tên vật tư <span className="req-mark">*</span></label>
                                        <input
                                            className="form-input"
                                            style={{ borderColor: errors.name ? '#EE5D50' : '#ddd', background: matchedProduct ? '#f8f9fa' : '#fff' }}
                                            value={formData.name}
                                            onChange={e => {
                                                setFormData(p => ({ ...p, name: e.target.value }));
                                                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                                            }}
                                            placeholder={matchedProduct ? "(tự động từ SKU)" : "Tên vật tư"}
                                            readOnly={!!matchedProduct}
                                        />
                                        {errors.name && <span className="error-text">⚠️ {Array.isArray(errors.name) ? errors.name[0] : errors.name}</span>}
                                    </div>

                                    {/* Kho */}
                                    <div className="form-group">
                                        <label>Kho hàng <span className="req-mark">*</span></label>
                                        <select className="form-input" style={{ borderColor: errors.warehouse_id ? '#EE5D50' : '#ddd' }}
                                            value={formData.warehouse_id} onChange={e => {
                                                setFormData(p => ({ ...p, warehouse_id: e.target.value }));
                                                if (errors.warehouse_id) setErrors(prev => ({ ...prev, warehouse_id: null }));
                                            }}>
                                            <option value="">-- Chọn kho --</option>
                                            {warehouses.map(w => {
                                                const info = getWarehouseInfo(w.id);
                                                return <option key={w.id} value={w.id}>{w.name} (còn {info.remaining.toFixed(0)} m³)</option>;
                                            })}
                                        </select>
                                        {errors.warehouse_id && <span className="error-text">⚠️ {errors.warehouse_id}</span>}
                                    </div>

                                    {/* NCC */}
                                    <div className="form-group">
                                        <label>Nhà cung cấp <span className="req-mark">*</span></label>
                                        <select className="form-input" style={{ borderColor: errors.supplier_id ? '#EE5D50' : '#ddd' }}
                                            value={formData.supplier_id} onChange={e => {
                                                setFormData(p => ({ ...p, supplier_id: e.target.value }));
                                                if (errors.supplier_id) setErrors(prev => ({ ...prev, supplier_id: null }));
                                            }}>
                                            <option value="">-- Chọn NCC --</option>
                                            {suppliers.filter(s => s.status === 'ACTIVE').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        {errors.supplier_id && <span className="error-text">⚠️ {errors.supplier_id}</span>}
                                    </div>

                                    {/* Vật tư của NCC (Nếu có) */}
                                    {formData.supplier_id && suppliers.find(s => String(s.id) === String(formData.supplier_id))?.materials?.length > 0 && (
                                        <div className="form-group">
                                            <label>Chọn từ phiếu giá NCC <span style={{ color: '#05CD99', fontSize: '11px' }}>(tự điền giá)</span></label>
                                            <select 
                                                className="form-input" 
                                                style={{ background: '#f8fafc', borderStyle: 'dashed' }}
                                                onChange={e => {
                                                    const selectedMatId = e.target.value;
                                                    
                                                    // Nếu người dủng bỏ chọn (chọn về default)
                                                    if (!selectedMatId) {
                                                        setSkuInput('');
                                                        setMatchedProduct(null);
                                                        setFormData(p => ({
                                                            ...p,
                                                            sku: '',
                                                            name: '',
                                                            price: '',
                                                        }));
                                                        return;
                                                    }
                                                    
                                                    const supplier = suppliers.find(s => String(s.id) === String(formData.supplier_id));
                                                    const mat = supplier?.materials?.find(m => String(m.id) === String(selectedMatId));
                                                    
                                                    if (mat) {
                                                        // Fallback tìm vật tư trong kho có cùng tên (không phân biệt chữ hoa thường)
                                                        const existingProduct = inventory.find(
                                                            i => i.name?.toLowerCase().trim() === mat.material_name.toLowerCase().trim()
                                                        );

                                                        if (existingProduct) {
                                                            setSkuInput(existingProduct.sku);
                                                            setMatchedProduct(existingProduct);
                                                            setFormData(p => ({
                                                                ...p,
                                                                sku: existingProduct.sku,
                                                                name: existingProduct.name,
                                                                // Ưu tiên giá mới nhất của form NCC, nếu không có mới dùng giá tồn kho
                                                                price: mat.current_price || existingProduct.price,
                                                                unit: existingProduct.unit || 'Cái',
                                                                type: existingProduct.type || 'CONSUMABLE',
                                                                category_name: existingProduct.category_name || '',
                                                                space_coefficient: existingProduct.space_coefficient || '1',
                                                            }));
                                                        } else {
                                                            // Không có trong kho -> Đây là vật tư hoàn toàn mới
                                                            setSkuInput('');
                                                            setMatchedProduct(null);
                                                            setFormData(p => ({
                                                                ...p,
                                                                sku: '', // Bắt buộc user tự nhập SKU nếu tạo mới
                                                                name: mat.material_name,
                                                                price: mat.current_price || p.price,
                                                                unit: mat.unit || p.unit
                                                            }));
                                                        }
                                                    }
                                                }}
                                            >
                                                <option value="">-- Click để chọn vật tư --</option>
                                                {suppliers.find(s => String(s.id) === String(formData.supplier_id))?.materials?.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.material_name} (Giá: {new Intl.NumberFormat('vi-VN').format(m.current_price || 0)}đ)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Số lượng */}
                                    <div className="form-group">
                                        <label>Số lượng nhập <span className="req-mark">*</span></label>
                                        <input type="number" step="0.01" min="0.01" className="form-input" style={{ borderColor: errors.current_stock ? '#EE5D50' : '#ddd' }}
                                            value={formData.current_stock} onChange={e => {
                                                setFormData(p => ({ ...p, current_stock: e.target.value }));
                                                if (errors.current_stock) setErrors(prev => ({ ...prev, current_stock: null }));
                                            }} />
                                        {errors.current_stock && <span className="error-text">⚠️ {errors.current_stock}</span>}
                                    </div>

                                    {/* Min stock */}
                                    <div className="form-group">
                                        <label>Tồn kho tối thiểu</label>
                                        <input type="number" className="form-input" value={formData.min_stock_level}
                                            onChange={e => setFormData(p => ({ ...p, min_stock_level: e.target.value }))} />
                                    </div>

                                    {/* Giá */}
                                    <div className="form-group">
                                        <label>Giá nhập (đ)</label>
                                        <input type="number" min="0" className="form-input" style={{ borderColor: errors.price ? '#EE5D50' : '#ddd', background: matchedProduct ? '#f8f9fa' : '#fff' }}
                                            value={formData.price} onChange={e => {
                                                setFormData(p => ({ ...p, price: e.target.value }));
                                                if (errors.price) setErrors(prev => ({ ...prev, price: null }));
                                            }} />
                                        {errors.price && <span className="error-text">⚠️ {errors.price}</span>}
                                    </div>

                                    {/* Đơn vị */}
                                    <div className="form-group">
                                        <label>Đơn vị tính</label>
                                        <input className="form-input" value={formData.unit}
                                            onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} />
                                    </div>

                                    {/* HSD */}
                                    <div className="form-group">
                                        <label>Hạn sử dụng (HSD) <span style={{ color: '#a3aed0' }}>— tùy chọn</span></label>
                                        <input type="date" className="form-input" value={formData.hsd}
                                            onChange={e => setFormData(p => ({ ...p, hsd: e.target.value }))} />
                                    </div>

                                    {/* Space */}
                                    <div className="form-group">
                                        <label>Thể tích chiếm/SP (m³)</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.space_coefficient}
                                            onChange={e => setFormData(p => ({ ...p, space_coefficient: e.target.value }))} />
                                    </div>

                                    {/* Loại hình - chỉ hiện khi tạo mới */}
                                    {!matchedProduct && <>
                                        <div className="form-group">
                                            <label>Loại hình vật tư</label>
                                            <select className="form-input" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                                                <option value="CONSUMABLE">📦 Tiêu hao</option>
                                                <option value="RETURNABLE">🔄 Thu hồi</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Danh mục</label>
                                            <input className="form-input" value={formData.category_name}
                                                onChange={e => setFormData(p => ({ ...p, category_name: e.target.value }))}
                                                placeholder="VD: Linh kiện, Bảo hộ..." />
                                        </div>
                                    </>}
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsImportModalOpen(false)}
                                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Hủy</button>
                                    <button type="submit" disabled={inputSpaceCheck()}
                                        style={{ padding: '10px 25px', background: inputSpaceCheck() ? '#ccc' : '#4318FF', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: inputSpaceCheck() ? 'not-allowed' : 'pointer' }}>
                                        {inputSpaceCheck() ? 'Kho không đủ chỗ' : (matchedProduct ? '✅ Cộng dồn số lượng' : '✅ Xác nhận nhập')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ---- FORM: Từ Dự Án Trả Lại ---- */}
                        {importSource === 'PROJECT' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div className="form-group">
                                        <label>Chọn Dự án</label>
                                        <select className="form-input" value={importProjectId}
                                            onChange={e => { setImportProjectId(e.target.value); handleLoadProjectItems(e.target.value); }}>
                                            <option value="">-- Chọn dự án --</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.project_code}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Kho nhận hàng trả về</label>
                                        <select className="form-input" value={importWarehouseId} onChange={e => setImportWarehouseId(e.target.value)}>
                                            <option value="">-- Chọn kho --</option>
                                            {warehouses.map(w => {
                                                const info = getWarehouseInfo(w.id);
                                                return <option key={w.id} value={w.id}>{w.name} (còn {info.remaining.toFixed(0)} m³)</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {loadingProjectItems && <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner-mini" style={{ margin: 'auto' }}></div></div>}

                                {!loadingProjectItems && importProjectId && projectItems.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '30px', color: '#a3aed0', fontStyle: 'italic' }}>
                                        Không có vật tư nào đang ở dự án này.
                                    </div>
                                )}

                                {!loadingProjectItems && projectItems.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b3674', marginBottom: '10px' }}>
                                            Vật tư đang ở dự án — chọn để thu hồi:
                                        </div>
                                        <div style={{ border: '1px solid #e0e5f2', borderRadius: '12px', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead style={{ background: '#f4f7fe', position: 'sticky', top: 0 }}>
                                                    <tr>
                                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#a3aed0' }}>VẬT TƯ</th>
                                                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#a3aed0' }}>Ở DỰ ÁN</th>
                                                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#a3aed0' }}>SL THU HỒI</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projectItems.map(item => (
                                                        <tr key={item.product_id} style={{ borderTop: '1px solid #f4f7fe' }}>
                                                            <td style={{ padding: '10px' }}>
                                                                <div style={{ fontWeight: 'bold', color: '#2b3674', fontSize: '13px' }}>{item.product_name}</div>
                                                                <div style={{ fontSize: '11px', color: '#a3aed0' }}>{item.sku}</div>
                                                            </td>
                                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{item.qty_at_project} {item.unit}</td>
                                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                                <input type="number" min="0" max={item.qty_at_project} step="1"
                                                                    style={{ width: '80px', padding: '6px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'right' }}
                                                                    value={importProjectSelections[item.product_id] || ''}
                                                                    onChange={e => setImportProjectSelections(prev => ({ ...prev, [item.product_id]: e.target.value }))}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '15px', padding: '15px', background: '#fff5f5', borderRadius: '12px', border: '1px solid #ffd4d4' }}>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#EE5D50' }}
                                                    checked={isFinalReturn} 
                                                    onChange={e => setIsFinalReturn(e.target.checked)} 
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#c0392b', fontSize: '13px' }}>Thu hồi & Quyết toán luôn dự án này</div>
                                                    <div style={{ fontSize: '11px', color: '#e74c3c' }}>
                                                        Chọn tùy chọn này nếu đây là lần thu hồi cuối. Hệ thống sẽ tự động chuyển phần vật tư còn thiếu (hao hụt thi công, mất mát) thành Phiếu Xuất Kho <b>(Hao hụt)</b> và xóa nợ dự án.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsImportModalOpen(false)}
                                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Hủy</button>
                                    <button type="button" onClick={handleImportFromProject}
                                        style={{ padding: '10px 25px', background: '#4318FF', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        ♻️ Xác nhận Thu hồi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================== MODAL XUẤT KHO ======================== */}
            {isExportModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '780px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#FF6B35' }}>🚚 Xuất Kho</h2>
                            <button onClick={() => setIsExportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#a3aed0' }}>✖</button>
                        </div>

                        {/* Chọn loại xuất */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div className={`radio-card radio-card-orange ${exportType === 'TO_PROJECT' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setExportType('TO_PROJECT')}>
                                <span style={{ fontSize: '20px' }}>📋</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2b3674' }}>Xuất cho Dự án</div>
                                    <div style={{ fontSize: '12px', color: '#a3aed0' }}>Giao vật tư phục vụ thi công</div>
                                </div>
                            </div>
                            <div className={`radio-card radio-card-orange ${exportType === 'TO_WAREHOUSE' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setExportType('TO_WAREHOUSE')}>
                                <span style={{ fontSize: '20px' }}>🏭</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2b3674' }}>Chuyển sang Kho khác</div>
                                    <div style={{ fontSize: '12px', color: '#a3aed0' }}>Di chuyển vật tư giữa các kho</div>
                                </div>
                            </div>
                        </div>

                        {/* Chọn đích */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            {exportType === 'TO_PROJECT' ? (
                                <div className="form-group">
                                    <label>Chọn Dự án</label>
                                    <select className="form-input" value={exportProjectId} onChange={e => setExportProjectId(e.target.value)}>
                                        <option value="">-- Chọn dự án --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.project_code}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Kho đích</label>
                                    <select className="form-input" value={exportDestWarehouse} onChange={e => setExportDestWarehouse(e.target.value)}>
                                        <option value="">-- Chọn kho đích --</option>
                                        {warehouses.map(w => {
                                            const info = getWarehouseInfo(w.id);
                                            return <option key={w.id} value={w.id}>{w.name} (còn {info.remaining.toFixed(0)} m³)</option>;
                                        })}
                                    </select>
                                    {exportDestWarehouse && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                                            {(() => {
                                                const info = getWarehouseInfo(exportDestWarehouse);
                                                const pct = Math.min(100, (info.used / info.total) * 100);
                                                const after = Math.min(100, ((info.used + exportTotalSpace) / info.total) * 100);
                                                return <>
                                                    <div style={{ flex: 1, height: '6px', background: '#e0e5f2', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: '#4318FF', borderRadius: '3px' }}></div>
                                                        <div style={{ position: 'absolute', left: `${pct}%`, top: 0, height: '100%', width: `${Math.max(0, after - pct)}%`, background: '#FF6B35', opacity: 0.7, borderRadius: '3px' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '11px', color: '#a3aed0', whiteSpace: 'nowrap' }}>Còn {info.remaining.toFixed(1)} m³</span>
                                                </>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="form-group">
                                <label>Ghi chú (tùy chọn)</label>
                                <input className="form-input" placeholder="Lý do xuất kho..." value={exportNote} onChange={e => setExportNote(e.target.value)} />
                            </div>
                        </div>

                        {/* Chọn vật tư xuất */}
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b3674', marginBottom: '10px' }}>
                            Chọn vật tư và số lượng xuất:
                        </div>
                        <div style={{ border: '1px solid #e0e5f2', borderRadius: '12px', overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f4f7fe', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#a3aed0' }}>VẬT TƯ</th>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#a3aed0' }}>KHO</th>
                                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#a3aed0' }}>TỒN KHO</th>
                                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#a3aed0' }}>SL XUẤT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exportableInventory.map(item => {
                                        const qty = exportSelections[item.id] || '';
                                        const isOver = qty && Number(qty) > Number(item.current_stock);
                                        return (
                                            <tr key={item.id} style={{ borderTop: '1px solid #f4f7fe', background: qty ? '#fff8f5' : 'transparent' }}>
                                                <td style={{ padding: '10px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#2b3674', fontSize: '13px' }}>{item.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#a3aed0' }}>{item.sku}</div>
                                                </td>
                                                <td style={{ padding: '10px', fontSize: '13px', color: '#a3aed0' }}>
                                                    {warehouses.find(w => w.id == item.warehouse_id)?.name || 'N/A'}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: Number(item.current_stock) <= 0 ? '#EE5D50' : '#2b3674' }}>
                                                    {item.current_stock} {item.unit}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                                    <input
                                                        type="number" min="0" max={item.current_stock} step="1"
                                                        style={{ width: '90px', padding: '6px', borderRadius: '8px', border: `1px solid ${isOver ? '#EE5D50' : '#ddd'}`, textAlign: 'right', outline: 'none' }}
                                                        value={qty}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setExportSelections(prev => {
                                                                const updated = { ...prev };
                                                                if (!val || Number(val) === 0) delete updated[item.id];
                                                                else updated[item.id] = val;
                                                                return updated;
                                                            });
                                                        }}
                                                        placeholder="0"
                                                    />
                                                    {isOver && <div style={{ fontSize: '10px', color: '#EE5D50' }}>Vượt tồn kho!</div>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        {Object.keys(exportSelections).length > 0 && (
                            <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fff8f5', borderRadius: '10px', border: '1px solid #FFD5C2', display: 'flex', gap: '20px' }}>
                                <span style={{ fontWeight: 'bold', color: '#FF6B35', fontSize: '13px' }}>
                                    📦 {Object.keys(exportSelections).length} loại vật tư
                                </span>
                                <span style={{ fontWeight: 'bold', color: '#FF6B35', fontSize: '13px' }}>
                                    📐 Tổng thể tích: {exportTotalSpace.toFixed(2)} m³
                                </span>
                            </div>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsExportModalOpen(false)}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Hủy</button>
                            <button type="button" onClick={handleExport}
                                style={{ padding: '10px 25px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                🚚 Xác nhận Xuất kho
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== MODAL CHI TIẾT ======================== */}
            {isDetailModalOpen && selectedProductDetails && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setIsDetailModalOpen(false)}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '720px', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#2b3674', margin: 0 }}>📋 Chi tiết Vật tư</h2>
                            <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f8f9fa', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ margin: '5px 0' }}><strong>Tên vật tư:</strong> {selectedProductDetails.product.name}</p>
                                <p style={{ margin: '5px 0' }}><strong>Mã SKU:</strong> {selectedProductDetails.product.sku}</p>
                                <p style={{ margin: '5px 0' }}><strong>Loại hình:</strong> {selectedProductDetails.product.type === 'CONSUMABLE' ? 'Tiêu hao' : 'Thu hồi'}</p>
                                <p style={{ margin: '5px 0' }}><strong>Kho:</strong> {selectedProductDetails.product.warehouse_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '5px 0' }}><strong>Tồn kho:</strong> {selectedProductDetails.product.current_stock} {selectedProductDetails.product.unit || 'Cái'}</p>
                                <p style={{ margin: '5px 0' }}><strong>Giá nhập:</strong> {new Intl.NumberFormat('vi-VN').format(Number(selectedProductDetails.product.price || 0))}đ</p>
                                <p style={{ margin: '5px 0' }}><strong>Min Stock:</strong> {selectedProductDetails.product.min_stock_level}</p>
                                <p style={{ margin: '5px 0' }}><strong>Danh mục:</strong> {selectedProductDetails.product.category_name}</p>
                                <p style={{ margin: '5px 0' }}><strong>Thể tích/SP:</strong> {selectedProductDetails.product.space_coefficient} m³</p>
                            </div>
                        </div>

                        {selectedProductDetails.product.batches && selectedProductDetails.product.batches.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ color: '#2b3674', marginBottom: '10px' }}>📦 Chi tiết Lô hàng</h3>
                                <div style={{ border: '1px solid #e0e5f2', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f4f7fe' }}>
                                            <tr>
                                                <th style={{ padding: '8px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>TT LÔ</th>
                                                <th style={{ padding: '8px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>HẠN SỬ DỤNG</th>
                                                <th style={{ padding: '8px', textAlign: 'right', color: '#a3aed0', fontSize: '12px' }}>SỐ LƯỢNG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedProductDetails.product.batches.map((b, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid #e0e5f2' }}>
                                                    <td style={{ padding: '8px', fontSize: '12px' }}>Lô {idx + 1}</td>
                                                    <td style={{ padding: '8px', fontSize: '12px', color: b.hsd ? '#e53e3e' : '#a3aed0' }}>
                                                        {b.hsd ? new Date(b.hsd).toLocaleDateString('vi-VN') : 'Không có HSD'}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                                        {b.quantity} {selectedProductDetails.product.unit || 'Cái'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <h3 style={{ color: '#2b3674', marginBottom: '15px' }}>⏳ Lịch sử nhập/xuất kho</h3>
                        {selectedProductDetails.history.length === 0 ? (
                            <p style={{ color: '#a3aed0', textAlign: 'center', fontStyle: 'italic' }}>Chưa có lịch sử giao dịch nào.</p>
                        ) : (
                            <div style={{ border: '1px solid #e0e5f2', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f4f7fe' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>THỜI GIAN</th>
                                            <th style={{ padding: '12px', textAlign: 'center', color: '#a3aed0', fontSize: '12px' }}>LOẠI</th>
                                            <th style={{ padding: '12px', textAlign: 'right', color: '#a3aed0', fontSize: '12px' }}>SỐ LƯỢNG</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: '#a3aed0', fontSize: '12px' }}>NGUỒN / ĐỐI TƯỢNG</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProductDetails.history.map((h, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid #e0e5f2' }}>
                                                <td style={{ padding: '12px', fontSize: '13px' }}>
                                                    {h.date ? new Date(h.date).toLocaleString('vi-VN') : 'N/A'}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                                                        background: h.type === 'IN' ? '#e6fff1' : '#fff1f0',
                                                        color: h.type === 'IN' ? '#05CD99' : '#EE5D50'
                                                    }}>
                                                        {h.type === 'IN' ? '⬇ NHẬP' : '⬆ XUẤT'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2b3674' }}>
                                                    {h.type === 'IN' ? '+' : '-'}{h.quantity}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '13px', color: '#a3aed0' }}>
                                                    {h.supplier_name}
                                                    {h.note && <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>{h.note}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}