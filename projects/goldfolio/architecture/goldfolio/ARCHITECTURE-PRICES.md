# goldfolio — ARCHITECTURE-PRICES (bẫy nguồn giá)

> Tách từ `ARCHITECTURE.md` §6 vì file chính vượt 15 KB; giữ nguyên số thứ tự bẫy (§6.n) để các chỗ đang trích không đổi. Kiểm ở commit `7957b32` (nhánh `main`, 2026-11-17).

1. **Bảng bạc có 2 dòng nhóm** (`server/src/prices/phuquy/parse.ts:78`): "BẠC THƯƠNG HIỆU PHÚ QUÝ" đứng trước, "… KHÁC" đứng sau. Coi mọi dòng nhóm là "hãng khác" thì mất toàn bộ bạc Phú Quý.
2. **Bảng vàng trang chủ có dòng bạc theo chỉ** (`server/src/prices/phuquy/parse.ts:59`): bỏ khi lấy giá live; chỉ dùng trong giá theo ngày, nhân lên lượng qua `matchRows`. Sản phẩm theo kg không nhận giá quy từ chỉ (`server/src/prices/match.ts:46`).
3. **Dữ liệu XemLai bẩn**: có ngày 2 dòng "Nhẫn tròn" trùng (lấy dòng đầu), tên viết hoa/dấu cách không đều, năm 2023 không có bạc. Thêm tên khác vào `aliases` trong `catalog.ts`, đừng sửa bộ đọc.
4. **Ẩn sản phẩm theo bảng live** (`server/src/prices/service.ts:129`): mỗi lần lưu bảng mới, sản phẩm `live` cùng kim loại không có trong bảng bị `active = 0`. Bảng đọc thiếu dòng (nhưng không lỗi) sẽ ẩn nhầm sản phẩm khỏi form thêm mới; lần mua cũ vẫn giữ.
5. **Lỗi mạng ≠ không có dữ liệu** (`server/src/prices/service.ts:201`): fetch lỗi thì không ghi `daily_misses`, để lần sau thử lại. Ghi nhầm thì ngày đó không bao giờ được gợi ý giá.
9. **"Hôm nay chưa xong"** (`server/src/prices/service.ts:195`): cache kiểu "nguồn không có dữ liệu ngày X" chỉ được ghi cho ngày đã qua theo giờ VN. Ghi cho hôm nay thì ngày đó bị chặn vĩnh viễn; lỗi chỉ lộ khi chạy qua ngày.

## Nhận định xu hướng bằng AI (PRICE-UC02)

Luồng: lịch lấy giá tải bù giá theo ngày 30 ngày (`server/src/prices/scheduler.ts:21` → `server/src/prices/service.ts:219`) → `GET /api/trends` → `getTrend` (`server/src/trends/service.ts:102`): chọn sản phẩm, lấy chuỗi giá (`server/src/prices/service.ts:274`), tính số liệu, gọi `TrendModel` (`server/src/ai/trend.ts:37`; bản Gemini `server/src/ai/gemini.ts:18`), kiểm JSON, lưu `trend_insights`.

| ID | Luật |
|---|---|
| R-AI-01 | Con số trên màn hình (giá, %, thấp/cao nhất) do server tính từ giá thật; AI chỉ viết lời nhận xét. Kết quả AI luôn qua `parseTrendAnalysis` (`server/src/ai/trend.ts:98`), sai định dạng thì không lưu. |
| R-AI-02 | Chỉ gửi giá và giá vốn; không gửi email, id hay thông tin tài khoản (gói miễn phí có thể bị dùng để cải thiện sản phẩm). |
| R-AI-04 | Chat (PRICE-UC03): số liệu danh mục do server ghép (`server/src/chat/service.ts:42`), không nhận ngữ cảnh từ trình duyệt; chỉ đếm số câu (`chat_usage`), không lưu nội dung. |
| R-AI-03 | Gọi AI qua giao diện `TrendModel`, không gọi SDK của nhà cung cấp ở chỗ khác. Test dùng model giả, không gọi mạng. Thiếu `GEMINI_API_KEY` thì API trả 503, phần khác vẫn chạy. |

Bẫy:
- **Hạn mức miễn phí, quá tải** (`server/src/ai/gemini.ts:37`): 429 hết lượt, 503/500 quá tải ("high demand" gặp thật trên Render) → thử model dự phòng một lần, vẫn lỗi thì báo người dùng; không tự thử lại liên tục, sẽ càng bị chặn lâu. "Phân tích lại" giới hạn 3 lần/ngày (`server/src/trends/service.ts:115`).
- **Tải bù dồn request**: lần chạy đầu hỏi 30 ngày, phải tuần tự và có nghỉ giữa các lần (R-SRC-02); đừng đổi sang `Promise.all`.
