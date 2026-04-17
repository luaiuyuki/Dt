import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM dichVu ORDER BY nhom, tenDichVu').all())
})
router.post('/', (req, res) => {
  const { tenDichVu, moTa, donGia, nhom } = req.body
  if (!tenDichVu || donGia === undefined) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const result = db.prepare(`INSERT INTO dichVu (tenDichVu, moTa, donGia, nhom) VALUES (?, ?, ?, ?)`).run(tenDichVu, moTa, donGia, nhom)
  res.status(201).json({ id: result.lastInsertRowid })
})
router.put('/:id', (req, res) => {
  const fields = []
  const params = []
  const allowed = ['tenDichVu', 'moTa', 'donGia', 'nhom', 'trangThai']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(req.body[key])
    }
  })
  if (fields.length === 0) return res.json({ success: true })
  params.push(req.params.id)
  db.prepare(`UPDATE dichVu SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE dichVu SET trangThai = 'ngungHoatDong' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
export default router