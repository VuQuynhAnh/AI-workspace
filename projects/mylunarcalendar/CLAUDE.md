# MyLunarCalendar

Lịch âm Việt Nam và tử vi hằng ngày bằng AI, mobile-first; kèm app Android (web trong webview) và widget lịch tháng chạy offline, không quảng cáo. **Không tài khoản, không database:** hồ sơ ngày sinh và tử vi đã xem lưu trên máy người dùng; server chỉ chuyển số liệu tới AI, có mật khẩu chung tuỳ chọn; chưa có key Gemini thì web chỉ còn tab Lịch. Tài liệu, comment và thông báo viết **tiếng Việt**.

## Repo

| Thư mục | Remote · branch | Stack | Kiến trúc |
|---|---|---|---|
| `repos/mylunarcalendar/` | `VuQuynhAnh/MyLunarCalendar` · `main` | Node 22 · TypeScript · npm workspaces (`shared`, `server`, `web`) · Express 4 (không DB) + Gemini · React 18 + Vite 6 + Tailwind 4 · `android/` Kotlin (SDK chuẩn) | `architecture/mylunarcalendar/ARCHITECTURE.md` |

## Lệnh (chạy trong `repos/mylunarcalendar/`, đã chạy thử 2026-11-17)

| Việc | Lệnh |
|---|---|
| Cài đặt | `npm install` · `cp server/.env.example server/.env` |
| Dev (server :4000 + web :5173) | `npm run dev` |
| Test tất cả / một file | `npm test` / `cd server && npx vitest run test/api.test.ts` |
| Kiểm tra kiểu | `npm run lint` |
| Build web | `npm run build` |
| Test + build Android | chỉ chạy ở GitHub Actions (`.github/workflows/android.yml`); máy dev không có JDK/Android SDK |

## Domain spec

| Thư mục | Prefix | Phạm vi |
|---|---|---|
| `specs/calendar/` | `CAL` | Lịch âm, can chi, tiết khí, giờ hoàng đạo, ngày lễ, widget tháng |
| `specs/horoscope/` | `HORO` | Hồ sơ ngày sinh (trên máy), tử vi hằng ngày bằng AI, chat hỏi AI, mật khẩu chung |

## Quy ước riêng

- Lịch âm theo **múi giờ +7** (khác lịch Trung Quốc ở vài năm). Có hai bản cùng thuật toán: TypeScript `shared/src/lunar.ts` và Kotlin `android/…/LunarCalendar.kt`; sửa một bên thì sửa cả bên kia, cả hai chạy chung `shared/test/lunar-cases.json` (R-LUNAR-01).
- **AI không tự tính lịch:** code tính can chi, tuổi, mệnh, hợp xung; AI chỉ luận giải (R-AI-01). Không gửi email, ngày sinh dương lịch đầy đủ cho AI (R-AI-02).
- Ngày giờ theo giờ VN (R-TIME-01). Mobile-first, vùng bấm ≥ 44px, giao diện tối, màu chỉ dùng token (R-UI-*).
- Deploy một service trên Render, không cần database. Thêm thứ gì cần lưu thì lưu trên máy (`web/src/lib/storage.ts`), không thêm DB khi user chưa đồng ý.
- Khung code chép từ GoldFolio (Gemini có model dự phòng, khung chat); giữ cùng kiểu khi sửa.
