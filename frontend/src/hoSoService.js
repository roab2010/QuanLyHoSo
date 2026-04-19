import axios from "axios"; // THÊM DÒNG NÀY VÀO ĐẦU FILE
const API_URL = "http://127.0.0.1:8000/api";

import api from "./api";

/**
 * --- PHẦN HỒ SƠ (PROJECTS) ---
 */
export const getAllHoSo = async () => {
  try {
    const res = await api.get("/projects");
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Lỗi lấy danh sách hồ sơ:", error);
    return [];
  }
};

export const createHoSo = async (payload) => {
  const res = await api.post("/projects", payload);
  return res.data?.data ?? res.data;
};

export const updateTrangThai = async (id, statusValue) => {
  // Đảm bảo truyền đúng key 'status' và giá trị CHỮ HOA cho Backend Laravel
  return api.put(`/projects/${id}`, {
    status: statusValue,
  });
};

export const updateHoSo = async (id, payload) => {
  const res = await api.put(`/projects/${id}`, payload);
  return res.data?.data ?? res.data;
};

export const deleteHoSo = async (id) => {
  await api.delete(`/projects/${id}`);
};

/**
 * --- PHẦN LOẠI DỰ ÁN (CATEGORIES) ---
 */
let categoryCache = null;
let lastFetch = 0;

export const getAllCategories = async () => {
    const now = Date.now();
    if (categoryCache && (now - lastFetch < 30000)) {
        return categoryCache;
    }
    try {
        const res = await api.get("/categories");
        const data = res.data?.data ?? res.data;
        categoryCache = Array.isArray(data) ? data : [];
        lastFetch = now;
        return categoryCache;
    } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
        return [];
    }
};

export const createCategory = async (payload) => {
  const res = await api.post("/categories", payload);
  return res.data?.data ?? res.data;
};

export const updateCategory = async (id, payload) => {
  const res = await api.put(`/categories/${id}`, payload);
  return res.data?.data ?? res.data;
};

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`);
};

/**
 * --- PHẦN KHÁCH HÀNG (CUSTOMERS) ---
 */
export const getAllCustomers = async () => {
  try {
    const res = await api.get("/customers");
    // Luôn ép về mảng để không lỗi map
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Lỗi API Customer:", e);
    return [];
  }
};

export const getChiTietHoSo = async (id) => {
  try {
    const res = await api.get(`/projects/${id}`);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Lỗi lấy chi tiết hồ sơ:", error);
    return null;
  }
};

/**
 * --- PHẦN TASKS (TIẾN ĐỘ THI CÔNG) ---
 */
export const createTask = async (projectId, payload) => {
  const res = await api.post(`/projects/${projectId}/tasks`, payload);
  return res.data?.data ?? res.data;
};

export const updateTask = async (projectId, taskId, payload) => {
  const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, payload);
  return res.data?.data ?? res.data;
};

export const deleteTask = async (projectId, taskId) => {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
};

/**
 * --- PHẦN TÀI LIỆU ---
 */
export const uploadProjectDocument = async (payload) => {
  const res = await api.post("/documents/upload", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteProjectDocument = async (docId) => {
  const res = await api.delete(`/documents/${docId}`);
  return res.data;
};

export const updateProjectDocumentNew = async (docId, payload) => {
  const res = await api.post(`/documents/${docId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateDocument = async (projectId, docId, payload) => {
  const res = await api.put(
    `/projects/${projectId}/documents/${docId}`,
    payload,
  );
  return res.data?.data ?? res.data;
};

export const getDocumentsMetadata = async () => {
  try {
    const res = await api.get("/documents-metadata");
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy metadata tài liệu:", error);
    return { projects: [], types: [] };
  }
};


/**
 * --- PHẦN THÀNH VIÊN ---
 */
export const addMember = async (projectId, payload) => {
  const res = await api.post(`/projects/${projectId}/members`, payload);
  return res.data?.data ?? res.data;
};

export const removeMember = async (projectId, memberId) => {
  await api.delete(`/projects/${projectId}/members/${memberId}`);
};

/**
 * --- PHẦN VẬT TƯ DỰ ÁN (PROJECT MATERIALS) ---
 */

/**
 * Lấy danh sách vật tư đã xuất kho cho dự án (chưa hoàn trả đủ)
 */
export const getProjectExportedItems = async (projectId) => {
  try {
    const res = await api.get(`/inventory/project-items/${projectId}`);
    return res.data;
  } catch (e) {
    console.error("Lỗi lấy vật tư dự án:", e);
    return { success: false, items: [] };
  }
};

/**
 * Hoàn trả vật tư thừa từ dự án về kho
 */
export const returnItemsToWarehouse = async (payload) => {
  const res = await api.post(`/inventory/import-from-project`, payload);
  return res.data;
};

/**
 * Yêu cầu cấp vật tư cho dự án (Gửi trạng thái PENDING)
 */
export const requestProjectMaterials = async (payload) => {
  const res = await api.post(`/inventory/export`, { ...payload, status: 'PENDING' });
  return res.data;
};

/**
 * Lấy danh sách phiếu yêu cầu cấp vật tư đang chờ duyệt
 */
export const getPendingMaterialRequests = async () => {
  try {
    const res = await api.get('/inventory/pending-requests');
    return res.data;
  } catch (e) {
    console.error("Lỗi lấy danh sách phiếu chờ duyệt:", e);
    return { success: false, requests: [] };
  }
};

/**
 * Xử lý (Duyệt/Từ chối) phiếu yêu cầu vật tư
 */
export const processMaterialRequest = async (id, action) => {
  const res = await api.post(`/inventory/requests/${id}/process`, { action });
  return res.data;
};

/**
 * Lấy danh sách kho
 */
export const getAllWarehouses = async () => {
  try {
    const res = await api.get("/warehouses");
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Lỗi lấy kho:", e);
    return [];
  }
};

/**
 * Lấy danh sách vật tư tồn kho
 */
export const getAllInventoryItems = async () => {
  try {
    const res = await api.get("/inventory");
    const data = res.data?.inventory ?? res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Lỗi lấy danh sách tồn kho:", e);
    return [];
  }
};

/**
 * --- PHẦN NHÂN VIÊN ---
 */
export const getAllEmployees = async () => {
  try {
    const res = await api.get("/employees");
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Lỗi API Employee:", e);
    return [];
  }
};

export const getAllProjectPositions = async () => {
  try {
    const res = await api.get("/project-positions");
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Lỗi API Project Positions:", e);
    return [];
  }
};
export const getTemplatesByCategoryId = async (categoryId) => {
  try {
    const response = await api.get(`/template-tasks/category/${categoryId}`);

    // Vì Controller trả về { status: 'success', data: [...] }
    // nên ta lấy response.data (là cục JSON) để Modal tự xử lý tiếp
    return response.data;
  } catch (error) {
    console.error("Lỗi API getTemplates:", error);
    throw error;
  }
};

export const createTemplateTask = async (payload) => {
  try {
    const response = await api.post(`/template-tasks`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTemplateTask = async (id, payload) => {
  try {
    const response = await api.put(`/template-tasks/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTemplateTask = async (id) => {
  try {
    const response = await api.delete(`/template-tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * --- PHẦN TÀI LIỆU MẪU (THUỘC VỀ DANH MỤC) ---
 */
export const getTemplateDocsByCategoryId = async (categoryId) => {
  try {
    const response = await api.get(`/template-documents/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi API getTemplateDocs:", error);
    throw error;
  }
};

export const getDocumentTypes = async () => {
  try {
    const response = await api.get('/document-types');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Lỗi API getDocumentTypes:", error);
    return [];
  }
};

export const createTemplateDoc = async (payload) => {
  try {
    const response = await api.post(`/template-documents`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTemplateDoc = async (id, payload) => {
  try {
    const response = await api.put(`/template-documents/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTemplateDoc = async (id) => {
  try {
    const response = await api.delete(`/template-documents/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * --- NHẬT KÝ THI CÔNG (CONSTRUCTION LOGS) ---
 */
export const getConstructionLogs = async (projectId) => {
  try {
    const res = await api.get(`/projects/${projectId}/construction-logs`);
    return res.data;
  } catch (e) {
    console.error("Lỗi lấy nhật ký thi công:", e);
    return { success: false, logs: [] };
  }
};

export const createConstructionLog = async (projectId, formData) => {
  const res = await api.post(`/projects/${projectId}/construction-logs`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteConstructionLog = async (logId) => {
  const res = await api.delete(`/construction-logs/${logId}`);
  return res.data;
};

export const addLogImages = async (logId, formData) => {
  const res = await api.post(`/construction-logs/${logId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteLogImage = async (imageId) => {
  const res = await api.delete(`/construction-log-images/${imageId}`);
  return res.data;
};
