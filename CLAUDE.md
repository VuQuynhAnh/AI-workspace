# AI workspace

Workspace chứa **khung AI dùng lại được** (`.claude/`, `tools/`) và các **dự án độc lập** trong `projects/<p>/`.
Quy ước chung: `.claude/kit/CONVENTIONS.md`. Đọc file này trước khi chạy bất kỳ skill nào.

## Dự án

| Dự án | Mô tả | Bản đồ |
|---|---|---|
| `smartclocking` | Chấm công, bảng lương, trợ lý AI hỏi đáp quy chế (Node/Express + React) | `projects/smartclocking/CLAUDE.md` |

Khi làm việc trong một dự án, đọc `projects/<p>/CLAUDE.md`, rồi tới ARCHITECTURE của repo đang sửa. Các dự án không đọc chéo nhau.

## Luồng làm việc

| Lệnh | Việc |
|---|---|
| `/onboard <p> [repo-url\|path]` | Tạo dự án mới hoặc thêm repo: submodule, ARCHITECTURE, domain spec, glossary |
| `/spec <p> <ý tưởng\|UC>` | Làm rõ yêu cầu (hỏi đáp), viết hoặc sửa spec UC |
| `/plan <slug>` | Spec + code → `work/<ngày>-<slug>/plan.md` (checklist) |
| `/build <slug>` | Làm theo plan bằng TDD, đánh dấu checkbox, cập nhật tài liệu |
| `/review [slug]` | Review diff theo spec và luật `R-*` → `review.md` |
| `/fix-bug <p> <mô tả>` | Tái hiện → nguyên nhân gốc → sửa → test hồi quy |
| `/track [slug] [commit]` | Việc còn thiếu gì, lệnh nào chạy tiếp; `commit` = commit trọn việc |
| `/reverse <p> <tính năng>` | Code có sẵn → spec `as-built`, xác minh độc lập |

Luồng chuẩn: `/spec` → `/plan` → `/build` → `/review` → `/track <slug> commit`.

## Luật chung (chi tiết ở CONVENTIONS)

- Không đoán: tên hàm, đường dẫn và `file:line` đều phải đọc tận mắt. Báo kết quả kiểm tra thật.
- Comment giải thích nghiệp vụ và lý do. Không ghi slug việc hay mã ticket trong code.
- Một việc chỉ xong khi tài liệu cũng xong (CONVENTIONS §6) và `node tools/check-docs.mjs` sạch.
- Không commit hay push khi chưa được yêu cầu. Repo con commit trước, workspace commit con trỏ submodule sau.
- Không đọc hay ghi `.env` và secret. Lệnh phá dữ liệu (reset DB…) phải hỏi trước.
- Đổi khung (`.claude/`, `tools/`) thì giữ khung chung cho mọi dự án, không đưa chi tiết của dự án nào vào.
