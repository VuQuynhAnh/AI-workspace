# Goldfolio

Sổ tài sản vàng bạc cá nhân: ghi từng lần mua (thương hiệu, sản phẩm, khối lượng, ngày giờ mua, giá mua), so với giá mua vào hiện tại để ra lãi/lỗ. Nhiều thương hiệu, mặc định **Phú Quý** (nguồn giá duy nhất hiện có). Nhiều tài khoản, mỗi người một danh mục riêng. Tài liệu, comment và thông báo viết **tiếng Việt**.

## Repo

| Thư mục | Remote · branch | Stack | Kiến trúc |
|---|---|---|---|
| `repos/goldfolio/` | `VuQuynhAnh/GoldFolio` · `main` | Node 22 · TypeScript · npm workspaces (`shared`, `server`, `web`) · Express 4 + `node:sqlite` + cheerio · React 18 + Vite 6 + Tailwind 4 + Recharts | `architecture/goldfolio/ARCHITECTURE.md` |

## Lệnh (chạy trong `repos/goldfolio/`, đã chạy thử 2026-11-03)

| Việc | Lệnh |
|---|---|
| Cài đặt | `npm install` · `cp server/.env.example server/.env` |
| Dev (server :4000 + web :5173) | `npm run dev` |
| Test tất cả / một file | `npm test` / `cd server && npx vitest run test/api.test.ts` |
| Kiểm tra kiểu | `npm run lint` |
| Build web | `npm run build` |
| Đồng bộ danh mục sản phẩm | `npm run seed` |
| Xoá sạch dữ liệu (**phá dữ liệu**) | dừng server, xoá `server/data/` |

## Domain spec

| Thư mục | Prefix | Phạm vi |
|---|---|---|
| `specs/account/` | `ACC` | Đăng ký, đăng nhập, tách dữ liệu theo tài khoản |
| `specs/holding/` | `HOLD` | Lần mua, danh mục, đơn vị khối lượng, lãi/lỗ, biểu đồ |
| `specs/price/` | `PRICE` | Nguồn giá (adapter), ảnh chụp giá, giá theo ngày, gợi ý giá mua |

## Quy ước riêng

- Tiền là số nguyên VNĐ, khối lượng là số nguyên miligram (R-MONEY-01). Ngày giờ theo giờ VN (R-TIME-01).
- Lãi/lỗ theo **giá mua vào** (R-PNL-01).
- Nguồn giá qua adapter; không giả trình duyệt, không lách chặn bot; lỗi thì giữ giá cũ (R-SRC-01, R-SRC-02).
- **Dùng chủ yếu trên điện thoại:** thiết kế mobile-first (khung 360–430px trước, màn rộng sau), vùng bấm ≥ 44px, thao tác chính trong tầm ngón cái.
- Giao diện tham khảo [React Bits](https://reactbits.dev): `npx shadcn@latest add @react-bits/<Tên>-TS-TW` trong `web/`. Số tiền không chạy hiệu ứng (R-UI-01).
- Mạng có chứng chỉ riêng: đặt `NODE_EXTRA_CA_CERTS` (ARCHITECTURE §6.6), không tắt TLS.
