# HORO-UC02 — Chat hỏi AI về ngày tốt xấu và tử vi

> Trạng thái: implemented · Việc: 2026-11-17-widget-lich · Cập nhật: 2026-11-17 · Kiểm ở commit `5fcc913` (nhánh `main`, 2026-11-17)

## Mục tiêu
Hỏi bằng lời thường ("ngày mai có hợp khai trương không?", "tuổi tôi hợp màu gì?"), AI trả lời dựa trên hồ sơ và lịch hôm nay.

## Phạm vi
- Nút **Hỏi AI** nổi ở cả 3 tab; khung chat trượt từ đáy; mở từ nút "Hỏi thêm AI" của tab Tử vi.
- Ngoài phạm vi: lưu lịch sử chat (lịch sử chỉ trong phiên trình duyệt), giới hạn số câu (user chốt: dùng cho vui).

## Quy tắc nghiệp vụ
- BR-1: **Tin nhắn:** gửi tối đa 12 tin gần nhất, mỗi tin ≤ 1.000 ký tự, tin cuối phải là câu hỏi; sai thì 400. Cần mật khẩu chung nếu server đặt (HORO-UC01/BR-6).
- BR-2: **Số liệu gửi kèm:**
  - Thông tin hôm nay do server tính (ngày âm, can chi, hoàng đạo, tiết khí, giờ hoàng đạo, lễ).
  - Hồ sơ trên máy (web gửi lên; server chỉ đưa tên gọi, giới tính, tuổi, mệnh, giờ sinh cho AI, không đưa ngày sinh dương lịch).
  - Tóm tắt tử vi hôm nay đã lưu trên máy.
  - Hồ sơ sai dạng thì bỏ qua, không chặn câu hỏi.
- BR-3: **Lỗi:** như HORO-UC01/BR-5, lỗi khác báo "Chưa trả lời được, thử lại sau"; câu lỗi trả lại ô nhập để gửi lại.

## Scenario

```gherkin
Scenario: HORO-UC02-SC1 Trả lời dựa trên hồ sơ và hôm nay
  Given web gửi hồ sơ "Anh" và tóm tắt tử vi hôm nay
  When tôi hỏi "Hôm nay tôi nên làm gì?"
  Then AI nhận thông tin hôm nay, hồ sơ "Anh" tuổi Canh Ngọ và tóm tắt; không có ngày sinh dương

Scenario: HORO-UC02-SC2 Kiểm tin nhắn
  Then danh sách rỗng, tin cuối không phải câu hỏi, câu quá 1.000 ký tự báo 400
  And lịch sử 31 tin chỉ gửi 12 tin gần nhất
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 tin nhắn | `server/src/chat/service.ts:18`, `server/src/app.ts:34` | `server/test/api.test.ts` (SC2) |
| BR-2 số liệu gửi kèm | `server/src/chat/service.ts:33`, `server/src/chat/service.ts:51`, `web/src/chat-context.tsx:60` | `api.test.ts` (SC1), `web/test/app.test.tsx` (HORO-UC01-SC6) |
| BR-3 lỗi | `server/src/chat/service.ts:70`, `server/src/ai/model.ts:141` | `api.test.ts` (SC2) |

Khung chat (`web/src/components/ChatSheet.tsx`, `web/src/chat-context.tsx`) chép từ GoldFolio.
