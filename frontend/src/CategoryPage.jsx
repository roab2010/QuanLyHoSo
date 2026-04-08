import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu từ API
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="p-10 bg-[#f8fafc] min-h-screen font-sans">
      {/* Header Area */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <nav className="text-xs text-gray-400 uppercase mb-2">Hệ thống &gt; <span className="text-blue-600 font-bold">Quản lý danh mục</span></nav>
          <h1 className="text-3xl font-extrabold text-slate-800">Quản lý danh mục</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Cấu hình và tổ chức các nhóm hồ sơ xây dựng để tối ưu hóa quy trình lưu trữ và tra cứu thông tin chuyên nghiệp.
          </p>
        </div>
        <button className="bg-[#003884] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg transition-all text-sm font-semibold">
          <span className="text-xl mr-2">+</span> Thêm danh mục mới
        </button>
      </div>

      {/* Search & Table Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Thanh tìm kiếm giả (như hình 1) */}
        <div className="p-6 border-b border-slate-50">
           <div className="relative w-1/3">
              <input type="text" placeholder="Tìm kiếm danh mục..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
           </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-50">
              <th className="px-8 py-5 font-semibold">STT</th>
              <th className="px-4 py-5 font-semibold">Tên danh mục</th>
              <th className="px-4 py-5 font-semibold">Mô tả chi tiết</th>
              <th className="px-4 py-5 font-semibold">Trạng thái</th>
              <th className="px-8 py-5 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((cat, index) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6 text-sm text-slate-400 font-medium">
                  {(index + 1).toString().padStart(2, '0')}
                </td>
                <td className="px-4 py-6">
                  <div className="flex items-center">
                    {/* Icon giả như hình 1 */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4 text-blue-600">
                       🏢
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cat.category_code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-6 text-sm text-slate-500 leading-relaxed max-w-sm">
                  {cat.description || "Chưa có mô tả chi tiết cho danh mục này."}
                </td>
                <td className="px-4 py-6">
                  {cat.status === 1 ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-100">HOẠT ĐỘNG</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">TẠM NGƯNG</span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-slate-400 hover:text-blue-600">✏️</button>
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-slate-400 hover:text-red-500">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination giả (như hình 1) */}
        <div className="p-6 bg-slate-50/30 flex justify-between items-center border-t border-slate-50">
            <span className="text-xs font-bold text-slate-400 uppercase">Hiển thị {categories.length} trên tổng số 12 danh mục</span>
            <div className="flex gap-2">
               <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-900 text-white text-xs font-bold shadow-md shadow-blue-200">1</button>
               <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-50">2</button>
               <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-50">&gt;</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;