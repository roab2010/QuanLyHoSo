import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfessionalInventory = () => {
    const [products, setProducts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        type: 'import',
        project_id: '',
        supplier_id: '',
        note: '',
        items: [{ product_id: '', quantity: 1, price: 0 }]
    });

    useEffect(() => {
        axios.get('http://localhost:8000/api/products-list')
            .then(res => setProducts(res.data))
            .catch(err => console.error("Lỗi API Vật tư:", err));

        axios.get('http://localhost:8000/api/projects')
            .then(res => setProjects(res.data))
            .catch(err => console.warn("Dự án chưa có data"));

        axios.get('http://localhost:8000/api/suppliers')
            .then(res => setSuppliers(res.data))
            .catch(err => console.warn("Nhà cung cấp chưa có data"));

        setLoading(false);
    }, []);

    const addItem = () => {
        setForm({...form, items: [...form.items, { product_id: '', quantity: 1, price: 0 }]});
    };

    const removeItem = (index) => {
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index][field] = value;
        if (field === 'product_id') {
            const selectedProd = products.find(p => p.id == value);
            newItems[index].price = selectedProd ? selectedProd.price : 0;
        }
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async () => {
        // Chỉ bắt lỗi chọn Dự án khi đang ở chế độ XUẤT
        if (form.type === 'export' && !form.project_id) {
            return alert("Vui lòng chọn Dự án cần xuất vật tư!");
        }
        
        try {
            const response = await axios.post('http://localhost:8000/api/inventory/store', form);
            alert(response.data.message);
            window.location.reload(); 
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu phiếu!");
        }
    };

    if (loading) return <div>Đang tải dữ liệu hệ thống...</div>;

    return (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '20px' }}>
                {form.type === 'import' ? '📥 NHẬP HÀNG VỀ KHO' : '📤 XUẤT HÀNG ĐI DỰ ÁN'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* 1. Chọn loại giao dịch */}
                <div>
                    <label><b>Loại giao dịch:</b></label><br/>
                    <select 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }} 
                        value={form.type} 
                        onChange={e => setForm({ ...form, type: e.target.value, project_id: '', supplier_id: '' })}
                    >
                        <option value="import">Nhập kho (Tăng tồn)</option>
                        <option value="export">Xuất đi dự án (Giảm tồn)</option>
                    </select>
                </div>

                {/* 2. Logic ẩn hiện thông minh */}
                {form.type === 'import' ? (
                    /* Nếu là NHẬP: Hiện Nhà cung cấp */
                    <div>
                        <label><b>Nhà cung cấp:</b></label><br/>
                        <select 
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }} 
                            value={form.supplier_id} 
                            onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                        >
                            <option value="">-- Chọn nhà cung cấp --</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                ) : (
                    /* Nếu là XUẤT: Hiện Dự án */
                    <div>
                        <label><b>Xuất cho Dự án:</b></label><br/>
                        <select 
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }} 
                            value={form.project_id} 
                            onChange={e => setForm({ ...form, project_id: e.target.value })}
                        >
                            <option value="">-- Chọn dự án nhận hàng --</option>
                            {projects.map(pj => <option key={pj.id} value={pj.id}>{pj.name}</option>)}
                        </select>
                    </div>
                )}

                {/* 3. Ghi chú chung */}
                <div>
                    <label><b>Ghi chú:</b></label><br/>
                    <input 
                        type="text" 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }} 
                        placeholder="Lý do nhập/xuất..."
                        value={form.note}
                        onChange={e => setForm({ ...form, note: e.target.value })}
                    />
                </div>
            </div>

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                        <th>Tên vật tư</th>
                        <th>Số lượng</th>
                        <th>Đơn giá vốn</th>
                        <th>Thành tiền</th>
                        <th width="50">Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    {form.items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <select 
                                    style={{ width: '100%', padding: '5px' }} 
                                    value={item.product_id} 
                                    onChange={e => updateItem(index, 'product_id', e.target.value)}
                                >
                                    <option value="">-- Chọn vật tư --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Tồn: {p.current_stock})</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input 
                                    type="number" 
                                    style={{ width: '80px', padding: '5px' }} 
                                    value={item.quantity} 
                                    onChange={e => updateItem(index, 'quantity', e.target.value)} 
                                />
                            </td>
                            <td>{Number(item.price).toLocaleString()}đ</td>
                            <td style={{ fontWeight: 'bold' }}>{(item.quantity * item.price).toLocaleString()}đ</td>
                            <td>
                                <button onClick={() => removeItem(index)} style={{ color: 'white', background: '#e74c3c', border: 'none', borderRadius: '3px', padding: '5px 10px', cursor: 'pointer' }}>×</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={addItem} style={{ padding: '10px 20px', cursor: 'pointer', background: '#34495e', color: 'white', border: 'none', borderRadius: '5px' }}>
                    + Thêm vật tư
                </button>
                
                <button 
                    onClick={handleSubmit} 
                    style={{ 
                        padding: '12px 40px', 
                        cursor: 'pointer', 
                        background: form.type === 'import' ? '#27ae60' : '#e67e22', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    XÁC NHẬN {form.type === 'import' ? 'NHẬP KHO' : 'XUẤT KHO'}
                </button>
            </div>
        </div>
    );
};

export default ProfessionalInventory;