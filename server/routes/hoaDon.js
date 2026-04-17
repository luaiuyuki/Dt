import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT hd.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi
    FROM hoaDon hd
    JOIN benhNhan bn ON hd.benhNhanId = bn.id
    JOIN bacSi bs ON hd.bacSiId = bs.id
    ORDER BY hd.ngayTao DESC
  `).all()
  res.json(rows)
})
router.get('/:id', (req, res) => {
  const hd = db.prepare(`
    SELECT hd.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi
    FROM hoaDon hd
    JOIN benhNhan bn ON hd.benhNhanId = bn.id
    JOIN bacSi bs ON hd.bacSiId = bs.id
    WHERE hd.id = ?
  `).get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  const chiTiet = db.prepare(`
    SELECT ct.*, dv.tenDichVu
    FROM chiTietHoaDon ct
    JOIN dichVu dv ON ct.dichVuId = dv.id
    WHERE ct.hoaDonId = ?
  `).all(req.params.id)
  res.json({ ...hd, chiTiet })
})
router.post('/', (req, res) => {
  const { benhNhanId, bacSiId, hoSoId, ghiChu, chiTiet } = req.body
  if (!benhNhanId || !bacSiId || !chiTiet || !chiTiet.length) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const tongTien = chiTiet.reduce((sum, item) => sum + item.soLuong * item.donGia, 0)
  const result = db.prepare(`INSERT INTO hoaDon (benhNhanId, bacSiId, hoSoId, tongTien, ghiChu) VALUES (?, ?, ?, ?, ?)`).run(benhNhanId, bacSiId, hoSoId, tongTien, ghiChu)
  const hoaDonId = result.lastInsertRowid
  const insertCt = db.prepare(`INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)`)
  chiTiet.forEach(item => insertCt.run(hoaDonId, item.dichVuId, item.soLuong, item.donGia, item.soLuong * item.donGia))
  res.status(201).json({ id: hoaDonId, tongTien })
})
router.put('/:id/thanhToan', (req, res) => {
  const { daThanhToan } = req.body
  const hd = db.prepare('SELECT tongTien FROM hoaDon WHERE id = ?').get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  const trangThai = daThanhToan >= hd.tongTien ? 'daThanhToan' : 'thanhToanMot'
  db.prepare(`UPDATE hoaDon SET daThanhToan=?, trangThai=? WHERE id=?`).run(daThanhToan, trangThai, req.params.id)
  res.json({ success: true, trangThai })
})
export default router