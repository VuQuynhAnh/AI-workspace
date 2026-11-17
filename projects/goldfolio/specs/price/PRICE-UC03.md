# PRICE-UC03 — Chat hỏi AI về giá và tài sản

> Trạng thái: implemented · Việc: 2026-11-05-ai-chat · Cập nhật: 2026-11-05 · Kiểm ở commit `7957b32` (nhánh `main`, 2026-11-17)

## Mục tiêu
Người dùng hỏi bằng lời thường ("vàng của tôi đang lỗ vì sao?", "bạc tháng này thế nào?") và nhận câu trả lời ngắn dựa trên chính danh mục và giá thật trong GoldFolio. Chỉ để tham khảo, không phải lời khuyên đầu tư.

## Phạm vi
- Vai trò: tài khoản đã đăng nhập (ACC-BR-001).
- Màn hình:
  - Nút **"Hỏi AI"** nổi ngay trên nút "+" ở cả 3 tab (không có nút "+" thì đứng chỗ của nút đó).
  - Khung chat trượt từ đáy, gần toàn màn hình điện thoại.
  - Mở từ nút "Hỏi thêm" của bong bóng nhận định (PRICE-UC02/BR-11).
- Phụ thuộc: Gemini gói miễn phí (cùng model và key với PRICE-UC02).
- Ngoài phạm vi: lưu lịch sử chat trên server, tìm tin tức trên web, câu hỏi ngoài giá vàng bạc và danh mục.

## Quy tắc nghiệp vụ
- BR-1: **Giới hạn 20 câu hỏi mỗi người mỗi ngày** (user chốt 2026-11-05). Chỉ tính câu AI trả lời được. Hết lượt thì báo "Hôm nay đã hỏi đủ 20 câu, mai hỏi tiếp nhé" và khoá ô nhập. Khung chat ghi "Còn N câu hôm nay".
- BR-2: **Lịch sử chỉ trong phiên** (user chốt): chuyển tab, mở form thêm/sửa vẫn còn; tải lại trang là mất. Server không lưu nội dung câu hỏi hay câu trả lời, chỉ đếm số câu.
- BR-3: **Số liệu gửi kèm** do server ghép, trình duyệt không gửi được: danh mục (từng sản phẩm: khối lượng, số lần mua, tổng tiền mua, giá vốn bình quân, giá mua vào/bán ra hiện tại, lãi/lỗ), giá mua vào 30 ngày của tối đa 4 sản phẩm bỏ nhiều tiền nhất, nhận định xu hướng hôm nay (nếu đã có). Không gửi email hay thông tin tài khoản (R-AI-02).
- BR-4: **Lịch sử gửi lên:** tối đa 12 tin gần nhất; tin cuối phải là câu hỏi; mỗi tin tối đa 1.000 ký tự, không rỗng; sai thì 400.
- BR-5: **AI trả lời** bằng tiếng Việt, ngắn (khoảng 150 chữ), chỉ về giá vàng bạc và danh mục trong app, dựa trên số liệu được gửi, không khuyên chắc chắn mua/bán. Khung chat luôn ghi "Nhận định tham khảo, không phải lời khuyên đầu tư".
- BR-6: **Lỗi:** chưa cấu hình AI báo "Chưa bật AI (thiếu GEMINI_API_KEY)"; hết hạn mức miễn phí báo "AI đã hết lượt miễn phí, thử lại sau"; quá tải (sau khi đã thử model dự phòng, PRICE-UC02/BR-9a) báo "AI đang quá tải, thử lại sau ít phút"; lỗi khác báo "Chưa trả lời được, thử lại sau". Câu hỏi lỗi được bỏ khỏi khung, chữ trả lại ô nhập để gửi lại.
- BR-7: **Khung chat:** đầu khung là thẻ nhận định xu hướng Vàng | Bạc (PRICE-UC02/BR-10); nút "Hỏi AI" và nút "+" cùng cỡ 48px (user chốt 2026-11-05). Gửi thì ô nhập xoá ngay, hiện "AI đang trả lời…"; khung trống có vài câu hỏi gợi ý; Esc, nút "Đóng" hoặc chạm nền tối thì đóng.

## Scenario

```gherkin
Scenario: PRICE-UC03-SC1 Trả lời dựa trên danh mục của tôi
  Given tôi có 2 chỉ nhẫn tròn giá vốn 13.000.000/chỉ, giá mua vào hiện tại 13.550.000
  When tôi hỏi "Vàng của tôi đang lãi hay lỗ?"
  Then AI nhận được số liệu có "Nhẫn tròn Phú Quý 999.9", "2 chỉ", giá vốn và giá hiện tại, không có email của tôi
  And tôi thấy câu trả lời và "Còn 19 câu hôm nay"

Scenario: PRICE-UC03-SC2 Tối đa 20 câu mỗi ngày
  Given AI lỗi một lần
  Then câu đó không tính lượt
  When tôi hỏi đủ 20 câu
  Then câu thứ 21 báo "Hôm nay đã hỏi đủ 20 câu, mai hỏi tiếp nhé"

Scenario: PRICE-UC03-SC3 Kiểm tin nhắn
  When gửi danh sách rỗng, tin cuối không phải câu hỏi, câu hỏi rỗng hoặc quá 1.000 ký tự
  Then báo lỗi 400
  When lịch sử có 30 tin
  Then chỉ 12 tin gần nhất được gửi cho AI

Scenario: PRICE-UC03-SC4 Khung chat
  When tôi bấm nút "Hỏi AI" rồi hỏi "Vàng của tôi đang lỗ vì sao?"
  Then câu hỏi hiện trong khung, ô nhập trống, "AI đang trả lời…"
  When AI trả lời
  Then câu trả lời hiện bên dưới và "Còn 19 câu hôm nay"
```

PRICE-UC03-SC5 (bong bóng nhận định, "Hỏi thêm") nằm trong `PRICE-UC02.md`.

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 giới hạn 20 câu/ngày | `server/src/chat/service.ts:11`, `server/src/chat/service.ts:93`, bảng `server/src/schema.sql:94` | `chat.test.ts` (SC2) |
| BR-2 lịch sử trong phiên | `web/src/chat-context.tsx:32` | `chat.test.tsx` (SC4, SC5) |
| BR-3 số liệu gửi kèm | `server/src/chat/service.ts:42` | `chat.test.ts` (SC1) |
| BR-4 kiểm tin nhắn | `server/src/chat/service.ts:19` | `chat.test.ts` (SC3) |
| BR-5 prompt, gọi Gemini | `server/src/ai/chat.ts:20`, `server/src/ai/gemini.ts:77` | (chưa kiểm với Gemini thật) |
| BR-6 lỗi | `server/src/chat/service.ts:93`, `web/src/chat-context.tsx:60` | `chat.test.ts` (SC2), `chat.test.tsx` |
| BR-7 khung chat, nút nổi | `web/src/components/ChatSheet.tsx:16`, `web/src/components/AppShell.tsx:53` | `chat.test.tsx` (SC4) |

API: `GET /api/chat` (số câu còn lại), `POST /api/chat` `{ messages }` (`server/src/chat/routes.ts:9`).

Chưa kiểm: chất lượng câu trả lời của Gemini thật, hạn mức thật khi dùng chung key với SmartClocking.
