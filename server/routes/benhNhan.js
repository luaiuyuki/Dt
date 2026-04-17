import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { search } = req.query
  let rows
  if (search) {
    rows = db.prepare(`SELECT * FROM benhNhan WHERE hoTen LIKE ? OR soDienThoai LIKE ? ORDER BY hoTen`).all(`%${search}%`, `%${search}%`)
  } else {
    rows = db.prepare('SELECT * FROM benhNhan ORDER BY hoTen').all()
  }
  res.json(rows)
})
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM benhNhan WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Không Tìm Thấy Bệnh Nhân' })
  res.json(row)
})
router.post('/', (req, res) => {
  const { hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng } = req.body
  if (!hoTen) return res.status(400).json({ error: 'Tên Bệnh Nhân Là Bắt Buộc' })
  const result = db.prepare(`
    INSERT INTO benhNhan (hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng)
  res.status(201).json({ id: result.lastInsertRowid, hoTen })
})
router.put('/:id', (req, res) => {
  const fields = []
  const params = []
  const allowed = ['hoTen', 'ngaySinh', 'gioiTinh', 'soDienThoai', 'diaChi', 'tienSuBenh', 'diUng']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(req.body[key])
    }
  })
  if (fields.length === 0) return res.json({ success: true })
  params.push(req.params.id)
  db.prepare(`UPDATE benhNhan SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM benhNhan WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})
export default router