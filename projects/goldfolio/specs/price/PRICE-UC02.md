# PRICE-UC02 — AI nhận định xu hướng giá vàng, bạc

> Trạng thái: implemented · Việc: 2026-11-05-ai-xu-huong · Cập nhật: 2026-11-05 · Kiểm ở commit `b85b3bb` (nhánh `main`, 2026-11-17)

## Mục tiêu
Người dùng mở khung chat "Hỏi AI" và đọc được ngay ở đầu khung, bằng lời dễ hiểu, giá vàng (hoặc bạc) 30 ngày qua đang tăng, giảm hay đi ngang, và giá mua vào hiện tại đang ở đâu so với giá vốn của mình. Đây là nhận định tham khảo, không phải lời khuyên đầu tư.

## Phạm vi
- Vai trò: tài khoản đã đăng nhập (ACC-BR-001).
- Màn hình:
  - Thẻ "Nhận định xu hướng" ở **đầu khung chat Hỏi AI** (PRICE-UC03), có nút chuyển Vàng | Bạc. User chuyển từ tab Biểu đồ vào chat 2026-11-05; tab Biểu đồ chỉ còn biểu đồ.
  - Bong bóng nhận định ở dòng sản phẩm của tab **Tổng quan** (BR-11).
- Phụ thuộc:
  - Giá theo ngày của nguồn (PRICE-BR-007) và ảnh chụp giá live.
  - Nhà cung cấp AI: **Google Gemini, gói miễn phí** (user chốt 2026-11-05), model mặc định `gemini-3.6-flash`.
- Ngoài phạm vi:
  - Dự báo con số giá tương lai, khuyến nghị mua/bán.
  - Tin tức thị trường thế giới (không cho AI tìm web).
  - Nhận định cho thương hiệu chưa có nguồn giá.

## Quy tắc nghiệp vụ
- BR-1: **Số liệu 30 ngày.** Server tải bù giá theo ngày của 30 ngày đã qua gần nhất cho mọi thương hiệu có nguồn (tuần tự, nghỉ 1,5 giây giữa hai lần hỏi, mỗi ngày vẫn chỉ hỏi một lần theo PRICE-BR-007), chạy nền sau mỗi lượt lấy giá live. Chuỗi giá của một sản phẩm: mỗi ngày một điểm, ưu tiên giá theo ngày của nguồn, ngày chưa có thì lấy ảnh chụp live cuối cùng của ngày đó.
- BR-2: **Sản phẩm được nhận định** cho mỗi kim loại: sản phẩm (có nguồn giá) mà người dùng bỏ nhiều tiền nhất. Chưa có thì dùng sản phẩm mặc định của thương hiệu mặc định (vàng: Nhẫn tròn Phú Quý 999.9; bạc: sản phẩm bạc đầu tiên của Phú Quý).
- BR-3: **Ít hơn 5 ngày có giá** thì không gọi AI.
  - Hôm nay chưa tải bù xong: server tự bắt đầu tải bù (dùng chung với lịch lấy giá, không tải trùng), trả "Đang tải giá 30 ngày gần nhất, đợi khoảng 1 phút". Thẻ hiện thông báo này như trạng thái chờ (không phải lỗi) và tự thử lại sau mỗi 15 giây (user yêu cầu 2026-11-05: thiếu dữ liệu thì phải tự thêm).
  - Đã tải bù xong mà vẫn thiếu: báo "Nguồn giá chưa có đủ số liệu để nhận định (cần ít nhất 5 ngày)".
- BR-4: **Số liệu tóm tắt do server tính** từ giá thật, không lấy từ AI: số ngày, giá mua vào đầu kỳ → cuối kỳ, % thay đổi (2 chữ số thập phân), thấp nhất, cao nhất.
- BR-5: **Gửi cho AI:** tên sản phẩm, đơn vị niêm yết, giá mua vào/bán ra từng ngày, số liệu tóm tắt, và (user chốt) khối lượng đang có, giá vốn bình quân, tổng tiền mua của sản phẩm đó. **Không gửi** email hay thông tin tài khoản. Gói miễn phí của Google có thể dùng dữ liệu gửi lên để cải thiện sản phẩm.
- BR-6: **AI trả về JSON**: xu hướng (tăng / giảm / đi ngang), độ tin cậy (thấp / trung bình / cao), tóm tắt 2–3 câu, tối đa 4 ý, nhận xét so với giá vốn (chỉ khi người dùng đang có sản phẩm). Server kiểm định dạng; sai thì không lưu, báo lỗi.
- BR-7: **Mỗi ngày một bản** cho mỗi người, mỗi kim loại: lần đầu mở trong ngày thì phân tích và lưu, mở lại dùng bản đã lưu (không tốn lượt AI). Sản phẩm được nhận định đổi (vd vừa mua sản phẩm khác nhiều tiền hơn) thì phân tích lại.
- BR-8: **"Phân tích lại"**: gọi AI lần nữa, tối đa **3 lần mỗi ngày** cho mỗi kim loại. Nút ghi số lượt còn lại; hết lượt thì báo "Hôm nay đã phân tích lại đủ 3 lần, mai thử lại nhé".
- BR-9: **Lỗi không làm hỏng trang:** chưa cấu hình AI (thiếu `GEMINI_API_KEY`) báo "Chưa bật AI nhận định (thiếu GEMINI_API_KEY)"; hết hạn mức miễn phí báo "AI đã hết lượt miễn phí, thử lại sau"; Gemini quá tải (503 "high demand", gặp thật trên Render 2026-11-05) báo "AI đang quá tải, thử lại sau ít phút"; lỗi khác báo "Chưa phân tích được, thử lại sau". Biểu đồ và các tab khác vẫn dùng bình thường. Phân tích lại bị lỗi thì giữ nhận định cũ.
- BR-9a: **Model dự phòng:** model chính quá tải (503, 500) hoặc hết lượt (429) thì tự thử model dự phòng (mặc định `gemini-3.5-flash-lite`, đổi bằng `GEMINI_FALLBACK_MODEL`); lỗi khác không thử tiếp. Cả hai đều không được mới báo lỗi theo BR-9. Chat (PRICE-UC03) dùng chung cơ chế này.
- BR-10: **Hiển thị** (đầu khung chat; kim loại mặc định là kim loại vừa xem ở bong bóng, không thì theo bộ lọc đang dùng, đang "Tất cả" thì Vàng): xu hướng (tăng màu xanh, giảm màu đỏ, đi ngang màu xám), độ tin cậy, tên sản phẩm, dòng số liệu "30 ngày: mua vào 13.400.000 → 13.690.000/chỉ +2,16%", tóm tắt, các ý, nhận xét so với giá vốn, và dòng cuối "Nhận định tham khảo, không phải lời khuyên đầu tư · model · giờ tạo". Đang chờ AI thì hiện "Đang phân tích…".

- BR-11: **Bong bóng ở Tổng quan** (user yêu cầu 2026-11-05): chạm ô giá trị / % lãi/lỗ của một sản phẩm thì mở bong bóng ngay dưới dòng đó: xu hướng 30 ngày của kim loại, tóm tắt, "Theo <sản phẩm được nhận định> · tham khảo, không phải lời khuyên đầu tư", nút **"Hỏi thêm"** mở chat (PRICE-UC03) có sẵn tin "Nhận định <vàng/bạc> hôm nay: <tóm tắt>". Mỗi lúc một bong bóng; chạm lại, nút ✕ hoặc Esc thì đóng. Dùng bản đã lưu trong ngày (BR-7), không tốn thêm lượt.

## Scenario

```gherkin
Scenario: PRICE-UC02-SC1 Tải bù giá theo ngày 30 ngày
  Given hôm nay 02/11/2026, nguồn có giá theo ngày của 30 ngày trước trừ một ngày
  When server tải bù 30 ngày
  Then nguồn được hỏi đúng 30 ngày đã qua (không hỏi hôm nay), mỗi ngày một lần
  And tải bù lần nữa thì không hỏi lại ngày nào
  And chuỗi giá có 29 ngày, cũ trước

Scenario: PRICE-UC02-SC2 Mỗi ngày phân tích một lần
  Given có giá nhẫn tròn 30 ngày, tôi có 2 chỉ nhẫn tròn giá vốn 13.000.000/chỉ
  When tôi mở khung chat Hỏi AI (Vàng)
  Then AI nhận được giá 30 ngày và giá vốn 13.000.000, không có email của tôi
  And thẻ hiện số liệu do server tính: mua vào 13.400.000 → 13.690.000 (+2,16%)
  When tôi mở lại trong ngày
  Then dùng bản đã lưu, không gọi AI lần nữa

Scenario: PRICE-UC02-SC3 Phân tích lại tối đa 3 lần mỗi ngày
  When tôi bấm "Phân tích lại" 3 lần
  Then nút lần lượt ghi còn 2, 1, 0 lần
  When tôi phân tích lại lần thứ 4
  Then báo "Hôm nay đã phân tích lại đủ 3 lần, mai thử lại nhé"

Scenario: PRICE-UC02-SC4 Chưa có lần mua bạc
  When tôi chọn Bạc ở thẻ nhận định trong khung chat
  Then nhận định sản phẩm bạc mặc định, không có phần so với giá vốn

Scenario: PRICE-UC02-SC5 Thiếu dữ liệu thì tự tải bù
  Given server vừa khởi động, chưa tải bù giá 30 ngày
  When tôi mở khung chat Hỏi AI
  Then server bắt đầu tải bù và báo "Đang tải giá 30 ngày gần nhất, đợi khoảng 1 phút", không gọi AI
  When tải bù xong
  Then mở lại có nhận định
  Given đã tải bù xong nhưng nguồn chỉ có giá 4 ngày
  When tôi mở khung chat Hỏi AI
  Then báo "Nguồn giá chưa có đủ số liệu để nhận định (cần ít nhất 5 ngày)"

Scenario: PRICE-UC02-SC6 AI hết lượt hoặc lỗi
  When AI báo hết hạn mức miễn phí
  Then báo "AI đã hết lượt miễn phí, thử lại sau"
  When AI lỗi khác
  Then báo "Chưa phân tích được, thử lại sau" và không lưu bản hỏng

Scenario: PRICE-UC02-SC10 Model chính quá tải thì dùng model dự phòng
  Given gemini-3.6-flash trả 503 "high demand"
  When phân tích xu hướng hoặc hỏi AI
  Then dùng gemini-3.5-flash-lite và vẫn có kết quả
  Given cả hai model đều quá tải
  Then báo "AI đang quá tải, thử lại sau ít phút"

Scenario: PRICE-UC02-SC7 Thẻ nhận định ở đầu khung chat
  When nhận định trả về xu hướng tăng
  Then thẻ ghi "Xu hướng tăng", dòng số liệu 30 ngày, tóm tắt, nhận xét so với giá vốn
  And dòng "Nhận định tham khảo, không phải lời khuyên đầu tư"

Scenario: PRICE-UC02-SC9 Thẻ chờ tải giá rồi tự thử lại
  Given server báo đang tải giá 30 ngày
  When tôi mở khung chat Hỏi AI
  Then thẻ hiện "Đang tải giá 30 ngày gần nhất, đợi khoảng 1 phút" kèm vòng xoay, không báo lỗi đỏ
  When 15 giây sau giá đã đủ
  Then thẻ tự hiện nhận định, tôi không phải bấm gì

Scenario: PRICE-UC03-SC5 Bong bóng nhận định ở Tổng quan
  When tôi chạm % lãi/lỗ của "Nhẫn tròn Phú Quý 999.9" ở Tổng quan
  Then ngay dưới dòng đó hiện bong bóng "Xu hướng tăng" và tóm tắt nhận định vàng
  When tôi bấm "Hỏi thêm"
  Then khung chat mở, tin đầu là "Nhận định vàng hôm nay: …"

Scenario: PRICE-UC02-SC8 Đang phân tích lại
  When tôi bấm "Phân tích lại (còn 3 lần)"
  Then thẻ hiện "Đang phân tích…"
  When có kết quả
  Then nút ghi "Phân tích lại (còn 2 lần)"
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 tải bù 30 ngày, chuỗi giá theo ngày | `server/src/prices/service.ts:219`, `server/src/prices/service.ts:274`, `server/src/prices/scheduler.ts:21` | `trends.test.ts` (SC1) |
| BR-2 chọn sản phẩm | `server/src/trends/service.ts:51` | `trends.test.ts` (SC2, SC4) |
| BR-3, BR-4 đủ dữ liệu (thiếu thì tự tải bù), số liệu do server tính | `server/src/trends/service.ts:70`, `server/src/trends/service.ts:124`, `server/src/prices/service.ts:239`, `web/src/components/TrendCard.tsx:35` | `trends.test.ts` (SC2, SC5), `trend.test.tsx` (SC9) |
| BR-5, BR-6 dữ liệu gửi AI, kiểm JSON | `server/src/ai/trend.ts:75`, `server/src/ai/trend.ts:98`, `server/src/ai/gemini.ts:18` | `trend-parse.test.ts`, `trends.test.ts` (SC2) |
| BR-7, BR-8 mỗi ngày một bản, phân tích lại 3 lần | `server/src/trends/service.ts:115`, `server/src/trends/routes.ts:14` | `trends.test.ts` (SC2, SC3) |
| BR-9a model dự phòng | `server/src/ai/gemini.ts:37` | `gemini.test.ts` (SC10) |
| BR-9 lỗi không làm hỏng trang | `server/src/ai/gemini.ts:37`, `web/src/components/TrendCard.tsx:35` | `trends.test.ts` (SC6), `trend.test.tsx` |
| BR-10 hiển thị | `web/src/components/TrendCard.tsx:35`, `web/src/hooks/useTrend.ts:13` | `trend.test.tsx` (SC7, SC8) |
| BR-11 bong bóng ở Tổng quan | `web/src/components/TrendPopover.tsx:12`, `web/src/pages/OverviewPage.tsx:116` | `chat.test.tsx` (PRICE-UC03-SC5) |

Bảng `trend_insights`: `server/src/schema.sql:80`. Bật AI khi có `GEMINI_API_KEY`: `server/src/index.ts:42`.

Chưa kiểm: gọi Gemini thật (test dùng model giả, không gọi mạng); chất lượng nhận định tiếng Việt và hạn mức thật của gói miễn phí cần kiểm khi đã có API key.

## Câu hỏi mở
- [ ] Có cần cho AI đọc tin tức thị trường (web search) không? Tốn thêm và gói miễn phí giới hạn.
