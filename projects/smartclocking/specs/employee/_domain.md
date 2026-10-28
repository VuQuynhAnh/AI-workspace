# Domain: Nhân viên & tài khoản (EMP)

> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rút từ code và README (*as-built*). Dòng nào có đánh dấu *(README)* thì chưa đối chiếu `file:line`. Cần chạy `/reverse` để xác minh.

| ID | Rule | Code |
|---|---|---|
| EMP-BR-001 | Không có đăng ký công khai. Tài khoản do superadmin (admin đầu tiên) hoặc admin cửa hàng tạo | *(README)* |
| EMP-BR-002 | Email duy nhất trong các tài khoản chưa xoá. Email của tài khoản đã xoá được dùng lại | `schema.sql:298` |
| EMP-BR-003 | Số tài khoản đang hoạt động (admin + nhân viên) không vượt `max_employee_count` của gói. Vượt thì chặn (409) | `storePlan.service.js:35-47` |
| EMP-BR-004 | Admin không tự đổi quyền hay tự xoá chính mình. Cửa hàng luôn còn ít nhất 1 admin đang hoạt động | `employee.service.js:117`; phần còn lại *(README)* |
| EMP-BR-005 | Mỗi nhân viên có đúng 1 lương giờ ≥ 0 | `schema.sql:107` |
| EMP-BR-006 | Ngày bắt đầu đi làm khác ngày tạo tài khoản. Admin sửa được, mặc định là hôm nay (giờ VN) | `schema.sql:108-109` |
