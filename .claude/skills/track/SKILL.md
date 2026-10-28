---
name: track
description: Xem tiến độ một việc (hoặc mọi việc đang dở) trong workspace — đọc work/<…>/, spec, plan, review, git status, độ phủ test theo scenario, kết quả check-docs; in bảng còn thiếu và lệnh nên chạy tiếp; `commit` để commit trọn việc. Dùng khi user gõ `/track [slug] [commit]`, hoặc hỏi "việc … tới đâu rồi", "còn thiếu gì", "commit việc …".
---

# /track [slug] [commit]

Skill **chỉ đọc**, không tự chạy skill khác.

## Không có slug

Liệt kê các việc đang dở của mọi dự án: những `work/*/plan.md` còn `- [ ]`, sắp theo thời gian sửa mới nhất. In tên việc, tiến độ `x/y` và branch.

## Có slug

Thu thập:
1. `work/*-<slug>/`: có những file nào.
2. Spec có `Việc: <slug>`: trạng thái `draft`, `approved` hay `implemented`.
3. Plan: số `[x]` trên tổng số mục, 5 mục chưa xong đầu tiên.
4. Review: số mục Blocker/Major chưa `[x]`.
5. Git:
   - Repo con: `status -sb` và `log --oneline <nhánh chính>..HEAD`.
   - Workspace: `git status -s`.
6. Test theo scenario: với mỗi `<UC>-SCn` trong spec, `grep -rn "SC: <UC>-SCn"` trong repo để biết SC nào chưa có test.
7. `node tools/check-docs.mjs`: số lỗi và số cảnh báo.

In ra:

```
<slug> · <repo>@feat/<slug> · 3 commit · 5 file chưa commit
| Bước     | Trạng thái              |
| spec     | CLK-UC03 approved       |
| plan     | 7/10                    |
| review   | 1 Blocker mở            |
| test     | thiếu SC2, SC4          |
| tài liệu | check-docs: 0 lỗi, 2 cảnh báo |
Tiếp theo: 1. /build <slug> (còn 3 mục)  2. /review <slug>
```

Chỉ gợi ý những bước còn thiếu, theo thứ tự `/spec` → `/plan` → `/build` → `/review` → commit.

## Chế độ `commit`

1. Chạy chế độ xem. Nếu còn Blocker, plan chưa xong, hoặc check-docs còn lỗi thì cảnh báo và hỏi user có tiếp tục không.
2. Liệt kê file sẽ commit ở repo con và ở workspace. Kiểm tra không có `.env`, secret, file build hay dữ liệu runtime.
3. Đề xuất commit message theo Conventional Commits (`feat(<scope>): …`, viết bằng ngôn ngữ dự án, **không** chứa slug). **Chờ user duyệt.**
4. Khi được duyệt:
   - Repo con: `git add <file cụ thể>` rồi commit.
   - Workspace: `git add projects/<p>/repos/<repo> projects/<p>/specs projects/<p>/architecture projects/<p>/work/<…>` rồi commit, message `chore(<p>): <tóm tắt việc>`.
   - Kèm dòng attribution theo hướng dẫn của phiên.
5. **Không push**, trừ khi user yêu cầu. Push thì push repo con trước, workspace sau.
