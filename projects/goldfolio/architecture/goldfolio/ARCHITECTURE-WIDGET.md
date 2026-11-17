# goldfolio — ARCHITECTURE-WIDGET (widget Android)

> Tách riêng vì `ARCHITECTURE.md` sát 15 KB. Kiểm ở commit `3635158` (nhánh `main`, 2026-11-17). Nghiệp vụ: `specs/holding/HOLD-UC02.md`.

## Thành phần

| Phần | Vai trò |
|---|---|
| `server/src/widget/` | Mã widget (tạo, thu hồi, tra người dùng) và số liệu widget dựng từ `buildPortfolio` + `pickProduct` của nhận định xu hướng (`server/src/widget/service.ts:69`) |
| `web/src/pages/WidgetPage.tsx` | Trang `/widget` trong `AppShell`, mở từ header (không chiếm tab) |
| `android/` | App Kotlin chỉ dùng SDK chuẩn (`Activity`, `AppWidgetProvider`, `JobService`, `HttpURLConnection`, `org.json`); không AndroidX, không thư viện ngoài |
| `.github/workflows/android-widget.yml` | Build APK release khi `android/` đổi trên `main`, tạo GitHub Release `widget-v<run_number>` |

## Luật

| ID | Luật |
|---|---|
| R-WIDGET-01 | Mã widget là quyền **chỉ đọc** một API: chỉ `GET /api/widget` đọc header `Authorization: Bearer`. Không cho `requireUser` nhận mã widget, không dùng mã cho API ghi. Router gắn ngoài `auth` chung, từng route quản lý mã tự gắn `requireUser` (`server/src/widget/routes.ts:13`, `server/src/app.ts:44`). |
| R-WIDGET-02 | Chỉ lưu SHA-256 của mã (`server/src/widget/service.ts:32`); mã gốc chỉ trả trong response `POST /api/widget/token`. Mã có tiền tố `gfw_` để từ chối sớm chuỗi lạ (`server/src/widget/service.ts:47`). |
| R-WIDGET-03 | Widget không tự định dạng tiền: server trả sẵn `valueText`, `pnlText`, `price.text`, `priceTimeText` bằng `shared/src/format.ts`, để widget và web hiện cùng một kiểu số. Thêm số mới cho widget thì thêm cả chuỗi đã định dạng. |
| R-WIDGET-04 | Gọi mạng của widget chạy trong `JobService` (`android/app/src/main/java/app/goldfolio/widget/RefreshJob.kt:48`), không chạy trong `AppWidgetProvider`: receiver chỉ có vài giây, server Render đang ngủ cần tới cả phút. Lỗi thì giữ bản số liệu cũ. |

## Bẫy

1. **Khoá ký APK:** chưa có Secrets `ANDROID_KEYSTORE_*` thì APK ký bằng khoá debug sinh mới trên mỗi máy build, nên bản sau không cài đè được bản trước (phải gỡ rồi cài lại, dán lại mã). Cách tạo khoá cố định: README "Widget Android".
2. **Mã kết nối có `#`:** phần sau `#` là fragment, trình duyệt không gửi lên server, nên mã không lọt vào log nếu ai đó mở chuỗi như một đường dẫn. App tách theo dấu `#` cuối (`android/app/src/main/java/app/goldfolio/widget/Prefs.kt:29`).
3. **`APK_URL` cố định** trỏ trang Releases của repo GitHub (`web/src/pages/WidgetPage.tsx:14`). Repo private thì điện thoại phải đăng nhập GitHub mới tải được APK.
