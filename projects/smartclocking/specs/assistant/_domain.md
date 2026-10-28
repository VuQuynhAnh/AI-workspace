# Domain: Trợ lý AI & quy chế (AI)

> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/` (tên file ngắn: tìm trong repo).

Rút từ code (*as-built*).

| ID | Rule | Code |
|---|---|---|
| AI-BR-001 | Chatbot chỉ trả lời dựa trên văn bản quy chế **của cửa hàng người hỏi**, lấy top 5 đoạn gần nghĩa nhất | `assistant.service.js:13`, `:84-85` |
| AI-BR-002 | Không có tài liệu liên quan thì nói rõ là không tìm thấy, không suy đoán | `assistant.service.js:44-48` |
| AI-BR-003 | Câu trả lời liệt kê tài liệu nguồn. Người dùng tải được file gốc của nguồn | `assistant.service.js:26-30` |
| AI-BR-004 | Câu hỏi khớp tài liệu nhạy cảm (cosine ≥ 0.72): không tự trả lời, nội dung nhạy cảm không gửi ra Gemini, hội thoại gắn cờ chờ admin | `assistant.service.js:20`, `:150` |
| AI-BR-005 | Câu hỏi về số liệu cá nhân (lương, đi muộn) được trả lời từ số liệu hệ thống. Gemini chỉ diễn đạt lại, Gemini lỗi thì trả số liệu thô | `assistant.service.js:91-109` |
| AI-BR-006 | Tài liệu nhạy cảm chỉ admin xem hoặc tải được | `regulationDocument.service.js:12-13` |
| AI-BR-007 | Upload trả về ngay. Trích xuất text và tạo embedding chạy nền: processing → ready / failed | `regulationDocument.service.js:49-50` |
| AI-BR-008 | Mỗi nhân viên có 1 đoạn chat đang hoạt động. Xoá là xoá mềm | `conversation.model.js:77-81` |
