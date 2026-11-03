# Giao diện tối màu sang trọng

Việc: 2026-11-03-giao-dien-toi · Spec: không đổi hành vi · Repo: goldfolio · Branch: làm tiếp trên nhánh của việc giá tự lấy

## Bối cảnh
User thấy giao diện xấu, chọn hướng "sang trọng tối màu". Nguyên nhân kỹ thuật có thật: CSS khai báo font "Be Vietnam Pro" nhưng chưa nạp file font, nên đang dùng font hệ thống; màu dùng trực tiếp `stone-*`/`white` rải ở 12 file.

## Thiết kế
- **Bảng màu dạng token** trong `web/src/index.css` (`@theme`):
  - Nền: đen than `#0f0f10`, mặt thẻ `#18181b`, viền mảnh `#2a2a2e`.
  - Chữ: chính `#f4f1ea`, phụ `#a8a29e`.
  - Nhấn: vàng kim `#d4af37`, vàng nhạt `#f0d78c` cho số to.
  - Lãi/lỗ chỉnh sắc độ cho nền tối: xanh `#34d399`, đỏ `#f87171`. Đều đạt tương phản ≥ 4.5:1 trên nền thẻ.
- **Thay màu cố định bằng token** ở mọi component và trang; nhãn dùng tiếng Việt, không đổi selector của test.
- **Font Be Vietnam Pro** tự đóng gói qua `@fontsource/be-vietnam-pro` (chờ duyệt), không tải từ Google, nên chạy được cả khi không có mạng. Chữ số dùng `tabular-nums`.
- **Thẻ tổng quan:** nền gradient đen → nâu vàng rất tối, viền vàng mảnh, số giá trị hiện tại cỡ lớn màu vàng nhạt.
- **Thanh tab, nút `+`, nút Lưu:** tab đang chọn màu vàng kim; nút chính nền vàng kim, chữ đen.
- **Biểu đồ:** lưới và trục màu xám tối, đường vàng kim, điểm hôm nay màu xanh lãi, tooltip nền thẻ.
- **Hệ thống:** `color-scheme: dark` để ô ngày/giờ và bàn phím của hệ thống cũng tối; `theme-color` đổi sang nền đen.
- Chỉ có chế độ tối (không theo cài đặt sáng/tối của máy).

## Checklist
- [x] Token màu + font + `color-scheme` (`index.css`, `index.html`, `main.tsx` import font)
- [x] Thay màu ở `AppShell`, `BottomNav`, `ConfirmSheet`, `ui.tsx`, `HistoryChart`, 5 trang
- [x] Chạy `npm test` (test chọn theo nhãn, không đổi), `npm run lint`, `npm run build`
- [x] ARCHITECTURE: luật R-UI-05 (chỉ dùng token màu, không dùng màu cố định); `check-docs`

## Rủi ro
- Không xem được giao diện trong phiên này (không có trình duyệt): user cần mở trên điện thoại để duyệt màu.

## Ghi chú khi làm
- Tương phản đã tính (WCAG): chữ chính 15.7, chữ phụ 7.0, lãi 9.2, lỗ 6.4, vàng 8.4, chữ trên nút vàng 9.1, chữ trên nút đỏ 6.9 (đều ≥ 4.5:1).
- Font đóng gói kèm bộ ký tự tiếng Việt (400/500/600).
- Chưa xem được trên thiết bị: cần user mở trên điện thoại để duyệt màu.
