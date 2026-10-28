---
name: reverse
description: Dựng spec từ code đã có (reverse engineering) — map code của một tính năng, trích BR kèm file:line, sinh scenario, rồi xác minh bằng sub-agent độc lập không đọc spec. Dùng khi user gõ `/reverse <p> <UC-ID|tính năng>`, hoặc nói "viết spec từ code", "tài liệu hoá tính năng … đang có".
---

# /reverse <p> <UC-ID | tính năng>

Dùng cho code đang chạy nhưng chưa có spec. Kết quả là `projects/<p>/specs/<domain>/<UC>.md` với trạng thái `as-built`. Đọc `.claude/kit/CONVENTIONS.md` §3.

## 1. Map

- Điểm vào: route hoặc handler và màn hình UI, tra theo ARCHITECTURE §2 và §4 của repo.
- Lần theo luồng: đầu vào → logic → dữ liệu (schema) → cache và dịch vụ ngoài nếu có.
- Ghi danh sách file và hàm thuộc tính năng. Phần dùng chung với tính năng khác thì chỉ ghi phần liên quan.
- Đã có UC phủ một phần trong `specs/<domain>/` thì bổ sung vào UC đó, không tạo trùng.

## 2. Extract

- Mỗi nhánh chặn hoặc ném lỗi, mỗi ràng buộc dữ liệu (CHECK, UNIQUE, trigger, validate) và mỗi công thức sinh ra một ứng viên BR, kèm `file:line`.
- Viết BR thành **hành vi quan sát được**, dùng thuật ngữ trong glossary. Thông báo lỗi chép nguyên văn vào scenario.
- Rule đã có trong `_domain.md` thì trích ID. Rule dùng chung cho ≥ 2 UC thì nâng lên domain.
- Viết theo `.claude/kit/templates/uc.md`, điền mục "Cài đặt" (BR → `file:line` → test nếu có). Đầu file ghi `Kiểm ở commit <sha>`.

## 3. Verify (sub-agent độc lập)

Gọi **một** sub-agent loại `Explore`, brief như sau:
- Đưa danh sách file và hàm ở bước 1 cùng mô tả phạm vi tính năng.
- **Không** đưa spec và **không** đưa danh sách BR. Sub-agent không được đọc `projects/<p>/specs/`.
- Yêu cầu: liệt kê mọi rule nghiệp vụ mà code thực thi (điều kiện chặn, ràng buộc, công thức, phân quyền), mỗi rule kèm `file:line`.

So khớp kết quả:
- Sub-agent thấy mà spec thiếu: bổ sung vào spec.
- Spec có mà sub-agent không thấy: đọc lại code. Không có căn cứ thì xoá BR đó, hoặc chuyển thành câu hỏi mở.

## 4. Kết thúc

- Chạy `node tools/check-docs.mjs`.
- In ra:
  - Bảng so khớp BR ↔ rule của sub-agent.
  - Số BR, số SC.
  - Các chỗ code trái luật `R-*` hoặc có vẻ là bug: ghi vào "Câu hỏi mở", **không sửa code**.
- Hỏi user có muốn nâng một số BR lên `_domain.md` không.
