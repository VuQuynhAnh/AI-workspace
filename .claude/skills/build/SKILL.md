---
name: build
description: Thực thi plan.md của một việc — viết code và test theo TDD trong repo của dự án, comment nghiệp vụ, đánh dấu [x] từng mục, cập nhật spec và ARCHITECTURE cho tới khi đạt định nghĩa "xong". Dùng khi user gõ `/build <slug>`, hoặc nói "làm theo plan", "tiếp tục build…".
---

# /build <slug>

Mục tiêu: mọi `- [ ]` trong `plan.md` thành `- [x]`, mỗi mục đổi ngay khi xong. Một skill dùng cho mọi stack: phần riêng của từng stack nằm trong ARCHITECTURE và `projects/<p>/CLAUDE.md`.

## Chuẩn bị

1. Đọc `.claude/kit/CONVENTIONS.md` (§4 code, §5 comment, §6 xong), `work/*-<slug>/plan.md`, `projects/<p>/CLAUDE.md` (lệnh), ARCHITECTURE của repo, và `CLAUDE.md` riêng của repo nếu có.
2. Branch trong repo con: `git -C projects/<p>/repos/<repo> status -sb`. Đang ở nhánh chính thì hỏi user có tạo `feat/<slug>` không.
3. Bỏ qua các mục đã `[x]`, làm tiếp từ mục `[ ]` đầu tiên.

## Vòng lặp cho từng mục

1. **Đọc lại** file đích và mẫu tham chiếu trong plan. Số dòng có thể đã lệch, tìm lại theo tên hàm.
2. **Test trước** cho logic nghiệp vụ (TDD). Tên test mô tả scenario, kèm `// SC: <UC>-SCn`. Viết test, chạy để thấy test **fail đúng lý do**, rồi mới viết code.
3. **Viết code** theo luật `R-*` và theo đúng phong cách của mẫu tham chiếu. Comment giải thích nghiệp vụ và lý do (CONVENTIONS §5). Không ghi slug việc vào code.
4. **Kiểm tra** bằng lệnh trong `projects/<p>/CLAUDE.md`: test, build, lint, kiểm tra import. Báo kết quả thật, fail thì dán output.
5. Đánh `[x]`. Có phát sinh thì thêm mục `[ ]` mới, ghi chú `(phát sinh)`.

## Tài liệu (bắt buộc trước khi kết thúc, CONVENTIONS §6)

- Spec → `implemented`, điền mục "Cài đặt" (BR/SC → `file:line` → test).
- ARCHITECTURE: thêm endpoint/module, mẫu mới, bẫy phát hiện được. Sửa `file:line` đang trích nếu đã lệch, rồi cập nhật `Kiểm ở commit`.
- Glossary và tài liệu API/README của repo nếu có thay đổi.
- Chạy `node tools/check-docs.mjs` cho tới khi không còn lỗi.

## Kết thúc

In ra: các mục đã xong và còn lại, từng lệnh đã chạy kèm kết quả, tài liệu đã cập nhật. Gợi ý bước tiếp theo là `/review <slug>`. **Không commit**: việc đó do `/track <slug> commit` làm.

## Dừng và hỏi user khi

- Plan mâu thuẫn với spec hoặc với luật `R-*`.
- Cần thêm dependency, script, biến môi trường, hoặc đổi file cấu hình CI.
- Cần chạy lệnh phá dữ liệu (reset DB, xoá file).
- Có lần kiểm tra thất bại mà nguyên nhân nằm ngoài phạm vi việc.

## Không làm

Không sửa file bị hook chặn. Không lách luật. Không refactor ngoài plan: thấy vấn đề thì ghi vào `notes.md`.
