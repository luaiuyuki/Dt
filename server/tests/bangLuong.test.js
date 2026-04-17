import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
let bsId, bnId, dvId
beforeEach(() => {
  db.exec('DELETE FROM bangLuong')
  db.exec('DELETE FROM chiTietHoaDon')
  db.exec('DELETE FROM hoaDon')
  db.exec('DELETE FROM dichVu')
  db.exec('DELETE FROM benhNhan')
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('bangLuong','chiTietHoaDon','hoaDon','dichVu','benhNhan','bacSi')")
  bsId = db.prepare('INSERT INTO bacSi (hoTen, luongCo, tyLeHoaHong) VALUES (?, ?, ?)').run('BS. Lương', 10000000, 10).lastInsertRowid
  bnId = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Khách').lastInsertRowid
  dvId = db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Nhổ Răng', 2000000).lastInsertRowid
})
const taoHoaDonThanhToan = (tongTien) => {
  const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, daThanhToan, trangThai) VALUES (?, ?, ?, ?, ?)').run(bnId, bsId, tongTien, tongTien, 'daThanhToan')
  db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd.lastInsertRowid, dvId, 1, tongTien, tongTien)
  return hd.lastInsertRowid
}
describe('GET /api/bangLuong', () => {
  it('Trả Về Mảng Rỗng Khi Chưa Có Bảng Lương', async () => {
    const res = await request(app).get('/api/bangLuong')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Trả Về Danh Sách Bảng Lương Kèm Tên Bác Sĩ', async () => {
    db.prepare('INSERT INTO bangLuong (bacSiId, thang, nam, luongCo, hoaHong, tongLuong) VALUES (?, ?, ?, ?, ?, ?)').run(bsId, 4, 2026, 10000000, 500000, 10500000)
    const res = await request(app).get('/api/bangLuong')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].tenBacSi).toBe('BS. Lương')
    expect(res.body[0].tongLuong).toBe(10500000)
  })
})
describe('POST /api/bangLuong/tinh', () => {
  it('Tính Lương Đúng Khi Không Có Hóa Đơn', async () => {
    const res = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: bsId, thang: 4, nam: 2026 })
    expect(res.statusCode).toBe(201)
    expect(res.body.luongCo).toBe(10000000)
    expect(res.body.hoaHong).toBe(0)
    expect(res.body.tongLuong).toBe(10000000)
    expect(res.body.doanhThu).toBe(0)
  })
  it('Tính Lương Đúng Hoa Hồng Từ Doanh Thu', async () => {
    taoHoaDonThanhToan(2000000)
    const res = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: bsId, thang: new Date().getMonth() + 1, nam: new Date().getFullYear() })
    expect(res.body.doanhThu).toBe(2000000)
    expect(res.body.hoaHong).toBe(200000)
    expect(res.body.tongLuong).toBe(10200000)
  })
  it('Cập Nhật Bảng Lương Nếu Đã Tồn Tại Tháng Đó', async () => {
    const r1 = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: bsId, thang: 3, nam: 2026 })
    expect(r1.statusCode).toBe(201)
    const r2 = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: bsId, thang: 3, nam: 2026 })
    expect(r2.statusCode).toBe(200)
    expect(r2.body.id).toBe(r1.body.id)
    const count = db.prepare('SELECT COUNT(*) as c FROM bangLuong WHERE bacSiId=? AND thang=3 AND nam=2026').get(bsId)
    expect(count.c).toBe(1)
  })
  it('Trả 400 Khi Thiếu BacSiId', async () => {
    const res = await request(app).post('/api/bangLuong/tinh').send({ thang: 4, nam: 2026 })
    expect(res.statusCode).toBe(400)
  })
  it('Trả 404 Khi Bác Sĩ Không Tồn Tại', async () => {
    const res = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: 99999, thang: 4, nam: 2026 })
    expect(res.statusCode).toBe(404)
  })
  it('Không Tính Hóa Đơn ChuaThanhToan Vào Doanh Thu', async () => {
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien, trangThai) VALUES (?, ?, ?, ?)').run(bnId, bsId, 5000000, 'chuaThanhToan')
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd.lastInsertRowid, dvId, 1, 5000000, 5000000)
    const res = await request(app).post('/api/bangLuong/tinh').send({ bacSiId: bsId, thang: new Date().getMonth() + 1, nam: new Date().getFullYear() })
    expect(res.body.doanhThu).toBe(0)
    expect(res.body.hoaHong).toBe(0)
  })
})
describe('PUT /api/bangLuong/:id/thanhToan', () => {
  it('Đánh Dấu Bảng Lương Đã Thanh Toán', async () => {
    const r = db.prepare('INSERT INTO bangLuong (bacSiId, thang, nam, luongCo, hoaHong, tongLuong) VALUES (?, ?, ?, ?, ?, ?)').run(bsId, 5, 2026, 10000000, 0, 10000000)
    const res = await request(app).put(`/api/bangLuong/${r.lastInsertRowid}/thanhToan`)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM bangLuong WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('daThanhToan')
  })
})