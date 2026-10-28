# <Tiêu đề việc>

Việc: <YYYY-MM-DD-slug> · Spec: specs/<domain>/<UC>.md · Repo: <repo> · Branch: feat/<slug>

## Bối cảnh
<2–5 dòng: thay đổi gì, vì sao.>

## Mẫu tham chiếu
- <tính năng tương tự đã có, làm mẫu> — `file:line`

## Ảnh hưởng
- Spec/BR bị chạm: <UC/BR, kể cả UC khác dùng chung code>
- Code dùng chung bị chạm: <hàm/module + nơi gọi khác>

## Thiết kế
- Dữ liệu: <bảng/cột/enum/cấu hình>
- API: <method path · quyền · request/response · mã lỗi>
- UI: <trang/component · trạng thái rỗng/lỗi>

## Checklist
### <Layer 1>
- [ ] `<file>:NN` — <việc> (BR-1)
### Kiểm tra
- [ ] Test <hàm/service> — SC1, SC2
- [ ] Chạy tay: <bước → kết quả mong đợi>
### Tài liệu (CONVENTIONS §6)
- [ ] Spec → implemented + mục Cài đặt
- [ ] ARCHITECTURE: <mục cần cập nhật | không cần>
- [ ] `node tools/check-docs.mjs`

## Rủi ro / bẫy liên quan
- <bẫy §6.n của ARCHITECTURE>

## Câu hỏi mở
- [ ] …
