import jwt from 'jsonwebtoken'
const jwtSecret = process.env.jwtSecret || 'VAK42'
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token && process.env.env === 'test') {
    req.user = { id: 1, hoTen: 'VAK42', vaiTro: 'admin' }
    return next()
  }
  if (!token) return res.status(401).json({ error: 'Không Tìm Thấy Token Đăng Nhập' })
  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token Không Hợp Lệ Hoặc Đã Hết Hạn' })
  }
}
const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.vaiTro)) {
      return res.status(403).json({ error: 'Không Có Quyền Truy Cập' })
    }
    next()
  }
}
export {  verifyToken, verifyRole, jwtSecret  }