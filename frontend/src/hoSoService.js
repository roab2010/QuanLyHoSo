import api from './api';

/**
 * --- PHẦN HỒ SƠ (PROJECTS) ---
 */
export const getAllHoSo = async () => {
    try {
        const res = await api.get('/projects');
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Lỗi lấy danh sách hồ sơ:", error);
        return [];
    }
};

export const createHoSo = async (payload) => {
    const res = await api.post('/projects', payload);
    return res.data?.data ?? res.data;
};

export const updateTrangThai = async (id, statusValue) => {
    // Đảm bảo truyền đúng key 'status' và giá trị CHỮ HOA cho Backend Laravel
    return api.put(`/projects/${id}`, { 
        status: statusValue 
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
export const getAllCategories = async () => {
    try {
        const res = await api.get('/categories');
        // Xử lý để luôn lấy được mảng dữ liệu dù Laravel có bọc trong 'data' hay không
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
        return [];
    }
};

export const createCategory = async (payload) => {
    const res = await api.post('/categories', payload);
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
        const res = await api.get('/customers');
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
    const res = await api.put(`/projects/${projectId}/documents/${docId}`, payload);
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
 * --- PHẦN NHÂN VIÊN ---
 */
export const getAllEmployees = async () => {
    try {
        const res = await api.get('/employees');
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Lỗi API Employee:", e);
        return [];
    }
};