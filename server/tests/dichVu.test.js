import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec('DELETE FROM dichVu')
  db.exec("DELETE FROM sqlite_sequence WHERE name='dichVu'")
})
describe('GET /api/dichVu', () => {
  it('Trả Về Mảng Rỗng Khi Chưa Có Dịch Vụ', async () => {
    const res = await request(app).get('/api/dichVu')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Trả Về Danh Sách Dịch Vụ', async () => {
    db.prepare('INSERT INTO dichVu (tenDichVu, donGia, nhom) VALUES (?, ?, ?)').run('Nhổ Răng', 500000, 'Phẫu Thuật')
    const res = await request(app).get('/api/dichVu')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].tenDichVu).toBe('Nhổ Răng')
  })
  it('Trả Về Nhiều Dịch Vụ', async () => {
    db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Trám Răng', 300000)
    db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Cạo Cao Răng', 200000)
    const res = await request(app).get('/api/dichVu')
    expect(res.body.length).toBe(2)
  })
})
describe('POST /api/dichVu', () => {
  it('Tạo Dịch Vụ Mới Thành Công', async () => {
    const res = await request(app).post('/api/dichVu').send({ tenDichVu: 'Tẩy Trắng Răng', donGia: 1500000, nhom: 'Thẩm Mỹ', moTa: 'Tẩy Trắng Bằng Laser' })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
  })
  it('Trả 400 Khi Thiếu Tên Dịch Vụ', async () => {
    const res = await request(app).post('/api/dichVu').send({ donGia: 500000 })
    expect(res.statusCode).toBe(400)
  })
  it('Trả 400 Khi Thiếu Đơn Giá', async () => {
    const res = await request(app).post('/api/dichVu').send({ tenDichVu: 'Nhổ Răng' })
    expect(res.statusCode).toBe(400)
  })
  it('Trạng Thái Mặc Định Là hoatDong', async () => {
    const res = await request(app).post('/api/dichVu').send({ tenDichVu: 'Cấy Ghép', donGia: 20000000 })
    const row = db.prepare('SELECT * FROM dichVu WHERE id = ?').get(res.body.id)
    expect(row.trangThai).toBe('hoatDong')
  })
})
describe('PUT /api/dichVu/:id', () => {
  it('Cập Nhật Thông Tin Dịch Vụ', async () => {
    const r = db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Dịch Vụ Cũ', 100000)
    const res = await request(app).put(`/api/dichVu/${r.lastInsertRowid}`).send({ tenDichVu: 'Dịch Vụ Mới', donGia: 250000, nhom: 'Tổng Quát', moTa: 'Mô Tả Mới', trangThai: 'hoatDong' })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM dichVu WHERE id = ?').get(r.lastInsertRowid)
    expect(row.tenDichVu).toBe('Dịch Vụ Mới')
    expect(row.donGia).toBe(250000)
  })
  it('Cập Nhật Trạng Thái Ngừng Dịch Vụ', async () => {
    const r = db.prepare('INSERT INTO dichVu (tenDichVu, donGia) VALUES (?, ?)').run('Dịch Vụ', 150000)
    await request(app).put(`/api/dichVu/${r.lastInsertRowid}`).send({ tenDichVu: 'Dịch Vụ', donGia: 150000, trangThai: 'ngungHoatDong' })
    const row = db.prepare('SELECT * FROM dichVu WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('ngungHoatDong')
  })
})
describe('DELETE /api/dichVu/:id', () => {
  it('Ngừng Cung Cấp Dịch Vụ (Soft Delete)', async () => {
    const r = db.prepare('INSERT INTO dichVu (tenDichVu, donGia, trangThai) VALUES (?, ?, ?)').run('Xóa Me', 100000, 'hoatDong')
    const res = await request(app).delete(`/api/dichVu/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM dichVu WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('ngungHoatDong')
  })
})