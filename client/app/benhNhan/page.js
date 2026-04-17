'use client'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function BenhNhanPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ hoTen: '', ngaySinh: '', gioiTinh: 'Nam', soDienThoai: '', diaChi: '', tienSuBenh: '', diUng: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const load = (s = '') => {
    setLoading(true)
    api.get('/benhNhan', { params: { search: s } }).then((r) => { setList(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  const handleSearch = (e) => { setSearch(e.target.value); load(e.target.value) }
  const openAdd = () => { setForm({ hoTen: '', ngaySinh: '', gioiTinh: 'Nam', soDienThoai: '', diaChi: '', tienSuBenh: '', diUng: '' }); setEditId(null); setShowModal(true) }
  const openEdit = (bn) => { setForm({ hoTen: bn.hoTen, ngaySinh: bn.ngaySinh || '', gioiTinh: bn.gioiTinh || 'Nam', soDienThoai: bn.soDienThoai || '', diaChi: bn.diaChi || '', tienSuBenh: bn.tienSuBenh || '', diUng: bn.diUng || '' }); setEditId(bn.id); setShowModal(true) }
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.hoTen.trim()) return alert('Vui Lòng Nhập Tên Bệnh Nhân')
    setSaving(true)
    try {
      if (editId) { await api.put(`/benhNhan/${editId}`, form) } else { await api.post('/benhNhan', form) }
      setShowModal(false); load(search)
    } finally { setSaving(false) }
  }
  const handleDelete = async (id) => { if (!confirm('Xóa Bệnh Nhân Này?')) return; await api.delete(`/benhNhan/${id}`); load(search) }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout
      title="Hồ Sơ Bệnh Nhân"
      actions={
        <button onClick={openAdd} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
          <Plus size={16}/>Thêm Bệnh Nhân
        </button>
      }
    >
      <div className="bg-white border-2 border-green-950 rounded p-4 mb-6 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-gray-400"/>
        <input className="bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none flex-1" placeholder="Tìm Kiếm Bệnh Nhân Theo Tên Hoặc SĐT..." value={search} onChange={handleSearch}/>
      </div>
      <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-green-950">
            <div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Search size={40} className="mb-3 text-green-950/50"/>
            <p className="text-sm font-medium">Chưa Có Bệnh Nhân</p>
            <p className="text-xs mt-1 text-gray-400">Nhấn "Thêm Bệnh Nhân" Để Bắt Đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Họ & Tên</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Ngày Sinh</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Giới Tính</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Điện Thoại</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Địa Chỉ</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((bn) => (
                  <tr key={bn.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold">
                      <Link href={`/benhNhan/${bn.id}`} className="text-green-950 hover:text-green-700 underline underline-offset-2">{bn.hoTen}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{bn.ngaySinh || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{bn.gioiTinh || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{bn.soDienThoai || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{bn.diaChi || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(bn)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                          <Pencil size={16}/>
                        </button>
                        <button onClick={() => handleDelete(bn.id)} className="cursor-pointer p-1.5 text-red-400 hover:text-red-700 transition-colors rounded hover:bg-red-50">
                          <Trash2 size={16}/>
                        </button>
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
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">{editId ? 'Cập Nhật Bệnh Nhân' : 'Thêm Bệnh Nhân Mới'}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Họ & Tên *</label>
                <input required className={inputCls} value={form.hoTen} onChange={f('hoTen')} placeholder="Nguyễn Văn A"/>
              </div>
              <div>
                <label className={labelCls}>Ngày Sinh *</label>
                <input required className={inputCls} type="date" value={form.ngaySinh} onChange={f('ngaySinh')}/>
              </div>
              <div>
                <label className={labelCls}>Giới Tính *</label>
                <select required className={inputCls} value={form.gioiTinh} onChange={f('gioiTinh')}>
                  <option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Số Điện Thoại *</label>
                <input required className={inputCls} value={form.soDienThoai} onChange={f('soDienThoai')} placeholder="09..."/>
              </div>
              <div>
                <label className={labelCls}>Địa Chỉ *</label>
                <input required className={inputCls} value={form.diaChi} onChange={f('diaChi')} placeholder="123 ABC..."/>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tiền Sử Bệnh Lý *</label>
                <textarea required className={inputCls} rows={2} value={form.tienSuBenh} onChange={f('tienSuBenh')} placeholder="Huyết Áp, Tim Mạch, Tiểu Đường..."/>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Dị Ứng *</label>
                <textarea required className={inputCls} rows={2} value={form.diUng} onChange={f('diUng')} placeholder="Các Loại Thuốc..."/>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-gray-100 col-span-2">
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