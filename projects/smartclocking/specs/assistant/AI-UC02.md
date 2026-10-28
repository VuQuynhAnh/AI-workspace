# AI-UC02 — Nhân viên hỏi đáp với trợ lý AI

> Trạng thái: as-built · Việc: — · Cập nhật: 2026-10-28
> Kiểm ở commit `008f4f7`. Đường dẫn tính từ `repos/smartclocking/`.

## Mục tiêu
Nhân viên (và admin cửa hàng) hỏi trợ lý AI về quy chế nội bộ của cửa hàng và về số liệu công/lương của chính mình, trong **một đoạn chat liên tục** giống Messenger. Trợ lý chỉ trả lời dựa trên văn bản của cửa hàng hoặc số liệu hệ thống tự tính. Câu hỏi đụng tới tài liệu nhạy cảm thì không tự trả lời mà chuyển cho admin. Nhân viên cũng có thể chủ động nhờ admin hỗ trợ.

## Phạm vi
- Vai trò:
  - `user` và `admin` cửa hàng: hỏi đáp.
  - `superadmin`: không dùng được.
- Màn hình:
  - `/chat` (toàn màn hình).
  - Ô chat nổi trong `/work`.
- API:
  - `GET /api/chat/thread`
  - `POST /api/chat/thread/ask`
  - `POST /api/chat/thread/flag`
  - `PATCH /api/chat/thread/messages/:id/feedback`
  - `DELETE /api/chat/thread`
  - `DELETE /api/chat/thread/messages/:id`
  - `GET /api/doc-files/:id/download`
- Ngoài phạm vi:
  - Admin tải lên văn bản (AI-UC01).
  - Admin trả lời trong hộp thư hỗ trợ (AI-UC03).
  - Dashboard (AI-UC04).

## Quy tắc nghiệp vụ

**Áp dụng rule domain:**
- AI-BR-001: chỉ dùng văn bản của cửa hàng người hỏi, lấy 5 đoạn gần nghĩa nhất.
- AI-BR-002: không có tài liệu liên quan thì nói không tìm thấy.
- AI-BR-003: liệt kê nguồn và tải được file gốc.
- AI-BR-004: câu hỏi nhạy cảm thì chuyển admin, không gửi nội dung tài liệu nhạy cảm ra Gemini.
- AI-BR-005: số liệu cá nhân lấy từ hệ thống.
- AI-BR-006: tài liệu nhạy cảm chỉ admin xem được.
- AI-BR-008: mỗi người một đoạn chat đang hoạt động.

**Rule riêng của UC:**
- **BR-1:** Mỗi người có đúng **một đoạn chat đang hoạt động**. Đoạn chat được tự tạo ở lần đầu dùng hoặc ngay sau khi xoá đoạn cũ. Đoạn chat lưu cửa hàng, tên và email của người hỏi, đều lấy từ phiên đăng nhập.
- **BR-2:** Tin nhắn hiện theo trang:
  - Trang mới nhất có 20 tin (tối đa 50).
  - Kéo lên đầu danh sách thì tải tiếp các tin cũ hơn.
  - Tin đã xoá không hiện.
- **BR-3:** Câu hỏi không được rỗng: 400 "Câu hỏi không được để trống." Hiện không giới hạn độ dài câu hỏi.
- **BR-4:** Cách trợ lý chọn hướng trả lời, xét theo thứ tự:
  1. **Câu hỏi về dữ liệu cá nhân.** Câu hỏi có đồng thời: một từ về công/lương (lương, chấm công, đi muộn, về sớm, phạt, check-in…), một từ tự xưng hoặc thời gian (tôi, em, mình, tháng này, hôm nay, mấy lần…), và không có từ loại trừ (hợp đồng, kỷ luật, sa thải, bảo hiểm, thuế, thưởng, của giám đốc/sếp/trưởng). Câu **nối tiếp** ngay sau một câu cá nhân cũng đi hướng này; "nối tiếp" là câu ≤ 60 ký tự hoặc có từ như "chi tiết", "từng ngày", "thì sao"…
  2. **Câu hỏi khớp tài liệu nhạy cảm.** Độ tương đồng với đoạn nhạy cảm gần nhất ≥ 0.72: không gọi Gemini để trả lời. Trả về câu cố định "Câu hỏi này liên quan tới tài liệu nội bộ thuộc diện nhạy cảm, tôi không thể tự động trả lời. Tôi đã chuyển câu hỏi này cho quản trị viên — bạn sẽ nhận được phản hồi trực tiếp trong hội thoại này.", và đoạn chat **tự gắn cờ** "cần admin trả lời".
  3. **Còn lại: trả lời theo quy chế (RAG)** từ 5 đoạn văn bản thường gần nghĩa nhất. Câu nối tiếp được ghép với câu hỏi trước rồi mới tìm.
- **BR-5:** Trả lời **câu hỏi cá nhân**:
  - Tháng được hỏi lấy từ câu hỏi ("tháng trước", "tháng 9", "tháng 9/2026"). Với câu nối tiếp thì lấy từ câu hỏi trước. Mặc định là tháng hiện tại. "Tháng N" lớn hơn tháng hiện tại mà không ghi năm thì hiểu là năm trước.
  - Tháng chưa tới, hoặc tài khoản chưa có hồ sơ nhân viên: trả lời là chưa có dữ liệu.
  - Số liệu lấy từ bảng lương nếu có, không thì là lương tạm tính (PAY-UC01/BR-10). Gemini chỉ diễn đạt lại và phải giữ nguyên các con số.
  - Câu trả lời luôn kết thúc bằng "(Số liệu từ hệ thống chấm công — tháng M/YYYY[, bảng lương nháp | , tạm tính])".
  - Gemini lỗi thì trả số liệu thô, mở đầu "Hệ thống AI đang bận nên mình gửi bạn số liệu thô từ hệ thống chấm công:".
- **BR-6:** Ngữ cảnh gửi cho Gemini gồm **6 tin nhắn gần nhất** của đoạn chat (gồm tin của nhân viên, trợ lý **và admin**), mỗi tin cắt còn 600 ký tự.
- **BR-7:** Store chưa có văn bản thường nào sẵn sàng thì trả câu cố định "Hiện chưa có văn bản nội bộ nào được nạp vào hệ thống, nên tôi chưa thể trả lời câu hỏi này. Vui lòng liên hệ quản trị viên để bổ sung tài liệu."
- **BR-8:** Nguồn trích dẫn của câu trả lời:
  - Với hướng RAG: mọi tài liệu có đoạn nằm trong top 5.
  - Với hướng cá nhân: chỉ khi câu trả lời có chữ "Nguồn:".
  - Bấm vào nguồn để tải file gốc. Tài liệu nhạy cảm, nếu có, nhân viên không tải được (AI-BR-006).
- **BR-9:** **Nhờ admin hỗ trợ** (nút "Cần admin hỗ trợ"): gắn cờ đoạn chat thủ công.
  - Gắn cờ thì cộng dồn số lần chuyển admin.
  - Đoạn chat đang chờ admin thì gắn lại không có tác dụng.
  - Đoạn chat "admin đã trả lời" thì gắn cờ lại được.
  - Mỗi lần chuyển sang trạng thái chờ, hệ thống sinh **tóm tắt hội thoại** chạy nền cho admin.
- **BR-10:** **Đánh giá câu trả lời:**
  - Giá trị "Hữu ích" hoặc "Không hữu ích", chỉ cho câu trả lời của trợ lý trong đoạn chat của chính mình.
  - Bấm lại đúng lựa chọn cũ thì huỷ đánh giá.
  - Giá trị khác: 400 "Giá trị đánh giá không hợp lệ." Không tìm thấy câu trả lời: 404 "Không tìm thấy câu trả lời cần đánh giá."
- **BR-11:** **Xoá một tin nhắn** (xoá mềm, có hỏi xác nhận):
  - Chỉ xoá được tin trong đoạn chat của chính mình.
  - ID sai: 400 "ID tin nhắn không hợp lệ." Không tìm thấy hoặc đã xoá: 404 "Không tìm thấy tin nhắn (có thể đã bị xoá trước đó)."
- **BR-12:** **Xoá cả đoạn chat** (có hỏi xác nhận): đoạn chat bị xoá mềm, và một đoạn chat trắng được tạo ngay để hỏi tiếp.
- **BR-13:** Trạng thái hiện trên đầu đoạn chat:

  | Trạng thái | Chữ hiện |
  |---|---|
  | Chờ admin | "Đang chờ admin trả lời" |
  | Admin đã trả lời | "Admin đã trả lời" |
  | Bình thường | Không hiện gì |

  Màn chat không tự cập nhật: phải tải lại trang mới thấy admin trả lời.
- **BR-14:** Chat cần MongoDB. Mongo chưa kết nối thì báo 503 "Chưa kết nối được MongoDB (dùng để lưu lịch sử hội thoại)…"
- **BR-15:** Gemini quá tải tạm thời (503) thì tự thử lại tối đa 3 lần, mỗi lần chờ lâu hơn. Vẫn lỗi thì báo "Gemini đang quá tải tạm thời (lỗi 503 - high demand), đã tự thử lại vài lần nhưng chưa được…". Riêng hướng cá nhân thì trả số liệu thô thay vì báo lỗi.

## Scenario
```gherkin
Scenario: AI-UC02-SC1 Hỏi quy chế
  Given cửa hàng A có văn bản "Quy chế nghỉ phép" (thường, đã xử lý xong)
  When nhân viên hỏi "Tôi được nghỉ phép bao nhiêu ngày một năm?"
  Then trợ lý trả lời dựa trên văn bản, cuối có "Nguồn: Quy chế nghỉ phép"
  And nguồn bấm tải được file gốc

Scenario: AI-UC02-SC2 Không dùng văn bản cửa hàng khác
  Given chỉ cửa hàng B có văn bản về nghỉ phép
  When nhân viên cửa hàng A hỏi về nghỉ phép
  Then câu trả lời không dựa trên văn bản của cửa hàng B

Scenario: AI-UC02-SC3 Câu hỏi khớp tài liệu nhạy cảm
  Given cửa hàng có văn bản nhạy cảm "Hồ sơ lương thưởng cá nhân"
  When nhân viên hỏi nội dung khớp văn bản đó (độ tương đồng ≥ 0.72)
  Then trợ lý trả câu cố định "Câu hỏi này liên quan tới tài liệu nội bộ thuộc diện nhạy cảm…"
  And không gọi Gemini để trả lời, không có nguồn
  And đoạn chat chuyển "Đang chờ admin trả lời", số lần chuyển admin tăng 1

Scenario: AI-UC02-SC4 Hỏi lương của chính mình
  Given tháng 10 chưa có bảng lương
  When nhân viên hỏi "Lương tháng này của tôi bao nhiêu?"
  Then câu trả lời dùng số liệu tạm tính của chính nhân viên
  And kết thúc bằng "(Số liệu từ hệ thống chấm công — tháng 10/2026, tạm tính)"

Scenario: AI-UC02-SC5 Câu nối tiếp sau câu hỏi lương
  Given vừa hỏi "Tháng 9 em đi muộn mấy lần?"
  When hỏi tiếp "chi tiết từng ngày được không?"
  Then trả lời bằng dữ liệu chấm công tháng 9 của chính nhân viên

Scenario: AI-UC02-SC6 Gemini lỗi khi hỏi lương
  Given Gemini không phản hồi
  When nhân viên hỏi lương tháng này
  Then nhận số liệu thô, mở đầu "Hệ thống AI đang bận nên mình gửi bạn số liệu thô từ hệ thống chấm công:"

Scenario: AI-UC02-SC7 Chưa có văn bản nào
  Given cửa hàng chưa có văn bản thường nào sẵn sàng
  When hỏi về quy chế
  Then nhận "Hiện chưa có văn bản nội bộ nào được nạp vào hệ thống…"

Scenario: AI-UC02-SC8 Câu hỏi rỗng
  When gửi câu hỏi chỉ có khoảng trắng
  Then bị từ chối 400 "Câu hỏi không được để trống."

Scenario: AI-UC02-SC9 Nhờ admin hỗ trợ
  When bấm "Cần admin hỗ trợ"
  Then đoạn chat chuyển "Đang chờ admin trả lời"; tóm tắt hội thoại được sinh nền cho admin
  When bấm lại khi đang chờ
  Then không có thay đổi

Scenario: AI-UC02-SC10 Đánh giá rồi huỷ đánh giá
  When bấm "Hữu ích" trên một câu trả lời
  Then câu trả lời được đánh giá hữu ích
  When bấm "Hữu ích" lần nữa
  Then đánh giá bị huỷ

Scenario: AI-UC02-SC11 Xoá cả đoạn chat
  When chọn "Xoá đoạn chat" và xác nhận
  Then đoạn chat cũ bị xoá mềm, màn hình trống, hỏi tiếp được ngay

Scenario: AI-UC02-SC12 Nhân viên tải tài liệu nhạy cảm
  When nhân viên gọi tải file của một văn bản nhạy cảm
  Then bị từ chối 403 "Tài liệu này thuộc diện nhạy cảm — vui lòng liên hệ trực tiếp quản trị viên để được hỗ trợ."

Scenario: AI-UC02-SC13 Superadmin mở chat
  When superadmin gọi API chat
  Then bị từ chối 403 "Bạn không có quyền truy cập chức năng này."
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| Route, quyền, Mongo | `backend/src/routes/chat.routes.js:16-41`, `backend/src/middleware/requireMongo.js:7-15` | — |
| BR-1 | `backend/src/services/chat.service.js:30-50`, `backend/src/models/conversation.model.js:79-82` | — |
| BR-2 | `backend/src/services/chat.service.js:59-73`, `:110-120` | — |
| BR-3 | `backend/src/services/chat.service.js:125-128` | — |
| BR-4 | `backend/src/services/assistant.service.js:122-175`, `backend/src/services/salaryInquiry.service.js:45-54` | — |
| BR-5 | `backend/src/services/assistant.service.js:91-113`, `backend/src/services/salaryInquiry.service.js:58-78`, `:167-177`, `:183-192` | — |
| BR-6 | `backend/src/services/chat.service.js:11`, `:134-141`, `backend/src/services/assistant.service.js:33-39` | — |
| BR-7 | `backend/src/services/assistant.service.js:164-171` | — |
| BR-8 | `backend/src/services/assistant.service.js:26-30`, `:112`, `:175`, `backend/src/services/regulationDocument.service.js:103-129` | — |
| BR-9 | `backend/src/services/chat.service.js:79-107`, `:181-185`, `backend/src/services/conversationSummary.service.js:21-41` | — |
| BR-10 | `backend/src/services/chat.service.js:191-211` | — |
| BR-11 | `backend/src/services/chat.service.js:224-233` | — |
| BR-12 | `backend/src/services/chat.service.js:216-220` | — |
| BR-13 | `frontend/src/pages/client/Chat.jsx:28-39` | — |
| BR-15 | `backend/src/providers/ai.provider.js:15-25`, `:73-101` | — |

## Câu hỏi mở
- [ ] **Vi phạm R-AI-01, nội dung về chủ đề nhạy cảm vẫn tới Gemini qua lịch sử chat:** ngữ cảnh gửi Gemini có cả tin nhắn trả lời của **admin** (`chat.service.js:140`). Admin trả lời một câu hỏi nhạy cảm trong đoạn chat, rồi nhân viên hỏi tiếp câu khác, thì câu trả lời của admin (tối đa 600 ký tự) nằm trong prompt.
- [ ] **Vi phạm R-AI-01, tóm tắt hội thoại gửi nguyên đoạn chat cho Gemini:** mỗi lần gắn cờ, kể cả khi tự gắn do câu hỏi nhạy cảm, 40 tin nhắn **cũ nhất** được gửi nguyên văn cho Gemini để tóm tắt (`chat.service.js:79-85`, `conversationSummary.service.js:10-14`). Đoạn chat đã gắn cờ trước đó thì các tin này có thể gồm cả câu trả lời nhạy cảm của admin.
- [ ] **Câu ngắn sau câu hỏi lương bỏ qua kiểm tra nhạy cảm:** hướng cá nhân được xét **trước** bước kiểm tra nhạy cảm, mà mọi câu ≤ 60 ký tự đều được coi là câu nối tiếp (`salaryInquiry.service.js:48`). Hỏi một câu nhạy cảm ngắn ngay sau câu hỏi lương thì không bị chuyển admin. Không lộ nội dung nhạy cảm, vì hướng này chỉ lấy đoạn văn bản thường, nhưng câu hỏi bị bỏ sót, không được chuyển cho admin.
- [ ] **Câu hỏi của nhân viên luôn được gửi ra ngoài:** nội dung câu hỏi luôn được gửi tới Gemini để tạo embedding, trước khi kiểm tra nhạy cảm. Đây là điều không tránh được với cách làm hiện tại, nhưng cần nêu rõ trong chính sách dữ liệu.
- [ ] **Nguồn trích dẫn có thể sai:** hướng RAG luôn lấy 5 đoạn gần nhất mà không có ngưỡng liên quan, và trích dẫn **mọi** tài liệu trong top 5, kể cả khi trợ lý trả lời "Tôi không tìm thấy quy định liên quan…" (`assistant.service.js:175`).
- [ ] **Thông báo "chưa có văn bản" sai trường hợp:** câu này cũng hiện khi cửa hàng có văn bản nhưng toàn là văn bản nhạy cảm, hoặc văn bản đang xử lý hay xử lý lỗi (`assistant.service.js:164-171`).
- [ ] **Câu hỏi mất trả lời khi Gemini lỗi:** câu hỏi được lưu trước khi gọi AI. Ở hướng RAG, nếu embedding hoặc Gemini lỗi thì câu hỏi nằm lại không có câu trả lời, API trả 500 (`chat.service.js:143-150`).
- [ ] **Không giới hạn độ dài câu hỏi và tần suất hỏi:** điều này tốn chi phí Gemini và có thể bị lạm dụng (README cũng ghi là hướng mở rộng).
- [ ] **Không tự cập nhật trạng thái:** sau khi admin trả lời, màn chat vẫn hiện "Đang chờ admin trả lời" và ẩn nút "Cần admin hỗ trợ" cho tới khi tải lại trang.
- [ ] **Xoá đoạn chat nhưng tin nhắn vẫn được tính:** các tin nhắn bên trong vẫn có `isDeleted = false` nên vẫn được tính trong số liệu dashboard. Tóm tắt dùng 40 tin **cũ nhất** thay vì mới nhất (`message.repository.js:20-22`).
- [ ] **Tham số phân trang không được kiểm:** `before` không phải ngày hợp lệ thì gây lỗi 500. `limit` âm vẫn lọt qua bước giới hạn (`chat.service.js:60`).
- [ ] **Vẫn đánh giá được tin nhắn đã xoá:** truy vấn tìm tin để đánh giá không lọc xoá mềm (`message.repository.js:24-26`), nên vẫn đánh giá được một câu trả lời đã bị xoá.
- [ ] **Thứ tự kiểm tra khi tải file:** bước kiểm "thiếu file" (404) chạy **trước** bước kiểm "nhạy cảm" (403). Vì vậy nhân viên có thể biết được một tài liệu nhạy cảm có file hay không (`regulationDocument.service.js:121-124`).
- [ ] **Tên file tiếng Việt khi tải có thể bị lỗi:** client chỉ đọc `filename=` (bản ASCII), bỏ qua `filename*=UTF-8''…` (`frontend/src/api/client.js`). Cần thử trên trình duyệt để xác nhận.
