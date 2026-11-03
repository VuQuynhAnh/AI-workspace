# AI workspace

Workspace chứa **khung AI dùng lại được** (`.claude/`, `tools/`) và các **dự án độc lập** trong `projects/<p>/`.
Quy ước chung: `.claude/kit/CONVENTIONS.md`. Đọc file này trước khi chạy bất kỳ skill nào.

## Dự án

| Dự án | Mô tả | Bản đồ |
|---|---|---|
| `smartclocking` | Chấm công, bảng lương, trợ lý AI hỏi đáp quy chế (Node/Express + React) | `projects/smartclocking/CLAUDE.md` |
| `goldfolio` | Sổ tài sản vàng bạc, lãi/lỗ theo giá hiện tại, nguồn giá Phú Quý (Node/Express + React, mobile-first) | `projects/goldfolio/CLAUDE.md` |

Khi làm việc trong một dự án, đọc `projects/<p>/CLAUDE.md`, rồi tới ARCHITECTURE của repo đang sửa. Các dự án không đọc chéo nhau.

## Luồng mặc định: yêu cầu → plan → đồng ý → code

User đưa yêu cầu bằng lời (không gõ lệnh) thì làm theo luồng ngắn này, không bắt user chạy từng skill:

1. **Plan ngay:** tự đọc code/spec, viết `work/<ngày>-<slug>/plan.md` và báo plan ngắn gọn trong chat: làm gì, file nào, quy tắc nghiệp vụ đổi gì, rủi ro. Yêu cầu đổi hành vi thì sửa spec luôn trong bước này (ghi rõ BR/SC đổi gì).
2. **Hỏi khi vướng:** chỉ hỏi điều user phải quyết (nghiệp vụ, dependency mới, lệnh phá dữ liệu); gom vào một lần hỏi. Điều có mặc định hợp lý thì tự chọn và nói ra.
3. **User đồng ý → code luôn:** TDD, tự review theo luật `R-*`, sửa luôn lỗi tự phát hiện, cập nhật tài liệu (CONVENTIONS §6), chạy test/lint/`check-docs`. Không tách thành các lượt `/build` → `/review` riêng.
4. **Báo kết quả:** việc đã làm, lệnh đã chạy và kết quả thật, điều còn lại cần user (vd kiểm trên máy thật). Commit chỉ khi user bảo.

Các lệnh dưới đây vẫn dùng được khi user gọi đích danh hoặc việc lớn cần làm từng bước.

## Lệnh

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

Luồng từng bước (khi cần): `/spec` → `/plan` → `/build` → `/review` → `/track <slug> commit`.

## Luật chung (chi tiết ở CONVENTIONS)

- Không đoán: tên hàm, đường dẫn và `file:line` đều phải đọc tận mắt. Báo kết quả kiểm tra thật.
- Comment giải thích nghiệp vụ và lý do. Không ghi slug việc hay mã ticket trong code.
- Một việc chỉ xong khi tài liệu cũng xong (CONVENTIONS §6) và `node tools/check-docs.mjs` sạch.
- Không commit hay push khi chưa được yêu cầu. Repo con commit trước, workspace commit con trỏ submodule sau.
- Không đọc hay ghi `.env` và secret. Lệnh phá dữ liệu (reset DB…) phải hỏi trước.
- Đổi khung (`.claude/`, `tools/`) thì giữ khung chung cho mọi dự án, không đưa chi tiết của dự án nào vào.
