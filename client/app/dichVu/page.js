'use client'
import { Plus, Activity, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function DichVuPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ tenDichVu: '', moTa: '', donGia: '', nhom: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const load = () => { setLoading(true); api.get('/dichVu').then((r) => { setList(r.data); setLoading(false) }) }
  useEffect(() => { load() }, [])
  const openAdd = () => { setForm({ tenDichVu: '', moTa: '', donGia: '', nhom: '' }); setEditId(null); setShowModal(true) }
  const openEdit = (dv) => { setForm({ tenDichVu: dv.tenDichVu, moTa: dv.moTa || '', donGia: dv.donGia, nhom: dv.nhom || '' }); setEditId(dv.id); setShowModal(true) }
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.tenDichVu || !form.donGia) return alert('Vui Lòng Điền Tên Và Đơn Giá')
    setSaving(true)
    try {
      if (editId) { await api.put(`/dichVu/${editId}`, { ...form, trangThai: 'hoatDong' }) } else { await api.post('/dichVu', form) }
      setShowModal(false); load()
    } finally { setSaving(false) }
  }
  const handleDeactivate = async (id) => { if (!confirm('Ngừng Cung Cấp Dịch Vụ Này?')) return; await api.delete(`/dichVu/${id}`); load() }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫'
  const grouped = list.reduce((acc, dv) => {
    const nhom = dv.nhom || 'Chưa Phân Nhóm'
    if (!acc[nhom]) acc[nhom] = []
    acc[nhom].push(dv)
    return acc
  }, {})
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout
      title="Dịch Vụ & Phí"
      actions={
        <button onClick={openAdd} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
          <Plus size={16}/>Thêm Dịch Vụ
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white border-2 border-green-950 rounded flex flex-col items-center justify-center h-48 text-gray-500 shadow-sm">
          <Activity size={40} className="mb-3 text-green-950/50"/>
          <p className="text-sm font-medium">Chưa Có Dịch Vụ Nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([nhom, dvs]) => (
            <div key={nhom} className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <span className="text-base font-semibold text-green-950">{nhom}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-950/10 text-green-950">{dvs.length} Dịch Vụ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 bg-white">
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Tên Dịch Vụ</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Mô Tả</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Đơn Giá</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Trạng Thái</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dvs.map((dv) => (
                      <tr key={dv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{dv.tenDichVu}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{dv.moTa || '—'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-950">{fmtVnd(dv.donGia)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${dv.trangThai === 'hoatDong' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {dv.trangThai === 'hoatDong' ? 'Đang Cung Cấp' : 'Tạm Dừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(dv)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                              <Pencil size={16}/>
                            </button>
                            <button onClick={() => handleDeactivate(dv.id)} className="cursor-pointer px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors">Ngừng</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-md shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">{editId ? 'Cập Nhật Dịch Vụ' : 'Thêm Dịch Vụ Mới'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className={labelCls}>Tên Dịch Vụ *</label><input required className={inputCls} value={form.tenDichVu} onChange={f('tenDichVu')} placeholder="Nhổ Răng, Trám Răng..."/></div>
              <div><label className={labelCls}>Nhóm *</label><input required className={inputCls} value={form.nhom} onChange={f('nhom')} placeholder="Phẫu Thuật, Thẩm Mỹ..."/></div>
              <div><label className={labelCls}>Đơn Giá (₫) *</label><input required className={inputCls} type="number" value={form.donGia} onChange={f('donGia')} placeholder="500000"/></div>
              <div><label className={labelCls}>Mô Tả *</label><textarea required className={inputCls} value={form.moTa} onChange={f('moTa')} rows={3} placeholder="Mô Tả Ngắn Về Dịch Vụ..."/></div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
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