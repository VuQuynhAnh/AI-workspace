# CAL-UC01 — Lịch âm dương (web và widget Android)

> Trạng thái: implemented · Việc: 2026-11-17-widget-lich · Cập nhật: 2026-11-17 · Kiểm ở commit `d7255cf` (nhánh `main`, 2026-11-17)

## Mục tiêu
Xem lịch dương kèm ngày âm, ngày lễ, ngày tốt xấu như lịch treo tường; có widget lịch tháng trên màn hình chính Android. Không phí, không quảng cáo (user chốt 2026-11-17).

## Phạm vi
- Web: tab **Lịch** (`/`), cần đăng nhập như các tab khác.
- Android: widget tháng 4x4 (**chỉ widget tháng**, user chốt) chạy offline; mở app là mở web trong app (webview, user chốt 2026-11-17).
- Ngoài phạm vi: nhắc lịch, đồng bộ với Google Calendar, lịch các nước khác.

## Quy tắc nghiệp vụ
- BR-1: **Ngày âm theo lịch Việt Nam:** thuật toán thiên văn Hồ Ngọc Đức, múi giờ +7 (khác lịch Trung Quốc ở năm 1985, 2007, 2030…). Đúng cho 1900–2100. Có tháng nhuận.
- BR-2: **Lưới tháng:** tuần bắt đầu thứ Hai, 6 hàng × 7 ô. Mỗi ô có ngày dương và ngày âm nhỏ; mùng 1 ghi kèm tháng ("1/10", tháng nhuận "1/6n"). Mùng 1 và rằm nổi bật; hôm nay được đánh dấu; ngày ngoài tháng mờ đi.
- BR-3: **Ngày lễ** (user chốt):
  - Dương lịch: 1/1, 3/2, 14/2, 8/3, 30/4, 1/5, 19/5, 1/6, 27/7, 1/9 (từ 2021), 2/9, 20/10, 20/11, 22/12, 24/12, 25/12.
  - Âm lịch, chỉ tính trong tháng thường, không tính tháng nhuận: mùng 1–3 Tết, rằm tháng Giêng, 3/3, 10/3, 15/4, 5/5, 15/7, 15/8, 23/12, Giao thừa (ngày cuối tháng Chạp).
  - Ngày nghỉ theo luật lao động tô **đỏ**, ngày lễ khác tô vàng; Chủ nhật cũng đỏ.
- BR-4: **Chi tiết một ngày:** thứ, ngày dương, ngày âm kèm năm can chi; can chi ngày và tháng; ngày hoàng đạo/hắc đạo (12 thần theo tháng âm); ngũ hành nạp âm của ngày; tiết khí (ghi "bắt đầu hôm nay" nếu đúng ngày chuyển tiết); giờ hoàng đạo kèm giờ đồng hồ (user chốt: lễ, giờ hoàng đạo, tiết khí).
- BR-5: **Đổi ngày âm → dương** (ngày, tháng, năm 1900–2100, tháng nhuận). Ngày không tồn tại (tháng nhuận sai năm, ngày 30 của tháng thiếu) thì báo "Ngày âm không tồn tại". Đổi được thì nhảy lịch tới ngày đó.
- BR-6: **Widget Android:**
  - ‹ › chuyển tháng; chạm tiêu đề về tháng hiện tại; sang ngày mới thì tự về tháng hiện tại.
  - Dòng cuối: hôm nay âm lịch, tiết khí, ngày lễ, giờ tốt.
  - Chạm một ngày thì mở app ở ngày đó: app mở web với `/?ngay=YYYY-MM-DD`, tab Lịch chọn sẵn ngày đó.
  - Tự đổi ngày lúc 0 giờ (Android có thể trễ vài phút). Widget không cần mạng.
- BR-7: **App Android = web trong app:**
  - Lần đầu nhập địa chỉ web (vd địa chỉ Render) một lần; chưa nhập thì mở màn hình nhập.
  - Web chạy trong webview, có localStorage (hồ sơ, tử vi đã xem) và cookie; mất mạng thì dùng bản đã lưu trong bộ nhớ đệm, mở trang lỗi kèm "Thử lại" nếu chưa từng mở.
  - Nút back lùi trang trong web trước; link ngoài mở bằng trình duyệt.
  - Menu ⋮: "Thêm widget ra màn hình chính", "Đổi địa chỉ web".

## Scenario

```gherkin
Scenario: CAL-UC01-SC1 Tết theo lịch Việt Nam
  Then mùng 1 Tết 1985 là 21/01/1985, 2007 là 17/02/2007, 2030 là 02/02/2030
  And hôm trước Tết là ngày thuộc tháng Chạp năm trước

Scenario: CAL-UC01-SC2 Tháng nhuận
  Then năm 2023 nhuận tháng 2, 2025 nhuận tháng 6, 2024 không nhuận

Scenario: CAL-UC01-SC3 Tiết khí
  Then 03/02/2025 bắt đầu tiết Lập xuân, 21/12/2024 bắt đầu tiết Đông chí

Scenario: CAL-UC01-SC4 Ngày lễ
  Then 30/04 là ngày nghỉ, Trung thu 2025 (06/10/2025) là lễ âm lịch không nghỉ
  And 16/02/2026 là Giao thừa

Scenario: CAL-UC01-SC5 Tab Lịch
  Given hôm nay 17/11/2026
  Then lịch tháng 11/2026 bắt đầu từ ô 26/10, chi tiết ghi "Ngày 9 tháng 10 năm Bính Ngọ"
  When tôi chạm ngày 20/11
  Then chi tiết ghi "Nhà giáo Việt Nam"
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 ngày âm | `shared/src/lunar.ts:144`, `shared/src/lunar.ts:181`; Kotlin `android/app/src/main/java/app/mylunarcalendar/LunarCalendar.kt:130` | `shared/test/lunar.test.ts` (SC1, SC2), `LunarCalendarTest.kt` |
| BR-2 lưới tháng | `web/src/lib/calendar.ts:35`, `web/src/pages/CalendarPage.tsx:11` | `web/test/app.test.tsx` (SC5) |
| BR-3 ngày lễ | `shared/src/holidays.ts:48` | `shared/test/tuvi.test.ts` (SC4) |
| BR-4 chi tiết ngày | `shared/src/tuvi.ts:36`, `shared/src/lunar.ts:244`, `shared/src/lunar.ts:259`, `shared/src/lunar.ts:288`, `web/src/pages/CalendarPage.tsx:74` | `shared/test/lunar.test.ts` (SC3), `app.test.tsx` (SC5) |
| BR-5 đổi âm → dương | `web/src/pages/CalendarPage.tsx:111` | `app.test.tsx` |
| BR-6 widget | `android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:96`, `android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:156`, `android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:180`, `web/src/pages/CalendarPage.tsx:16` | `web/test/app.test.tsx` (?ngay=); widget: CI build, thử trên máy thật |
| BR-7 web trong app | `android/app/src/main/java/app/mylunarcalendar/MainActivity.kt:21`, `android/app/src/main/java/app/mylunarcalendar/WebScreen.kt:24`, `android/app/src/main/java/app/mylunarcalendar/SetupActivity.kt:19` | (thử trên máy thật) |

Chưa kiểm: widget trên điện thoại thật; bản Android chỉ được build và test ở GitHub Actions.
