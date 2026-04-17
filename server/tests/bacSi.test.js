import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name='bacSi'")
})
describe('GET /api/bacSi', () => {
  it('Trả Về Mảng Rỗng Khi Không Có Bác Sĩ', async () => {
    const res = await request(app).get('/api/bacSi')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Trả Về Danh Sách Bác Sĩ', async () => {
    db.prepare('INSERT INTO bacSi (hoTen, luongCo, tyLeHoaHong) VALUES (?, ?, ?)').run('BS. An', 10000000, 15)
    const res = await request(app).get('/api/bacSi')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].hoTen).toBe('BS. An')
  })
  it('Trả Về Nhiều Bác Sĩ Sắp Xếp Theo Tên', async () => {
    db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Minh')
    db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. An')
    const res = await request(app).get('/api/bacSi')
    expect(res.statusCode).toBe(200)
    expect(res.body[0].hoTen).toBe('BS. An')
    expect(res.body[1].hoTen).toBe('BS. Minh')
  })
})
describe('GET /api/bacSi/:id', () => {
  it('Trả Về Bác Sĩ Theo ID', async () => {
    const r = db.prepare('INSERT INTO bacSi (hoTen, chuyenKhoa) VALUES (?, ?)').run('BS. Bình', 'Phục Hình')
    const res = await request(app).get(`/api/bacSi/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.hoTen).toBe('BS. Bình')
    expect(res.body.chuyenKhoa).toBe('Phục Hình')
  })
  it('Trả 404 Khi Bác Sĩ Không Tồn Tại', async () => {
    const res = await request(app).get('/api/bacSi/99999')
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBeDefined()
  })
})
describe('POST /api/bacSi', () => {
  it('Tạo Bác Sĩ Mới Thành Công', async () => {
    const payload = { hoTen: 'BS. Châu', chuyenKhoa: 'Chỉnh Nha', luongCo: 15000000, tyLeHoaHong: 20 }
    const res = await request(app).post('/api/bacSi').send(payload)
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.hoTen).toBe('BS. Châu')
  })
  it('Trả 400 Khi Thiếu Tên Bác Sĩ', async () => {
    const res = await request(app).post('/api/bacSi').send({ chuyenKhoa: 'Nha Chu' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBeDefined()
  })
  it('Tạo Bác Sĩ Với Giá Trị Mặc Định LuongCo Và TyLeHoaHong', async () => {
    const res = await request(app).post('/api/bacSi').send({ hoTen: 'BS. Default' })
    expect(res.statusCode).toBe(201)
    const row = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(res.body.id)
    expect(row.luongCo).toBe(0)
    expect(row.tyLeHoaHong).toBe(0)
  })
  it('Trạng Thái Mặc Định Là hoatDong', async () => {
    const res = await request(app).post('/api/bacSi').send({ hoTen: 'BS. Trang' })
    const row = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(res.body.id)
    expect(row.trangThai).toBe('hoatDong')
  })
})
describe('PUT /api/bacSi/:id', () => {
  it('Cập Nhật Thông Tin Bác Sĩ', async () => {
    const r = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Cũ')
    const res = await request(app).put(`/api/bacSi/${r.lastInsertRowid}`).send({ hoTen: 'BS. Mới', chuyenKhoa: 'Cấy Ghép', luongCo: 20000000, tyLeHoaHong: 25, trangThai: 'hoatDong' })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(r.lastInsertRowid)
    expect(row.hoTen).toBe('BS. Mới')
    expect(row.luongCo).toBe(20000000)
  })
})
describe('DELETE /api/bacSi/:id', () => {
  it('Ngừng Hoạt Động Bác Sĩ (Soft Delete)', async () => {
    const r = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Sẽ Nghỉ')
    const res = await request(app).delete(`/api/bacSi/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('ngungHoatDong')
  })
})