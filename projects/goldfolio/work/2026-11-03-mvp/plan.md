# MVP GoldFolio: tài khoản, giá Phú Quý, ghi lần mua và lãi/lỗ

Việc: 2026-11-03-mvp · Spec: specs/holding/HOLD-UC01.md (+ rule domain ACC, PRICE) · Repo: goldfolio · Branch: feat/mvp

## Bối cảnh
Repo chưa có code. Việc này dựng toàn bộ khung (server + web), đăng nhập email/mật khẩu, adapter giá Phú Quý (giá hiện tại 15 phút một lần, giá theo ngày khi cần), rồi cài đặt trọn HOLD-UC01. ACC và PRICE chưa có UC riêng: phần tối thiểu ở đây bám theo rule domain (`notes.md` ghi lý do).

## Mẫu tham chiếu
- Repo chưa có code để làm mẫu. Việc này **đặt mẫu** cho các việc sau. Cấu trúc, cách validate, báo lỗi và test chọn ở đây sẽ được ghi thành luật `R-*` trong ARCHITECTURE khi xong.
- Dữ liệu thật của nguồn (đã tải, dùng làm fixture test): trang chủ `phuquygroup.vn` (bảng vàng `td.buy-price` / `td.sell-price`, dòng "Giá vàng cập nhật lần cuối lúc HH:mm dd/MM/yyyy"); `giabac.phuquygroup.vn` (bảng `td.silver-product-name` / `.silver-unit` / `.silver-buy-price` / `.silver-sell-price`); `XemLai?date=` các ngày 2026-11-01, 2025-01-15 (có dòng trùng), 2023-06-01 (không có bạc).

## Ảnh hưởng
- Spec/BR bị chạm:
  - HOLD-UC01: toàn bộ.
  - Domain: ACC-BR-001, ACC-BR-002; HOLD-BR-001…007; PRICE-BR-001…008.
- Code dùng chung bị chạm: chưa có code.
- Workspace: `projects/goldfolio/CLAUDE.md` (bảng lệnh, stack), `projects/goldfolio/protected.json` (file DB runtime).

## Thiết kế

### Cấu trúc repo (npm workspaces, TypeScript, Node 22)
```
shared/   đơn vị khối lượng, tiền, tính lãi/lỗ — dùng cả ở server và web
server/   Express 4 + better-sqlite3 + zod; vitest + supertest
web/      Vite + React 18 + Tailwind 4 + shadcn (cho React Bits) + Recharts + React Router
```

### Dữ liệu (SQLite, file `server/data/goldfolio.sqlite`)
- `users(id, email UNIQUE, password_hash, created_at)`
- `sessions(token_hash PK, user_id, expires_at)`: cookie `sid` httpOnly, SameSite=Lax, 30 ngày.
- `brands(id, code UNIQUE, name, is_default, has_source)`
- `products(id, brand_id, code, name, metal 'gold'|'silver', price_unit 'chi'|'luong'|'kg', source 'live'|'seed', aliases_json, active, UNIQUE(brand_id, code))`
- `price_snapshots(id, brand_id, kind 'live'|'daily', source_time, source_date, fetched_at, content_hash)`
  - Bản `live`: lấy 15 phút một lần, bỏ qua nếu `content_hash` trùng lần trước (PRICE-BR-002).
  - Bản `daily`: lấy từ XemLai. Có `daily_misses(brand_id, date)` để không hỏi lại ngày nguồn đã báo không có dữ liệu (PRICE-BR-007).
- `price_points(snapshot_id, product_id, buy_price INT, sell_price INT NULL)`
- `purchases(id, user_id, product_id, weight_mg INT, input_unit, purchase_date 'YYYY-MM-DD', purchase_time 'HH:mm' NULL, price_mode 'unit'|'total', unit_cost INT, total_cost INT, note, created_at, updated_at)`

Chọn miligram làm đơn vị gốc: 1 chỉ = 3.750 mg, 1 lượng = 37.500 mg, 1 kg = 1.000.000 mg, đều là số nguyên (HOLD-BR-002). Tiền là số nguyên VNĐ.

### Công thức (`shared/`)
- `qty = weight_mg / unitMg(price_unit)`: khối lượng theo đơn vị niêm yết.
- `value = round(weight_mg × buy_price / unitMg)`, tính bằng số nguyên. Lớn nhất cỡ 1e7 × 1e8 = 1e15, vẫn nhỏ hơn 2^53.
- `unit_cost ↔ total_cost` theo BR-5, làm tròn tới đồng.
- `pct` làm tròn 2 chữ số thập phân.
- Giá vốn bình quân = Σtotal ÷ Σqty.
- Điểm biểu đồ của một ngày = Σtotal ÷ Σqty của các lần mua trong ngày đó (BR-13).

### API (JSON, lỗi có dạng `{ error: "<tiếng Việt>", field? }`)
| Method · path | Quyền | Ghi chú |
|---|---|---|
| `POST /api/auth/register` · `login` · `logout`, `GET /api/auth/me` | công khai / đăng nhập | email chuẩn hoá chữ thường, mật khẩu ≥ 8 ký tự, hash bằng `crypto.scrypt` |
| `GET /api/brands` | đăng nhập | thương hiệu + sản phẩm đang `active`, kèm `is_default` (BR-1, BR-2, BR-15) |
| `GET /api/prices/suggest?productId&date&time` | đăng nhập | trả về `{ unitPrice, label }` hoặc `{ unitPrice: null }` (BR-6, PRICE-BR-004) |
| `GET/POST /api/purchases`, `PUT/DELETE /api/purchases/:id` | đăng nhập, chỉ của mình | 404 "Không tìm thấy lần mua" (BR-12, ACC-BR-002) |
| `GET /api/portfolio` | đăng nhập | tổng quan, nhóm, danh sách kèm lãi/lỗ, thời điểm giá (BR-9, BR-10) |
| `GET /api/portfolio/history?productId` | đăng nhập | các điểm mua, điểm hôm nay, giá vốn bình quân (BR-13, BR-14) |

### Adapter Phú Quý (`server/src/prices/phuquy/`)
- `fetchLive()`:
  - Vàng lấy từ trang chủ, theo VNĐ/chỉ. **Bỏ các dòng bạc** của trang chủ.
  - Bạc lấy từ `giabac.phuquygroup.vn`, theo VNĐ/lượng hoặc VNĐ/kg. Bỏ nhóm "BẠC THƯƠNG HIỆU KHÁC".
  - Thời điểm lấy từ dòng "cập nhật lần cuối lúc …" (vàng) và từ `GetDateTimeUpdate` (bạc).
- `fetchDaily(date)`:
  - Gọi `XemLai?date=`.
  - Bạc ở đây theo chỉ: nhân 10 rồi gán cho các sản phẩm bạc niêm yết theo lượng. Không có giá theo ngày cho bạc 1 kg.
- Parse bằng `cheerio`. Ô trống hoặc "_" nghĩa là không có giá bán (PRICE-BR-006).
- Giá ≤ 0 hoặc không parse được thì **bỏ cả bảng**, giữ ảnh chụp cũ (PRICE-BR-003).
- Khớp tên theo PRICE-BR-008.
- `User-Agent: GoldFolio/0.1 (+repo url)`. Không giả trình duyệt.
- Lịch: `setInterval` 15 phút trong tiến trình server, chạy một lần lúc khởi động. Lỗi thì ghi log rồi thử lại ở lượt sau.

### UI
- `/dang-nhap`, `/dang-ky`: form, có nền trang trí bằng một component React Bits.
- `/` (Tài sản của tôi):
  - Khối tổng quan, nhóm kim loại → sản phẩm, danh sách lần mua, biểu đồ.
  - Trạng thái rỗng theo BR-11. Các con số **không có hiệu ứng chạy số**.
- Hộp thoại thêm/sửa lần mua (BR-1…7), hộp xác nhận xoá (BR-8).
- Định dạng số theo `vi-VN` ("13.850.000", "+0,37%", "−450.000"). Lãi màu xanh, lỗ màu đỏ.

### Dữ liệu khởi tạo (seed)
- **Phú Quý** (`has_source=1`, mặc định). Sản phẩm `live`:
  - Vàng, theo chỉ: Vàng miếng SJC; Nhẫn tròn Phú Quý 999.9; Phú Quý 1 Lượng 999.9; Phú Quý 1 lượng 99.9; Vàng trang sức 999.9 / 999 / 99 / 98; Vàng 999.9 phi SJC; Vàng 999.0 phi SJC.
  - Bạc, theo lượng: Bạc miếng Phú Quý 999 1 lượng; Bạc thỏi Phú Quý 999 10 lượng, 5 lượng; Đồng bạc mỹ nghệ Phú Quý 999.
  - Bạc, theo kg: Bạc thỏi Phú Quý 999 1 kilo.
- **Bảo Tín Minh Châu** (`has_source=0`). Lấy từ `btmc.vn` ngày 03/11/2026, user cần duyệt:
  - Vàng: Vàng miếng VRTL; Nhẫn tròn trơn BTMC; Đồng xu VRTL 0.1; Quà mừng bản vị vàng; Vàng miếng SJC; Trang sức Vàng Rồng Thăng Long 999.9 / 99.9. Đơn vị theo chỉ nhưng **chưa xác minh**, vì trang chỉ ghi "ĐVT 1 = 1.000 VNĐ".
  - Bạc, theo lượng: Bạc miếng Rồng Thăng Long.
  - Bạc, theo kg: Bạc thỏi Rồng Thăng Long.
- **Bảo Tín Mạnh Hải** (`has_source=0`). Lấy từ `baotinmanhhai.vn/bang-gia-vang`:
  - Vàng, theo chỉ: Kim Gia Bảo 24K; Kim Gia Bảo Gift 24K; Tiểu Kim Cát 24K; Nhẫn tròn BTMH; Vàng trang sức 24K 999.9 / 999; Vàng miếng SJC.
  - Bạc, theo lượng: Ngân Gia Bảo Tứ Quý; Ngân Gia Bảo bạc thỏi 5 lượng, 10 lượng.
  - Bạc, theo kg: Bạc thỏi 1 kg.
- **SJC, DOJI, PNJ** (`has_source=0`): chưa đọc được trang chính thức (SJC 403; DOJI và PNJ nạp bằng JS). Mỗi hãng tạm có một sản phẩm "Vàng miếng SJC 999.9" theo chỉ, **chờ user cung cấp danh sách**.

## Checklist
### 0. Khung repo
- [x] `package.json` gốc với workspaces `shared`, `server`, `web`; script `dev` (chạy song song server + web), `test`, `build`, `lint` (tsc --noEmit); `.nvmrc` = 22
- [x] `tsconfig.base.json`; `shared/` export `units.ts`, `money.ts`, `pnl.ts`
- [x] `server/`: Express, `src/app.ts` (tạo app, không listen, để test), `src/index.ts` (listen cổng 4000 + bộ lịch lấy giá), `src/db.ts` (mở SQLite, chạy `schema.sql` nếu chưa có bảng), `src/seed.ts`
- [x] `web/`: Vite React TS; Tailwind 4; `components.json` viết tay thay cho `shadcn init`; proxy `/api` → 4000
- [x] `server/.env.example` (PORT, DB_PATH, PRICE_INTERVAL_MIN=15). Không tạo `.env`.
- [x] README: cách cài, chạy, test, reset DB

### 1. shared — đơn vị, tiền, lãi/lỗ
- [x] `units.ts`: `toMg(value, unit)`, `fromMg(mg, unit)`, kiểm tra > 0 và ≤ 3 chữ số thập phân, nhận cả dấu phẩy thập phân (BR-3, HOLD-BR-002)
- [x] `money.ts`: `totalFromUnit`, `unitFromTotal`, làm tròn tới đồng (BR-5)
- [x] `pnl.ts`: `valueOf`, `pctOf`, `avgCost`, `dayPoint` (BR-9, BR-13)
- [x] `format.ts`: định dạng VNĐ, %, khối lượng kèm đơn vị đã nhập, vd "26,667 lượng (1 kg)" (BR-3)

### 2. server — tài khoản (ACC-BR-001, ACC-BR-002)
- [x] `src/auth/`: register, login, logout, me; middleware `requireUser` gắn `res.locals.userId`
- [x] Thông báo: "Email hoặc mật khẩu không đúng", "Email đã được đăng ký", "Mật khẩu tối thiểu 8 ký tự"; chưa đăng nhập thì 401 "Vui lòng đăng nhập"

### 3. server — giá (PRICE-BR-001…008)
- [x] `src/prices/phuquy/parse.ts`: `parseGoldLive`, `parseSilverLive`, `parseDaily(html, date)` — hàm thuần, test bằng fixture
- [x] `src/prices/phuquy/adapter.ts`: `fetchLive()`, `fetchDaily(date)`
- [x] `src/prices/match.ts`: chuẩn hoá tên + aliases, bỏ dòng trùng (PRICE-BR-008)
- [x] `src/prices/service.ts` (`PriceService`): lưu ảnh chụp (bỏ qua nếu hash trùng); `latest(productId)`; `priceAt(productId, date, time)` (PRICE-BR-004); cờ `active` của sản phẩm theo bảng live mới nhất (BR-15)
- [x] `src/prices/scheduler.ts`: 15 phút một lần, nguồn lỗi thì giữ giá cũ (PRICE-BR-003)
- [x] `GET /api/prices/suggest`: lấy ảnh chụp live gần nhất ≤ thời điểm mua trong ngày; không có thì `fetchDaily` một lần rồi lưu lại (PRICE-BR-007); label theo BR-6

### 4. server — lần mua và danh mục (HOLD-UC01)
- [x] `src/purchases/validate.ts`: kiểm tra (viết tay, bỏ zod để ra đúng thông báo từng ô) BR-1, 3, 4, 5, ghi chú ≤ 200 ký tự; ngày giờ "hôm nay" và "hiện tại" theo Asia/Ho_Chi_Minh
- [x] `src/purchases/routes.ts`: CRUD, mọi truy vấn có `user_id = req.userId`, không thấy thì 404 (BR-7, 8, 12)
- [x] `src/portfolio/service.ts`: tổng quan, nhóm (vàng tính theo chỉ, bạc theo lượng), "Chưa có giá" + đếm số lần mua bị loại (BR-9, 10, 15)
- [x] `buildHistory` trong `src/portfolio/service.ts`: điểm theo ngày mua, điểm hôm nay, giá vốn bình quân, sản phẩm mặc định = tổng tiền mua lớn nhất (BR-13, 14)

### 5. web
- [x] `src/api.ts` (fetch kèm cookie, ném lỗi `{error, field}`); `AuthProvider`; route có bảo vệ
- [x] Trang đăng nhập / đăng ký
- [x] `PortfolioPage`: tổng quan, nhóm, danh sách, rỗng (BR-9…11)
- [x] `PurchaseDialog`: thương hiệu mặc định Phú Quý; đổi thương hiệu thì xoá sản phẩm; chọn đơn giá hoặc tổng tiền, số kia tự tính; gợi ý không ghi đè giá đã sửa tay; form sửa không gợi ý lại; lỗi hiện dưới từng ô (BR-1…7, 12)
- [x] `DeleteConfirm` (BR-8)
- [x] `HistoryChart` (Recharts): chọn sản phẩm, điểm mua, điểm hôm nay khác màu, đường nét đứt giá vốn, tooltip (BR-13, 14)
- [ ] Một component React Bits trang trí (nền trang đăng nhập), cài bằng `npx shadcn@latest add @react-bits/<Tên>-TS-TW` — **chặn**: tải `reactbits.dev` lỗi chứng chỉ mạng (`SELF_SIGNED_CERT_IN_CHAIN`); tạm nền gradient CSS

### 6. (phát sinh)
- [x] `better-sqlite3` không cài được (lỗi chứng chỉ khi tải bản dựng sẵn) → dùng `node:sqlite` theo phương án dự phòng
- [x] `server/vitest.config.ts`: test một luồng, vì vitest nhiều tiến trình tràn RAM trên máy dev
- [x] Sửa bộ đọc bạc: bảng có 2 dòng nhóm (Phú Quý / hãng khác), không phải 1
- [x] README: mục cấu hình CA cho mạng công ty; `.gitignore` thêm `server/data/`

### Kiểm tra
- [x] `shared` (vitest): SC2, SC3, SC4, SC5, SC14, SC15, SC20, SC24, SC25, SC26 (giá vốn), SC27
- [x] parse Phú Quý với fixture: trang chủ, trang bạc, XemLai 2026-11-01, 2025-01-15 (dòng trùng), 2023-06-01 (không có bạc), HTML hỏng hoặc giá 0 thì bỏ bảng
- [x] `store.priceAt`: SC10, SC11, SC12, SC32; ngày nguồn báo không có dữ liệu chỉ hỏi một lần
- [x] API (supertest, SQLite in-memory, adapter giả): SC1, SC5–SC8, SC16, SC17, SC18, SC19, SC21, SC22, SC23, SC28, SC29, SC30, SC31; 401 khi chưa đăng nhập
- [ ] Chạy tay trên web (chưa làm: không có trình duyệt trong phiên này): SC9, SC13 (gợi ý không ghi đè), SC20/SC24 trong form, biểu đồ SC26, giao diện điện thoại 375px
- [ ] Chạy thật với Phú Quý một lần: giá về đủ sản phẩm, giờ cập nhật đúng — **chặn**: `fetch` của Node lỗi chứng chỉ mạng; cần `NODE_EXTRA_CA_CERTS`. Server chạy được và giữ giá cũ khi lỗi (đã kiểm)

### Tài liệu (CONVENTIONS §6)
- [x] HOLD-UC01 → `implemented`, điền mục Cài đặt (BR/SC → `file:line`, test)
- [x] `_domain.md` của ACC, HOLD, PRICE: thêm cột Code + "Kiểm ở commit"
- [x] Viết `architecture/goldfolio/ARCHITECTURE.md` lần đầu: luồng request, luật `R-*` rút từ code vừa viết, bẫy (giờ VN, số nguyên tiền, mg, nguồn HTML đổi cấu trúc)
- [x] `projects/goldfolio/CLAUDE.md`: stack thật, bảng lệnh đã chạy thử; `protected.json` cho `server/data/`
- [x] Glossary: kiểm lại `code_name` theo code thật
- [x] `node tools/check-docs.mjs`

## Rủi ro / bẫy liên quan
- **Nguồn là HTML không có hợp đồng:**
  - Phú Quý đổi giao diện là adapter hỏng. Có fixture test và luật "bỏ bảng chứ không ghi giá sai" để giảm thiệt hại.
  - `XemLai` và `SilverPricePartial` là endpoint nội bộ, có thể bị chặn hoặc đổi.
- **Dữ liệu lịch sử bẩn:** dòng trùng, tên khác nhau giữa các năm, không có bạc trước một mốc nào đó. Thiếu alias thì gợi ý trống, chứ không sai.
- **Giờ VN:** "hôm nay" và "hiện tại" phải tính theo Asia/Ho_Chi_Minh, không theo giờ máy chủ.
- **better-sqlite3 là module native:** trên Windows cần prebuilt cho Node 22. Cài lỗi thì chuyển sang `node:sqlite` (có sẵn từ Node 22.5, còn experimental).
- **Lịch lấy giá chạy trong tiến trình web:** chạy nhiều instance thì lấy trùng. MVP chỉ chạy một instance.

## Câu hỏi mở
- [ ] Duyệt danh sách sản phẩm nhập sẵn của Bảo Tín Minh Châu và Bảo Tín Mạnh Hải. Gửi danh sách sản phẩm của SJC, DOJI, PNJ (hoặc chấp nhận bản tạm).
- [ ] Bảo Tín Minh Châu niêm yết vàng theo chỉ đúng không?
