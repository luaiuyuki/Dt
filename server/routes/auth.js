import { Router } from 'express'
import { jwtSecret } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import db from '../db.js'
const router = Router()
router.post('/login', (req, res) => {
  const { tenDangNhap, matKhau } = req.body
  if (!tenDangNhap || !matKhau) return res.status(400).json({ error: 'Vui Lòng Điền Tên Đăng Nhập Và Mật Khẩu' })
  const user = db.prepare('SELECT * FROM taiKhoan WHERE tenDangNhap = ? AND trangThai = ?').get(tenDangNhap, 'hoatDong')
  if (!user) return res.status(401).json({ error: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu' })
  const valid = bcrypt.compareSync(matKhau, user.matKhau)
  if (!valid) return res.status(401).json({ error: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu' })
  const token = jwt.sign(
    { id: user.id, tenDangNhap: user.tenDangNhap, vaiTro: user.vaiTro, bacSiId: user.bacSiId },
    jwtSecret,
    { expiresIn: '24h' }
  )
  res.json({
    token,
    user: { id: user.id, tenDangNhap: user.tenDangNhap, vaiTro: user.vaiTro, bacSiId: user.bacSiId }
  })
})
export default router