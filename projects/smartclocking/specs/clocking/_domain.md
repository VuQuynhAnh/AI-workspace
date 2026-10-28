# Domain: Chấm công (CLK)

> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rule dùng chung cho mọi UC chấm công. Rút từ code. Rule nào chưa có UC thì trạng thái là *as-built*.

| ID | Rule | Code |
|---|---|---|
| CLK-BR-001 | Thời điểm chấm công do server ghi, không nhận giờ từ client | `clocking.repository.js:87` |
| CLK-BR-002 | Mỗi nhân viên mỗi ngày (giờ VN) có đúng 1 dòng chấm công. Giờ ca được chụp vào dòng lúc tạo | `schema.sql:142`, `timesheet.service.js:32` |
| CLK-BR-003 | Tự chấm công bắt buộc có GPS hợp lệ | `clocking.service.js:112-115` |
| CLK-BR-004 | Chấm bằng QR: QR phải là cửa hàng của nhân viên | `clocking.service.js:117-122` |
| CLK-BR-005 | Chấm bằng Wi-Fi: cửa hàng phải bật, IP trùng Wi-Fi cửa hàng, cửa hàng đã đặt vị trí, và GPS cách cửa hàng ≤ `wifi_max_distance_meters`, được trừ hao sai số GPS tối đa 100 m | `clocking.service.js:84-90`, `:123-132` |
| CLK-BR-006 | Check-in tối đa 1 lần/ngày. Check-out luôn được, kể cả khi quên check-in | `clocking.service.js:142-153` |
| CLK-BR-007 | Hai lần bấm phải cách nhau ≥ 20 giây (trả 429) | `clocking.service.js:12`, `:155` |
| CLK-BR-008 | Chấm ngoài bán kính `check_in_radius_meters` chỉ gắn cờ cho admin, không chặn | `clocking.service.js:159-176` |
| CLK-BR-009 | Tháng đã có bảng lương chốt thì không chấm công hay sửa giờ trong tháng đó (`MONTH_LOCKED`) | `timesheet.service.js:21` |
| CLK-BR-010 | Lần chấm không sửa, không xoá. Admin sửa = huỷ lần cũ + thêm lần mới (`source=admin`) trỏ về lần cũ | `schema.sql:146-200` |
| CLK-BR-011 | Tài khoản bị vô hiệu hoá hoặc cửa hàng tạm ngưng thì không chấm công được | `clocking.service.js:120`, `:134` |
| CLK-BR-012 | Admin cửa hàng cũng chấm công như nhân viên. Superadmin thì không | `clocking.routes.js:22` |
