import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
let bsId, bnId, dvId
beforeEach(() => {
  db.exec('DELETE FROM bangLuong')
  db.exec('DELETE FROM chiTietHoaDon')
  db.exec('DELETE FROM hoaDon')
  db.exec('DELETE FROM lichHen')
  db.exec('DELETE FROM dichVu')
  db.exec('DELETE FROM benhNhan')
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('bangLuong','chiTietHoaDon','hoaDon','lichHen','dichVu','benhNhan','bacSi')")
  bsId = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Thống Kê').lastInsertRowid
  bnId = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Mẫu').lastInsertRowid
  dvId = db.prepare('INSERT INTO dichVu (tenDichVu, donGia, nhom) VALUES (?, ?, ?)').run('Khám Tổng Quát', 500000, 'Tổng Quát').lastInsertRowid
})
describe('GET /api/thongKe/tongQuan', () => {
  it('Trả Về Cấu Trúc Đầy Đủ Khi Không Có Dữ Liệu', async () => {
    const res = await request(app).get('/api/thongKe/tongQuan')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('doanhThu')
    expect(res.body).toHaveProperty('benhNhanMoi')
    expect(res.body).toHaveProperty('soDichVuTheoNhom')
    expect(res.body).toHaveProperty('topBacSi')
    expect(res.body).toHaveProperty('lichHenTheoThang')
    expect(res.body.doanhThu).toBe(0)
    expect(res.body.benhNhanMoi).toBe(1)
    expect(res.body.soDichVuTheoNhom).toEqual([])
    expect(res.body.topBacSi).toEqual([])
    expect(res.body.lichHenTheoThang).toEqual([])
  })
  it('Tính Doanh Thu Chỉ Từ Hóa Đơn DaThanhToan', async () => {
    const hdPaid = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId, 1500000, 1500000, 'daThanhToan')
    const hdUnpaid = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId, 500000, 0, 'chuaThanhToan')
    const res = await request(app).get('/api/thongKe/tongQuan')
    expect(res.body.doanhThu).toBe(1500000)
  })
  it('Đếm Đúng Số Bệnh Nhân', async () => {
    db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Phụ 1')
    db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Phụ 2')
    const res = await request(app).get('/api/thongKe/tongQuan')
    expect(res.body.benhNhanMoi).toBe(3)
  })
  it('Thống Kê TopBacSi Theo Doanh Thu Hóa Đơn Đã Thu', async () => {
    const bsId2 = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Phụ').lastInsertRowid
    const hd1 = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId, 3000000, 3000000, 'daThanhToan')
    const hd2 = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId2, 1000000, 1000000, 'daThanhToan')
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd1.lastInsertRowid, dvId, 1, 3000000, 3000000)
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd2.lastInsertRowid, dvId, 1, 1000000, 1000000)
    const res = await request(app).get('/api/thongKe/tongQuan')
    expect(res.body.topBacSi.length).toBe(2)
    expect(res.body.topBacSi[0].hoTen).toBe('BS. Thống Kê')
    expect(res.body.topBacSi[0].doanhThu).toBe(3000000)
  })
  it('Thống Kê Lịch Hẹn Theo Tháng', async () => {
    db.prepare("INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)").run(bnId, bsId, '2026-04-01 08:00:00')
    db.prepare("INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)").run(bnId, bsId, '2026-04-15 09:00:00')
    db.prepare("INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)").run(bnId, bsId, '2026-05-01 10:00:00')
    const res = await request(app).get('/api/thongKe/tongQuan?nam=2026')
    const thang4 = res.body.lichHenTheoThang.find(t => parseInt(t.thang) === 4)
    const thang5 = res.body.lichHenTheoThang.find(t => parseInt(t.thang) === 5)
    expect(thang4?.soLuong).toBe(2)
    expect(thang5?.soLuong).toBe(1)
  })
  it('Thống Kê Nhóm Dịch Vụ Chỉ Từ Hóa Đơn Đã Thanh Toán', async () => {
    const dvId2 = db.prepare('INSERT INTO dichVu (tenDichVu, donGia, nhom) VALUES (?, ?, ?)').run('Phẫu Thuật', 5000000, 'Phẫu Thuật').lastInsertRowid
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId, 5500000, 5500000, 'daThanhToan')
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd.lastInsertRowid, dvId, 1, 500000, 500000)
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd.lastInsertRowid, dvId2, 1, 5000000, 5000000)
    const res = await request(app).get('/api/thongKe/tongQuan')
    expect(res.body.soDichVuTheoNhom.length).toBe(2)
    const nhomPt = res.body.soDichVuTheoNhom.find(n => n.nhom === 'Phẫu Thuật')
    expect(nhomPt.doanhThu).toBe(5000000)
  })
  it('Lọc Doanh Thu Theo Năm', async () => {
    const hd2025 = db.prepare("INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai, ngayTao) VALUES (?, ?, ?, ?, ?, ?)").run(bnId, bsId, 1000000, 1000000, 'daThanhToan', '2025-01-01 10:00:00')
    const hd2026 = db.prepare("INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai, ngayTao) VALUES (?, ?, ?, ?, ?, ?)").run(bnId, bsId, 2000000, 2000000, 'daThanhToan', '2026-01-01 10:00:00')
    const res = await request(app).get('/api/thongKe/tongQuan?nam=2026')
    expect(res.body.doanhThu).toBe(2000000)
  })
})