'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.vaiTro === 'admin') {
        router.replace('/dashboard')
      } else {
        router.replace('/benhNhan')
      }
    } else {
      router.replace('/login')
    }
  }, [router])
  return null
}