# goldfolio — ARCHITECTURE-WIDGET (widget Android)

> Tách riêng vì `ARCHITECTURE.md` sát 15 KB. Kiểm ở commit `7957b32` (nhánh `main`, 2026-11-17). Nghiệp vụ: `specs/holding/HOLD-UC02.md`.

## Thành phần

| Phần | Vai trò |
|---|---|
| `server/src/widget/` | Mã widget (tạo, thu hồi, tra người dùng) và số liệu widget dựng từ `buildPortfolio` + `pickProduct` của nhận định xu hướng (`server/src/widget/service.ts:69`) |
| `web/src/pages/WidgetPage.tsx` | Trang `/widget` trong `AppShell`, mở từ header (không chiếm tab) |
| `android/` | App Kotlin chỉ dùng SDK chuẩn (`Activity`, `WebView`, `AppWidgetProvider`, `JobService`, `HttpURLConnection`, `org.json`); không AndroidX, không thư viện ngoài. Mở app là GoldFolio trong webview (`android/app/src/main/java/app/goldfolio/widget/MainActivity.kt:21`), cài đặt widget ở `WidgetSetupActivity` |
| `.github/workflows/android-widget.yml` | Build APK release khi `android/` đổi trên `main`, tạo GitHub Release `widget-v<run_number>` |

## Luật

| ID | Luật |
|---|---|
| R-WIDGET-01 | Mã widget là quyền **chỉ đọc** một API: chỉ `GET /api/widget` đọc header `Authorization: Bearer`. Không cho `requireUser` nhận mã widget, không dùng mã cho API ghi. Router gắn ngoài `auth` chung, từng route quản lý mã tự gắn `requireUser` (`server/src/widget/routes.ts:13`, `server/src/app.ts:44`). |
| R-WIDGET-02 | Chỉ lưu SHA-256 của mã (`server/src/widget/service.ts:32`); mã gốc chỉ trả trong response `POST /api/widget/token`. Mã có tiền tố `gfw_` để từ chối sớm chuỗi lạ (`server/src/widget/service.ts:47`). |
| R-WIDGET-03 | Widget không tự định dạng tiền: server trả sẵn `valueText`, `pnlText`, `price.text`, `priceTimeText` bằng `shared/src/format.ts`, để widget và web hiện cùng một kiểu số. Thêm số mới cho widget thì thêm cả chuỗi đã định dạng. |
| R-WIDGET-04 | Gọi mạng của widget chạy trong `JobService` (`android/app/src/main/java/app/goldfolio/widget/RefreshJob.kt:48`), không chạy trong `AppWidgetProvider`: receiver chỉ có vài giây, server Render đang ngủ cần tới cả phút. Lỗi thì giữ bản số liệu cũ. |

## Bẫy

1. **Khoá ký APK** (`.github/workflows/android-widget.yml:33`): chỉ cài đè (và cập nhật trong app) được khi mọi bản ký cùng khoá. Khoá `android/release-key.p12` do CI tạo một lần, mật khẩu là Secret `ANDROID_KEYSTORE_PASSWORD` nếu có, không thì mật khẩu ghi sẵn trong workflow (khoá công khai, user chốt 2026-11-18); đặt Secret sau khi khoá đã tạo là build lỗi vì sai mật khẩu; đổi mật khẩu hay xoá file này là mọi máy phải gỡ app cài lại. Chưa có Secret thì ký bằng khoá debug sinh mới mỗi lần build. Cập nhật trong app: `android/app/src/main/java/app/goldfolio/widget/Updater.kt:27` so tag `widget-v<n>` với versionCode (= số lần build).
2. **Mã kết nối có `#`:** phần sau `#` là fragment, trình duyệt không gửi lên server, nên mã không lọt vào log nếu ai đó mở chuỗi như một đường dẫn. App tách theo dấu `#` cuối (`android/app/src/main/java/app/goldfolio/widget/Prefs.kt:29`).
3. **`APK_URL` cố định** trỏ trang Releases của repo GitHub (`web/src/pages/WidgetPage.tsx:14`). Repo private thì điện thoại phải đăng nhập GitHub mới tải được APK.
4. **Cookie đăng nhập trong webview phải `flush()` khi app bị ẩn** (`android/app/src/main/java/app/goldfolio/widget/MainActivity.kt:52`): đăng nhập là gọi API ngầm, không tải trang mới; không ghi xuống máy thì đóng app là mất phiên, mở lại phải đăng nhập lại (gặp thật 2026-11-17).
