# Domain: Bảng lương (PAY)

> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rút từ code (*as-built*).

| ID | Rule | Code |
|---|---|---|
| PAY-BR-001 | Giờ làm = phần thời gian từ check-in đầu tiên tới check-out cuối cùng **nằm trong khung ca**. Đến sớm hoặc về muộn không được tính thêm | `payrollCalculator.js:31-45` |
| PAY-BR-002 | Đi muộn và về sớm tính theo phút, làm tròn xuống | `payrollCalculator.js:48-54` |
| PAY-BR-003 | Lương ngày = lương giờ × phút làm / 60. Phạt ngày = (muộn + sớm) × phạt/phút. Làm tròn đến đồng cho **từng ngày** | `payrollCalculator.js:11-12` |
| PAY-BR-004 | Thực nhận cả tháng = max(0, tổng lương − tổng phạt) | `payrollCalculator.js:110` |
| PAY-BR-005 | Có check-in mà không có check-out thì giờ làm = 0, gắn cờ thiếu check-out | `payrollCalculator.js:47` |
| PAY-BR-006 | Mỗi cửa hàng có tối đa 1 bảng lương chưa huỷ cho mỗi tháng | `schema.sql:230-231` |
| PAY-BR-007 | Vòng đời: draft → (tính lại) → finalized. Huỷ được từ draft hoặc finalized. Bảng đã huỷ vẫn giữ để tra cứu | `backend/src/constants/enums.js:97-106` |
| PAY-BR-008 | Chỉ chốt được bảng lương của tháng đã kết thúc (giờ VN) | `paysheet.service.js:182-183` |
| PAY-BR-009 | Bảng đã chốt lưu lại lương giờ và mức phạt đã dùng. Đổi lương hay thiết lập sau đó không làm đổi bảng này | `schema.sql:211`, `:238` |
| PAY-BR-010 | Bảng nháp có thay đổi chấm công, lương hoặc thiết lập sau lần tính gần nhất thì hiện cờ "cần tính lại" | `paysheet.service.js:103-104` |
| PAY-BR-011 | Tháng chưa có bảng lương: nhân viên thấy lương tạm tính theo lương giờ hiện tại | `paysheet.service.js:227` |
| PAY-BR-012 | Bảng lương gồm mọi người đang làm của cửa hàng, cộng với người đã nghỉ nhưng có công trong kỳ | `employee.repository.js:51-60` |
