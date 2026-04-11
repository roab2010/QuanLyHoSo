import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Đảm bảo tên hàm là ProductList
const ProductList = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/products-list')
            .then(res => setProducts(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div style={{ padding: '10px' }}>
            <h3>Danh mục vật tư tồn kho</h3>
            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#eee' }}>
                        <th>Tên vật tư</th>
                        <th>Đơn vị</th>
                        <th>Tồn hiện tại</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.unit}</td>
                            <td style={{ fontWeight: 'bold', color: p.current_stock < p.min_stock_level ? 'red' : 'green' }}>
                                {p.current_stock}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Dòng này phải đúng tên ProductList
export default ProductList;