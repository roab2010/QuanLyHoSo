import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function ProjectDocuments() {
    // 1. State quản lý dữ liệu
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]); 
    const [docTypes, setDocTypes] = useState([]); 
    const [loading, setLoading] = useState(true);

    // 2. State quản lý Tìm kiếm & Bộ lọc
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProject, setFilterProject] = useState("");
    const [filterType, setFilterType] = useState("");

    // 3. State quản lý Modal Upload và Sửa
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editDocId, setEditDocId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [newDoc, setNewDoc] = useState({ 
        name: '', 
        project_id: '', 
        type: '', 
        note: '',
        file: null 
    });

    // 4. Gọi API lấy dữ liệu
    const fetchMetadata = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/documents-metadata`);
            setProjects(res.data.projects || []);
            setDocTypes(res.data.types || []);
        } catch (err) {
            console.error("Lỗi lấy metadata:", err);
        }
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                project_id: filterProject,
                category: filterType
            };
            const res = await axios.get(`${API_BASE_URL}/all-documents`, { params });
            setDocuments(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách tài liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDocuments();
        }, 300); // Debounce search
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterProject, filterType]);

    // 5. Xử lý hành động
    const handleFileChange = (e) => {
        setNewDoc({ ...newDoc, file: e.target.files[0] });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newDoc.file) return alert("Vui lòng chọn tệp tin!");

        setUploading(true);
        const formData = new FormData();
        formData.append('file', newDoc.file);
        formData.append('document_name', newDoc.name);
        formData.append('project_id', newDoc.project_id);
        formData.append('category_name', newDoc.type);
        formData.append('note', newDoc.note);

        try {
            const res = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            setShowUploadModal(false);
            setNewDoc({ name: '', project_id: '', type: '', note: '', file: null });
            fetchDocuments();
        } catch (err) {
            alert(err.response?.data?.error || "Lỗi khi tải lên!");
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = (doc) => {
        setNewDoc({
            name: doc.document_name,
            project_id: doc.project_id,
            type: doc.category_name,
            note: doc.note || '',
            file: null
        });
        setEditDocId(doc.id);
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData();
        if (newDoc.file) formData.append('file', newDoc.file);
        formData.append('document_name', newDoc.name);
        formData.append('project_id', newDoc.project_id);
        formData.append('category_name', newDoc.type);
        formData.append('note', newDoc.note);

        try {
            const res = await axios.post(`${API_BASE_URL}/documents/${editDocId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            setShowEditModal(false);
            setEditDocId(null);
            setNewDoc({ name: '', project_id: '', type: '', note: '', file: null });
            fetchDocuments();
        } catch (err) {
            alert(err.response?.data?.error || "Lỗi khi cập nhật!");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/documents/${id}`);
            fetchDocuments();
        } catch (err) {
            alert("Lỗi khi xóa tài liệu!");
        }
    };

    const handleDownload = (fileUrl) => {
        // fileUrl thường có dạng /storage/documents/...
        window.open(`http://127.0.0.1:8000${fileUrl}`, '_blank');
    };

    return (
        <div className="category-container" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                .header-search { 
                    width: 200px; 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    transition: all 0.3s;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                }
                .header-search input {
                    border: none;
                    outline: none;
                    background: transparent;
                    flex: 1;
                    padding: 8px 0;
                    font-size: 14px;
                    color: #1e293b;
                }
                .v3-select-custom {
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #4b5563;
                    font-size: 14px;
                    cursor: pointer;
                    margin-left: 10px;
                    max-width: 150px;
                    text-overflow: ellipsis;
                }
                .action-cell {
                    text-align: center;
                }
            `}</style>
            
            {/* Header & Thanh công cụ */}
            <div className="category-header" style={{ display: 'flex', flexWrap: 'nowrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, whiteSpace: 'nowrap', minWidth: 'fit-content' }}>Quản lý tài liệu</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'nowrap', flex: 1, justifyContent: 'flex-end' }}>
                    <div className="header-search">
                        <span className="material-symbols-outlined" style={{color: '#a3aed0', marginRight: '5px', fontSize: '18px'}}>search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm tên tài liệu..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="v3-select-custom"
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                    >
                        <option value="">-- Tất cả dự án --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select 
                        className="v3-select-custom"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">-- Tất cả loại --</option>
                        {docTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>

                    <button className="btn-add-cat" onClick={() => setShowUploadModal(true)} style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}>
                        + Tải tài liệu
                    </button>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <table className="category-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px' }}>STT</th>
                        <th>Tên tài liệu</th>
                        <th>Thuộc dự án</th>
                        <th>Loại tài liệu</th>
                        <th style={{textAlign: 'center'}}>Trạng thái</th>
                        <th style={{ textAlign: 'center' }}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                         <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px', color: '#a3aed0' }}>Đang tải dữ liệu...</td></tr>
                    ) : documents.length > 0 ? (
                        documents.map((doc, index) => (
                            <tr key={doc.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc.document_name}</span>
                                        {doc.note && <small style={{ color: '#64748b', fontSize: '12px' }}>{doc.note}</small>}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ color: '#2563eb', fontWeight: '500' }}>{doc.project?.name || "N/A"}</span>
                                </td>
                                <td>
                                    <span style={{ color: '#64748b' }}>{doc.category_name}</span>
                                </td>
                                <td style={{textAlign: 'center'}}>
                                    <span className={`status-badge ${doc.status === 'COMPLETED' ? "active" : "inactive"}`}>
                                        {doc.status === 'COMPLETED' ? "Hoàn thành" : doc.status === 'PENDING' ? "Chờ duyệt" : doc.status === 'PROCESSING' ? "Đang xử lý" : "Cần sửa"}
                                    </span>
                                </td>
                                <td className="action-cell" style={{ verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                        {doc.file_url && (
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
                                        )}
                                        <button
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: '#fef3c7', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                            title="Sửa"
                                            onClick={() => handleEditClick(doc)}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#fde68a'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#fef3c7'}
                                        >
                                            <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" width="18" alt="Edit" style={{ filter: "opacity(0.8)" }} />
                                        </button>
                                        <button
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: '#fee2e2', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                            title="Xóa"
                                            onClick={() => handleDelete(doc.id)}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        >
                                            <img src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png" width="18" alt="Delete" style={{ filter: "opacity(0.8)" }} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#a3aed0' }}>
                                Không tìm thấy tài liệu phù hợp.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* MODAL UPLOAD (DUNG CHUNG STYLE V3) */}
            {showUploadModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '450px' }}>
                        <h4 className="modal-title" style={{ marginBottom: '20px', fontSize: '20px' }}>Tải tài liệu mới lên</h4>
                        <form onSubmit={handleUpload}>
                            <div className="form-group">
                                <label>Tên tài liệu</label>
                                <input required className="form-control" name="document_name" placeholder="Nhập tên tài liệu..." value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chọn dự án</label>
                                <select required className="form-control" name="project_id" value={newDoc.project_id} onChange={e => setNewDoc({...newDoc, project_id: e.target.value})}>
                                    <option value="">-- Chọn dự án --</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Loại tài liệu</label>
                                <select required className="form-control" name="category_name" value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})}>
                                    <option value="">-- Chọn loại --</option>
                                    {docTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú (nếu có)</label>
                                <input className="form-control" name="note" placeholder="VD: Bản vẽ kỹ thuật móng..." value={newDoc.note} onChange={e => setNewDoc({...newDoc, note: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chọn file tài liệu</label>
                                <input type="file" required className="form-control" style={{ padding: '8px' }} onChange={handleFileChange} />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '20px', padding: '0' }}>
                                <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-submit-form" style={{ background: '#2563eb' }} disabled={uploading}>
                                    {uploading ? "Đang tải lên..." : "Tải lên hệ thống"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '450px' }}>
                        <h4 className="modal-title" style={{ marginBottom: '20px', fontSize: '20px' }}>Sửa thông tin tài liệu</h4>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Tên tài liệu</label>
                                <input required className="form-control" name="document_name" placeholder="Nhập tên tài liệu..." value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chọn dự án</label>
                                <select required className="form-control" name="project_id" value={newDoc.project_id} onChange={e => setNewDoc({...newDoc, project_id: e.target.value})}>
                                    <option value="">-- Chọn dự án --</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Loại tài liệu</label>
                                <select required className="form-control" name="category_name" value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})}>
                                    <option value="">-- Chọn loại --</option>
                                    {docTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú (nếu có)</label>
                                <input className="form-control" name="note" placeholder="VD: Bản vẽ kỹ thuật móng..." value={newDoc.note} onChange={e => setNewDoc({...newDoc, note: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chọn file tài liệu (Để trống nếu không muốn đổi)</label>
                                <input type="file" className="form-control" style={{ padding: '8px' }} onChange={handleFileChange} />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '20px', padding: '0' }}>
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-submit-form" style={{ background: '#2563eb' }} disabled={uploading}>
                                    {uploading ? "Đang cập nhật..." : "Lưu thay đổi"}
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
        </div>
    );
}