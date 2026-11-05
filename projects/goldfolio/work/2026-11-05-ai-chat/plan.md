# Plan: nhận định AI ngay trên Tổng quan + chat hỏi AI

Trạng thái: xong. Spec: `specs/price/PRICE-UC02.md` (BR-11 bong bóng), `specs/price/PRICE-UC03.md` (chat), `specs/holding/HOLD-UC01.md` (BR-21).

## Yêu cầu (user 2026-11-05)

- Không làm Zalo Mini App, giữ web.
- Nhận định AI đưa ra ngoài, dạng bong bóng ngay ở dòng sản phẩm trên Tổng quan.
- Thêm chat hỏi AI.
- (thêm giữa chừng) Chạm thẻ Vàng/Bạc ở Tổng quan thì sang Chi tiết với bộ lọc tương ứng; Chi tiết hiện giá hiện tại để tham chiếu.

## User đã chốt

- Bong bóng ở dòng sản phẩm + nút chat nổi trên nút "+".
- 20 câu hỏi/ngày.
- Lịch sử chat chỉ trong phiên, server không lưu nội dung.

## Việc

- [x] Bong bóng nhận định: chạm ô giá trị / % lãi/lỗ của sản phẩm → `TrendPopover` (xu hướng, tóm tắt, "Hỏi thêm"), dùng bản đã lưu trong ngày. Tách `useTrend` dùng chung với `TrendCard`.
- [x] Nút "Hỏi AI" nổi (trên nút "+", cả 3 tab) → `ChatSheet` trượt từ đáy; `ChatProvider` đặt trong vùng đã đăng nhập để chuyển tab / mở form không mất lịch sử.
- [x] `GET /api/chat` (số câu còn lại), `POST /api/chat` `{ messages }`: server ghép số liệu (danh mục, giá 30 ngày tối đa 4 sản phẩm, nhận định hôm nay), gọi Gemini qua `ChatModel`; không gửi email. Bảng `chat_usage` chỉ đếm số câu.
- [x] Giới hạn 20 câu/ngày, chỉ tính câu trả lời được; lỗi thì bỏ câu hỏi khỏi khung và trả chữ lại ô nhập.
- [x] Thẻ Vàng/Bạc (tên nhóm, tên sản phẩm) ở Tổng quan → Chi tiết với bộ lọc; Chi tiết có khối "Giá hiện tại".
- [x] Test, spec, ARCHITECTURE-PRICES (R-AI-04), README, glossary.

## Kết quả

- Test: shared 28, server 100 (thêm `chat.test.ts` SC1–SC3 + cấu hình/đăng nhập), web 53 (thêm `chat.test.tsx`: SC4, SC5, SC57, SC58). Lint, build sạch.
- Chưa kiểm: Gemini thật (chất lượng trả lời, hạn mức khi dùng chung key với SmartClocking), bố cục trên điện thoại thật.

## Sửa sau (user 2026-11-05)

- [x] Nhận định xu hướng chuyển vào đầu khung chat (nút chuyển Vàng | Bạc, mặc định kim loại vừa xem ở bong bóng hoặc theo bộ lọc); tab Biểu đồ chỉ còn biểu đồ. Bong bóng ở Tổng quan giữ.
- [x] Nút "+" cùng cỡ 48px với nút chat.
- Test: web 54, server 100, shared 28. Lint, build sạch.

