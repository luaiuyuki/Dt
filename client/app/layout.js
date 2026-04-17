import './globals.css'
export const metadata = {
  title: 'DentalClinic - Phần Mềm Quản Lý Phòng Khám',
  description: 'Hệ Thống Quản Lý Phòng Khám Nha Khoa Toàn Diện',
}
export default function rootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">{children}</body>
    </html>
  )
}