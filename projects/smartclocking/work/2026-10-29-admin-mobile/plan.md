# Thiết kế lại giao diện admin cho điện thoại

Việc: 2026-10-29-admin-mobile · Spec: không có (chỉ đổi giao diện, không đổi hành vi nghiệp vụ) · Repo: smartclocking

## Bối cảnh
Màn admin từ tablet trở lên đã ổn; trên điện thoại (390 px) bị vỡ và có chỗ không dùng được. Chụp thật bằng Chrome headless (390×844) trước khi sửa:
- Thanh tab đáy 7 mục chữ cuộn ngang, chỉ thấy ~4 mục; thanh tiêu đề chật (tiêu đề + "Chấm công" + "Đăng xuất" xuống dòng).
- Bảng công: chỉ thấy 1 cột ngày (tuần lẫn tháng).
- Nhân viên: bảng 6 cột, **nút "Sửa" bị đẩy ra ngoài màn hình** (không sửa được hồ sơ).
- Bảng lương: bảng 8 cột ép chữ, cột thực nhận bị cắt; phiếu lương 9 cột.
- Chi tiết ngày công: bảng lịch sử 4 cột chữ gãy dòng.
- Hội thoại: danh sách + chi tiết xếp chồng (phải cuộn qua danh sách).

Quyết định của user: điều hướng điện thoại = 4 tab icon + "Thêm" (ngăn kéo).

## Checklist
- [x] `AdminLayout.jsx`: thanh đáy 4 tab (Chấm công, Nhân viên, Bảng lương, Hội thoại) + "Thêm" (ngăn kéo: Thiết lập, Tổng quan AI, Quy chế, Chấm công của tôi, Đăng xuất); thanh tiêu đề chỉ logo + tiêu đề (cắt chữ)
- [x] `Clockings.jsx`: thẻ từng người + lưới 7 cột (tuần: thứ + ngày; tháng: lưới lịch từ thứ Hai), bấm ô mở chi tiết
- [x] `Employees.jsx`: danh sách bấm cả dòng để mở hồ sơ
- [x] `Paysheets.jsx`: danh sách người (thực nhận nổi bật, dòng tổng); phiếu lương danh sách từng ngày
- [x] `DayDetail.jsx`: lịch sử chấm dạng danh sách dưới sm
- [x] `Modal.jsx`: toàn màn hình dưới sm
- [x] `Logs.jsx`: chọn hội thoại thì thay danh sách bằng chi tiết + nút "← Danh sách hội thoại"; lỗi tải danh sách vẫn hiện
- [x] `custom.css`: `.bottom-tab`, `.more-sheet`, `.att-grid`, `.att-chip`
- [x] ARCHITECTURE: R-FE-07 + mục checklist

## Kết quả
- Chụp lại 390 px: không tràn ngang ở cả 7 trang; thao tác mở ngăn "Thêm", mở chi tiết ngày công (bấm ô), "Chỉnh sửa" giờ, mở phiếu lương, "Thêm nhân viên" đều chạy.
- Hồi quy: tablet 820 px giữ bảng (chỉ đổi thanh đáy sang icon); desktop 1280 px không đổi.
- `npm test` 94/94 pass; `npm run build` pass.
- **Chưa xem được** Tổng quan AI và Hội thoại có dữ liệu: MongoDB trên máy không chạy lúc chụp (trang báo lỗi kết nối). Phần Hội thoại kiểm qua đọc code.
- Không đổi backend, không đổi hành vi nghiệp vụ.
