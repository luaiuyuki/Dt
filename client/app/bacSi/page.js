'use client'
import { Plus, Stethoscope, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function BacSiPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ hoTen: '', chuyenKhoa: '', soDienThoai: '', email: '', luongCo: '', tyLeHoaHong: '', ngayBatDau: '', loaiNhanVien: 'bacSi' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const load = () => { setLoading(true); api.get('/bacSi').then((r) => { setList(r.data); setLoading(false) }) }
  useEffect(() => { load() }, [])
  const openAdd = () => { setForm({ hoTen: '', chuyenKhoa: '', soDienThoai: '', email: '', luongCo: '', tyLeHoaHong: '', ngayBatDau: '', loaiNhanVien: 'bacSi' }); setEditId(null); setShowModal(true) }
  const openEdit = (bs) => { setForm({ hoTen: bs.hoTen, chuyenKhoa: bs.chuyenKhoa || '', soDienThoai: bs.soDienThoai || '', email: bs.email || '', luongCo: bs.luongCo, tyLeHoaHong: bs.tyLeHoaHong, ngayBatDau: bs.ngayBatDau || '', loaiNhanVien: bs.loaiNhanVien || 'bacSi' }); setEditId(bs.id); setShowModal(true) }
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.hoTen.trim()) return alert('Vui Lòng Nhập Tên Nhân Viên')
    setSaving(true)
    try {
      if (editId) { await api.put(`/bacSi/${editId}`, { ...form, trangThai: 'hoatDong' }) } else { await api.post('/bacSi', form) }
      setShowModal(false); load()
    } finally { setSaving(false) }
  }
  const handleDeactivate = async (id) => { if (!confirm('Ngừng Hoạt Động Nhân Viên Này?')) return; await api.delete(`/bacSi/${id}`); load() }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫'
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout
      title="Quản Lý Nhân Sự"
      actions={
        <button onClick={openAdd} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
          <Plus size={16}/>Thêm Nhân Viên
        </button>
      }
    >
      <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Stethoscope size={40} className="mb-3 text-green-950/50"/>
            <p className="text-sm font-medium">Chưa Có Nhân Viên</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Họ & Tên</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Loại</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Chuyên Khoa</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Điện Thoại</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Lương Cố Định</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((bs) => (
                  <tr key={bs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{bs.hoTen}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bs.loaiNhanVien === 'bacSi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {bs.loaiNhanVien === 'bacSi' ? 'Bác Sĩ' : 'Lễ Tân'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{bs.chuyenKhoa || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{bs.soDienThoai || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-950">{fmtVnd(bs.luongCo)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(bs)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                            <Pencil size={16}/>
                        </button>
                        <button onClick={() => handleDeactivate(bs.id)} className="cursor-pointer px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors">Ngừng</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">{editId ? 'Cập Nhật Nhân Viên' : 'Thêm Nhân Viên Mới'}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelCls}>Họ & Tên *</label><input required className={inputCls} value={form.hoTen} onChange={f('hoTen')} placeholder="Nguyễn Văn A"/></div>
              <div className="col-span-2">
                <label className={labelCls}>Loại Nhân Viên *</label>
                <select className={inputCls} value={form.loaiNhanVien} onChange={f('loaiNhanVien')}>
                  <option value="bacSi">Bác Sĩ</option>
                  <option value="leTan">Lễ Tân</option>
                </select>
              </div>
              <div><label className={labelCls}>Chuyên Khoa / Vai Trò *</label><input required className={inputCls} value={form.chuyenKhoa} onChange={f('chuyenKhoa')} placeholder="Phục Hình / Lễ Tân..."/></div>
              <div><label className={labelCls}>Điện Thoại *</label><input required className={inputCls} value={form.soDienThoai} onChange={f('soDienThoai')} placeholder="09..."/></div>
              <div><label className={labelCls}>Email *</label><input required className={inputCls} type="email" value={form.email} onChange={f('email')} placeholder="nv@example.com"/></div>
              <div><label className={labelCls}>Ngày Bắt Đầu *</label><input required className={inputCls} type="date" value={form.ngayBatDau} onChange={f('ngayBatDau')}/></div>
              <div><label className={labelCls}>Lương Cố Định * (₫)</label><input required className={inputCls} type="number" value={form.luongCo} onChange={f('luongCo')} placeholder="10000000"/></div>
              <div><label className={labelCls}>Hoa Hồng * (%)</label><input required className={inputCls} type="number" value={form.tyLeHoaHong} onChange={f('tyLeHoaHong')} placeholder="0"/></div>
              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                  {saving ? 'Đang Lưu...' : 'Lưu Thông Tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}