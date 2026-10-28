# AI workspace

Một **khung AI dùng lại được** cho Claude Code, cộng với các dự án độc lập được quản lý bằng khung đó.
Mục tiêu của khung: code chính xác (mọi `file:line` đều đọc tận mắt, có TDD, báo kết quả kiểm tra thật) và tài liệu đầy đủ (spec, ARCHITECTURE và glossary được cập nhật cùng code, có script kiểm tra).

## Hai tầng

| Tầng | Nằm ở | Nội dung |
|---|---|---|
| **Khung** (dùng chung) | `.claude/`, `tools/`, `CLAUDE.md` | Skill, hook, quy ước (`.claude/kit/CONVENTIONS.md`), template, `tools/check-docs.mjs` |
| **Dự án** (riêng) | `projects/<p>/` | Repo (submodule), ARCHITECTURE, spec, glossary, `work/` theo từng việc |

```
.claude/kit/CONVENTIONS.md     quy ước chung: việc, spec, comment, định nghĩa "xong", bảo trì tri thức
.claude/kit/templates/         CLAUDE dự án · ARCHITECTURE · UC · domain · glossary · plan · review · bug
.claude/skills/                onboard · spec · plan · build · review · fix-bug · track · reverse
.claude/hooks/                 protected-files-guard · pii-guard · session-context
tools/check-docs.mjs           ngân sách kích thước + kiểm tra file:line + cảnh báo tài liệu cũ
projects/<p>/                  CLAUDE.md · repos/ · architecture/ · specs/ · work/ · sql/ · protected.json
```

## Dùng hằng ngày

```
/spec smartclocking "nhân viên xin nghỉ phép"   → hỏi đáp làm rõ → specs/…/<UC>.md (duyệt)
/plan nghi-phep                                 → work/<ngày>-nghi-phep/plan.md (duyệt)
/build nghi-phep                                → code + test (TDD) + cập nhật tài liệu
/review nghi-phep                               → review.md, đề xuất luật/bẫy mới
/track nghi-phep commit                         → commit repo con, sau đó workspace
/fix-bug smartclocking "lương tháng 9 lệch 1 ngày"
/track                                          → các việc đang dở
```

## Thêm dự án hoặc thêm repo vào workspace này

```
/onboard <tên-dự-án> <git-url | đường dẫn local>
```

Skill sẽ thêm repo dưới dạng submodule, khảo sát code, viết ARCHITECTURE (luật `R-*`, bẫy, `file:line` thật), `CLAUDE.md` của dự án, domain spec và glossary, rồi chạy `check-docs`. Gọi `/onboard` lần nữa với cùng tên dự án để thêm repo thứ hai (backend, mobile…) vào dự án đó.

## Mang khung sang workspace mới

1. Tạo repo mới, chép `.claude/`, `tools/`, `CLAUDE.md`, `README.md`, `.gitignore`. **Không** chép `projects/`.
2. Trong `CLAUDE.md`, xoá các dòng ở bảng "Dự án".
3. Mở Claude Code ở gốc repo mới và dán prompt:

> Đọc `CLAUDE.md` và `.claude/kit/CONVENTIONS.md`. Chạy `/onboard <tên-dự-án> <git-url>` cho repo này. Khảo sát kỹ, mọi `file:line` phải đọc tận mắt. Viết ARCHITECTURE với luật `R-*` rút từ những gì code đang làm nhất quán, kèm các bẫy chỉ lộ khi chạy. Liệt kê những chỗ code đang lệch luật của chính nó, không sửa code. Xong thì chạy `node tools/check-docs.mjs` và đề xuất 3 tính năng nên `/reverse` trước tiên.

## Bảo trì

- `node tools/check-docs.mjs` (thêm `--strict` để coi cảnh báo là lỗi) báo các vấn đề sau:
  - `file:line` trỏ sai.
  - File được trích đã đổi kể từ commit ghi trong tài liệu.
  - File AI vượt ngân sách kích thước.
- Kéo commit mới của repo con: `git submodule update --remote projects/<p>/repos/<repo>`, chạy `check-docs`, đối chiếu lại các cảnh báo rồi cập nhật `Kiểm ở commit`.
- Sửa khung thì giữ cho nó chung: chi tiết của dự án nào ghi vào `projects/<p>/`.
