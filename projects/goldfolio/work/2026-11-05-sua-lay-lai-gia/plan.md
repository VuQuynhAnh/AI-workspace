# Plan: trang sửa lấy lại giá khi đổi sản phẩm / đơn vị

Spec: `specs/holding/HOLD-UC01.md` (BR-7, BR-6, BR-5). Trạng thái: xong.

## Lỗi

Trang sửa lần mua không bao giờ gợi ý giá (BR-7 cũ: "mở form sửa thì không tự gợi ý lại giá", code chặn hẳn bằng `editing`):

- Đổi sản phẩm, ngày, giờ: ô giá vẫn là giá của sản phẩm/thời điểm cũ.
- Đổi đơn vị: đơn giá giữ nguyên con số nên sai nghĩa (13.850.000/chỉ thành 13.850.000/lượng).

## Sửa

- [x] Mở trang sửa: vẫn không gợi ý (giữ giá đã lưu).
- [x] Sau khi mở, đổi sản phẩm / ngày / giờ: lấy giá gợi ý như thêm mới, hiện "Đang lấy giá…". Giá đã lưu coi như giá gợi ý: người dùng chưa gõ giá trong lần sửa này thì bị thay bằng giá mới; đã gõ thì giữ.
- [x] Đổi đơn vị: quy đổi đơn giá đang có sang đơn vị mới (giá gợi ý gốc nếu có, không thì quy từ đơn vị trước), cả ở trang thêm và trang sửa.
- [x] Lần mua đang nhập theo tổng tiền: giữ tổng tiền, đơn giá tự tính lại; chỉ hiện giá tham khảo (user chọn).
- [x] Lần mua có giá tự lấy (BR-16): ô giá để trống như cũ, lưu thì server lấy lại theo sản phẩm/ngày mới; không điền gợi ý.
- [x] Spec BR-7, BR-5; SC mới; test web; check-docs.

## Thêm giữa chừng (user yêu cầu)

- [x] Bộ lọc mặc định **Tất cả** ở cả 3 tab, nút Tất cả đứng đầu (user chọn: vẫn dùng chung một bộ lọc).
- [x] Tab "Lịch sử" → **Biểu đồ** (`/bieu-do`), bộ lọc chỉ Vàng | Bạc (đang lọc Tất cả thì xem Vàng).
- [x] Tab "Lần mua" → **Chi tiết** (`/chi-tiet`); đường dẫn cũ chuyển hướng.
- [x] Tab Chi tiết: dòng đơn giá theo đơn vị đã nhập; giá người dùng nhập có nhãn "Bạn nhập", giá tự lấy ghi "Tự lấy · nguồn". Server trả thêm `inputUnit` cho từng lần mua.
- [x] Spec BR-1 (tên tab), BR-5, BR-7, BR-16, BR-17; SC40 sửa; SC50–SC53 mới; glossary, ARCHITECTURE, README.

- [x] Dữ liệu cũ là giá hệ thống (user đồng ý sửa dữ liệu): bước nâng cấp chạy một lần đánh dấu mọi lần mua có sẵn "Tự lấy · Dữ liệu cũ, chưa xác nhận", số tiền giữ nguyên. Trang sửa điền sẵn số đã lưu (kể cả giá tự lấy).
- [x] Lúc lưu (thêm/sửa) so giá với giá hệ thống tại thời điểm mua: trùng là giá hệ thống, khác là người dùng nhập; không tra được giá thì là người dùng nhập.
- [x] Spec BR-16, SC37, SC54, SC55; PRICE-BR-007 (lưu cũng hỏi giá theo ngày khi cần).

## Kết quả

- Test: shared 28, server 83 (thêm SC53, SC54, SC55), web 43. Lint, build sạch.
