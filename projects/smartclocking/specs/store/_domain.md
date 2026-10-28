# Domain: Cửa hàng (STORE)

> Kiểm ở commit `eb82f95`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rút từ code (*as-built*).

| ID | Rule | Code |
|---|---|---|
| STORE-BR-001 | Mọi dữ liệu tách theo cửa hàng. `storeId` lấy từ JWT, không nhận từ client | `auth.service.js:29` |
| STORE-BR-002 | Cửa hàng tạm ngưng hoặc quá `expiry_date` (dùng tới hết ngày, giờ VN) thì mọi tài khoản của cửa hàng bị chặn ngay, kể cả khi token còn hạn (`STORE_LOCKED`) | `accountAccess.js:26-29`, `schema.sql:27-28` |
| STORE-BR-003 | Superadmin tạo cửa hàng kèm admin đầu tiên. Superadmin không quản lý nhân viên của cửa hàng | `superadmin.service.js:92` |
| STORE-BR-004 | Thiết lập là key-value. Key chưa lưu thì dùng giá trị mặc định | `backend/src/constants/enums.js:72-89` |
| STORE-BR-005 | Wi-Fi cửa hàng = IP công cộng lúc admin đăng nhập gần nhất. IP đổi thì thêm dòng mới, dòng cũ giữ làm lịch sử | `storeNetwork.service.js:17` |
