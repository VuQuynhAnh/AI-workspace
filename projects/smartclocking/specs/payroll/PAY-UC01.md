# PAY-UC01 — Vòng đời bảng lương tháng

> Trạng thái: as-built · Việc: — · Cập nhật: 2026-10-28
> Kiểm ở commit `eb82f95`. Đường dẫn tính từ `repos/smartclocking/`.

## Mục tiêu
Admin cửa hàng lập bảng lương tháng từ dữ liệu chấm công, lương giờ và mức phạt; tính lại khi dữ liệu đổi; chốt để đóng băng số liệu và khoá chấm công của tháng; huỷ khi cần làm lại; xuất bảng lương và phiếu lương từng người. Nhân viên thấy số lương lấy từ bảng lương, hoặc lương tạm tính khi tháng chưa có bảng.

## Phạm vi
- Vai trò:
  - `admin` cửa hàng: thao tác bảng lương.
  - Nhân viên: chỉ xem số của mình qua CLK-UC02 hoặc chatbot.
- Màn hình: `/admin/paysheets` (bảng lương theo tháng, chi tiết từng người, phiếu lương).
- API:
  - `GET /api/hr/paysheets?month=`
  - `POST /api/hr/paysheets`
  - `POST /api/hr/paysheets/:id/recalculate`
  - `POST /api/hr/paysheets/:id/finalize`
  - `POST /api/hr/paysheets/:id/cancel`
  - `GET /api/hr/paysheets/:id/export`
- Ngoài phạm vi:
  - Công thức tính công và lương (PAY-BR-001..005).
  - Sửa giờ chấm công (CLK-UC03).

## Quy tắc nghiệp vụ

**Áp dụng rule domain:**
- PAY-BR-003, PAY-BR-004: công thức lương, thực nhận không âm.
- PAY-BR-006: tối đa 1 bảng chưa huỷ mỗi tháng.
- PAY-BR-007: vòng đời draft → finalized, huỷ được từ cả hai.
- PAY-BR-008: chỉ chốt tháng đã kết thúc.
- PAY-BR-009: bảng đã chốt lưu lại lương giờ và mức phạt.
- PAY-BR-010: cờ "cần tính lại".
- PAY-BR-011: lương tạm tính.
- PAY-BR-012: ai có mặt trong bảng lương.
- CLK-BR-009: tháng đã chốt thì khoá chấm công.
- STORE-BR-001: chỉ thấy dữ liệu cửa hàng mình.

**Rule riêng của UC:**
- **BR-1:** Màn bảng lương của một tháng (mặc định là tháng hiện tại theo giờ VN, định dạng `YYYY-MM`) gồm:
  - Bảng đang dùng (chưa huỷ), nếu có, kèm chi tiết từng người, xếp theo tên.
  - Danh sách các bảng đã huỷ của tháng, mới nhất trước, kèm người huỷ, thời điểm huỷ và lý do.
  - Tháng đã kết thúc hay chưa.
- **BR-2:** **Tạo bảng lương:**
  - Được tạo cho tháng hiện tại hoặc các tháng trước. Tháng chưa tới: 400 "Không thể tạo bảng lương cho tháng chưa tới."
  - Bảng mới ở trạng thái nháp và được tính ngay.
  - Tháng đã có bảng chưa huỷ: 409 "Tháng này đã có bảng lương. Hãy huỷ bảng lương hiện tại trước khi tạo mới."
- **BR-3:** **Tính bảng lương** dùng dữ liệu **hiện tại**: chấm công của tháng, lương giờ hiện tại của từng người và mức phạt/phút hiện tại của cửa hàng.
  - Mỗi lần tính, các dòng chi tiết cũ bị xoá mềm rồi thêm dòng mới.
  - Tổng của bảng, mức phạt đã dùng và thời điểm tính (`calculated_at`) được cập nhật.
  - Ngày thiếu check-out của hôm nay chưa tính là thiếu.
- **BR-4:** **Tính lại** chỉ áp dụng cho bảng nháp. Bảng ở trạng thái khác: 409 "Chỉ thao tác được với bảng lương đang ở trạng thái nháp."
- **BR-5:** **Chốt lương:**
  - Chỉ cho bảng nháp (BR-4) của tháng đã kết thúc. Chưa kết thúc: 400 "Chỉ chốt được bảng lương của tháng đã kết thúc."
  - Lúc chốt, hệ thống **tự tính lại lần cuối** rồi mới đóng băng, ghi lại người chốt và thời điểm chốt.
  - Giao diện hỏi xác nhận "Chốt bảng lương … ? Sau khi chốt, số liệu không đổi nữa và chấm công tháng này bị khoá."
  - Khi tháng chưa kết thúc, nút "Chốt lương" bị vô hiệu kèm thông báo ngày bắt đầu chốt được.
- **BR-6:** **Huỷ bảng lương:**
  - Huỷ được bảng nháp hoặc bảng đã chốt. Bảng đã huỷ trước đó: 409 "Bảng lương đã được huỷ trước đó."
  - Lý do là tuỳ chọn, tối đa 500 ký tự. Hệ thống ghi lại người huỷ và thời điểm huỷ.
  - Huỷ bảng đã chốt sẽ **mở khoá chấm công** của tháng đó.
  - Sau khi huỷ, tháng đó tạo được bảng mới. Bảng đã huỷ vẫn được giữ lại để tra cứu.
- **BR-7:** **Cờ "cần tính lại"** chỉ dành cho bảng nháp. Cờ bật khi có một trong các thay đổi sau xảy ra sau `calculated_at`:
  - Dòng chấm công trong tháng được cập nhật.
  - Hồ sơ của bất kỳ nhân viên nào trong cửa hàng được cập nhật.
  - Mức phạt/phút của cửa hàng thay đổi.

  Giao diện hiện cảnh báo "Có thay đổi chấm công, lương giờ hoặc thiết lập sau lần tính gần nhất." kèm nút "Tính lại ngay".
- **BR-8:** **Xuất bảng lương CSV** (`bang-luong-YYYY-MM.csv`):
  - File UTF-8 có BOM để Excel đọc đúng, dòng ngăn cách bằng CRLF.
  - Cột: Nhân viên, Chức danh, Lương giờ, Số ngày công, Giờ làm (giờ, 2 số lẻ), Phút muộn, Phút về sớm, Lương gộp, Tiền phạt, Thực nhận.
  - Ô bắt đầu bằng `= + - @` được thêm dấu `'` phía trước để chống chèn công thức.
  - Xuất được với bảng ở mọi trạng thái, kể cả bảng đã huỷ.
- **BR-9:** **Phiếu lương từng người** (tạo ngay trên trình duyệt, không gọi API):
  - "Xuất file": CSV chi tiết từng ngày (ngày, giờ vào, giờ ra hoặc chữ "thiếu", giờ làm, muộn, sớm, lương gộp, tiền phạt, thực nhận).
  - "In / PDF": mở hộp in của trình duyệt. Trình duyệt chặn pop-up thì báo "Trình duyệt đã chặn cửa sổ in — hãy cho phép pop-up rồi thử lại."
- **BR-10:** **Lương nhân viên nhìn thấy** cho một tháng:
  - Tháng có bảng chưa huỷ **và** người đó có dòng trong bảng: lấy số của bảng, kèm trạng thái nháp hoặc đã chốt.
  - Ngược lại: lương tạm tính từ chấm công, theo lương giờ và mức phạt hiện tại (trạng thái `null`).
- **BR-11:** **Cache** (khi có Redis), theo cửa hàng:
  - Màn bảng lương chỉ được cache khi bảng **đã chốt** (1 giờ).
  - File CSV luôn được cache (1 giờ).
  - Mọi thao tác tạo, tính lại, chốt, huỷ, cùng mọi thay đổi hồ sơ nhân viên, đều xoá cache của cửa hàng.
- **BR-12:** Các thao tác ghi đều khoá dòng bảng lương trong transaction, nên hai thao tác đồng thời trên cùng một bảng chạy lần lượt.

## Scenario
```gherkin
Scenario: PAY-UC01-SC1 Tạo bảng lương nháp cho tháng đang chạy
  Given tháng 10/2026 chưa có bảng lương
  When admin bấm "Tạo bảng lương" ngày 15/10/2026
  Then bảng nháp được tạo và tính ngay theo chấm công tới thời điểm đó
  And nút "Chốt lương" bị vô hiệu, báo chốt được từ 01/11/2026

Scenario: PAY-UC01-SC2 Tạo bảng cho tháng chưa tới
  When tạo bảng lương tháng 12/2026 vào ngày 15/10/2026
  Then bị từ chối 400 "Không thể tạo bảng lương cho tháng chưa tới."

Scenario: PAY-UC01-SC3 Tạo trùng
  Given tháng 09/2026 đã có bảng nháp
  When tạo bảng lương tháng 09/2026
  Then bị từ chối 409 "Tháng này đã có bảng lương. Hãy huỷ bảng lương hiện tại trước khi tạo mới."

Scenario: PAY-UC01-SC4 Bảng nháp bị cũ sau khi sửa công
  Given bảng nháp tháng 09 tính lúc 10:00
  When admin sửa giờ một ngày tháng 09 lúc 10:30
  Then màn bảng lương hiện cảnh báo "Có thay đổi chấm công, lương giờ hoặc thiết lập sau lần tính gần nhất."
  When bấm "Tính lại ngay"
  Then số liệu được tính lại, cảnh báo biến mất

Scenario: PAY-UC01-SC5 Chốt lương tháng đã kết thúc
  Given bảng nháp tháng 09/2026, hôm nay 01/10/2026
  When admin bấm "Chốt lương" và xác nhận
  Then bảng được tính lại lần cuối rồi chuyển "Đã chốt", ghi người chốt và thời điểm
  And chấm công tháng 09 bị khoá (CLK-BR-009)

Scenario: PAY-UC01-SC6 Chốt tháng chưa kết thúc
  When gửi yêu cầu chốt bảng tháng 10/2026 vào ngày 30/10/2026
  Then bị từ chối 400 "Chỉ chốt được bảng lương của tháng đã kết thúc."

Scenario: PAY-UC01-SC7 Tính lại bảng đã chốt
  When gửi yêu cầu tính lại hoặc chốt lại một bảng đã chốt
  Then bị từ chối 409 "Chỉ thao tác được với bảng lương đang ở trạng thái nháp."

Scenario: PAY-UC01-SC8 Tăng lương sau khi chốt
  Given bảng tháng 09 đã chốt với lương giờ 30.000đ
  When admin đổi lương giờ nhân viên thành 35.000đ
  Then bảng tháng 09 vẫn giữ 30.000đ và số liệu cũ (PAY-BR-009)

Scenario: PAY-UC01-SC9 Huỷ bảng đã chốt để sửa công
  Given bảng tháng 09 đã chốt
  When admin huỷ với lý do "Sai công ngày 15"
  Then bảng chuyển "Đã huỷ", ghi người huỷ, thời điểm và lý do; vẫn hiện trong danh sách đã huỷ
  And chấm công tháng 09 được mở khoá; tạo được bảng mới cho tháng 09

Scenario: PAY-UC01-SC10 Huỷ hai lần
  When huỷ một bảng đã huỷ
  Then bị từ chối 409 "Bảng lương đã được huỷ trước đó."

Scenario: PAY-UC01-SC11 Xuất CSV an toàn
  Given nhân viên có tên bắt đầu bằng "="
  When xuất bảng lương CSV
  Then ô tên được thêm "'" phía trước; file mở bằng Excel hiển thị đúng tiếng Việt

Scenario: PAY-UC01-SC12 Bảng lương của cửa hàng khác
  When admin cửa hàng A gửi thao tác với id bảng lương của cửa hàng B
  Then bị từ chối 404 "Không tìm thấy bảng lương."

Scenario: PAY-UC01-SC13 Lương nhân viên thấy
  Given tháng 09 có bảng nháp, nhân viên X có dòng trong bảng
  Then X thấy số của bảng, trạng thái "Nháp"
  Given tháng 10 chưa có bảng
  Then X thấy lương tạm tính theo lương giờ và mức phạt hiện tại
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| Route và quyền (admin) | `backend/src/routes/hr.routes.js:15`, `:68-93` | — |
| BR-1 | `backend/src/services/paysheet.service.js:125-138`, `backend/src/repositories/paysheet.repository.js:35-43` | — |
| BR-2 | `backend/src/services/paysheet.service.js:140-165` | — |
| BR-3 | `backend/src/services/paysheet.service.js:54-96`, `backend/src/repositories/paysheet.repository.js:60-72`, `:93-99` | `payrollCalculator.test.js` |
| BR-4 | `backend/src/services/paysheet.service.js:118-122`, `:167-175` | — |
| BR-5 | `backend/src/services/paysheet.service.js:178-190`, `frontend/src/pages/admin/Paysheets.jsx:58-64`, `:96-104` | `vnTime.test.js` (tháng kết thúc) |
| BR-6 | `backend/src/services/paysheet.service.js:193-201`, `frontend/src/pages/admin/Paysheets.jsx:272-288` | — |
| BR-7 | `backend/src/services/paysheet.service.js:99-108`, `backend/src/repositories/paysheet.repository.js:138-147` | — |
| BR-8 | `backend/src/services/paysheet.service.js:25-29`, `:204-220`, `backend/src/routes/hr.routes.js:88-93` | — |
| BR-9 | `frontend/src/utils/payslip.js:18`, `:58`, `frontend/src/pages/admin/Paysheets.jsx:300-308` | — |
| BR-10 | `backend/src/services/paysheet.service.js:226-259` | — |
| BR-11 | `backend/src/cache/cachedServices.js:40-63`, `:83-88` | — |
| BR-12 | `backend/src/services/paysheet.service.js:111-116`, `backend/src/repositories/paysheet.repository.js:55-58` | — |
| PAY-BR-006 | `backend/src/db/schema.sql:230-231`, `backend/src/services/paysheet.service.js:158-161` | — |

## Câu hỏi mở
- [ ] **Rủi ro đồng thời khi chốt lương:** chốt lương chỉ khoá dòng bảng lương, không khoá dữ liệu chấm công. Trong khi đó `assertMonthEditable` của chấm công và sửa giờ đọc bảng lương mà không khoá (`timesheet.service.js:21-27`, `paysheet.repository.js:46-52`). Một lần chấm hoặc sửa giờ đã qua bước kiểm tra nhưng commit **sau** khi chốt lương đọc dữ liệu thì không có trong số liệu đã chốt, rồi tháng bị khoá luôn. Hậu quả: lương đã chốt thiếu công, mà không sửa được trừ khi huỷ bảng. Cờ "cần tính lại" cũng có thể bỏ sót trường hợp tương tự, vì `calculated_at` là thời điểm **bắt đầu** transaction.
- [ ] **Lưu thiết lập làm bảng nháp bị báo nhầm "cần tính lại":** màn Thiết lập cửa hàng luôn gửi kèm mức phạt (`frontend/src/pages/admin/StoreSetting.jsx:95`), và lệnh ghi thiết lập luôn cập nhật `updated_at` dù giá trị không đổi (`store.repository.js:71-75`). Chỉ bật/tắt Wi-Fi cũng làm mọi bảng nháp hiện cảnh báo.
- [ ] **Dữ liệu chấm công đã xoá mềm vẫn được tính lương (lỗi tiềm ẩn):** `listByStoreAndPeriod`, `listByEmployeeAndPeriod` và `findLatestUpdateInPeriod` không lọc `NOT is_deleted` (`clocking.repository.js:36-72`). Hiện chưa có luồng nào xoá mềm dòng chấm công nên chưa xảy ra.
- [ ] **Lương ngày âm, lương tháng không âm:** lương thực nhận của từng ngày có thể âm, còn thực nhận cả tháng bị chặn ở 0. Khi bị chặn, tổng các ngày trên phiếu lương khác với "Thực nhận" của tháng. Comment trong code lại ghi "tổng tháng = tổng các ngày" (`payrollCalculator.js:11-12`).
- [ ] **Hộp thoại huỷ vẫn đóng khi huỷ thất bại:** người dùng thấy thông báo lỗi nhưng mất lý do vừa nhập (`Paysheets.jsx:66-70`).
- [ ] **Bảng đã huỷ không xem được trên giao diện:** bảng đã huỷ vẫn giữ chi tiết, và API cho xuất CSV. Nhưng giao diện không có nút xem chi tiết hay xuất cho bảng đã huỷ.
- [ ] **Chưa có test** cho `paysheet.service` (vòng đời, chốt, huỷ, cờ cần tính lại). Đây là phần tiền, nên ưu tiên ngay sau `clockingManagement`.
- [ ] **Cờ "cần tính lại" báo nhầm:** cờ dựa vào `MAX(employee.updated_at)` của **cả cửa hàng** (`paysheet.repository.js:141`). Đổi số điện thoại, chức danh hay ảnh đại diện của bất kỳ ai cũng làm bảng nháp bị báo "cần tính lại", dù lương không đổi.
- [ ] **Cờ "cần tính lại" báo thiếu:** khoá hoặc mở lại tài khoản là sửa bảng `account`, không phải `employee`. Thay đổi này làm đổi danh sách người trong bảng lương (PAY-BR-012) nhưng không bật cờ.
- [ ] **Bảng đã chốt không giữ tên và chức danh:** CSV và chi tiết lấy họ tên, chức danh **hiện tại** qua join (`paysheet.repository.js:117-122`). Lương giờ và số liệu thì đã được lưu lại. Đổi tên một nhân viên sẽ làm đổi bảng lương đã chốt khi xuất lại.
- [ ] **Người được thêm sau khi tạo bảng thấy lương tạm tính:** tháng có bảng nhưng người đó chưa có dòng (chưa tính lại) thì nhân viên thấy lương tạm tính, trong khi những người khác thấy số của bảng (BR-10). Đây có phải chủ đích không?
- [ ] **Phiếu lương in không có tên cửa hàng:** `printPayslip` nhận tham số `storeName` nhưng `Paysheets.jsx:306` không truyền vào.
- [ ] **Huỷ bảng đã chốt không cần điều kiện gì:** chỉ cần một bước xác nhận, lý do cũng không bắt buộc. Với bảng đã chốt, có nên bắt buộc ghi lý do không?
- [ ] **Lệch R-DB-02:** `findInStore`, `listByMonth` và `findActiveByMonth` không lọc xoá mềm `paysheet` (`paysheet.repository.js:26-52`).
