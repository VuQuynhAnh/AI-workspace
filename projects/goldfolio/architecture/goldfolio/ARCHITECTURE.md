# goldfolio — ARCHITECTURE

> Đường dẫn tính từ gốc repo. Kiểm ở commit `3635158` (nhánh `main`, 2026-11-17).
> Chỉ ghi điều KHÔNG suy ra được nhanh từ code. Mỗi khẳng định có `file:line` thật.

## 1. Tổng quan

npm workspaces, TypeScript, Node 22 (`.nvmrc`):

| Workspace | Vai trò |
|---|---|
| `shared/` | Quy đổi khối lượng, tiền, lãi/lỗ, định dạng, ngày giờ VN. Server và web import thẳng mã nguồn TS (`shared/package.json` trỏ `main` vào `src/index.ts`) |
| `server/` | Express 4, PostgreSQL qua `pg` (Pool), cheerio đọc HTML nguồn giá. Chạy bằng `tsx`, không build. AI nhận định xu hướng: `server/src/ai/`, `server/src/trends/` (xem `ARCHITECTURE-PRICES.md`). Có `web/dist` thì trả luôn giao diện (`server/src/app.ts:51`, `server/src/index.ts:48`); `/api` lạ trả 404 JSON (`server/src/app.ts:46`). Deploy Render: README. Widget Android: `server/src/widget/`, `android/` (xem `ARCHITECTURE-WIDGET.md`) |
| `web/` | Vite 6 + React 18 + Tailwind 4 + Recharts, **mobile-first**. Dev proxy `/api` → `:4000` (`web/vite.config.ts:14`). Route ở `web/src/App.tsx:30`: 3 tab trong `AppShell` (`/`, `/bieu-do`, `/chi-tiet`, `/widget` mở từ header; đường dẫn cũ `/lich-su`, `/lan-mua` chuyển hướng) + trang form toàn màn hình (`/them`, `/sua/:id`). Dữ liệu dùng chung qua `PortfolioProvider` (`web/src/portfolio-context.tsx:20`) |

| Kho | Dùng cho | Bắt buộc |
|---|---|---|
| PostgreSQL (Supabase free, `DATABASE_URL` + `DB_SSL_CA`; không có URL thì `pg` đọc `PG*`) | tài khoản, phiên, danh mục, ảnh chụp giá, lần mua | có — không kết nối được thì server thoát với thông báo rõ (`server/src/index.ts:13`) |
| Web Phú Quý (HTML) | giá hiện tại 15 phút/lần, giá theo ngày khi cần | không (lỗi thì giữ giá cũ) |

Tách dữ liệu theo **tài khoản**: mọi bảng của người dùng có `user_id`, không có tenant khác.

## 2. Khởi động và lắp ráp

- `server/src/index.ts:26` đồng bộ danh mục (`seedCatalog`) mỗi lần khởi động; `server/src/index.ts:32` bật lịch lấy giá.
- `server/src/app.ts:30` `createApp({ db, prices, now })`: không listen, test dùng chung. Đăng ký router ở `server/src/app.ts:35-44`, error handler cuối cùng `server/src/app.ts:58`.
- `server/src/db.ts:33` `poolDb`: Pool `pg`, SSL bằng CA của nhà cung cấp khi có `DB_SSL_CA`. Lớp `Db` (`query`/`one`/`exec`/`tx`) dùng chung cho app và test. `initSchema` (`server/src/db.ts:79`) chạy `schema.sql` rồi `migrate()` (`server/src/db.ts:88`) mỗi lần khởi động.
- Danh mục thương hiệu/sản phẩm: `server/src/catalog.ts:30`.

## 3. Sơ đồ layer

```
web/src/pages, components  — gọi API qua web/src/api.ts; danh mục + thương hiệu lấy từ usePortfolio(), gọi reload() sau khi ghi;
                             tính lại số trên form bằng shared (chỉ để hiển thị)
server/src/*/routes.ts     — đọc request, gọi validate/service, trả JSON. Không tính tiền ở đây
server/src/purchases/validate.ts — luật nhập liệu, ra HttpError 400 + fields
server/src/portfolio/service.ts  — tổng hợp lãi/lỗ, biểu đồ
server/src/prices/         — service.ts (lưu/tra giá) ← phuquy/adapter.ts (mạng) ← phuquy/parse.ts (HTML thuần)
shared/src/                — công thức số học thuần, không I/O
```

## 4. Đường đi một request tiêu biểu: `POST /api/purchases`

1. Cookie `sid` → `requireUser` tra `sessions` theo SHA-256 của token, hết hạn thì 401 — `server/src/auth/auth.ts:31`; gắn `res.locals.userId` — `server/src/auth/auth.ts:32`.
2. Router — `server/src/purchases/routes.ts:83`.
3. `validatePurchase` — `server/src/purchases/validate.ts:52`:
   - Ngày giờ so với `now` theo giờ VN — `server/src/purchases/validate.ts:77`, `server/src/purchases/validate.ts:86`.
   - Tính số còn lại theo cách nhập — `server/src/purchases/validate.ts:107-108`, dùng `shared/src/money.ts:21`.
4. INSERT kèm `user_id`, đọc lại bằng `findOwn` (lọc `user_id`) — `server/src/purchases/routes.ts:53-57`.
5. Lỗi: `HttpError` → `{ error, fields }` — `server/src/http.ts:22`; lỗi khác → 500 "Có lỗi xảy ra, vui lòng thử lại".

Thêm tài sản nhiều sản phẩm (BR-18): `POST /api/purchases/batch` (`server/src/purchases/routes.ts:97`) kiểm mọi dòng + tự lấy giá trước, gom lỗi `items.<i>.<ô>`, rồi ghi tất cả trong một transaction (`server/src/purchases/routes.ts:118`).

Tự lấy giá khi để trống (HOLD-UC01/BR-16): `validatePurchase` đánh dấu `priceSource = auto` → `resolvePrice` (`server/src/purchases/validate.ts:130`) gọi `sellPriceAt` (`server/src/prices/suggest.ts:11`, dùng chung với `/api/prices/suggest`) → lưu `price_source`, `price_note`. Không có giá thì 400 `fields.price`.

Luồng giá: `startPriceScheduler` (`server/src/prices/scheduler.ts:11`) → `PriceService.refreshLive` (`server/src/prices/service.ts:102`) → `PhuQuySource.fetchLive` (`server/src/prices/phuquy/adapter.ts:19`) → `parseGoldLive` / `parseSilverLive` (`server/src/prices/phuquy/parse.ts:52`, `server/src/prices/phuquy/parse.ts:65`) → `matchRows` (`server/src/prices/match.ts:32`) → lưu `price_snapshots` + `price_points`.

## 5. Luật bắt buộc

| ID | Luật |
|---|---|
| R-MONEY-01 | Tiền là số nguyên VNĐ; khối lượng là số nguyên **miligram**. Quy đổi chỉ qua `shared` (`shared/src/units.ts:27`, `shared/src/money.ts:21`), nhân trước chia sau, làm tròn một lần. `unit_cost` theo đơn vị **nhập** (`input_unit`); giá nguồn theo đơn vị niêm yết, đổi qua `convertUnitPrice` (`shared/src/money.ts:31`). |
| R-MONEY-02 | Khối lượng một lần mua ≤ 1.000 kg (`shared/src/units.ts:18`), tiền ≤ 1.000 tỷ đồng (`shared/src/money.ts:5`), kiểm cả số tự tính (`server/src/purchases/validate.ts:109`). Phép nhân-chia tiền dùng BigInt vì tích đơn giá × mg có thể vượt 2^53. |
| R-DB-01 | Thêm cột vào bảng đã có: khai báo trong `schema.sql` **và** `ALTER TABLE … ADD COLUMN IF NOT EXISTS` trong `migrate()` (`server/src/db.ts:88`), có test DB cũ (`server/test/db.test.ts`). Sửa dữ liệu cũ thì dùng `runOnce` (chạy một lần, đánh dấu `app_migrations`, `server/src/db.ts:102`). Không xoá/đổi tên cột trên DB đang có dữ liệu (phá dữ liệu); cần thì hỏi trước. |
| R-DB-02 | Truy vấn qua `Db` với tham số `$1, $2…`, không ghép chuỗi. Tiền/khối lượng/id là `BIGINT` (đọc thành number, `server/src/db.ts:21`); ngày/giờ/mốc ISO để `TEXT` (R-TIME-01). Id từ request phải `Number.isSafeInteger` trước khi đưa vào truy vấn, sai thì 404/400 (Postgres báo lỗi kiểu → 500). |
| R-PNL-01 | Giá trị hiện tại tính theo **giá mua vào** (`shared/src/pnl.ts:8`). Lần mua chưa có giá không cộng vào tổng, không coi là 0 (`server/src/portfolio/service.ts:67-68`). |
| R-TIME-01 | "Hôm nay"/"hiện tại" tính theo `Asia/Ho_Chi_Minh` qua `vnDate`/`vnTime`/`vnToIso` (`shared/src/time.ts:3`). Không dùng `new Date().toISOString().slice(0,10)`. Đồng hồ tiêm qua `createApp({ now })` để test. |
| R-OWN-01 | Mọi truy vấn lần mua có `user_id = currentUserId(res)`; không thấy thì 404 "Không tìm thấy lần mua", kể cả khi là của người khác (`server/src/purchases/routes.ts:57`, `server/src/purchases/routes.ts:151`). |
| R-API-01 | Lỗi người dùng ném `HttpError(status, thông báo tiếng Việt, fields?)` (`server/src/http.ts:4`); handler async bọc `asyncHandler` (`server/src/http.ts:18`). Form hiện `fields[tên ô]` dưới ô. |
| R-SRC-01 | Nguồn giá đi qua adapter `PriceSource` (`server/src/prices/types.ts:30`). Đọc HTML lỗi hoặc giá ≤ 0 thì ném lỗi, bỏ cả bảng, không ghi giá 0 (`server/src/prices/phuquy/parse.ts:10`). Mỗi bộ đọc có test bằng HTML thật trong `server/test/fixtures/`. |
| R-SRC-02 | Gọi nguồn với User-Agent của app, không giả trình duyệt, không lách chặn bot. Giá theo ngày chỉ hỏi khi cần, mỗi ngày một lần (`server/src/prices/service.ts:195`, `server/src/prices/service.ts:206`). |
| R-UI-02 | Kết quả async (gợi ý, tải lại) không ghi đè ô người dùng đang sửa: so với giá trị **hiện tại** qua `ref`, không so với closure lúc gửi yêu cầu (`web/src/components/PurchaseLine.tsx:77`, `web/src/components/PurchaseLine.tsx:92`). |
| R-UI-03 | Mobile-first: thiết kế cho 360–430px, màn rộng căn giữa `max-w-md`. Vùng bấm ≥ 44px; ô nhập cao 48px, chữ 16px (`web/src/components/ui.tsx:6`). Thao tác chính ở đáy (thanh tab, nút +, nút Lưu dính đáy, bảng xác nhận trượt từ đáy). Chừa vùng an toàn bằng `.safe-bottom`/`.safe-top` (`web/src/index.css:49`); chiều cao dùng `dvh`, không dùng `vh`. Form là route riêng để nút back của điện thoại hoạt động đúng. |
| R-UI-04 | Mọi màn hình nạp dữ liệu có đủ 3 trạng thái: đang tải, lỗi kèm "Thử lại" (`LoadError`, `web/src/components/ui.tsx:22`), và rỗng/không tìm thấy. Không để "Đang tải…" là trạng thái cuối khi lỗi. Đã có dữ liệu mà nạp lại lỗi thì giữ dữ liệu, chỉ hiện dải lỗi. Form sửa khoá (`<fieldset disabled>`) tới khi nạp xong; 404 thì hiện "Không tìm thấy", không hiện form. |
| R-UI-05 | Màu chỉ dùng token trong `@theme` (`web/src/index.css:8`): `bg`, `surface`, `surface-2`, `line`, `ink`, `muted`, `gold`, `gold-deep`, `gold-soft`, `gain`, `loss`. Không dùng màu cố định (`stone-*`, `white`, mã hex) trong component; riêng Recharts nhận chuỗi màu thì lấy từ hằng `C` trùng token (`web/src/components/HistoryChart.tsx:19`). Chỉ có giao diện tối (`color-scheme: dark`); cặp màu chữ/nền phải ≥ 4.5:1. Font Be Vietnam Pro đóng gói qua `@fontsource` (`web/src/main.tsx:5`). |
| R-UI-01 | Số tiền và lãi/lỗ hiện thẳng (không hiệu ứng chạy số), lãi `text-gain` "+", lỗ `text-loss` "−" (`web/src/components/ui.tsx:34`). |

## 6. Bẫy âm thầm (build vẫn chạy, sai khi chạy)

1–5, 9. **Bẫy nguồn giá** (đọc HTML Phú Quý, dữ liệu XemLai, ẩn sản phẩm theo bảng live, lỗi mạng vs không có dữ liệu, "hôm nay chưa xong"): xem `ARCHITECTURE-PRICES.md`.
6. **Mạng có chứng chỉ riêng**: `fetch` của Node báo `SELF_SIGNED_CERT_IN_CHAIN`, server vẫn chạy nhưng không có giá. Sửa bằng biến hệ thống `NODE_EXTRA_CA_CERTS` (README), không tắt TLS. Kết nối Postgres ra ngoài qua mạng công ty cũng có thể bị chặn cổng hoặc chèn chứng chỉ.
7. **Gợi ý giá không ghi đè giá đã sửa tay** (`web/src/components/PurchaseLine.tsx:92`): so ô giá với số gợi ý lần trước (`lastSuggested`). Đổi cách so sánh này dễ làm gợi ý đè lên giá người dùng gõ. Đổi đơn vị thì quy đổi từ giá gợi ý gốc `suggestedRaw` (`web/src/components/PurchaseLine.tsx:141`), không gọi lại server; lấy giá lỗi phải xoá `suggestedRaw`, kẻo quy đổi nhầm giá của sản phẩm trước. Trang sửa: `lastSuggested` khởi tạo bằng giá đã lưu, `openedWith` (`web/src/components/PurchaseLine.tsx:80`) chặn gợi ý lúc mở bằng cách so giá trị sản phẩm/ngày/giờ, không dùng cờ "lần chạy đầu" vì StrictMode chạy effect hai lần.
8. **Vitest nhiều tiến trình tràn RAM** trên máy dev ít bộ nhớ: server chạy test một luồng (`server/vitest.config.ts:8`).
10. **Cột mới không tự có trên DB cũ** (`server/src/db.ts:88`): `schema.sql` chỉ `CREATE TABLE IF NOT EXISTS`. Quên `ensureColumn` thì máy dev (DB mới) chạy đúng nhưng máy có dữ liệu cũ lỗi "no such column" ngay khi ghi.
11. **BIGINT và DATE của pg:** `pg` trả `BIGINT` dạng chuỗi nếu không có `setTypeParser(20)` (cộng tiền thành nối chuỗi); kiểu `DATE`/`TIMESTAMP` bị đổi sang `Date` theo múi giờ máy chạy → lệch ngày. Vì vậy cấu hình parser ở `server/src/db.ts:21` và lưu ngày dạng `TEXT`.
12. **Kết nối rảnh bị ngắt** (`server/src/db.ts:45`): Supabase/pooler đóng kết nối nhàn rỗi; thiếu `pool.on("error")` thì cả server sập. Gói Free tạm dừng project sau 7 ngày không truy cập → server báo không kết nối được cho tới khi bấm Restore.
13. **`NODE_ENV=production` lúc build:** `npm ci` bỏ qua devDependencies → thiếu vite, build web hỏng. Build Command phải có `--include=dev`; `tsx` để ở dependencies vì lệnh start cần.

## 7. Test

- Runner: vitest. `npm test` ở gốc chạy `shared`, `server`, `web`. Một file: `cd server && npx vitest run test/api.test.ts`.
- API test: `createApp` + supertest + PGlite (Postgres thật chạy trong tiến trình, một instance mỗi file, `TRUNCATE` mỗi test — `server/test/helpers.ts`) + `FakeSource` (nguồn giá giả, đếm số lần hỏi giá theo ngày) — `server/test/helpers.ts`. Đồng hồ cố định truyền qua `now`.
- Bộ đọc HTML: fixture thật của Phú Quý tải ngày 03/11/2026 ở `server/test/fixtures/phuquy/`.
- Web: jsdom + Testing Library. Dựng `AppRoutes` trong `MemoryRouter`, giả lập `api` theo "METHOD /đường-dẫn" bằng `mockApi`; `deferred()` để giả phản hồi về muộn (test race) — `web/test/helpers.tsx`. `web/test/setup.ts` giả `ResizeObserver` (jsdom không có, Recharts cần). Chọn phần tử theo nhãn/role tiếng Việt, không theo class.
- Tên test tiếng Việt, kèm `// SC: <UC>-SCn`. Bố cục trên điện thoại thật vẫn phải kiểm tay.

## 8. Checklist thêm tính năng

- [ ] Công thức số → `shared/src` + test trong `shared/test`.
- [ ] Bảng mới → `server/src/schema.sql` (chỉ `CREATE … IF NOT EXISTS`; đổi cột cũ thì cần migration, hiện chưa có).
- [ ] Route trong `server/src/<module>/routes.ts`, đăng ký ở `server/src/app.ts`, có `requireUser`; lọc `user_id`.
- [ ] Validate trả `HttpError(400, …, fields)`.
- [ ] Test API trong `server/test/api.test.ts` theo scenario.
- [ ] Kiểu trả về khai báo lại trong `web/src/api.ts`.
- [ ] Màn hình mới: tab thì thêm vào `BottomNav` + route con của `AppShell`; trang nhập liệu thì route riêng toàn màn hình (R-UI-03). Test trong `web/test/`.
- [ ] Thương hiệu mới có nguồn giá: adapter `PriceSource` + fixture + đăng ký ở `server/src/index.ts`; sửa `hasSource` trong `catalog.ts`.
