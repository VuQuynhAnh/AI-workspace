# Plan: form gọn trên màn nhỏ, báo đang lấy giá, giá hiện tại ở Tổng quan

Spec: `specs/holding/HOLD-UC01.md` (BR-1, BR-6, BR-10). Trạng thái: xong (user chọn: giờ mua ẩn sau nút; Tổng quan hiện mua vào + bán ra).

## Yêu cầu

1. Màn nhỏ: nhãn "Giờ mua (không bắt buộc)" xuống dòng làm lệch hàng Ngày/Giờ, vỡ form.
2. Đổi đơn vị (hoặc sản phẩm, ngày) thì cần thấy đang lấy/tính giá.
3. Tổng quan hiện giá hiện tại.
5. (thêm giữa chừng) Bỏ ghi chú: user thấy không dùng.
4. Hỏi: lãi/lỗ = giá cửa hàng mua vào hiện tại × khối lượng − tổng tiền đã mua? → Đúng (BR-9), chỉ trả lời, không đổi.

## Việc

- [x] Giờ mua: ẩn mặc định, ngày mua chiếm cả hàng; nút "+ Thêm giờ mua" mở ô giờ (sửa lần mua có giờ thì mở sẵn). Nhãn ngắn "Giờ mua". (`web/src/pages/PurchaseFormPage.tsx`)
- [x] Đang lấy giá: `PurchaseLine` giữ cờ `loading` khi gọi `/prices/suggest`; ô đơn giá hiện "Đang lấy giá…" (gợi ý dưới ô, có `aria-busy`, `role=status`); kết quả về thì tắt. Đổi đơn vị mà đã có giá gợi ý thì quy đổi ngay tại chỗ (không phải chờ mạng).
- [x] Giá hiện tại ở Tổng quan: server trả thêm `price: { buy, sell, unit, time }` (null khi chưa có giá) cho từng sản phẩm trong `groups[].products` (`server/src/portfolio/service.ts`); mỗi dòng sản phẩm hiện "Mua vào 13.550.000 · Bán ra 13.850.000 /chỉ".
- [x] Spec: BR-1 (giờ mua ẩn sau nút), BR-6 (trạng thái đang lấy giá), BR-10 (giá hiện tại từng sản phẩm); thêm SC; bảng Cài đặt.
- [x] Test: web (giờ ẩn/hiện, đang lấy giá, giá hiện tại), server (portfolio có giá theo sản phẩm). lint, build, check-docs.

- [x] Bỏ ô ghi chú khỏi form và danh sách lần mua. Giữ cột `note` trong DB và API (không xoá dữ liệu); sửa lần mua cũ thì gửi lại ghi chú đã có. Spec BR-1, BR-18, SC23 (về mức API), SC49.

## Rủi ro

- Test cũ đang gõ vào ô giờ trực tiếp → phải bấm "+ Thêm giờ mua" trước.

## Kết quả

- Test: shared 28, server 80 (thêm SC46), web 35 (thêm SC46, SC47, SC48, SC49, sửa lần mua có giờ, danh sách không hiện ghi chú). Lint, build sạch.
- Tự review: lấy giá lỗi thì xoá giá gợi ý gốc để đổi đơn vị không quy đổi nhầm giá cũ (đã sửa).
