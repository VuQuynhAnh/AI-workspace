---
name: review
description: Review thay đổi trong repo của dự án theo spec, luật R-* và định nghĩa "xong" về tài liệu; ghi work/<…>/review.md (Blocker/Major/Minor) và đề xuất bổ sung luật/bẫy vào ARCHITECTURE. Dùng khi user gõ `/review [slug]`, hoặc nói "review code", "soát lại thay đổi…".
---

# /review [slug]

Mục tiêu: danh sách phát hiện **đã được xác nhận**, mỗi mục có `file:line`, căn cứ (`R-*` hoặc BR/SC) và một kịch bản lỗi cụ thể.

## Xác định phạm vi

- Dự án và repo: theo CONVENTIONS §1. `slug` lấy từ tham số hoặc từ tên branch (`feat/<slug>`, `fix/<slug>`).
- Diff: `git -C <repo> diff <nhánh chính>...HEAD`, cộng `git -C <repo> diff HEAD`, cộng file mới trong `status --porcelain`. User chỉ định phạm vi khác thì theo user.
- Căn cứ để đối chiếu: plan và spec của việc, ARCHITECTURE (§5 luật, §6 bẫy), `.claude/kit/CONVENTIONS.md`.

## Soát theo thứ tự

1. **Đúng spec:** mỗi BR/SC có code và test tương ứng không? Có code nào làm thêm điều spec không yêu cầu không?
2. **Bảo mật và phân quyền:** auth/role ở server, cô lập tenant, không lộ dữ liệu nhạy cảm hay secret.
3. **Toàn vẹn dữ liệu:** transaction, đồng thời, xoá mềm, ràng buộc, múi giờ và kiểu ngày, dữ liệu đã khoá.
4. **Từng bẫy trong §6** có liên quan tới diff.
5. **Luật `R-*`** về layer, DI, cache, đồng bộ hằng số.
6. **Test:** có test cho mọi logic mới, test có `// SC:`. Chạy test để xác nhận test pass thật.
7. **Comment:** comment giải thích nghiệp vụ, không có slug hay mã ticket, không comment thừa (CONVENTIONS §5).
8. **Tài liệu:** đủ định nghĩa "xong" ở CONVENTIONS §6. Chạy `node tools/check-docs.mjs`.

Với mỗi nghi vấn, **đọc code để xác nhận** trước khi ghi. Không xác nhận được thì ghi `(cần kiểm tra)` và không xếp vào Blocker.

## Mức độ

- **Blocker:** sai dữ liệu hoặc tiền, lộ dữ liệu giữa tenant hoặc dữ liệu nhạy cảm, crash, mất dữ liệu.
- **Major:** sai BR/SC, thiếu kiểm tra quyền phía server, cache cũ, thiếu test cho logic, thiếu tài liệu bắt buộc.
- **Minor:** layer, phong cách, đặt tên, comment.

## Output

`work/<…>/review.md` theo `.claude/kit/templates/review.md`. Review lần sau thì thêm một mục mới có ngày, giữ lại lịch sử cũ.

## Bổ sung tri thức

Một lỗi xuất hiện ≥ 2 lần, hoặc một lỗi chỉ lộ khi chạy: đề xuất luật `R-*` mới hoặc một mục bẫy cho ARCHITECTURE, ghi vào mục "Đề xuất bổ sung tri thức". **Chỉ ghi vào ARCHITECTURE khi user đồng ý.**

## Sau khi ghi

In số lượng theo từng mức và các Blocker. Hỏi user trước khi tự sửa. Được đồng ý thì sửa và đánh `[x]` cho mục đã xử lý.
