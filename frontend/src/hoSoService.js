import api from './api';

/**
 * Lấy toàn bộ hồ sơ
 * GET /ho-so
 * Response mong đợi: { data: HoSo[] }
 * hoặc mảng trực tiếp: HoSo[]
 */
export const getAllHoSo = async () => {
    const res = await api.get('/projects');
    // Hỗ trợ cả 2 dạng response của Laravel
    return res.data?.data ?? res.data;
};

/**
 * Tạo hồ sơ mới
 * POST /ho-so
 * Body: { ten, mo_ta, muc_do, trang_thai, ngay_tao }
 */
export const createHoSo = async (payload) => {
    const res = await api.post('/projects', payload);
    return res.data?.data ?? res.data;
};

/**
 * Cập nhật trạng thái (dùng khi kéo thả)
 * PATCH /ho-so/{id}
 * Body: { trang_thai: 'moi_tao' | 'dang_xu_ly' | 'hoan_thanh' }
 */
export const updateTrangThai = async (id, statusValue) => {
    // Đảm bảo truyền đúng key 'status' và value là CHỮ HOA
    return api.put(`/projects/${id}`, { 
        status: statusValue 
    });
};
/**
 * Cập nhật toàn bộ thông tin hồ sơ
 * PUT /ho-so/{id}
 */
export const updateHoSo = async (id, payload) => {
    const res = await api.put(`/projects/${id}`, payload);
    return res.data?.data ?? res.data;
};

/**
 * Xóa hồ sơ
 * DELETE /ho-so/{id}
 */
export const deleteHoSo = async (id) => {
    await api.delete(`/projects/${id}`);
};