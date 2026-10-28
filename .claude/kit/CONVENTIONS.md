# Quy ước của khung (dùng cho mọi dự án)

Mọi skill đều đọc file này. Phần riêng của từng dự án (stack, lệnh, luật code `R-*`) nằm trong `projects/<p>/CLAUDE.md` và `projects/<p>/architecture/`. Không ghi phần riêng đó vào đây.

## 1. Bố cục

```
.claude/  tools/                 KHUNG: skill, hook, quy ước, template, script. Không chứa gì riêng của dự án
projects/<p>/
  CLAUDE.md                      bản đồ dự án: repo, stack, lệnh, ngôn ngữ, quy ước riêng (≤ 3 KB)
  repos/<repo>/                  submodule; mỗi repo giữ lịch sử và CI riêng
  architecture/<repo>/ARCHITECTURE.md   (+ ARCHITECTURE-<TOPIC>.md khi quá 15 KB)
  specs/_glossary.yaml · specs/<domain>/_domain.md · specs/<domain>/<UC>.md
  work/<YYYY-MM-DD>-<slug>/      plan.md · review.md · bug.md · notes.md
  sql/                           script dữ liệu một lần (*.EXECUTE.sql = để chạy)
```

Các dự án hoàn toàn độc lập với nhau: skill không đọc chéo từ dự án này sang dự án khác. Mang khung sang workspace khác thì chép `.claude/`, `tools/`, `CLAUDE.md`, `README.md`, `.gitignore` và **không** chép `projects/`.

**Xác định dự án đang làm:** lấy theo tham số `<p>`. Nếu không có tham số thì lấy dự án chứa file đang mở hoặc thư mục hiện tại. Nếu chỉ có một dự án thì dùng dự án đó. Còn lại thì hỏi.

## 2. Việc (work item), không dùng ticket

- Mỗi việc là một thư mục `work/<YYYY-MM-DD>-<slug>/`. `slug` ngắn, viết thường, nối bằng gạch ngang, vd `2026-10-28-wifi-clocking`. Các skill nhận `<slug>` hoặc tên đầy đủ của thư mục.
- Branch trong repo con: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`.
- Commit theo Conventional Commits: `<type>(<scope>): <mô tả>`. `type` gồm `feat|fix|refactor|test|docs|chore`. `scope` là domain hoặc module. Mô tả viết bằng ngôn ngữ của dự án.
- **Không ghi mã việc (slug) trong code hay comment.** Liên kết code ↔ yêu cầu đi qua spec (§3).

## 3. Spec

- Một UC là một file `specs/<domain>/<PREFIX>-UC<NN>.md`, gồm PRD + BR + scenario Gherkin. Template: `.claude/kit/templates/uc.md`.
- Bảng domain và prefix nằm trong `projects/<p>/CLAUDE.md`.
- Format ID:
  - Rule riêng UC: `BR-n`, trích đầy đủ là `<UC>/BR-n`.
  - Rule domain: `<PREFIX>-BR-NNN`, đặt trong `_domain.md`. Một rule được ≥ 2 UC dùng thì chuyển lên domain.
  - Scenario: `<UC>-SCn`.
- Trạng thái:

  | Trạng thái | Nghĩa |
  |---|---|
  | `draft` | Đang viết |
  | `approved` | User đã duyệt |
  | `implemented` | Code xong, mục "Cài đặt" có `file:line` |
  | `as-built` | Rút từ code có sẵn |

- Thuật ngữ lấy từ `specs/_glossary.yaml`. Từ mới phải thêm vào glossary trước khi dùng.

## 4. Code chính xác

- Không đoán. Tên hàm, đường dẫn, `file:line` phải đọc tận mắt trước khi viết vào code hay tài liệu.
- Làm theo luật `R-*` của repo (ARCHITECTURE §Luật). Mâu thuẫn với luật thì dừng và hỏi, không lách luật.
- Logic nghiệp vụ mới phải có test (TDD khi được). Repo chưa có test runner thì làm theo mục Test trong ARCHITECTURE của repo.
- Báo kết quả kiểm tra **thật**: lệnh đã chạy, pass hay fail, output khi fail. Bước nào chưa kiểm được thì nói rõ là chưa kiểm.
- Không tự refactor ngoài phạm vi việc. Thấy vấn đề ngoài phạm vi thì ghi vào `notes.md`.

## 5. Comment

- Comment giải thích **nghiệp vụ và lý do** (vì sao, rule nào, ngoại lệ nào), viết bằng ngôn ngữ của dự án, theo mật độ và phong cách của code xung quanh.
- Hàm hay khối có rule nghiệp vụ thì comment nêu rule bằng lời. Có thể thêm ID trong ngoặc, vd `// Mỗi ngày chỉ check-in 1 lần (CLK-BR-006)`. **Không** chỉ ghi ID trần.
- Không comment lại điều code đã nói rõ. Không ghi slug việc, ngày, tên người sửa.
- Test: tên test mô tả scenario bằng ngôn ngữ dự án, kèm `// SC: <UC>-SCn`. Test hồi quy kèm `// Hồi quy: <mô tả lỗi>`.

## 6. Định nghĩa "xong" (tài liệu đầy đủ)

Một việc chỉ xong khi đủ các điều sau:
- [ ] Mọi mục trong plan đã `[x]`, kiểm tra pass (hoặc ghi rõ phần chưa kiểm được).
- [ ] Spec liên quan đã sang `implemented` và mục "Cài đặt" có `file:line`.
- [ ] ARCHITECTURE được cập nhật nếu có endpoint hoặc module mới, mẫu mới, bẫy mới, luật mới, hoặc nếu `file:line` đang được trích đã bị đổi.
- [ ] Glossary có đủ thuật ngữ mới. README hoặc tài liệu API của repo được cập nhật nếu có endpoint mới.
- [ ] `node tools/check-docs.mjs` không còn lỗi.

## 7. Bảo trì tri thức

- Đầu mỗi ARCHITECTURE và `_domain.md` ghi commit mà các `file:line` đã được kiểm (`> Kiểm ở commit <sha>`). Cập nhật lại sha sau khi đối chiếu lại.
- `tools/check-docs.mjs` báo các lỗi sau:
  - `file:line` trỏ tới file không có, hoặc dòng vượt số dòng của file.
  - File được trích đã đổi kể từ commit ghi ở đầu tài liệu.
  - File AI vượt ngân sách kích thước.
- Review phát hiện một lỗi lặp lại, hoặc một bẫy chỉ lộ khi chạy: đề xuất thêm luật `R-*` hoặc một mục "Bẫy" vào ARCHITECTURE, và chỉ ghi khi user đồng ý.

## 8. Ngân sách ngữ cảnh

| File | Giới hạn |
|---|---|
| `CLAUDE.md` gốc | ≤ 4 KB |
| `projects/<p>/CLAUDE.md` | ≤ 3 KB |
| `SKILL.md` | ≤ 8 KB |
| `CONVENTIONS.md` | ≤ 8 KB |
| `ARCHITECTURE.md` | ≤ 15 KB |

Skill chỉ đọc template khi tới bước cần dùng.
