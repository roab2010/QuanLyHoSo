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

const normalize = (item) => {
    const priority = item?.priority || 'MEDIUM';
    const status = item?.status || 'DRAFT';
    const name = item?.name || '(Không có tên)';

    return {
        id: item?.id,
        ma_ho_so: item?.project_code ?? `HS-${item?.id}`,
        title: name,
        sub: item?.address ?? '',
        badge: priority.toUpperCase(),
        badgeClass: `badge-${priority.toLowerCase()}`,
        trang_thai: status,
        colId: TRANG_THAI_MAP[status] ?? 'new',
        date: item?.start_date ?? '',
        created_at: item?.created_at ?? item?.start_date ?? '',
        category_name: item?.category?.name ?? 'Không phân loại',
        avatar: name !== '(Không có tên)' ? name.charAt(0).toUpperCase() : 'P',
        avatarBg: '#e0e7ff',
        avatarColor: '#3730a3',
        processing: status === 'PROCESSING' || status === 'REVISION',
        done: status === 'COMPLETED',
        expected_end_date: item?.expected_end_date ?? '',
        estimated_budget: item?.estimated_budget ?? 0,
        contract_value: item?.contract_value ?? 0,
        waitText: '',
    };
};
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
            name: payload.name,
            project_code: payload.project_code || `HS-${Date.now()}`,
            address: payload.address,
            status: payload.status || 'DRAFT',    
            priority: payload.priority || 'MEDIUM', 
            start_date: payload.start_date,
            category_id: payload.category_id, 
            customer_id: payload.customer_id,
            max_warehouse_capacity: payload.max_warehouse_capacity || 0,
            supervisor_id: payload.supervisor_id || 1,
            expected_end_date: payload.expected_end_date,
            estimated_budget: payload.estimated_budget || 0,
            contract_value: payload.contract_value || 0
        };
        const created = await createHoSo(dbPayload);
        setCards((prev) => [...prev, normalize(created)]);
        return { ok: true };
    } catch (err) {
        // Log lỗi chi tiết ra console để dễ debug
        console.error("Lỗi tạo hồ sơ chi tiết:", err);
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Lỗi tạo hồ sơ";
        return { ok: false, message: 'Lỗi: ' + errorMsg };
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
        try {
            await deleteHoSo(id);
            setCards((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            fetchAll();
            throw err;
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