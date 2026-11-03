# Domain: Tài khoản (ACC)

> Kiểm ở commit `fe2c586` (nhánh `feat/mvp`, 2026-11-03). Chưa có UC riêng: cài đặt tối thiểu cho HOLD-UC01 (email + mật khẩu, chốt 2026-11-03).

| ID | Rule | Code |
|---|---|---|
| ACC-BR-001 | Phải đăng nhập mới dùng được ứng dụng; chưa đăng nhập thì 401 "Vui lòng đăng nhập". Đăng nhập bằng email + mật khẩu (≥ 8 ký tự), phiên lưu bằng cookie httpOnly 30 ngày. | `server/src/auth/auth.ts:25`, `server/src/app.ts:24` |
| ACC-BR-002 | Mỗi lần mua thuộc về đúng một tài khoản. Mọi truy vấn lần mua phải lọc theo tài khoản đang đăng nhập; lần mua của người khác trả 404. | `server/src/purchases/routes.ts:44-46` |
| ACC-BR-003 | Sai email hay sai mật khẩu đều báo chung "Email hoặc mật khẩu không đúng", không lộ email nào đã đăng ký. *(as-built)* | `server/src/auth/auth.ts:85` |

## Câu hỏi mở

- Quên mật khẩu (cần gửi mail): chưa làm.
- Có cần vai trò quản trị không (vd thêm thương hiệu hoặc sản phẩm mới)? Hiện sửa `server/src/catalog.ts`.
