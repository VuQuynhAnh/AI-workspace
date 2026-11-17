# Widget Android cho GoldFolio

## Yêu cầu
User dùng Android. Muốn widget trên màn hình chính, **rẻ** và **không phụ thuộc** app bên thứ ba (KWGT, Scriptable…).

## Chọn cách: app Android nhỏ của riêng GoldFolio, chỉ có widget
- Một app Android tối giản (Kotlin, `AppWidgetProvider` + `RemoteViews`, không thư viện ngoài). App chỉ có:
  - một màn hình cấu hình: dán **địa chỉ server** và **mã widget**;
  - widget: tổng giá trị, lãi/lỗ (số + %), giá mua vào · bán ra hiện tại của vàng và bạc, giờ cập nhật;
  - bấm vào widget thì mở GoldFolio trên trình duyệt.
- **Chi phí 0 đồng:** cài APK trực tiếp (không lên CH Play, nên không mất 25 USD). Build APK bằng **GitHub Actions** (máy này chưa có Java/Android SDK, không phải cài Android Studio).
- **Không phụ thuộc:** chỉ cần app này và server GoldFolio của bạn.
- Bỏ qua: bọc cả app web bằng Capacitor (nặng, không cần). Web vẫn dùng như cũ.

## Phía server (repo `goldfolio`)
1. Bảng `widget_tokens` (user_id, token_hash SHA-256, created_at, last_used_at). Mỗi người một mã; tạo mã mới thì mã cũ hết hiệu lực.
2. API (cần đăng nhập):
   - `POST /api/widget/token`: tạo mã mới, trả mã **một lần duy nhất** (server chỉ lưu bản băm).
   - `DELETE /api/widget/token`: thu hồi.
   - `GET /api/widget/token`: đã có mã chưa, dùng lần cuối lúc nào.
3. `GET /api/widget` với header `Authorization: Bearer <mã>`. **Chỉ đọc**, trả gọn (dùng lại `buildPortfolio`): tổng giá trị, giá vốn, lãi/lỗ, theo vàng/bạc, giá hiện tại sản phẩm chính, thời điểm giá. Mã sai thì 401. Mã này không dùng được cho API khác.
4. Test: tạo/thu hồi mã, mã sai hoặc đã thu hồi thì 401, dữ liệu khớp danh mục, không lộ email.

## Phía web
- Trang **Cài đặt → Widget** (hoặc mục trong menu tài khoản):
  - nút "Tạo mã widget", hiện mã + địa chỉ server kèm nút Sao chép, cảnh báo "mã chỉ hiện một lần";
  - nút "Thu hồi";
  - link tải APK mới nhất và 3 bước cài.

## Phía Android (thư mục mới `android/` trong repo `goldfolio`)
- Kotlin, minSdk 26, chỉ dùng SDK chuẩn (`HttpURLConnection`, `org.json`).
- Làm mới: theo nhịp hệ điều hành (`updatePeriodMillis` 30 phút, mức thấp nhất Android cho phép) + nút làm mới trên widget.
- Lỗi mạng hoặc server đang ngủ: giữ số cũ, ghi "Cập nhật lúc HH:mm" để biết số đã cũ.
- Workflow `.github/workflows/android.yml`: build APK debug khi có thay đổi trong `android/`, đính file APK vào GitHub Release để tải về điện thoại.

## Tài liệu
- Spec mới `specs/holding/HOLD-UC0x-widget.md` (BR + SC), cập nhật `ARCHITECTURE.md` (mã widget, R-OWN-01), README (cách cài).

## Rủi ro
- Render ngủ: lần làm mới đầu sau khi ngủ chậm khoảng 30–60 giây; widget vẫn hiện số cũ.
- Cài APK ngoài CH Play: Android hỏi "cho phép cài từ nguồn này", bấm cho phép một lần.
- Không chạy được emulator ở máy này, nên phần Android chỉ kiểm bằng build CI + bạn thử trên máy thật.
