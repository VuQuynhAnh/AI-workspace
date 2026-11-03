# Review — 2026-11-03

Phạm vi: `git -C repos/goldfolio diff main` + file mới chưa commit (nhánh `feat/mvp`, toàn bộ code MVP: `shared/`, `server/`, `web/`) · Spec: HOLD-UC01, rule domain ACC/HOLD/PRICE.
Đã chạy: `npm test` (shared 23/23, server 56/56 pass), `npm run lint` (sạch), `node tools/check-docs.mjs` (0 lỗi), cùng một test thăm dò tạm thời (đã xoá) để xác nhận các mục bên dưới.

## Blocker
Không có.

## Major
- [x] `web/src/components/PurchaseDialog.tsx:84` — Gợi ý giá có thể **ghi đè giá người dùng vừa gõ**. Effect so `priceMode`/`unitPrice` của lần render lúc gửi yêu cầu (closure), không phải giá trị lúc nhận kết quả. Kịch bản: chọn sản phẩm (ô giá trống) → trong lúc `/prices/suggest` chưa trả về, gõ 13.700.000 → kết quả về, `unitPrice === ""` theo closure → ô giá bị thay bằng số gợi ý. (BR-6, SC13)
- [x] `server/src/prices/service.ts:178` — Hỏi giá theo ngày cho **hôm nay** bị ghi `daily_misses` vĩnh viễn. Kịch bản: mua lúc 08:00 trước ảnh chụp live đầu ngày (hoặc khi lấy giá live đang lỗi như hiện tại) → nguồn chưa có trang XemLai của hôm nay → ghi miss → sang ngày mai, lần mua ghi ngày đó không bao giờ được gợi ý giá nữa dù nguồn đã có. Đã tái hiện: gọi suggest ngày 2026-11-02 khi "bây giờ" là 2026-11-02 → `daily_misses` có `2026-11-02`. (PRICE-BR-004, PRICE-BR-007)
- [x] `server/src/purchases/validate.ts:80-82` — Không có giới hạn trên cho khối lượng và giá: tiền vượt vùng số nguyên chính xác và bị lưu thành số thực. Kịch bản: 999.999.999 kg × đơn giá 999.999.999.999 → `totalCost = 2.6666666639973333e+23` được lưu (CHECK `> 0` vẫn qua). (R-MONEY-01)
- [x] `web/src/pages/PortfolioPage.tsx:39-42` — Biểu đồ biến mất sau khi xoá hết lần mua của sản phẩm đang chọn. `historyProduct` vẫn giữ id cũ → API trả 404 "Không tìm thấy sản phẩm" (đã tái hiện) → `catch` trả `null` → không còn biểu đồ cho tới khi tải lại trang, dù còn sản phẩm khác. (BR-13, SC21)

## Minor
- [ ] `server/src/auth/auth.ts:86` — Email không tồn tại thì trả lời ngay, không chạy scrypt; email có thật thì chậm hơn khoảng vài chục ms. Đo thời gian phản hồi vẫn đoán được email đã đăng ký, trái ý của ACC-BR-003. Sửa: chạy `verifyPassword` với một hash giả khi không có user.
- [ ] `web/src/components/HistoryChart.tsx:47` — Trục X là trục danh mục: hai ngày mua cách nhau 1 ngày hay 1 năm đều đứng cạnh nhau, nên độ dốc của đường dễ gây hiểu nhầm. Spec chỉ yêu cầu "chia theo ngày" nên chưa sai, nhưng nên dùng trục thời gian (`type="number"` + timestamp).
- [ ] `web/src/pages/PortfolioPage.tsx:139` — Khi mọi lần mua đều chưa có giá, khối tổng quan hiện "Tổng tiền mua 0". Đúng theo BR-9 (chỉ tính lần mua có giá) nhưng dễ đọc nhầm. Có thể thêm dòng "Không gồm N lần mua chưa có giá" ngay cạnh số (hiện dòng này đang nằm ở dưới).
- [ ] `server/src/auth/auth.ts:33` — Phiên hết hạn không bao giờ bị xoá khỏi `sessions` (bảng chỉ tăng). Nên dọn khi đăng nhập hoặc trong lịch chạy định kỳ.
- [ ] `server/src/prices/service.ts:170` — Hai yêu cầu gợi ý cùng một ngày gửi đồng thời sẽ cùng hỏi nguồn và lưu 2 ảnh chụp `daily` trùng nhau. Kết quả vẫn đúng (`LIMIT 1`), chỉ thừa dữ liệu và thừa một lần gọi nguồn. (PRICE-BR-007, *cần kiểm tra* mức độ trên thực tế)

## Tài liệu (CONVENTIONS §6)
- [ ] Chưa chạy tay trên trình duyệt: SC9, SC13, form sửa SC20/SC24, biểu đồ SC26, màn hình 375px (plan ghi rõ "chưa làm").
- [ ] "Kiểm ở commit `34499a5`" trong ARCHITECTURE, `_domain.md`, HOLD-UC01: commit xong phải cập nhật sha (`/track mvp commit`).
- Phần còn lại đủ: spec `implemented` có mục Cài đặt, ARCHITECTURE mới, glossary, README (API + lệnh), `protected.json`, `check-docs` sạch.

## Đề xuất bổ sung tri thức
> Đã ghi vào ARCHITECTURE (user đồng ý 2026-11-03): R-MONEY-02, R-UI-02, bẫy §6.9.
- **Bẫy mới cho ARCHITECTURE §6:** "Hôm nay chưa xong": mọi cache kiểu "nguồn không có dữ liệu ngày X" chỉ được ghi cho ngày đã qua (X < hôm nay theo giờ VN). Lỗi này chỉ lộ khi chạy qua ngày.
- **Luật đề xuất R-UI-02:** kết quả async (gợi ý, tải lại) không được ghi đè ô người dùng đang sửa. Phải so với giá trị hiện tại qua `ref`, không so với closure.
- **Luật đề xuất R-MONEY-02:** mọi số tiền và khối lượng nhập vào có giới hạn trên. Đề xuất khối lượng ≤ 1.000 kg, đơn giá và tổng tiền ≤ 1.000 tỷ, để kết quả luôn là số nguyên an toàn.

## Đã kiểm, không có vấn đề
- **Cô lập dữ liệu theo tài khoản:** mọi truy vấn `purchases` có `user_id`; GET/PUT/DELETE lần mua của người khác trả 404 (test SC22).
- **Đăng nhập:** API dữ liệu đều qua `requireUser`. Mật khẩu hash bằng scrypt có salt; token phiên lưu dạng SHA-256; cookie httpOnly + SameSite=Lax. POST JSON từ site khác cần preflight nên bị chặn.
- **SQL:** toàn bộ dùng prepared statement, không ghép chuỗi.
- **Tiền và khối lượng:** với dữ liệu hợp lý, tính bằng số nguyên mg/VNĐ, làm tròn một lần (`shared/src/money.ts`), test SC2/3/14/15/20/24/25/26/27.
- **Giờ VN:** "hôm nay"/"hiện tại" và mốc giờ nguồn đều qua `shared/src/time.ts`; test SC6/SC7 dùng đồng hồ cố định.
- **Nguồn giá:** HTML lỗi hoặc giá 0 thì bỏ bảng (test); lỗi mạng không ghi miss; không giả User-Agent trình duyệt; mỗi phần (vàng/bạc) lỗi độc lập.
- **Bẫy §6.1–6.5** của ARCHITECTURE đều có test tương ứng.
- **Comment:** viết tiếng Việt, giải thích nghiệp vụ, không có slug hay mã ticket (đã grep).
- **Test:** mọi logic server mới đều có test, và test có `// SC:`.

## Đã xử lý — 2026-11-03
- Major 1: `PurchaseDialog` so với giá trị hiện tại qua `priceNow` ref (R-UI-02). Chưa có test tự động cho web; cần chạy tay SC13.
- Major 2: `PriceService.priceAt` không hỏi giá theo ngày cho hôm nay; đồng hồ tiêm qua constructor. Test hồi quy ở `price-service.test.ts`.
- Major 3: giới hạn khối lượng ≤ 1.000 kg, tiền ≤ 1.000 tỷ, kể cả số tự tính; thêm lỗi "Giá mua quá nhỏ so với khối lượng" (trước đây số tự tính làm tròn ra 0 sẽ vi phạm CHECK của DB và trả 500); tính tiền bằng BigInt. Spec BR-3, BR-5, SC33; test `api.test.ts` (SC33), `money.test.ts`.
- Major 4: biểu đồ quay về sản phẩm mặc định khi sản phẩm đang xem không còn lần mua. Chưa có test tự động cho web.
- Kết quả: `npm test` shared 24/24, server 58/58; `npm run lint` sạch.
- Minor: chưa xử lý, để việc sau.
