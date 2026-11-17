# CAL-UC02 — Cài đặt giao diện sáng / tối

> Trạng thái: implemented · Việc: 2026-11-17-widget-lich · Cập nhật: 2026-11-17 · Kiểm ở commit `5fcc913` (nhánh `main`, 2026-11-17)

## Mục tiêu
Chọn giao diện sáng hay tối cho web, app Android và widget lịch tháng trên màn hình chính (user chốt 2026-11-17).

## Phạm vi
- Tab **Cài đặt** (`/cai-dat`).
- Ngoài phạm vi: chọn màu nhấn, cỡ chữ.

## Quy tắc nghiệp vụ
- BR-1: **3 lựa chọn:** Sáng, Tối, Theo hệ thống (mặc định). Chọn là áp ngay, nhớ trên máy (localStorage); "Theo hệ thống" đổi theo chế độ sáng/tối của điện thoại, kể cả khi đang mở.
- BR-2: **Widget ăn theo:** trong app Android, web báo lựa chọn xuống app qua cầu nối `AndroidApp.setTheme`, app lưu lại và vẽ lại widget với bảng màu sáng/tối. Widget "Theo hệ thống" đổi màu ở lần vẽ lại kế tiếp (mở app, 0 giờ, bấm ‹ ›), không đổi tức thì khi máy chuyển chế độ.
- BR-3: **Không nháy màu:** trang áp lựa chọn đã lưu trước khi vẽ (script nhỏ trong `index.html`).
- BR-4: Tab Cài đặt có hướng dẫn tải app Android khi mở bằng trình duyệt; trong app thì ẩn.

## Scenario

```gherkin
Scenario: CAL-UC02-SC1 Chọn sáng tối
  Given đang mở trong app Android
  When tôi chọn "Sáng" rồi "Tối"
  Then giao diện đổi ngay, máy nhớ lựa chọn, app nhận "light" rồi "dark" để vẽ lại widget
  And không có mục tải app
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 lựa chọn, áp, nhớ | `web/src/lib/theme.ts:26`, `web/src/lib/theme.ts:37`, `web/src/pages/SettingsPage.tsx:21`, token sáng `web/src/index.css:36` | `web/test/app.test.tsx` (SC1) |
| BR-2 widget ăn theo | `android/app/src/main/java/app/mylunarcalendar/MainActivity.kt:52`, `android/app/src/main/java/app/mylunarcalendar/AppTheme.kt:14`, `android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:122` | (thử trên máy thật) |
| BR-3 không nháy màu | `web/index.html:8` | — |
| BR-4 tải app | `web/src/pages/SettingsPage.tsx:21` | `app.test.tsx` |
