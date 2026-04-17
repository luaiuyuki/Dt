import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
let bsId, bnId
beforeEach(() => {
  db.exec('DELETE FROM tinhTrangRang')
  db.exec('DELETE FROM hoSoBenhAn')
  db.exec('DELETE FROM benhNhan')
  db.exec('DELETE FROM bacSi')
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tinhTrangRang','hoSoBenhAn','benhNhan','bacSi')")
  bsId = db.prepare('INSERT INTO bacSi (hoTen) VALUES (?)').run('BS. Hồ').lastInsertRowid
  bnId = db.prepare('INSERT INTO benhNhan (hoTen) VALUES (?)').run('BN. Hồng').lastInsertRowid
})
describe('POST /api/hoSoBenhAn', () => {
  it('Tạo Hồ Sơ Bệnh Án Mới Thành Công', async () => {
    const res = await request(app).post('/api/hoSoBenhAn').send({ benhNhanId: bnId, bacSiId: bsId, chuanDoan: 'Sâu Răng Số 16', ghiChuLamSang: 'Cần Trám' })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeDefined()
  })
  it('Trả 400 Khi Thiếu BenhNhanId', async () => {
    const res = await request(app).post('/api/hoSoBenhAn').send({ bacSiId: bsId, chuanDoan: 'Test' })
    expect(res.statusCode).toBe(400)
  })
  it('Trả 400 Khi Thiếu BacSiId', async () => {
    const res = await request(app).post('/api/hoSoBenhAn').send({ benhNhanId: bnId, chuanDoan: 'Test' })
    expect(res.statusCode).toBe(400)
  })
  it('Tạo Hồ Sơ Kèm Tình Trạng Răng', async () => {
    const tinhTrangRang = [
      { soRang: 16, tinhTrang: 'sauRang', ghiChu: 'Đau Khi Ăn' },
      { soRang: 21, tinhTrang: 'tramRang', ghiChu: '' },
    ]
    const res = await request(app).post('/api/hoSoBenhAn').send({ benhNhanId: bnId, bacSiId: bsId, chuanDoan: 'Sâu Nhiều', ghiChuLamSang: '', tinhTrangRang })
    expect(res.statusCode).toBe(201)
    const rang = db.prepare('SELECT * FROM tinhTrangRang WHERE hoSoId = ?').all(res.body.id)
    expect(rang.length).toBe(2)
    expect(rang.find(r => r.soRang === 16).tinhTrang).toBe('sauRang')
    expect(rang.find(r => r.soRang === 21).tinhTrang).toBe('tramRang')
  })
  it('Tạo Hồ Sơ Không Bắt Buộc Chẩn Đoán', async () => {
    const res = await request(app).post('/api/hoSoBenhAn').send({ benhNhanId: bnId, bacSiId: bsId })
    expect(res.statusCode).toBe(201)
  })
})
describe('GET /api/hoSoBenhAn/benhNhan/:benhNhanId', () => {
  it('Trả Về Danh Sách Hồ Sơ Theo Bệnh Nhân', async () => {
    db.prepare('INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan) VALUES (?, ?, ?)').run(bnId, bsId, 'Khám Định Kỳ')
    db.prepare('INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan) VALUES (?, ?, ?)').run(bnId, bsId, 'Viêm Lợi')
    const res = await request(app).get(`/api/hoSoBenhAn/benhNhan/${bnId}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(2)
    expect(res.body[0].tenBacSi).toBe('BS. Hồ')
  })
  it('Trả Về Mảng Rỗng Khi Bệnh Nhân Chưa Có Hồ Sơ', async () => {
    const res = await request(app).get(`/api/hoSoBenhAn/benhNhan/${bnId}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })
  it('Hồ Sơ Sắp Xếp Theo Ngày Khám Mới Nhất', async () => {
    db.prepare("INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan, ngayKham) VALUES (?, ?, ?, ?)").run(bnId, bsId, 'Cũ Hơn', '2026-01-01 08:00:00')
    db.prepare("INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan, ngayKham) VALUES (?, ?, ?, ?)").run(bnId, bsId, 'Mới Hơn', '2026-03-01 08:00:00')
    const res = await request(app).get(`/api/hoSoBenhAn/benhNhan/${bnId}`)
    expect(res.body[0].chuanDoan).toBe('Mới Hơn')
  })
})
describe('GET /api/hoSoBenhAn/:id', () => {
  it('Trả Về Hồ Sơ Theo ID Kèm Tình Trạng Răng', async () => {
    const r = db.prepare('INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan) VALUES (?, ?, ?)').run(bnId, bsId, 'Cần Cấy Ghép')
    db.prepare('INSERT INTO tinhTrangRang (hoSoId, soRang, tinhTrang) VALUES (?, ?, ?)').run(r.lastInsertRowid, 46, 'matRang')
    const res = await request(app).get(`/api/hoSoBenhAn/${r.lastInsertRowid}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.chuanDoan).toBe('Cần Cấy Ghép')
    expect(res.body.tinhTrangRang.length).toBe(1)
    expect(res.body.tinhTrangRang[0].tinhTrang).toBe('matRang')
  })
  it('Trả 404 Khi Hồ Sơ Không Tồn Tại', async () => {
    const res = await request(app).get('/api/hoSoBenhAn/99999')
    expect(res.statusCode).toBe(404)
  })
})
describe('PUT /api/hoSoBenhAn/:id', () => {
  it('Cập Nhật Chẩn Đoán Và Tình Trạng Răng', async () => {
    const r = db.prepare('INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, chuanDoan) VALUES (?, ?, ?)').run(bnId, bsId, 'Cũ')
    const res = await request(app).put(`/api/hoSoBenhAn/${r.lastInsertRowid}`).send({
      chuanDoan: 'Cập Nhật Mới',
      ghiChuLamSang: 'Đã Xử Lý',
      tinhTrangRang: [{ soRang: 11, tinhTrang: 'tramRang', ghiChu: 'Trám Composite' }],
    })
    expect(res.statusCode).toBe(200)
    const row = db.prepare('SELECT * FROM hoSoBenhAn WHERE id = ?').get(r.lastInsertRowid)
    expect(row.chuanDoan).toBe('Cập Nhật Mới')
    const rang = db.prepare('SELECT * FROM tinhTrangRang WHERE hoSoId = ?').all(r.lastInsertRowid)
    expect(rang[0].tinhTrang).toBe('tramRang')
  })
})