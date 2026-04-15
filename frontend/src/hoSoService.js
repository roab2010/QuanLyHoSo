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
export const updateDocument = async (projectId, docId, payload) => {
  const res = await api.put(
    `/projects/${projectId}/documents/${docId}`,
    payload,
  );
  return res.data?.data ?? res.data;
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
    const response = await axios.get(
      `${API_URL}/template-tasks/category/${categoryId}`,
    );
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
    const response = await axios.post(`${API_URL}/template-tasks`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTemplateTask = async (id, payload) => {
  try {
    const response = await axios.put(
      `${API_URL}/template-tasks/${id}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTemplateTask = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/template-tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
