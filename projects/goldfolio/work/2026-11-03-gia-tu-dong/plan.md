# Để trống giá mua thì tự lấy giá ngày mua

Việc: 2026-11-03-gia-tu-dong · Spec: specs/holding/HOLD-UC01.md (BR-16, SC8, SC34–SC37) · Repo: goldfolio · Branch: feat/gia-tu-dong (từ `feat/mobile-ui`)

## Bối cảnh
User không muốn tự tra giá của ngày đã mua. Để trống giá thì khi lưu, server lấy giá bán ra tại thời điểm mua (PRICE-BR-004) và gắn nhãn "Giá tự lấy · …".

## Mẫu tham chiếu
- Tra giá và dựng nhãn: `GET /api/prices/suggest` — `server/src/routes.ts:42` (nhãn "Giá Phú Quý lúc …/ngày …"), `PriceService.priceAt` — `server/src/prices/service.ts:127`.
- Kiểm tra form: `server/src/purchases/validate.ts:42`; route ghi: `server/src/purchases/routes.ts:56`, `server/src/purchases/routes.ts:72`.

## Thiết kế
- **Dữ liệu:** bảng `purchases` thêm `price_source` (`manual` | `auto`, mặc định `manual`) và `price_note` (nhãn nguồn giá).
  - DB đang có dữ liệu: `schema.sql` chỉ `CREATE TABLE IF NOT EXISTS` nên không tự thêm cột. Thêm hàm `ensureColumn` trong `db.ts` (`ALTER TABLE … ADD COLUMN` nếu chưa có). Ghi thành bẫy và luật `R-DB-01` trong ARCHITECTURE.
- **Server:**
  - Tách hàm dựng nhãn giá dùng chung cho `suggest` và tự lấy giá.
  - `validatePurchase` không còn báo "Vui lòng nhập đơn giá hoặc tổng tiền". Hai ô trống thì route (async) gọi `prices.priceAt`. Có giá bán ra thì đơn giá = giá đó, `price_source = auto`, `price_note` = nhãn. Không có thì 400, `fields.price` = "Không tìm được giá ngày này, vui lòng nhập giá mua".
  - Nhập tay thì `price_source = manual`, `price_note = ''`.
  - `purchasesRouter` nhận thêm `prices`. API trả thêm `priceSource`, `priceNote` (lần mua và danh mục).
- **Web:**
  - Hint ô giá: "Để trống để tự lấy giá ngày mua".
  - Thẻ ở tab Lần mua và trang sửa hiện nhãn "Giá tự lấy · …".

## Checklist
- [x] Test API trước: SC34, SC35, SC36 (3 tình huống), SC37, SC8 mới; test `ensureColumn` trên DB cũ thiếu cột
- [x] `server/src/schema.sql` + `server/src/db.ts` (`ensureColumn`)
- [x] Hàm nhãn giá dùng chung; `validate.ts`, `purchases/routes.ts`, `app.ts`, `portfolio/service.ts`
- [x] Web: `api.ts` (kiểu), `PurchaseFormPage` (hint, nhãn khi sửa), `PurchasesPage` (nhãn); test web cho nhãn
- [x] Tự review theo R-*, chạy `npm test`, `npm run lint`, `npm run build`
- [x] Tài liệu: HOLD-UC01 → implemented + Cài đặt; ARCHITECTURE (R-DB-01, bẫy cột mới); README API; glossary `code_name`; `check-docs`

## Rủi ro
- Lưu lần mua phải chờ gọi Phú Quý khi chưa có giá ngày đó trong DB, có thể mất vài giây. Nguồn lỗi (vd lỗi chứng chỉ mạng §6.6) thì báo không tìm được giá, không treo.
- §6.9 "Hôm nay chưa xong": mua hôm nay, trước ảnh chụp live đầu tiên, sẽ không tự lấy được giá (đúng thiết kế).

## Ghi chú khi làm
- Lần mua giá tự lấy: form sửa để trống ô giá (giá cũ hiện mờ). Nếu điền sẵn thì chỉ sửa khối lượng cũng biến thành giá nhập tay và mất nhãn. Lưu mà vẫn trống thì server lấy lại giá; giá ngày cũ đã lưu trong DB nên thường không gọi lại nguồn.
- Thêm lỗi "Giá mua quá nhỏ so với khối lượng" / giới hạn 1.000 tỷ cho cả tổng tiền tự lấy (R-MONEY-02).
