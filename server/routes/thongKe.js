import { Router } from 'express'
import db from '../db.js'
const prepare = db.prepare.bind(db)
const router = Router()
router.get('/tongQuan', (req, res) => {
  const { thang, nam } = req.query
  const queryPhatSinh = `
    SELECT COALESCE(SUM(tongTien), 0) as tong
    FROM hoaDon
    WHERE trangThai != 'daHuy'
    ${thang ? `AND strftime('%m', ngayTao) = printf('%02d', ${thang})` : ''}
    ${nam ? `AND strftime('%Y', ngayTao) = '${nam}'` : ''}
  `
  const queryThucThu = `
    SELECT COALESCE(SUM(daThanhToan), 0) as tong
    FROM hoaDon
    WHERE trangThai != 'daHuy'
    ${thang ? `AND strftime('%m', ngayTao) = printf('%02d', ${thang})` : ''}
    ${nam ? `AND strftime('%Y', ngayTao) = '${nam}'` : ''}
  `
  const phatSinh = prepare(queryPhatSinh).get()
  const thucThu = prepare(queryThucThu).get()
  const benhNhanMoi = prepare(`
    SELECT COUNT(*) as tong FROM benhNhan
    ${nam ? `WHERE strftime('%Y', createdAt) = '${nam}'` : ''}
  `).get()
  const soDichVuTheoNhom = prepare(`
    SELECT dv.nhom, COUNT(*) as soLuong, SUM(ct.thanhTien) as doanhThu
    FROM chiTietHoaDon ct
    JOIN dichVu dv ON ct.dichVuId = dv.id
    JOIN hoaDon hd ON ct.hoaDonId = hd.id
    WHERE hd.trangThai != 'daHuy'
    GROUP BY dv.nhom
  `).all()
  const topBacSi = prepare(`
    SELECT bs.hoTen, SUM(ct.thanhTien) as doanhThu
    FROM chiTietHoaDon ct
    JOIN hoaDon hd ON ct.hoaDonId = hd.id
    JOIN bacSi bs ON hd.bacSiId = bs.id
    WHERE hd.trangThai != 'daHuy'
    GROUP BY hd.bacSiId
    ORDER BY doanhThu DESC
    LIMIT 5
  `).all()
  const lichHenTheoThang = prepare(`
    SELECT strftime('%m', ngayGio) as thang, COUNT(*) as soLuong
    FROM lichHen
    WHERE 1=1
    ${nam ? `AND strftime('%Y', ngayGio) = '${nam}'` : ''}
    GROUP BY thang
    ORDER BY thang
  `).all()
  res.json({ doanhThu: thucThu.tong, phatSinh: phatSinh.tong, benhNhanMoi: benhNhanMoi.tong, soDichVuTheoNhom, topBacSi, lichHenTheoThang })
})
export default router