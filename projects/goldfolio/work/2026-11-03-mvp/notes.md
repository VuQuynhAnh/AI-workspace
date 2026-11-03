# Ghi chú — 2026-11-03-mvp

- ACC (đăng nhập email/mật khẩu) và PRICE (adapter Phú Quý, lịch 15 phút, giá theo ngày) chưa có UC riêng. MVP chỉ làm phần tối thiểu để HOLD-UC01 chạy được, bám theo rule domain ACC-BR-*, PRICE-BR-*. User đã chốt các lựa chọn ngày 2026-11-03: TypeScript + Tailwind, email + mật khẩu, 15 phút. Nên `/reverse` hoặc `/spec` ACC-UC01, PRICE-UC01 sau khi build để có scenario riêng.
- Giao diện chủ yếu dùng trên điện thoại (user chốt 2026-11-03): làm thành việc riêng `mobile-ui` sau khi commit MVP. Bố cục đã chọn: thanh 3 tab dưới (Tổng quan / Lịch sử / Lần mua), nút "+" nổi để thêm, form thêm/sửa toàn màn hình.
- Ngoài phạm vi, ghi lại để làm sau:
  - Quên mật khẩu (cần gửi mail).
  - Adapter cho Bảo Tín Minh Châu và Bảo Tín Mạnh Hải (trang đọc được; BTMC có `gia-vang-theo-ngay.html`).
  - Ghi nhận bán ra.
