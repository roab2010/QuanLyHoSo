import { useState, useEffect, useCallback } from 'react';
import {
    getAllHoSo,
    createHoSo,
    updateTrangThai,
    updateHoSo,
    deleteHoSo,
} from './hoSoService';

/**
 * 1. Ánh xạ trang_thai từ Database (ENUM viết hoa) → id cột kanban (viết thường)
 */
/* 1. Ánh xạ từ DB gửi về UI */
/**
 * 1. Ánh xạ từ DB (Viết hoa) → Cột UI
 */
const TRANG_THAI_MAP = {
    'DRAFT':      'new',
    'PENDING':    'new',
    'PROCESSING': 'processing',
    'REVISION':   'processing',
    'COMPLETED':  'done',
    'ON_HOLD':    'new', // Hoặc cột nào tùy bạn
};

/**
 * 2. Ánh xạ từ Cột UI → Gửi xuống Database (PHẢI VIẾT HOA)
 */
const COL_TO_TRANG_THAI = {
    new:        'DRAFT',      // Kéo vào "Mới tạo" gửi DRAFT
    processing: 'PROCESSING', // Kéo vào "Đang xử lý" gửi PROCESSING
    done:       'COMPLETED',  // Kéo vào "Hoàn thành" gửi COMPLETED
};

const normalize = (item) => ({
    id: item.id,
    ma_ho_so: item.project_code ?? `HS-${item.id}`,
    title: item.name ?? '(Không có tên)',
    sub: item.address ?? '',
    badge: (item.priority ?? 'MEDIUM').toUpperCase(),
    badgeClass: `badge-${(item.priority ?? 'medium').toLowerCase()}`,
    trang_thai: item.status,
    colId: TRANG_THAI_MAP[item.status] ?? 'new',
    date: item.start_date ?? '',
    avatar: item.name?.charAt(0).toUpperCase() ?? 'P',
    avatarBg: '#e0e7ff',
    avatarColor: '#3730a3',
    processing: item.status === 'PROCESSING' || item.status === 'REVISION',
    done: item.status === 'COMPLETED',
    waitText: '',
});
/**
 * Ánh xạ muc_do (Priority) → class CSS
 */
const MUC_DO_BADGE = {
    HIGH:   { label: 'CAO',        cls: 'badge-high'   },
    MEDIUM: { label: 'TRUNG BÌNH', cls: 'badge-medium' },
    LOW:    { label: 'THẤP',       cls: 'badge-low'    },
};

/** * 3. Chuẩn hóa dữ liệu từ API (name, project_code, status...) 
 */


export default function useHoSo() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* ── Lấy dữ liệu ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllHoSo();
            // Đảm bảo data là mảng trước khi map
            const rawData = Array.isArray(data) ? data : (data?.data ?? []);
            setCards(rawData.map(normalize));
        } catch (err) {
            setError(err?.response?.data?.message ?? 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Thêm mới ── */
    const themHoSo = async (payload) => {
    try {
        const dbPayload = {
            name: payload.ten,
            project_code: payload.ma_ho_so || `HS-${Date.now()}`, // Tạo mã tự động nếu trống
            address: payload.mo_ta,
            status: 'DRAFT',    // Khớp với ENUM của bạn
            priority: 'MEDIUM', // Khớp với ENUM của bạn
            start_date: payload.ngay_tao,
            
            // THÊM 2 DÒNG NÀY (Thay số 1 bằng ID thực tế bạn có trong DB)
            category_id: 1, 
            customer_id: 1,
            supervisor_id: 1
        };
        const created = await createHoSo(dbPayload);
        setCards((prev) => [...prev, normalize(created)]);
        return { ok: true };
    } catch (err) {
        // Log lỗi chi tiết ra console để dễ debug
        console.error("Lỗi tạo hồ sơ:", err.response?.data);
        return { ok: false, message: 'Lỗi tạo hồ sơ' };
    }
};

    /* ── Kéo thả (Cập nhật trạng thái) ── */
    const moveCard = async (cardId, newColId) => {
        const statusEnum = COL_TO_TRANG_THAI[newColId];
        if (!statusEnum) return;

        // Cập nhật giao diện lập tức (Optimistic UI)
        setCards((prev) =>
            prev.map((c) =>
                c.id === cardId
                    ? { ...c, colId: newColId, trang_thai: statusEnum, processing: newColId === 'processing', done: newColId === 'done' }
                    : c
            )
        );

        try {
            await updateTrangThai(cardId, statusEnum);
        } catch {
            // Nếu lỗi API, tải lại dữ liệu để đồng bộ
            fetchAll();
        }
    };

    const xoaHoSo = async (id) => {
        setCards((prev) => prev.filter((c) => c.id !== id));
        try {
            await deleteHoSo(id);
        } catch {
            fetchAll();
        }
    };

    const cardsByCol = (colId) => cards.filter((c) => c.colId === colId);

    return {
        cards,
        loading,
        error,
        fetchAll,
        themHoSo,
        moveCard,
        xoaHoSo,
        cardsByCol,
        COL_TO_TRANG_THAI,
    };
}