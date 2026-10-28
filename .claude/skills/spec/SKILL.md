---
name: spec
description: Làm rõ yêu cầu bằng hỏi đáp rồi viết mới hoặc cập nhật spec use case (PRD + BR + scenario Gherkin) trong projects/<p>/specs/<domain>/<UC>.md. Dùng khi user gõ `/spec <p> <ý tưởng|UC-ID>`, hoặc nói "viết spec cho…", "tôi muốn thêm tính năng…", "cập nhật UC…".
---

# /spec <p> <ý tưởng | UC-ID>

Mục tiêu: một file UC đúng template, được user duyệt. Đây là nguồn chuẩn cho `/plan`. Đọc `.claude/kit/CONVENTIONS.md` §3 và `projects/<p>/CLAUDE.md` (bảng domain).

## 1. Nạp ngữ cảnh

- `specs/_glossary.yaml` và `_domain.md` của domain liên quan.
- Tìm UC có sẵn: `grep -rl "<từ khoá>" projects/<p>/specs/`. Nếu đã có UC phủ cùng hành vi thì **sửa UC đó**. UC mới lấy số `NN` kế tiếp trong domain.
- Đọc hành vi hiện tại trong code: route → logic → dữ liệu → UI (ARCHITECTURE §4), ghi `file:line`.
- Nếu user đưa link Figma thì đọc thiết kế bằng Figma MCP (`get_design_context` / `get_screenshot`) và ghi các màn hình và trạng thái vào phần Phạm vi.

## 2. Làm rõ (hỏi đáp)

Khi ý tưởng còn mơ hồ, hỏi **tối đa 5 câu một lượt**, mỗi câu có sẵn phương án gợi ý để user chỉ cần chọn. Các nhóm câu hỏi:
- **Mục tiêu:** ai dùng, đo thành công bằng gì.
- **Phạm vi:** vai trò, màn hình, cái gì nằm ngoài.
- **Quy tắc:** điều kiện chặn, công thức, giới hạn, quyền.
- **Biên:** dữ liệu rỗng, trùng, đồng thời, múi giờ, dữ liệu cũ đã chốt hoặc khoá.
- **Lỗi:** thông báo gì, có cho thử lại không.

Ghi lại các quyết định. Điều chưa rõ thì đưa vào "Câu hỏi mở", không tự quyết thay user.

## 3. Viết spec

Theo `.claude/kit/templates/uc.md`:
- BR mô tả hành vi quan sát được, đánh số `BR-n`. Rule có sẵn ở `_domain.md` thì chỉ trích ID.
- Mỗi BR có ít nhất 1 scenario `<UC>-SCn`. Scenario lỗi ghi nguyên văn thông báo hoặc mã HTTP.
- Thuật ngữ đúng glossary. Từ mới thì thêm vào `_glossary.yaml`.
- Đầu file: `Trạng thái: draft · Việc: <slug nếu có> · Cập nhật: <hôm nay>`.

## 4. Tự review theo 3 vai, sửa ngay chỗ thiếu

- **PO:** đúng mục tiêu? phạm vi và phần ngoài phạm vi rõ ràng?
- **Dev:** mỗi BR có làm được không? có đụng luật `R-*` không? có cần đổi schema không? có phá rule domain nào không?
- **QA:** đã đủ scenario cho biên, quyền, tenant và dữ liệu đã khoá chưa? mỗi scenario có kiểm chứng được không?

BR mà UC khác cũng dùng thì nâng lên `_domain.md`.

## 5. Dừng

In tóm tắt: số BR, số SC, quyết định đã chốt, câu hỏi mở. Hỏi user duyệt. Khi được duyệt thì đổi `Trạng thái: approved`, và gợi ý bước tiếp là `/plan <slug>`.

## Không làm

Không viết code. Không tách `.feature` ra file riêng. Không ghi chi tiết cài đặt vào BR (`file:line` chỉ dùng để tham chiếu).
