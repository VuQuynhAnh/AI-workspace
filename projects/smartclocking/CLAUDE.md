# SmartClocking

Chấm công (QR/GPS/Wi-Fi), bảng lương tháng và trợ lý AI hỏi đáp quy chế (RAG) cho chuỗi cửa hàng, có nhiều cửa hàng (multi-tenant). Tài liệu, comment và thông báo viết **tiếng Việt**.

## Repo

| Thư mục | Remote · branch | Stack | Kiến trúc |
|---|---|---|---|
| `repos/smartclocking/` | `VuQuynhAnh/AI-quyche` · `main` | Node 18+ ESM · Express 4 · PostgreSQL + pgvector · MongoDB · Redis (tuỳ chọn) · Gemini; React 18 + Vite 5 + Bootstrap 5.3 | `architecture/smartclocking/ARCHITECTURE.md` |

Repo có `CLAUDE.md` riêng (luật DB + nút bấm). File đó vẫn có hiệu lực.

## Lệnh (chạy trong `repos/smartclocking/`)

| Việc | Lệnh |
|---|---|
| Cài đặt lần đầu | `cd backend && npm install && cp .env.example .env` · `cd frontend && npm install` |
| Backend dev (cổng 4000) | `cd backend && npm run dev` |
| Frontend dev (cổng 5173, proxy `/api`) | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Backend import được | `cd backend && node -e "import('./src/container.js').then(m => { m.createContainer(); console.log('ok') })"` |
| Test tất cả / một file | `cd backend && npm test` / `node --test test/<module>.test.js` (ARCHITECTURE §7) |
| Reset DB + dữ liệu mẫu (**xoá sạch**) | `cd backend && npm run seed` |

## Domain spec

| Thư mục | Prefix | Phạm vi |
|---|---|---|
| `specs/store/` | `STORE` | Cửa hàng, gói dùng, thiết lập, Wi-Fi cửa hàng, superadmin |
| `specs/employee/` | `EMP` | Tài khoản, hồ sơ nhân viên, phân quyền, ảnh đại diện |
| `specs/clocking/` | `CLK` | Chấm công QR/GPS/Wi-Fi, bảng công, admin sửa giờ |
| `specs/payroll/` | `PAY` | Bảng lương tháng, tính lương, chốt/huỷ, xuất CSV |
| `specs/assistant/` | `AI` | Văn bản quy chế, RAG, chat, tài liệu nhạy cảm, hộp thư hỗ trợ |

## Quy ước riêng

- Không viết migration. Đổi schema = sửa `schema.sql` (+ `drop.sql`) + `seed.js`, rồi reset DB (R-DB-01).
- Thông báo lỗi cho người dùng viết tiếng Việt (R-API-01). Ngày tháng nghiệp vụ theo giờ VN (R-TIME-01).
- Thư mục `uploads/` của backend là dữ liệu runtime (`protected.json`).
