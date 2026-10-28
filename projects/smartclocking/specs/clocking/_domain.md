# Domain: Chấm công (CLK)

> Kiểm ở commit `4ac4c01`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rule dùng chung cho mọi UC chấm công. Rút từ code. Rule nào chưa có UC thì trạng thái là *as-built*.

| ID | Rule | Code |
|---|---|---|
| CLK-BR-001 | Thời điểm chấm công do server ghi, không nhận giờ từ client | `clocking.repository.js:87` |
| CLK-BR-002 | Mỗi nhân viên mỗi ngày (giờ VN) có đúng 1 dòng chấm công. Giờ ca được chụp vào dòng lúc tạo | `schema.sql:142`, `timesheet.service.js:32` |
| CLK-BR-003 | Tự chấm công bắt buộc có GPS hợp lệ | `clocking.service.js:129-132` |
| CLK-BR-004 | Chấm bằng QR: QR phải là cửa hàng của nhân viên | `clocking.service.js:134-139` |
| CLK-BR-005 | Chấm bằng Wi-Fi: cửa hàng phải bật, IP trùng Wi-Fi cửa hàng, cửa hàng đã đặt vị trí, và GPS cách cửa hàng ≤ `wifi_max_distance_meters`, được trừ hao sai số GPS tối đa 100 m | `clocking.service.js:85-91`, `:140-149` |
| CLK-BR-006 | Check-in tối đa 1 lần/ngày. Check-out luôn được, kể cả khi quên check-in | `clocking.service.js:161-172` |
| CLK-BR-007 | Hai lần bấm phải cách nhau ≥ 20 giây (trả 429) | `clocking.service.js:12`, `:174` |
| CLK-BR-008 | Chấm ngoài bán kính `check_in_radius_meters` được gắn cờ cho admin. Mặc định không chặn. Khi cửa hàng bật "chặn chấm công ngoài bán kính", chấm QR ngoài bán kính bị từ chối (CLK-UC01/BR-14) | `clocking.service.js:178-195` |
| CLK-BR-009 | Tháng đã có bảng lương chốt thì không chấm công hay sửa giờ trong tháng đó (`MONTH_LOCKED`) | `timesheet.service.js:21` |
| CLK-BR-010 | Lần chấm không sửa, không xoá. Admin sửa = huỷ lần cũ + thêm lần mới (`source=admin`) trỏ về lần cũ | `schema.sql:146-200` |
| CLK-BR-011 | Tài khoản bị vô hiệu hoá hoặc cửa hàng tạm ngưng thì không chấm công được | `clocking.service.js:137`, `:151` |
| CLK-BR-012 | Admin cửa hàng cũng chấm công như nhân viên. Superadmin thì không | `clocking.routes.js:22` |
