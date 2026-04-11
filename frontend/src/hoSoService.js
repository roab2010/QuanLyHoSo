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