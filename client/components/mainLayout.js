'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import sidebarComp from './sidebar'
const Sidebar = sidebarComp
export default function mainLayoutComp({ children, title, actions }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState(null)
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      if (!token || !storedUser) {
        if (pathname !== '/login') router.push('/login')
      } else {
        setUser(JSON.parse(storedUser))
        setIsAuth(true)
      }
    }
    checkAuth()
    window.addEventListener('auth-change', checkAuth)
    return () => window.removeEventListener('auth-change', checkAuth)
  }, [pathname, router])
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auth-change'))
    router.push('/login')
  }
  if (!isAuth && pathname !== '/login') return null
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-7 py-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-semibold text-green-950">{title}</h1>
          <div className="flex items-center gap-3">{actions}</div>
        </header>
        <main className="p-7 flex-1">{children}</main>
      </div>
    </div>
  )
}