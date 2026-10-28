---
name: plan
description: Lập kế hoạch kỹ thuật dạng checklist cho một việc từ spec và code hiện có — tìm mẫu tham chiếu, phân tích ảnh hưởng, ghi projects/<p>/work/<ngày>-<slug>/plan.md. Dùng khi user gõ `/plan <slug>`, hoặc nói "lập plan", "cần sửa những file nào cho…".
---

# /plan <slug> [spec]

Mục tiêu: `work/<YYYY-MM-DD>-<slug>/plan.md` đủ chi tiết để `/build` làm tuần tự và làm tiếp được nếu bị ngắt giữa chừng. Đọc `.claude/kit/CONVENTIONS.md`.

## 1. Nạp ngữ cảnh

- Xác định dự án (CONVENTIONS §1). Tìm thư mục việc `work/*-<slug>/`, chưa có thì tạo với ngày hôm nay.
- Spec: tham số `[spec]` hoặc `grep -rl "Việc: <slug>" projects/<p>/specs/`.
  - Không có spec, hoặc spec còn `draft`: đề xuất chạy `/spec` trước.
  - Việc nhỏ (refactor, sửa cấu hình) mà user muốn bỏ qua spec thì ghi lý do vào `notes.md`.
- `projects/<p>/CLAUDE.md` (lệnh) và ARCHITECTURE của repo: §5 luật, §6 bẫy, §8 checklist.

## 2. Mẫu tham chiếu

Tìm 1–2 tính năng **đã có** giống nhất về hình dạng (cùng loại endpoint, cùng kiểu màn hình, cùng kiểu ghi dữ liệu) và đọc trọn luồng của chúng. Code mới phải đi theo mẫu đó về cấu trúc, đặt tên, cách validate, cách báo lỗi và cách test. Ghi vào mục "Mẫu tham chiếu" kèm `file:line`.

## 3. Phân tích ảnh hưởng

- Liệt kê các hàm hoặc module dùng chung sẽ bị sửa và **mọi nơi gọi** chúng (`grep` tên hàm).
- Từ các file sẽ chạm, tìm spec liên quan: `grep -rn "<tên file>" projects/<p>/specs/`. Ghi những UC/BR có thể bị ảnh hưởng, kể cả UC khác.
- Có đổi dữ liệu hay schema: ghi dữ liệu mẫu hoặc seed cần cập nhật.

## 4. Khảo sát và viết plan

- Mỗi BR/SC phải có chỗ cài đặt cụ thể, kèm `file:line` thật. Không đoán đường dẫn.
- Viết theo `.claude/kit/templates/plan.md`. Mỗi checkbox là một việc nhỏ có kiểm tra được, ghi rõ file và trích BR/SC.
- Mục "Kiểm tra" phải có test cho từng scenario logic, và các bước chạy tay cho UI.
- Mục "Tài liệu" theo CONVENTIONS §6, nói rõ phần nào của ARCHITECTURE cần cập nhật.
- Chạm vào chỗ có bẫy trong §6 của ARCHITECTURE thì ghi bẫy đó vào mục "Rủi ro".
- Việc chạm ≥ 3 repo: chia sub-agent khảo sát mỗi repo song song. Còn lại thì tự đọc.

## 5. Dừng

In tóm tắt: số việc, file bị chạm, ảnh hưởng ngoài phạm vi, rủi ro, câu hỏi mở. Chờ user duyệt rồi mới chuyển sang `/build`.

Plan đã có sẵn thì cập nhật, giữ nguyên các mục đã `[x]`.
