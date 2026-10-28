---
name: fix-bug
description: Điều tra và sửa bug — tái hiện trước, tìm nguyên nhân gốc (file:line), ghi work/<ngày>-<slug>/bug.md, tạo branch fix/<slug>, sửa kèm test hồi quy và cập nhật spec/ARCHITECTURE nếu lộ ra lỗ hổng. Dùng khi user gõ `/fix-bug <p> <mô tả>`, hoặc nói "sửa lỗi…", "vì sao … sai".
---

# /fix-bug <p> <mô tả>

Đọc `.claude/kit/CONVENTIONS.md`. Tạo thư mục `work/<hôm nay>-<slug>/`, với `slug` mô tả ngắn gọn lỗi.

## 1. Tái hiện (luôn làm trước)

- Hỏi cho đủ thông tin: vai trò, màn hình hoặc API, các bước, kết quả mong đợi, kết quả thực tế, thời điểm, dữ liệu.
- Chọn cách tái hiện rẻ nhất:
  1. Test gọi thẳng hàm thuần.
  2. Test service với phụ thuộc giả.
  3. Chạy app (lệnh trong `projects/<p>/CLAUDE.md`, hoặc skill `run`). Môi trường chưa sẵn (`.env`, DB) thì nhờ user chạy.
- **Không tái hiện được** thì ghi những gì đã thử vào `bug.md` và đề xuất dừng hoặc xin thêm dữ liệu. Không sửa theo phỏng đoán.

## 2. Nguyên nhân gốc

- Lần theo luồng ở ARCHITECTURE §4. Đối chiếu với các bẫy ở §6 trước tiên.
- Chỉ ra `file:line` và **vì sao** nó sai. Phân loại:
  - Vi phạm luật `R-*` hoặc BR có sẵn → lỗi code.
  - Không có rule nào nói tới trường hợp này → spec thiếu.
- Tìm các chỗ khác có cùng mẫu lỗi bằng `grep` và liệt kê ra.

## 3. Ghi `bug.md`

Theo `.claude/kit/templates/bug.md`. Cho user xem nguyên nhân và cách sửa. **Hỏi trước khi sửa** nếu cách sửa đụng dữ liệu, schema, tiền hoặc quyền.

## 4. Sửa

- Tạo branch `fix/<slug>` trong repo con nếu đang ở nhánh chính (hỏi user).
- Viết test hồi quy **trước**, kèm `// Hồi quy: <mô tả lỗi>` (và `// SC:` nếu có scenario). Chạy để thấy test fail.
- Sửa đúng nguyên nhân gốc, phạm vi nhỏ nhất có thể, và sửa luôn các chỗ cùng mẫu nếu user đồng ý. Comment giải thích nghiệp vụ (CONVENTIONS §5).
- Chạy lại cho test pass, cộng thêm test, build và lint liên quan. Ghi kết quả thật vào `bug.md`.

## 5. Tri thức

- Spec thiếu: thêm BR và scenario vào UC (hoặc `_domain.md`), qua bước duyệt như `/spec`.
- Lỗi chỉ lộ khi chạy: đề xuất thêm một mục bẫy vào ARCHITECTURE §6.
- Chạy `node tools/check-docs.mjs`.

Không commit. Bước tiếp theo là `/review <slug>` rồi `/track <slug> commit`.
