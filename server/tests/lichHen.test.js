import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
let bsId, bnId
beforeEach(() => {
  db.exec('DELETE FROM lichHen')
  db.exec('DELETE FROM benhNhan')
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('lichHen','benhNhan','bacSi')")
  bsId = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Test').lastInsertRowid
  bnId = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Test').lastInsertRowid
})
describe('GET /api/lichHen', () => {
  it('Trả Về Danh Sách Lịch Hẹn', async () => {
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-05-01 09:00:00')
    const res = await request(app).get('/api/lichHen')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].tenBenhNhan).toBe('BN. Test')
    expect(res.body[0].tenBacSi).toBe('BS. Test')
  })
  it('Lọc Lịch Hẹn Theo Ngày', async () => {
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-05-01 09:00:00')
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-05-02 10:00:00')
    const res = await request(app).get('/api/lichHen?ngay=2026-05-01')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].ngayGio).toContain('2026-05-01')
  })
  it('Lọc Lịch Hẹn Theo BacSiId', async () => {
    const bsId2 = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Khác').lastInsertRowid
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-05-01 09:00:00')
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId2, '2026-05-01 10:00:00')
    const res = await request(app).get(`/api/lichHen?bacSiId=${bsId}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].bacSiId).toBe(bsId)
  })
  it('Trả Về Mảng Rỗng Khi Không Có Lịch Hẹn', async () => {
    const res = await request(app).get('/api/lichHen?ngay=2099-12-31')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
})
describe('GET /api/lichHen/:id', () => {
  it('Trả Về Lịch Hẹn Theo ID', async () => {
    const r = db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio, ghiChu) VALUES (?, ?, ?, ?)').run(bnId, bsId, '2026-05-01 09:00:00', 'Khám Định Kỳ')
    const res = await request(app).get(`/api/lichHen/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.ghiChu).toBe('Khám Định Kỳ')
  })
  it('Trả 404 Khi Lịch Hẹn Không Tồn Tại', async () => {
    const res = await request(app).get('/api/lichHen/99999')
    expect(res.statusCode).toBe(404)
  })
})
describe('POST /api/lichHen', () => {
  it('Tạo Lịch Hẹn Mới Thành Công', async () => {
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId, ngayGio: '2026-06-01 08:00:00', ghiChu: 'Lần Đầu' })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
  })
  it('Trả 400 Khi Thiếu Thông Tin Bắt Buộc', async () => {
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBeDefined()
  })
  it('Trả 409 Khi Trùng Lịch Bác Sĩ', async () => {
    const ngayGio = '2026-06-01 09:00:00'
    await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId, ngayGio })
    const bnId2 = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Khác').lastInsertRowid
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId2, bacSiId: bsId, ngayGio })
    expect(res.statusCode).toBe(409)
    expect(res.body.error).toContain('Đã Có Lịch')
  })
  it('Cho Phép Lịch Hẹn Cùng Giờ Nếu Bác Sĩ Khác', async () => {
    const bsId2 = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Hai').lastInsertRowid
    const ngayGio = '2026-06-02 10:00:00'
    await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId, ngayGio })
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId2, ngayGio })
    expect(res.statusCode).toBe(201)
  })
  it('Trạng Thái Mặc Định Là choKham', async () => {
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId, ngayGio: '2026-06-03 11:00:00' })
    const row = db.prepare('SELECT * FROM lichHen WHERE id = ?').get(res.body.id)
    expect(row.trangThai).toBe('choKham')
  })
})
describe('PUT /api/lichHen/:id', () => {
  it('Cập Nhật Trạng Thái Lịch Hẹn Sang dangKham', async () => {
    const r = db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-06-04 08:00:00')
    const res = await request(app).put(`/api/lichHen/${r.lastInsertRowid}`).send({ trangThai: 'dangKham', ngayGio: '2026-06-04 08:00:00', ghiChu: '', bacSiId: bsId })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const row = db.prepare('SELECT * FROM lichHen WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('dangKham')
  })
})
describe('DELETE /api/lichHen/:id', () => {
  it('Hủy Lịch Hẹn (Soft Delete Thành daHuy)', async () => {
    const r = db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio) VALUES (?, ?, ?)').run(bnId, bsId, '2026-06-05 08:00:00')
    const res = await request(app).delete(`/api/lichHen/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    const row = db.prepare('SELECT * FROM lichHen WHERE id = ?').get(r.lastInsertRowid)
    expect(row.trangThai).toBe('daHuy')
  })
  it('Sau Khi Hủy Có Thể Đặt Lại Cùng Giờ Cùng Bác Sĩ', async () => {
    const ngayGio = '2026-06-06 09:00:00'
    const r = db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio, trangThai) VALUES (?, ?, ?, ?)').run(bnId, bsId, ngayGio, 'daHuy')
    const res = await request(app).post('/api/lichHen').send({ benhNhanId: bnId, bacSiId: bsId, ngayGio })
    expect(res.statusCode).toBe(201)
  })
})