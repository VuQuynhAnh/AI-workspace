# <repo> — ARCHITECTURE

> Đường dẫn tính từ gốc repo. Kiểm ở commit `<sha>`.
> Chỉ ghi điều KHÔNG suy ra được nhanh từ code. Mỗi khẳng định có `file:line` thật.

## 1. Tổng quan
<Stack, cách chạy, kho dữ liệu (bảng: kho · dùng cho · bắt buộc?), tenant/phân quyền nếu có.>

## 2. Khởi động và lắp ráp
<Entry point, nơi đăng ký route/DI/module — `file:line`.>

## 3. Sơ đồ layer
```
<layer> — trách nhiệm, điều cấm
```

## 4. Đường đi một request tiêu biểu
1. <bước> — `file:line`
<Từ entry → auth → handler → logic → dữ liệu → response lỗi.>

## 5. Luật bắt buộc
| ID | Luật |
|---|---|
| R-<NHÓM>-01 | <một dòng, có `file:line` mẫu nếu được> |

## 6. Bẫy âm thầm (build vẫn chạy, sai khi chạy)
1. **<tên bẫy>** (`file:line`): <vì sao sai, cách tránh>.

## 7. Test
<Runner, lệnh chạy 1 file/1 test, cách dựng phụ thuộc giả, dữ liệu mẫu/tài khoản demo. Chưa có runner thì ghi cách làm tạm.>

## 8. Checklist thêm tính năng
- [ ] <theo thứ tự layer>
