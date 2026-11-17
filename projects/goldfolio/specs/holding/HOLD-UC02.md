# HOLD-UC02 — Widget màn hình chính Android

> Trạng thái: implemented · Việc: 2026-11-17-widget-android · Cập nhật: 2026-11-17 · Kiểm ở commit `b26543a` (nhánh `main`, 2026-11-17)

## Mục tiêu
Xem nhanh tổng tài sản, lãi/lỗ và giá vàng, bạc ngay trên màn hình chính điện thoại Android, không cần mở GoldFolio.

## Phạm vi
- Vai trò: tài khoản đã đăng nhập (ACC-BR-001) tạo mã; widget dùng mã, không đăng nhập.
- Màn hình:
  - Trang **Widget** (`/widget`), mở từ chữ "Widget" trên header.
  - App Android **GoldFolio Widget**: một màn hình dán mã kết nối và widget 4x2.
- Phụ thuộc: chỉ GoldFolio. Không cần app widget bên thứ ba (user chốt 2026-11-17: rẻ và không phụ thuộc). APK cài trực tiếp, không qua CH Play; GitHub Actions build (user chốt).
- Ngoài phạm vi: iPhone, widget nhiều cỡ, sửa dữ liệu từ widget, đưa lên CH Play.

## Quy tắc nghiệp vụ
- BR-1: **Mỗi tài khoản một mã widget.** Tạo mã mới thì mã cũ hết hiệu lực ngay; đã có mã thì bấm "Tạo mã mới" phải xác nhận. "Thu hồi mã" (có xác nhận) xoá mã, widget báo lỗi ở lần cập nhật sau.
- BR-2: **Mã chỉ hiện một lần**, ngay sau khi tạo, dưới dạng **mã kết nối** = địa chỉ GoldFolio + `#` + mã (dán một lần vào app). Server chỉ lưu bản băm SHA-256. Trang ghi lúc tạo mã và lần cuối widget dùng mã.
- BR-3: **Mã chỉ đọc số liệu widget** (`GET /api/widget`), không dùng thay đăng nhập cho API khác, không sửa/xoá được gì. Mã sai hoặc đã thu hồi thì 401 "Mã widget không đúng hoặc đã bị thu hồi, tạo mã mới trong GoldFolio". Số liệu không có email.
- BR-4: **Nội dung widget** (user chốt "Tổng + vàng/bạc"):
  - Tổng giá trị và lãi/lỗ (số + %) như màn Tổng quan (HOLD-UC01/BR-9), lãi xanh "+", lỗ đỏ "−". Chưa có tài sản thì ghi "Chưa có tài sản".
  - Mỗi kim loại một dòng: "Mua X · Bán Y /đơn vị" của sản phẩm chính (sản phẩm bỏ nhiều tiền nhất, chưa có thì sản phẩm mặc định, như PRICE-UC02), kèm lãi/lỗ của kim loại nếu có. Nguồn chỉ có giá mua vào thì bỏ phần "Bán" (PRICE-BR-006).
  - Dòng cuối "Giá lúc HH:mm dd/MM/yyyy" (giá cũ nhất đang dùng).
- BR-5: **Cập nhật:** Android tự làm mới khoảng 30 phút một lần (mức thấp nhất hệ điều hành cho phép); bấm dòng giờ để làm mới ngay ("Đang cập nhật…"). Lỗi mạng hoặc server đang ngủ thì giữ số cũ và ghi "⚠ <lỗi> · Giá lúc …". Bấm vào số liệu thì mở app (GoldFolio trong app, BR-7); chưa kết nối thì app mở màn hình dán mã.
- BR-6: **Cài đặt widget** (trong app, menu ⋮ → "Cài đặt widget"): dán mã kết nối (có nút "Dán"), bấm Lưu thì kiểm thử kết nối ngay và báo kết quả (server đang ngủ có thể mất tới 1 phút). Mã sai dạng thì báo cách lấy lại mã. Có nút "Mở GoldFolio", "Thêm widget ra màn hình chính" (nếu launcher hỗ trợ) và "Xoá kết nối".
- BR-7: **App là GoldFolio trong app** (user chốt 2026-11-17): mở app hay bấm widget là mở GoldFolio trong webview, đăng nhập một lần rồi nhớ cookie, không phải mở trình duyệt. Địa chỉ lấy từ mã kết nối; chưa dán mã thì mở Cài đặt widget trước. Nút back lùi trang trong web trước; link ngoài (GitHub) mở bằng trình duyệt; tên app là "GoldFolio".

## Scenario

```gherkin
Scenario: HOLD-UC02-SC1 Widget đọc tổng tài sản và giá
  Given tôi có 2 chỉ nhẫn tròn mua 13.000.000/chỉ, giá mua vào hiện tại 13.550.000, chưa có bạc
  When tôi tạo mã widget và widget gọi số liệu bằng mã đó
  Then widget nhận "27.100.000 đ", "+1.100.000 (+4,23%)"
  And dòng Vàng "Mua 13.550.000 · Bán 13.850.000 /chỉ" kèm lãi/lỗ, dòng Bạc chỉ có giá
  And "Giá lúc 09:00 02/11/2026", không có email của tôi

Scenario: HOLD-UC02-SC2 Chưa có tài sản
  When widget gọi số liệu
  Then tổng ghi "Chưa có tài sản", vẫn có giá vàng và bạc

Scenario: HOLD-UC02-SC3 Tạo mã mới, thu hồi
  When tôi tạo mã mới
  Then mã cũ báo 401
  When tôi thu hồi mã
  Then widget báo 401 và trang ghi chưa có mã

Scenario: HOLD-UC02-SC4 Mã chỉ mở số liệu widget của chủ mã
  When dùng mã widget gọi /api/portfolio hoặc tạo mã
  Then báo 401
  And mã của người khác chỉ thấy tài sản của người đó

Scenario: HOLD-UC02-SC5 Trang Widget: tạo mã
  When tôi bấm "Widget" trên header rồi "Tạo mã widget"
  Then tôi thấy ô "Mã kết nối" = địa chỉ GoldFolio + "#" + mã và nút "Chép mã kết nối"
  When tôi bấm chép
  Then nút đổi thành "Đã chép"

Scenario: HOLD-UC02-SC6 Trang Widget: tạo lại và thu hồi phải xác nhận
  Given đã có mã
  When tôi bấm "Tạo mã mới" rồi "Huỷ"
  Then không tạo mã
  When tôi bấm "Thu hồi mã" rồi "Thu hồi"
  Then trang hiện lại nút "Tạo mã widget"
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 một mã, tạo lại, thu hồi | `server/src/widget/service.ts:32`, `server/src/widget/service.ts:42`, bảng `server/src/schema.sql:103`, `web/src/pages/WidgetPage.tsx:112` | `widget.test.ts` (SC3), `widget.test.tsx` (SC6) |
| BR-2 mã hiện một lần, băm | `server/src/widget/service.ts:32`, `web/src/pages/WidgetPage.tsx:20` | `widget.test.ts` (SC1), `widget.test.tsx` (SC5) |
| BR-3 mã chỉ đọc widget | `server/src/widget/routes.ts:16`, `server/src/widget/service.ts:47`, `server/src/app.ts:44` | `widget.test.ts` (SC4) |
| BR-4 nội dung | `server/src/widget/service.ts:69`; hiện ở `android/app/src/main/java/app/goldfolio/widget/GoldWidgetProvider.kt:41` | `widget.test.ts` (SC1, SC2) |
| BR-5 cập nhật | `android/app/src/main/res/xml/widget_info.xml:10`, `android/app/src/main/java/app/goldfolio/widget/RefreshJob.kt:48` | (thử trên máy thật) |
| BR-6 cài đặt widget | `android/app/src/main/java/app/goldfolio/widget/WidgetSetupActivity.kt:68`, `android/app/src/main/java/app/goldfolio/widget/Prefs.kt:29` | (thử trên máy thật) |
| BR-7 GoldFolio trong app | `android/app/src/main/java/app/goldfolio/widget/MainActivity.kt:20`, `android/app/src/main/java/app/goldfolio/widget/WebScreen.kt:24`, `android/app/src/main/java/app/goldfolio/widget/GoldWidgetProvider.kt:70` | (thử trên máy thật) |

API: `GET/POST/DELETE /api/widget/token` (cookie), `GET /api/widget` (mã widget) — `server/src/widget/routes.ts:13`.

Chưa kiểm: phần Android chưa build trên máy này (không có Android SDK) và chưa chạy trên điện thoại thật; build lần đầu ở GitHub Actions.
