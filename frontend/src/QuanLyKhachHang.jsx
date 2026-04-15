import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // Đảm bảo import đúng file CSS tổng của bạn

export default function QuanLyKhachHang() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Quản lý Modal và Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null); 
    const [formData, setFormData] = useState({ 
        full_name: "", 
        email: "", 
        phone: "", 
        password: "",
        address: ""
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/customers");
            if (res.data.status === "success") {
                setCustomers(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi fetch:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({ 
                full_name: customer.full_name, 
                email: customer.email, 
                phone: customer.phone || "",
                address: customer.address || "",
                password: "" // Để trống mật khẩu khi sửa
            });
        } else {
            setEditingCustomer(null);
            setFormData({ 
                full_name: "", 
                email: "", 
                phone: "", 
                password: "",
                address: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                // Sửa khách hàng
                await axios.post(`http://127.0.0.1:8000/api/customer/profile/${editingCustomer.id}`, formData);
            } else {
                // Thêm khách hàng mới
                await axios.post("http://127.0.0.1:8000/api/customers", formData);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Thao tác thất bại"));
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="main-inner" style={{ padding: "32px" }}>
            <div className="customer-header">
                <div>
                    <h3 className="header-title">Quản lý khách hàng</h3>
                    <p className="header-subtitle">Thực hiện các thao tác quản trị đối tác</p>
                </div>
                <div className="header-actions">
                    <div className="header-search">
                        <span className="material-symbols-outlined">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-add-customer" onClick={() => handleOpenModal()}>
                        + Thêm khách hàng
                    </button>
                </div>
            </div>

            {loading ? <div className="v3-msg">Đang tải...</div> : (
                <div className="customer-table-container">
                    <table className="v3-table-clean">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '40px' }}>Khách hàng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Địa chỉ</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right', paddingRight: '40px' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="customer-row-v3">
                                    <td style={{ paddingLeft: '40px' }}>
                                        <div className="customer-cell">
                                            <div className="customer-avatar-v3">
                                                {customer.image ? (
                                                    <img src={customer.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    customer.full_name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="customer-name-v3">{customer.full_name}</span>
                                                <small className="customer-id">#{customer.customer_code || customer.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="customer-mail-v3">{customer.email}</span>
                                    </td>
                                    <td>
                                        <span className="customer-phone-v3">{customer.phone || "N/A"}</span>
                                    </td>
                                    <td>
                                        <span className="customer-address-v3">{customer.address || "Chưa có"}</span>
                                    </td>
                                    <td><span className="v3-st-active">Hoạt động</span></td>
                                    <td style={{ paddingRight: '40px' }}>
                                        <div className="action-group-v3">
                                            <button className="btn-action-v3 edit" onClick={() => handleOpenModal(customer)}>
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className="modal-title">{editingCustomer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</h4>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Họ tên khách hàng</label>
                                <input className="form-control" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Nhập địa chỉ" />
                            </div>

                            <div className="form-group">
                                <label>Mật khẩu {editingCustomer && "(Để trống nếu không đổi)"}</label>
                                <input 
                                    className="form-control" 
                                    type="password" 
                                    placeholder={editingCustomer ? "Nhập mật khẩu mới nếu muốn đổi" : "Đặt mật khẩu đăng nhập"}
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required={!editingCustomer} 
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-submit-form">{editingCustomer ? "Cập nhật" : "Tạo khách hàng"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}