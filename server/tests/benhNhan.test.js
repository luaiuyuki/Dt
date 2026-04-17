import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec('DELETE FROM benhNhan')
  db.exec("DELETE FROM sqlite_sequence WHERE name='benhNhan'")
})
describe('GET /api/benhNhan', () => {
  it('Trả Về Mảng Rỗng Khi Không Có Bệnh Nhân', async () => {
    const res = await request(app).get('/api/benhNhan')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Trả Về Danh Sách Bệnh Nhân', async () => {
    db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('Nguyễn Văn A')
    const res = await request(app).get('/api/benhNhan')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].hoTen).toBe('Nguyễn Văn A')
  })
  it('Tìm Kiếm Bệnh Nhân Theo Tên', async () => {
    db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('Trần Thị B')
    db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('Lê Văn C')
    const res = await request(app).get('/api/benhNhan?search=Trần')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].hoTen).toBe('Trần Thị B')
  })
  it('Tìm Kiếm Không Phân Biệt Hoa Thường', async () => {
    db.prepare('INSERT INTO benhNhan (hoTen, soDienThoai) VALUES (?, ?)').run('Nguyễn Bá', '0901234567')
    const res = await request(app).get('/api/benhNhan?search=nguyễn')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })
  it('Tìm Kiếm Theo Số Điện Thoại', async () => {
    db.prepare('INSERT INTO benhNhan (hoTen, soDienThoai) VALUES (?, ?)').run('Phạm Thị D', '0987654321')
    const res = await request(app).get('/api/benhNhan?search=0987654321')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
  })
})
describe('GET /api/benhNhan/:id', () => {
  it('Trả Về Bệnh Nhân Theo ID', async () => {
    const r = db.prepare('INSERT INTO benhNhan (hoTen, ngaySinh, gioiTinh) VALUES (?, ?, ?)').run('Hoàng Văn E', '1990-01-15', 'Nam')
    const res = await request(app).get(`/api/benhNhan/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.hoTen).toBe('Hoàng Văn E')
    expect(res.body.gioiTinh).toBe('Nam')
  })
  it('Trả 404 Khi Bệnh Nhân Không Tồn Tại', async () => {
    const res = await request(app).get('/api/benhNhan/99999')
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBeDefined()
  })
})
describe('POST /api/benhNhan', () => {
  it('Tạo Bệnh Nhân Mới Đầy Đủ Thông Tin', async () => {
    const payload = { hoTen: 'Vũ Thị F', ngaySinh: '1985-06-20', gioiTinh: 'Nữ', soDienThoai: '0912345678', diaChi: '123 Lê Lợi, HCM', tienSuBenh: 'Tiểu Đường', diUng: 'Penicillin' }
    const res = await request(app).post('/api/benhNhan').send(payload)
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
    const row = db.prepare('SELECT * FROM benhNhan WHERE id = ?').get(res.body.id)
    expect(row.diUng).toBe('Penicillin')
  })
  it('Trả 400 Khi Thiếu Tên Bệnh Nhân', async () => {
    const res = await request(app).post('/api/benhNhan').send({ ngaySinh: '1990-01-01' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBeDefined()
  })
  it('Tạo Bệnh Nhân Với Tên Tối Thiểu', async () => {
    const res = await request(app).post('/api/benhNhan').send({ hoTen: 'Bệnh Nhân Tối Thiểu' })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
  })
})
describe('PUT /api/benhNhan/:id', () => {
  it('Cập Nhật Thông Tin Bệnh Nhân', async () => {
    const r = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('Tên Cũ')
    const res = await request(app).put(`/api/benhNhan/${r.lastInsertRowid}`).send({ hoTen: 'Tên Mới', gioiTinh: 'Nữ', soDienThoai: '0900000001', ngaySinh: '2000-01-01', diaChi: '456 Trần Phú', tienSuBenh: '', diUng: '' })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM benhNhan WHERE id = ?').get(r.lastInsertRowid)
    expect(row.hoTen).toBe('Tên Mới')
    expect(row.gioiTinh).toBe('Nữ')
  })
})
describe('DELETE /api/benhNhan/:id', () => {
  it('Xóa Bệnh Nhân Thành Công', async () => {
    const r = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('Bệnh Nhân Xóa')
    const res = await request(app).delete(`/api/benhNhan/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM benhNhan WHERE id = ?').get(r.lastInsertRowid)
    expect(row).toBeUndefined()
  })
})