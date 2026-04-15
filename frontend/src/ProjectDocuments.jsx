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
                    width: 300px; 
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
                }
                .action-cell {
                    text-align: center;
                }
            `}</style>
            
            {/* Header & Thanh công cụ */}
            <div className="category-header">
                <h2 style={{margin: 0}}>Tủ hồ sơ điện tử</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

                    <button className="btn-add-cat" onClick={() => setShowUploadModal(true)} style={{marginLeft: '10px'}}>
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
                                <td className="action-cell">
                                    <button className="btn-edit" title="Sửa" onClick={() => handleEditClick(doc)}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" width="20" alt="Edit" />
                                    </button>
                                    <button className="btn-edit" style={{margin: '0 10px'}} title="Tải xuống" onClick={() => handleDownload(doc.file_url)}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/7268/7268609.png" width="20" alt="Download" />
                                    </button>
                                    <button className="btn-delete-small" title="Xóa" onClick={() => handleDelete(doc.id)}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png" width="20" alt="Delete" />
                                    </button>
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
        </div>
    );
}