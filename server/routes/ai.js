import { Router } from 'express'
import Groq from 'groq-sdk'
const router = Router()
const groq = new Groq({ apiKey: process.env.groqApiKey })
router.post('/sinhGhiChu', async (req, res) => {
  const { tinhTrangRang, tenBenhNhan, ngayKham } = req.body
  if (!tinhTrangRang || !tinhTrangRang.length) return res.status(400).json({ error: 'Cần Có Dữ Liệu Tình Trạng Răng' })
  const moTaRang = tinhTrangRang.map(r => `Răng Số ${r.soRang}: ${r.tinhTrang}${r.ghiChu ? ' - ' + r.ghiChu : ''}`).join(', ')
  const prompt = `Bạn là bác sĩ nha khoa chuyên nghiệp. Hãy viết một đoạn ghi chú lâm sàng ngắn gọn, chuyên nghiệp bằng tiếng Việt cho buổi khám ngày ${ngayKham || 'hôm nay'} của bệnh nhân ${tenBenhNhan || 'này'}. Tình trạng răng ghi nhận: ${moTaRang}. Chỉ trả về đoạn ghi chú, không giải thích thêm.`
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    })
    res.json({ ghiChu: completion.choices[0].message.content.trim() })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi Kết Nối AI: ' + err.message })
  }
})
router.post('/tomTatBaoCao', async (req, res) => {
  const { chuanDoan, ghiChuLamSang, tinhTrangRang, tenBenhNhan, dichVuDaLam } = req.body
  const moTaRang = (tinhTrangRang || []).map(r => `Răng ${r.soRang}: ${r.tinhTrang}`).join('; ')
  const moTaDichVu = (dichVuDaLam || []).join(', ')
  const prompt = `Bạn là bác sĩ nha khoa. Hãy viết tóm tắt báo cáo sức khỏe răng miệng bằng ngôn ngữ thân thiện, dễ hiểu cho bệnh nhân ${tenBenhNhan || ''} bằng tiếng Việt. Thông tin: Chẩn đoán: ${chuanDoan || 'chưa có'}. Ghi chú: ${ghiChuLamSang || 'chưa có'}. Tình trạng răng: ${moTaRang || 'chưa cập nhật'}. Dịch vụ đã thực hiện: ${moTaDichVu || 'chưa có'}. Kết thúc bằng một lời nhắc chăm sóc sức khỏe răng miệng tại nhà.`
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    })
    res.json({ tomTat: completion.choices[0].message.content.trim() })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi Kết Nối AI: ' + err.message })
  }
})
export default router