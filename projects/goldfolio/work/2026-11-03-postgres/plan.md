# Chuyển DB từ SQLite sang PostgreSQL (free, trên mạng)

Việc: 2026-11-03-postgres · Spec: không đổi hành vi · Repo: goldfolio · Branch: feat/postgres (từ `feat/gia-tu-dong`)

## Bối cảnh
SQLite là file trên máy chạy server, nên máy khác tự chạy server sẽ có DB riêng và phải nhập lại từ đầu. User muốn dùng Postgres free giống SmartClocking (gói `pg`, biến `PG*`), để mọi máy dùng chung một DB.

## Thiết kế
- **Kết nối:** gói `pg` (Pool). Đọc `DATABASE_URL`; không có thì `pg` tự đọc `PGHOST/PGUSER/...` như SmartClocking. Dịch vụ cloud bắt buộc SSL thì thêm `sslmode=require` trong URL.
- **Lớp DB mỏng** `server/src/db.ts`: `query`, `one`, `many`, `tx(fn)`. Toàn bộ truy vấn chuyển sang async, tham số `$1, $2…`.
- **Code bị chạm:** `auth`, `catalog`, `prices/service`, `purchases/*`, `portfolio/service`, `routes`.
- **Schema Postgres:**
  - Khoá chính `BIGINT GENERATED ALWAYS AS IDENTITY`; tiền và khối lượng `BIGINT`. Pool cấu hình đọc `BIGINT` thành `number` (an toàn vì R-MONEY-02 giới hạn ≤ 1e15).
  - Ngày `YYYY-MM-DD` và giờ `HH:mm` giữ dạng `TEXT` như hiện tại. Dùng kiểu `DATE` thì `pg` đổi sang `Date` theo múi giờ máy, dễ lệch ngày (R-TIME-01).
  - `migrate()` dùng `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (R-DB-01 giữ nguyên ý).
- **Test:** chạy trên PGlite (`@electric-sql/pglite`). Đây là Postgres thật chạy trong tiến trình Node, không cần cài server hay mạng. Mỗi test xoá dữ liệu bảng thay vì tạo DB mới.
- **Bỏ** `node:sqlite` và cảnh báo experimental; giữ `.gitignore`.
- **Tài liệu:** ARCHITECTURE (§1 kho dữ liệu, §2, §4, §6 bẫy BIGINT/DATE/SSL, §7 test), README (cách tạo DB free, biến môi trường), CLAUDE.md dự án, `.env.example`.

## Checklist
- [x] Thêm `pg`, `@types/pg`; dev: `@electric-sql/pglite` (chờ duyệt)
- [x] `db.ts` (Pool + adapter PGlite cho test), `schema.sql` bản Postgres, `migrate()`
- [x] Chuyển từng module sang async: `catalog`, `auth`, `prices/service`, `prices/suggest`, `purchases/*`, `portfolio/service`, `routes`, `index`, `seed`
- [x] Test chạy trên PGlite: mọi test hiện có (shared 24, server 65, web 21) pass
- [x] Chạy thật với Supabase của user (project mới, region eu-west-3): `npm run seed` tạo bảng + 36 sản phẩm. Chạy không SSL (`DB_SSL_CA` trống) giống SmartClocking; SSL có CA là tuỳ chọn
- [x] Tài liệu + `check-docs`

## Rủi ro
- **Mạng công ty:** kết nối Postgres ra ngoài (cổng 5432 hoặc 6543) có thể bị chặn, hoặc bị chèn chứng chỉ như HTTPS (§6.6). Nếu bị chặn thì cần mạng khác hoặc nhờ IT mở cổng.
- **Dịch vụ free có giới hạn:** dung lượng 0,5 GB; một số dịch vụ tạm ngủ khi lâu không dùng, lần mở đầu tiên chậm vài giây. Với sổ tài sản cá nhân thì đủ dùng.
- **Dữ liệu trong SQLite hiện tại:** xem câu hỏi.

## Câu hỏi
- [x] Dịch vụ: **Supabase free** (user chọn 2026-11-03), kết nối qua Session pooler + CA để SSL có kiểm chứng chỉ
- [x] Dữ liệu SQLite cũ: bỏ, bắt đầu mới (file cũ vẫn nằm ở `server/data/`, đã bị gitignore)
- [x] Deploy: để việc sau

## Ghi chú khi làm
- Thêm khi tự review: `pool.on("error")` để kết nối bị ngắt không làm sập server; khởi động không kết nối được DB thì in thông báo tiếng Việt và thoát; id từ request kiểm `Number.isSafeInteger` (Postgres báo lỗi kiểu thay vì trả rỗng như SQLite); đăng ký trùng email đồng thời bắt lỗi UNIQUE 23505 → 409.
- Hook pii-guard chặn ví dụ chuỗi kết nối có mật khẩu trong `.env.example` → chỉ mô tả cách lấy chuỗi.
