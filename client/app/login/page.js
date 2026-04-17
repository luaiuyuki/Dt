'use client'
import { useRouter } from 'next/navigation'
import { Smile } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
export default function LoginPage() {
  const router = useRouter()
  const [tenDangNhap, setTenDangNhap] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [error, setError] = useState('')
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', { tenDangNhap, matKhau })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('auth-change'))
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi Kết Nối')
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-sm rounded border-2 border-green-950 bg-white p-6 shadow hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        <h1 className="mb-6 flex justify-center items-center gap-2 text-2xl font-semibold text-green-950"><Smile size={28}/> DentalClinic</h1>
        {error && <div className="mb-4 rounded border-2 border-red-500 bg-red-50/50 p-3 text-sm font-medium text-red-600">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên Đăng Nhập</label>
            <input
              type="text"
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              className="w-full rounded border border-green-950 px-4 py-2 text-sm text-green-950 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-green-950/50"
              placeholder="Nhập Tên Đăng Nhập"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật Khẩu</label>
            <input
              type="password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className="w-full rounded border border-green-950 px-4 py-2 text-sm text-green-950 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-green-950/50"
              placeholder="Nhập Mật Khẩu"
              required
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer w-full rounded border-2 border-green-950 bg-green-950 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"
          >
            Đăng Nhập
          </button>
        </form>
      </div>
    </div>
  )
}