import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
let bsId, bnId, dvId
beforeEach(() => {
  db.exec('DELETE FROM chiTietHoaDon')
  db.exec('DELETE FROM hoaDon')
  db.exec('DELETE FROM dichVu')
  db.exec('DELETE FROM benhNhan')
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('chiTietHoaDon','hoaDon','dichVu','benhNhan','bacSi')")
  bsId = db.prepare('INSERT INTO bacSi (hoTen, luongCo, tyLeHoaHong) VALUES (?, ?, ?)').run('BS. Tài', 10000000, 15).lastInsertRowid
  bnId = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Thủy').lastInsertRowid
  dvId = db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Trám Răng', 800000).lastInsertRowid
})
describe('GET /api/hoaDon', () => {
  it('Trả Về Mảng Rỗng Khi Không Có Hóa Đơn', async () => {
    const res = await request(app).get('/api/hoaDon')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Trả Về Danh Sách Hóa Đơn Kèm Tên Bệnh Nhân Và Bác Sĩ', async () => {
    const r = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien) VALUES (?, ?, ?)').run(bnId, bsId, 800000)
    const res = await request(app).get('/api/hoaDon')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].tenBenhNhan).toBe('BN. Thủy')
    expect(res.body[0].tenBacSi).toBe('BS. Tài')
  })
})
describe('GET /api/hoaDon/:id', () => {
  it('Trả Về Hóa Đơn Chi Tiết Kèm ChiTiet', async () => {
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien) VALUES (?, ?, ?)').run(bnId, bsId, 800000)
    db.prepare('INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)').run(hd.lastInsertRowid, dvId, 1, 800000, 800000)
    const res = await request(app).get(`/api/hoaDon/${hd.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.chiTiet.length).toBe(1)
    expect(res.body.chiTiet[0].tenDichVu).toBe('Trám Răng')
    expect(res.body.chiTiet[0].thanhTien).toBe(800000)
  })
  it('Trả 404 Khi Hóa Đơn Không Tồn Tại', async () => {
    const res = await request(app).get('/api/hoaDon/99999')
    expect(res.statusCode).toBe(404)
  })
})
describe('POST /api/hoaDon', () => {
  it('Tạo Hóa Đơn Mới Tính Đúng Tổng Tiền', async () => {
    const chiTiet = [{ dichVuId: dvId, soLuong: 2, donGia: 800000 }]
    const res = await request(app).post('/api/hoaDon').send({ benhNhanId: bnId, bacSiId: bsId, chiTiet })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.tongTien).toBe(1600000)
  })
  it('Tạo Hóa Đơn Với Nhiều Dịch Vụ', async () => {
    const dvId2 = db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Cạo Cao', 300000).lastInsertRowid
    const chiTiet = [{ dichVuId: dvId, soLuong: 1, donGia: 800000 }, { dichVuId: dvId2, soLuong: 3, donGia: 300000 }]
    const res = await request(app).post('/api/hoaDon').send({ benhNhanId: bnId, bacSiId: bsId, chiTiet })
    expect(res.statusCode).toBe(201)
    expect(res.body.tongTien).toBe(1700000)
  })
  it('Trả 400 Khi Thiếu BenhNhanId', async () => {
    const res = await request(app).post('/api/hoaDon').send({ bacSiId: bsId, chiTiet: [{ dichVuId: dvId, soLuong: 1, donGia: 800000 }] })
    expect(res.statusCode).toBe(400)
  })
  it('Trả 400 Khi ChiTiet Rỗng', async () => {
    const res = await request(app).post('/api/hoaDon').send({ benhNhanId: bnId, bacSiId: bsId, chiTiet: [] })
    expect(res.statusCode).toBe(400)
  })
  it('Trạng Thái Mặc Định Là chuaThanhToan', async () => {
    const res = await request(app).post('/api/hoaDon').send({ benhNhanId: bnId, bacSiId: bsId, chiTiet: [{ dichVuId: dvId, soLuong: 1, donGia: 800000 }] })
    const row = db.prepare('SELECT * FROM hoaDon WHERE id = ?').get(res.body.id)
    expect(row.trangThai).toBe('chuaThanhToan')
    expect(row.daThanhToan).toBe(0)
  })
})
describe('PUT /api/hoaDon/:id/thanhToan', () => {
  it('Thanh Toán Một Phần Chuyển Thành thanhToanMot', async () => {
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien) VALUES (?, ?, ?)').run(bnId, bsId, 1600000)
    const res = await request(app).put(`/api/hoaDon/${hd.lastInsertRowid}/thanhToan`).send({ daThanhToan: 800000 })
    expect(res.statusCode).toBe(200)
    expect(res.body.trangThai).toBe('thanhToanMot')
  })
  it('Thanh Toán Đủ Chuyển Thành daThanhToan', async () => {
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien) VALUES (?, ?, ?)').run(bnId, bsId, 1600000)
    const res = await request(app).put(`/api/hoaDon/${hd.lastInsertRowid}/thanhToan`).send({ daThanhToan: 1600000 })
    expect(res.statusCode).toBe(200)
    expect(res.body.trangThai).toBe('daThanhToan')
  })
  it('Thanh Toán Vượt Mức Vẫn Chuyển Thành daThanhToan', async () => {
    const hd = db.prepare('INSERT INTO hoaDon (benhNhanId, bacSiId, tongTien) VALUES (?, ?, ?)').run(bnId, bsId, 500000)
    const res = await request(app).put(`/api/hoaDon/${hd.lastInsertRowid}/thanhToan`).send({ daThanhToan: 600000 })
    expect(res.body.trangThai).toBe('daThanhToan')
  })
  it('Trả 404 Khi Hóa Đơn Không Tồn Tại', async () => {
    const res = await request(app).put('/api/hoaDon/99999/thanhToan').send({ daThanhToan: 100000 })
    expect(res.statusCode).toBe(404)
  })
})