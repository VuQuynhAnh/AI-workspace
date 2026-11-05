# Plan: AI nhận định xu hướng giá vàng, bạc

Trạng thái: xong. Spec: `specs/price/PRICE-UC02.md`.

## User đã chốt

- Số liệu: giá Phú Quý **30 ngày** gần nhất (nới PRICE-BR-007: tải bù 30 ngày một lần, sau đó mỗi ngày thêm một ngày).
- Model: **miễn phí** → đề xuất Google Gemini Flash (gói miễn phí, API key từ Google AI Studio).
- Tần suất: mỗi ngày một nhận định cho vàng, một cho bạc, lưu DB; có nút **"Phân tích lại"** (giới hạn vài lần/ngày để không vượt hạn mức miễn phí).

## Việc

- [x] Giá lịch sử 30 ngày: hàm tải bù giá theo ngày còn thiếu (tuần tự, mỗi ngày một lượt, User-Agent của app, R-SRC-02), lưu như ảnh chụp `daily`. Sửa PRICE-BR-007.
- [x] Lớp gọi AI tách riêng (`server/src/ai/`): một interface `TrendModel`, bản cài đặt Gemini. Đổi nhà cung cấp chỉ sửa một file.
- [x] Bảng `trend_insights` (kim loại, ngày, nội dung, model, thời điểm tạo) trong `schema.sql`: bảng mới nên `CREATE TABLE IF NOT EXISTS` lúc khởi động là đủ, không cần `migrate()` (R-DB-01 chỉ áp cho cột thêm vào bảng cũ).
- [x] API `GET /api/trends?metal=gold|silver` (lấy bản hôm nay, chưa có thì tạo) và `POST /api/trends/refresh` (giới hạn lượt/ngày). Đăng nhập mới dùng được.
- [x] Prompt: số liệu giá 30 ngày (mua vào/bán ra) + (tuỳ user) giá vốn bình quân, khối lượng đang có. Yêu cầu trả về JSON có cấu trúc: xu hướng (tăng/giảm/đi ngang), mức biến động, điểm đáng chú ý, nhận xét so với giá vốn; luôn nói rõ mức không chắc chắn.
- [x] Giao diện: thẻ "Nhận định xu hướng" ở tab Biểu đồ theo kim loại đang lọc, nút "Phân tích lại", trạng thái đang phân tích/lỗi (R-UI-04), dòng "Nhận định tham khảo, không phải lời khuyên đầu tư".
- [x] Không có API key, hết hạn mức hoặc lỗi: thẻ hiện thông báo kèm "Thử lại" (không ẩn), biểu đồ và các tab khác vẫn chạy.
- [x] Test: tải bù giá (giả nguồn), lớp AI giả (không gọi mạng trong test), API, giao diện. Spec, ARCHITECTURE, README (biến môi trường `GEMINI_API_KEY`).

## Cần user

- ~~Đồng ý thêm dependency~~ đã đồng ý: `@google/genai` 2.32.
- Tự tạo API key ở Google AI Studio, dán vào `.env` và Render (`GEMINI_API_KEY`).
- ~~Gửi giá vốn?~~ user chốt: gửi giá thị trường + giá vốn, khối lượng; không gửi thông tin tài khoản.

## Rủi ro

- Hạn mức miễn phí do Google tự đặt và thay đổi; vượt thì báo lỗi 429 → hiện thông báo, không thử lại liên tục.
- Tải bù 30 ngày lần đầu mất vài chục giây (tuần tự để không dồn request vào Phú Quý); chạy nền, không chặn trang.
- AI có thể nhận định sai; chỉ là tham khảo.

## Kết quả

- Model mặc định `gemini-3.6-flash` (bản ổn định theo trang model của Google, tra 2026-11-05), đổi qua `GEMINI_MODEL`.
- Test: shared 28, server 94 (thêm `trends.test.ts` SC1–SC6, `trend-parse.test.ts`), web 48 (thêm `trend.test.tsx` SC7, SC8). Lint, build sạch.
- Chưa kiểm: gọi Gemini thật (chưa có API key), chất lượng nhận định tiếng Việt, hạn mức thật.

## Sửa sau (user báo: thiếu dữ liệu thì phải tự thêm)

- [x] Thiếu giá khi mở tab: server tự tải bù 30 ngày (`startBackfill`, dùng chung với lịch lấy giá, không tải trùng), trả "Đang tải giá 30 ngày gần nhất…" kèm `fields.trend = "loading"`; thẻ hiện như trạng thái chờ và tự thử lại mỗi 15 giây. Tải xong vẫn thiếu thì báo nguồn chưa có đủ số liệu. Spec BR-3, SC5, SC9.
- Test: server 96, web 49. Lint sạch.

