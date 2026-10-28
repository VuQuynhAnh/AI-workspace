# STORE-UC03 — Đăng nhập và kiểm soát truy cập

> Trạng thái: as-built · Việc: — · Cập nhật: 2026-10-28
> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/`.

## Mục tiêu
Người dùng đăng nhập bằng email và mật khẩu do quản trị cấp, rồi vào đúng trang theo vai trò. Mọi request sau đó đều được kiểm tra: phiên còn hợp lệ, đúng vai trò, tài khoản còn hoạt động, cửa hàng còn trong hạn dùng. Tài khoản bị khoá hoặc cửa hàng bị khoá thì bị chặn ngay, kể cả khi token vẫn còn hạn.

## Phạm vi
- Vai trò: mọi người dùng (`superadmin`, `admin`, `user`).
- Màn hình: `/login`. Các trang được bảo vệ đều đi qua `ProtectedRoute`.
- API:
  - `POST /api/auth/login`.
  - Lớp kiểm tra áp cho mọi `/api/*`.
- Ngoài phạm vi:
  - Tạo và quản lý tài khoản (EMP-UC01).
  - Tạo cửa hàng và gói dùng (STORE-UC02).
  - Đổi mật khẩu và quên mật khẩu: **chưa có** tính năng này.

## Quy tắc nghiệp vụ

**Áp dụng rule domain:**
- STORE-BR-001: `storeId` lấy từ phiên đăng nhập.
- STORE-BR-002: cửa hàng bị khoá thì chặn mọi request.
- STORE-BR-005: admin đăng nhập thì IP lúc đó được ghi làm Wi-Fi cửa hàng.
- EMP-BR-001: không có đăng ký công khai.

**Rule riêng của UC:**
- **BR-1:** Đăng nhập cần cả email và mật khẩu. Thiếu một trong hai: 400 "Thiếu email hoặc mật khẩu." Email được bỏ khoảng trắng hai đầu và chuyển chữ thường trước khi tra cứu.
- **BR-2:** Email không tồn tại, tài khoản đã xoá, hoặc sai mật khẩu đều nhận **cùng một** thông báo: 401 "Email hoặc mật khẩu không đúng."
- **BR-3:** Đúng mật khẩu thì xét tiếp, theo thứ tự:
  1. Tài khoản bị vô hiệu hoá: 403 "Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên."
  2. Với tài khoản không phải superadmin, cửa hàng bị tạm ngưng hoặc đã quá hạn dùng: 403 `STORE_LOCKED`, thông báo lý do (STORE-BR-002). Cửa hàng vẫn dùng được trọn ngày hết hạn, theo giờ VN. Superadmin không bị xét điều kiện cửa hàng.
- **BR-4:** Đăng nhập thành công thì nhận token và thông tin người dùng (id, họ tên, email, vai trò, cửa hàng). Token hết hạn sau `JWT_EXPIRES_IN`, mặc định **7 ngày**. Không có refresh token. Đăng xuất chỉ xoá phiên trên trình duyệt.
- **BR-5:** Admin cửa hàng đăng nhập thì IP công cộng lúc đó được ghi làm "Wi-Fi cửa hàng" nếu khác lần trước (STORE-BR-005). Ghi lỗi cũng không làm hỏng việc đăng nhập.
- **BR-6:** Sau khi đăng nhập, người dùng chuyển về trang chủ theo vai trò:

  | Vai trò | Trang chủ |
  |---|---|
  | `superadmin` | `/superadmin` |
  | `admin` | `/admin` (mặc định mở `/admin/clockings`) |
  | `user` | `/work` |

- **BR-7:** Mọi request có token đều qua **lớp kiểm tra truy cập**, đọc trạng thái mới nhất từ DB:
  - Tài khoản không còn, đã xoá hoặc bị khoá: 401 "Tài khoản không còn hoạt động. Vui lòng đăng nhập lại."
  - Không phải superadmin mà cửa hàng tạm ngưng hoặc hết hạn: 403 `STORE_LOCKED`.
  - Token sai thì lớp này bỏ qua, để bước kiểm tra của từng route trả lỗi.
- **BR-8:** Kiểm tra của từng route:
  - Thiếu token: 401 "Thiếu token xác thực."
  - Token sai hoặc hết hạn: 401 "Token không hợp lệ hoặc đã hết hạn."
  - Sai vai trò: 403 "Bạn không có quyền truy cập chức năng này."
  - **Vai trò được đọc từ token**, không đọc lại từ DB.
- **BR-9:** Bảng quyền theo API:

  | API | Ai được gọi |
  |---|---|
  | `/api/health`, `POST /api/auth/login`, `GET /api/clocking/store/:id`, `GET /api/avatars/:file` | Công khai |
  | `/api/superadmin/*` | `superadmin` |
  | `/api/hr/*`, `/api/admin/*`, `/api/documents/*` | `admin` |
  | `/api/clocking/*` (trừ trang công khai), `/api/chat/*`, `/api/doc-files/*` | `admin`, `user` |

- **BR-10:** Trên trình duyệt:
  - Token và thông tin người dùng được lưu ở localStorage, và mọi request gửi kèm token.
  - Chưa đăng nhập mà mở trang được bảo vệ thì chuyển tới `/login`.
  - Mở trang sai vai trò thì chuyển về trang chủ của vai trò đó.
  - Khi một request có token nhận 401 hoặc mã `STORE_LOCKED`: tự đăng xuất và chuyển về `/login`. Lần đăng nhập lại sẽ hiện lý do.
- **BR-11:** Màn đăng nhập hiện danh sách tài khoản demo để bấm chọn nhanh, trừ khi build với `VITE_HIDE_DEMO_ACCOUNTS=true`.

## Scenario
```gherkin
Scenario: STORE-UC03-SC1 Đăng nhập nhân viên
  When nhân viên đăng nhập đúng email (viết hoa, có khoảng trắng) và mật khẩu
  Then nhận token hạn 7 ngày và được chuyển tới /work

Scenario: STORE-UC03-SC2 Sai thông tin đăng nhập
  When đăng nhập với email không tồn tại, hoặc email đúng nhưng sai mật khẩu
  Then cả hai trường hợp đều nhận 401 "Email hoặc mật khẩu không đúng."

Scenario: STORE-UC03-SC3 Tài khoản bị vô hiệu hoá
  Given tài khoản đã bị khoá
  When đăng nhập đúng mật khẩu
  Then bị từ chối 403 "Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên."

Scenario: STORE-UC03-SC4 Cửa hàng hết hạn
  Given cửa hàng hết hạn ngày 30/09/2026
  When nhân viên đăng nhập lúc 23:59 ngày 30/09 (giờ VN)
  Then đăng nhập thành công
  When đăng nhập lúc 00:00 ngày 01/10 (giờ VN)
  Then bị từ chối 403 STORE_LOCKED "Cửa hàng của bạn đã hết hạn sử dụng từ ngày 30/09/2026. Vui lòng liên hệ nhà cung cấp để gia hạn."

Scenario: STORE-UC03-SC5 Bị khoá khi đang dùng
  Given nhân viên đang đăng nhập, token còn hạn
  When admin khoá tài khoản đó
  Then request kế tiếp nhận 401 "Tài khoản không còn hoạt động. Vui lòng đăng nhập lại." và trình duyệt tự đăng xuất

Scenario: STORE-UC03-SC6 Superadmin không bị xét cửa hàng
  When superadmin đăng nhập
  Then thành công và được chuyển tới /superadmin

Scenario: STORE-UC03-SC7 Sai vai trò
  When nhân viên (user) gọi API /api/hr/paysheets
  Then bị từ chối 403 "Bạn không có quyền truy cập chức năng này."
  When nhân viên mở trang /admin
  Then được chuyển về /work

Scenario: STORE-UC03-SC8 Admin đăng nhập ghi Wi-Fi cửa hàng
  Given IP Wi-Fi cửa hàng gần nhất là 203.0.113.5
  When admin đăng nhập từ IP 198.51.100.7
  Then Wi-Fi cửa hàng đổi thành 198.51.100.7
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| BR-1, BR-2, BR-3 | `backend/src/services/auth.service.js:9-22`, `backend/src/repositories/account.repository.js:10-18` | — |
| BR-3 (cửa hàng) | `backend/src/services/storePlan.service.js:17-28` | `storePlan.test.js` |
| BR-4 | `backend/src/services/auth.service.js:24-32`, `backend/src/utils/jwt.js:4-9` | — |
| BR-5 | `backend/src/services/auth.service.js:31`, `backend/src/services/storeNetwork.service.js:17-27` | — |
| BR-6 | `frontend/src/pages/Login.jsx:28-30`, `frontend/src/constants/enums.js:86` | — |
| BR-7 | `backend/src/app.js:24`, `backend/src/middleware/accountAccess.js:10-34`, `backend/src/repositories/account.repository.js:22-30` | — |
| BR-8 | `backend/src/middleware/auth.js:4-28` | — |
| BR-9 | `backend/src/routes/*.routes.js` (dòng `router.use(requireAuth, requireRole(…))`), `backend/src/app.js:20` | — |
| BR-10 | `frontend/src/context/AuthContext.jsx`, `frontend/src/routes/ProtectedRoute.jsx`, `frontend/src/api/client.js:66-74` | — |
| BR-11 | `frontend/src/constants/demoAccounts.js:6` | — |

## Câu hỏi mở
- [ ] **Lỗ hổng phân quyền: hạ quyền admin không có hiệu lực ngay.** Admin cửa hàng hạ được admin khác xuống `user` (`employee.service.js:115-121`). Nhưng `requireRole` đọc vai trò **từ token** (`auth.js:23`), còn lớp kiểm tra truy cập tuy đọc vai trò từ DB nhưng chỉ dùng để bỏ qua superadmin (`accountAccess.js:26`).
  - Hậu quả: người vừa bị hạ quyền vẫn có **toàn quyền admin tới 7 ngày**, gồm sửa giờ, chốt/huỷ bảng lương, xem tài liệu nhạy cảm.
  - Đề xuất: lớp kiểm tra so `state.role` với `payload.role`, khác thì trả 401.
  - Tương tự với email và họ tên trong token.
- [ ] **Không giới hạn số lần đăng nhập sai:** không có rate limit hay khoá tạm thời, nên mật khẩu có thể bị dò không giới hạn.
- [ ] **Lộ thông tin tài khoản qua thời gian phản hồi và thứ tự lỗi:**
  - Email không tồn tại thì bỏ qua bước so mật khẩu (bcrypt), nên trả lời nhanh hơn thấy rõ.
  - Thông báo "tài khoản bị vô hiệu hoá" hay "cửa hàng bị khoá" chỉ hiện **sau khi đúng mật khẩu**, tức là xác nhận được mật khẩu đúng.
- [ ] **Khoá ký token mặc định:** thiếu `JWT_SECRET` thì token được ký bằng chuỗi công khai "dev-secret-change-me" mà ứng dụng không báo lỗi lúc khởi động (`jwt.js:4`).
- [ ] **Tài khoản demo hiện ở bản production theo mặc định:** chỉ ẩn khi build với `VITE_HIDE_DEMO_ACCOUNTS=true`. Seed cũng dùng đúng các mật khẩu này.
- [ ] **Lỗi hệ thống lộ thông báo gốc:** lỗi không phải `AppError` (DB, thư viện) trả `err.message` nguyên văn cho client (`errorHandler.js:11`).
- [ ] **Đăng nhập lại bị chặn bởi token cũ:** trình duyệt còn giữ token của tài khoản bị khoá thì request đăng nhập cũng bị lớp kiểm tra chặn trước. Lần đầu sẽ thấy lý do của tài khoản cũ, phải thử lại lần nữa mới đăng nhập được.
- [ ] **Đã đăng nhập vẫn vào được `/login`:** không có chuyển hướng về trang chủ.
- [ ] **Tải file lỗi phiên không tự đăng xuất:** `api.downloadFile` không tự đăng xuất khi nhận 401 hoặc `STORE_LOCKED`.
- [ ] **Lệch R-ENUM-01:** mã `"STORE_LOCKED"` được viết cứng ở `frontend/src/api/client.js`.
- [ ] **Thiếu tính năng:** chưa có đổi mật khẩu và quên mật khẩu.
