# CLK-UC03 — Admin xem bảng công và sửa giờ chấm công

> Trạng thái: as-built · Việc: — · Cập nhật: 2026-10-28
> Kiểm ở commit `eb82f95`. Đường dẫn tính từ `repos/smartclocking/`.

## Mục tiêu
Admin cửa hàng theo dõi công của mọi người trong cửa hàng theo tuần hoặc tháng, xem chi tiết từng lần chấm (kèm vị trí), và sửa giờ vào/ra khi nhân viên quên chấm hoặc chấm sai. Mọi thay đổi được giữ lại thành nhật ký, không ghi đè dữ liệu gốc. Tháng đã chốt lương thì không sửa được nữa.

## Phạm vi
- Vai trò: `admin` cửa hàng.
- Màn hình:
  - `/admin/clockings`: bảng công theo tuần (mặc định) hoặc tháng.
  - Hộp thoại chi tiết ngày.
- API:
  - `GET /api/hr/clockings/overview`
  - `GET /api/hr/clockings/day`
  - `POST /api/hr/clockings/day-edit`
- Ngoài phạm vi:
  - Nhân viên tự chấm (CLK-UC01).
  - Bảng lương (PAY-UC01).
  - Cách tính phút làm, muộn, sớm (PAY-BR-001..005).

## Quy tắc nghiệp vụ

**Áp dụng rule domain:**
- CLK-BR-002: 1 dòng công mỗi ngày, chụp giờ ca.
- CLK-BR-009: tháng đã chốt lương thì khoá sửa giờ.
- CLK-BR-010: lần chấm không sửa, không xoá; sửa = huỷ lần cũ + thêm lần mới.
- STORE-BR-001: chỉ thấy dữ liệu cửa hàng mình.

**Rule riêng của UC:**
- **BR-1:** Bảng công xem theo tháng (`YYYY-MM`) hoặc theo khoảng ngày `from`–`to`. Khoảng ngày phải hợp lệ, `from` ≤ `to`, tối đa 31 ngày. Không truyền gì thì lấy tháng hiện tại theo giờ VN.
- **BR-2:** Bảng công có mỗi người một dòng: gồm mọi người đang làm của cửa hàng (cả admin), cộng với người đã nghỉ nhưng có công trong kỳ (PAY-BR-012).
  - Mỗi dòng có tổng phút làm, tổng phút muộn và tổng phút về sớm.
  - Mỗi ngày có chấm công là một ô.
  - Ngày không có lần chấm hợp lệ nào thì không hiện.
- **BR-3:** Màu ô trong bảng công:

  | Tình trạng | Màu |
  |---|---|
  | Thiếu check-out (của ngày trước hôm nay) | Đỏ |
  | Thiếu check-out, ngày hôm nay | Xanh dương ("đang làm") |
  | Có muộn hoặc sớm | Vàng |
  | Đủ công | Xanh lá |

- **BR-4:** Bảng công báo những tháng trong kỳ đã chốt lương. Một tuần có thể vắt qua 2 tháng, mỗi tháng xét chốt riêng.
- **BR-5:** Chi tiết ngày gồm:
  - Tổng hợp của ngày.
  - Toàn bộ lịch sử chấm, **kể cả các lần đã huỷ**, có vị trí GPS, khoảng cách, IP, tên người tạo và người huỷ.
  - Vị trí cửa hàng và bán kính (nếu cửa hàng đã đặt).
  - Cờ "đã chốt lương".

  Nhân viên phải thuộc cửa hàng của admin: id sai thì 400 "employeeId không hợp lệ.", không thuộc cửa hàng thì 404 "Không tìm thấy nhân viên."
- **BR-6:** Nhật ký thay đổi trong chi tiết ngày được xếp theo **thời điểm ghi nhận**, mới nhất trước. Mỗi dòng có trạng thái, hình thức và nội dung:

  | Ai làm gì | Trạng thái | Hình thức |
  |---|---|---|
  | Nhân viên tự chấm | "Chấm công vào" / "Chấm công ra" | "Chấm công QR" / "Chấm công Wi-Fi" (kèm vị trí) |
  | Admin thêm giờ còn thiếu | "Thêm giờ vào" / "Thêm giờ ra" / "Thêm giờ vào và ra" | "Thủ công" (kèm tên admin) |
  | Admin sửa giờ đã có | "Sửa giờ vào" / "Sửa giờ ra" / "Sửa giờ vào và ra" | "Điều chỉnh" (kèm tên admin) |
  | Admin xoá chấm công | "Xoá chấm công" | "Điều chỉnh" |

  - Nội dung ghi giờ đã đổi so với ca, vd "Giờ vào: 07:00, làm thêm trước ca: 1 giờ 0 phút", hoặc "đi muộn" / "về sớm" / "làm thêm sau ca". Giờ chưa có ghi `--:--`.
  - Các lần admin ghi trong cùng một lần "Lưu" được gộp thành 1 dòng.
- **BR-7:** Admin sửa giờ vào và/hoặc giờ ra của **một ngày** (giờ dạng `HH:MM`, theo giờ VN của ngày đó):
  - Giờ vào mới thay **lần check-in hợp lệ đầu tiên**. Giờ ra mới thay **lần check-out hợp lệ cuối cùng**. Các lần check-out khác trong ngày vẫn giữ hiệu lực (xem câu hỏi mở về bug B1).
  - Lần bị thay chuyển sang trạng thái huỷ, ghi lại ai huỷ và lúc nào. Lần mới có `source = admin`, trỏ về lần cũ.
  - Chưa có lần cũ thì chỉ thêm mới ("Thêm"). Có lần cũ thì vừa huỷ vừa thêm ("Sửa").
  - Giờ mới trùng phút với giờ hiện có thì không tính là thay đổi.
- **BR-8:** Điều kiện khi sửa giờ (chặn bằng 400):

  | Điều kiện | Thông báo |
  |---|---|
  | Giờ không đúng dạng `HH:MM` | "Giờ phải dạng HH:MM." |
  | Không có gì thay đổi | "Không có thay đổi." |
  | Giờ đặt sau thời điểm hiện tại hơn 1 phút | "Không thể đặt giờ trong tương lai." |
  | Giờ ra (sau khi áp thay đổi) không sau giờ vào | "Giờ ra phải sau giờ vào." (một ngày không vắt qua nửa đêm) |

- **BR-9:** **Xoá chấm công** của một ngày (giao diện: bỏ trống cả giờ vào lẫn giờ ra rồi xác nhận):
  - Huỷ **mọi** lần chấm còn hiệu lực của ngày, để nhân viên chấm lại từ đầu.
  - Các lần đã huỷ vẫn nằm trong lịch sử.
  - Ngày chưa có lần chấm nào: 400 "Ngày này chưa có lần chấm công nào để xoá."
  - Giao diện hỏi xác nhận "Xoá chấm công ngày dd/mm/yyyy của <tên>?" trước khi gửi.
- **BR-10:** Không xoá riêng được một bên giờ vào hoặc giờ ra. Bỏ trống một ô thì giữ nguyên giờ hiện có ở ô đó. Muốn bỏ hẳn thì phải xoá cả ngày (BR-9).
- **BR-11:** Mỗi lần sửa hoặc xoá đều tính lại tổng hợp công của ngày. Ngày chưa có dòng công thì tạo mới, chụp **giờ ca hiện tại** của cửa hàng.
- **BR-12:** Tháng đã chốt lương:
  - Giao diện hiện nhãn "Đã chốt lương" thay cho nút "Chỉnh sửa".
  - Server vẫn chặn: 403 `MONTH_LOCKED` "Bảng lương tháng này đã chốt, không thể chỉnh sửa chấm công."
- **BR-13:** Bảng công chỉ được cache khi **mọi** tháng trong kỳ đã chốt lương (1 giờ, theo cửa hàng). Kỳ còn tháng chưa chốt thì luôn đọc mới.
- **BR-14:** Lần chấm do admin thêm không có vị trí, hình thức hay IP, và không bị coi là ngoài phạm vi. Khi lần chấm cũ bị gắn cờ "ngoài phạm vi" được thay bằng lần của admin, cờ ngoài phạm vi của ngày đó mất đi.
- **BR-15:** Giao diện không cho chuyển sang tuần hoặc tháng trong tương lai. Server thì không chặn: gọi API vẫn xem được kỳ tương lai.

## Scenario
```gherkin
Scenario: CLK-UC03-SC1 Xem bảng công tuần
  Given admin cửa hàng A
  When mở /admin/clockings
  Then thấy bảng công tuần hiện tại, mỗi người một dòng, mỗi ngày có công là một ô tô màu theo tình trạng

Scenario: CLK-UC03-SC2 Khoảng ngày quá dài
  When xem bảng công từ 2026-09-01 tới 2026-10-05
  Then bị từ chối 400 "Chỉ xem tối đa 31 ngày một lần."

Scenario: CLK-UC03-SC3 Bổ sung giờ vào bị quên
  Given nhân viên chỉ có check-out 17:00 ngày 15/09
  When admin nhập giờ vào 08:00 và lưu
  Then thêm một lần chấm check-in 08:00 nguồn admin, không huỷ lần nào
  And nhật ký có dòng "Thêm giờ vào" · "Thủ công" · tên admin
  And công của ngày được tính lại thành 540 phút

Scenario: CLK-UC03-SC4 Sửa giờ ra đã chấm
  Given nhân viên check-out lúc 16:00 bằng QR
  When admin sửa giờ ra thành 17:00
  Then lần check-out 16:00 bị huỷ, giữ nguyên vị trí gốc
  And có lần check-out 17:00 nguồn admin trỏ về lần cũ
  And nhật ký có dòng "Sửa giờ ra" · "Điều chỉnh"

Scenario: CLK-UC03-SC5 Giờ ra trước giờ vào
  When admin đặt giờ vào 17:00 và giờ ra 08:00
  Then bị từ chối 400 "Giờ ra phải sau giờ vào."

Scenario: CLK-UC03-SC6 Đặt giờ trong tương lai
  When admin đặt giờ ra cho hôm nay muộn hơn hiện tại 10 phút
  Then bị từ chối 400 "Không thể đặt giờ trong tương lai."

Scenario: CLK-UC03-SC7 Lưu mà không đổi gì
  When admin lưu với giờ vào và giờ ra trùng phút với giờ hiện có
  Then bị từ chối 400 "Không có thay đổi."

Scenario: CLK-UC03-SC8 Xoá chấm công cả ngày
  Given ngày 15/09 có check-in và check-out hợp lệ
  When admin bỏ trống cả hai ô, lưu và xác nhận "Xoá chấm công"
  Then mọi lần chấm của ngày bị huỷ; nhật ký có dòng "Xoá chấm công"
  And nhân viên có thể chấm lại từ đầu

Scenario: CLK-UC03-SC9 Xoá ngày chưa có lần chấm
  Then bị từ chối 400 "Ngày này chưa có lần chấm công nào để xoá."

Scenario: CLK-UC03-SC10 Tháng đã chốt lương
  Given bảng lương tháng 09/2026 đã chốt
  When admin mở chi tiết một ngày của tháng 9
  Then thấy nhãn "Đã chốt lương", không có nút "Chỉnh sửa"
  When vẫn gửi yêu cầu sửa giờ
  Then bị từ chối 403 mã MONTH_LOCKED

Scenario: CLK-UC03-SC11 Nhân viên cửa hàng khác
  When admin cửa hàng A mở chi tiết ngày của nhân viên thuộc cửa hàng B
  Then bị từ chối 404 "Không tìm thấy nhân viên."
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| Route và quyền (admin) | `backend/src/routes/hr.routes.js:15`, `:55-65` | — |
| BR-1 | `backend/src/services/clockingManagement.service.js:29-43` | — |
| BR-2 | `backend/src/services/clockingManagement.service.js:50-77`, `backend/src/repositories/employee.repository.js:51-60` | — |
| BR-3 | `frontend/src/pages/admin/Clockings.jsx:65-70` | — |
| BR-4 | `backend/src/services/clockingManagement.service.js:47-60` | — |
| BR-5 | `backend/src/services/clockingManagement.service.js:19-24`, `:81-104`, `backend/src/repositories/clocking.repository.js:110-121` | — |
| BR-6 | `frontend/src/components/hr/DayDetail.jsx:297-371` | — |
| BR-7 | `backend/src/services/clockingManagement.service.js:150-166`, `:180-195` | — |
| BR-8 | `backend/src/services/clockingManagement.service.js:133-135`, `:167-178` | — |
| BR-9 | `backend/src/services/clockingManagement.service.js:116-132`, `frontend/src/components/hr/DayDetail.jsx:63-81` | — |
| BR-10 | `frontend/src/components/hr/DayDetail.jsx:53-60`, `backend/src/services/clockingManagement.service.js:155-166` | — |
| BR-11 | `backend/src/services/timesheet.service.js:32-58` | — |
| BR-12 | `frontend/src/components/hr/DayDetail.jsx:130-136`, `backend/src/services/timesheet.service.js:21-27` | — |
| BR-13 | `backend/src/cache/cachedServices.js:65-81` | — |
| BR-14 | `backend/src/services/clockingManagement.service.js:184-194`, `backend/src/services/payrollCalculator.js:63` | — |
| BR-15 | `frontend/src/components/hr/PeriodNav.jsx:47`, `frontend/src/components/hr/MonthNav.jsx:13` | — |

## Câu hỏi mở
- [ ] **BUG đã xác nhận (B1): sửa giờ ra có thể không có tác dụng.** Admin chỉ huỷ lần check-out **cuối cùng** (`clockingManagement.service.js:152`, `:182`). Mọi lần check-out khác vẫn còn hiệu lực, mà tổng hợp ngày lại lấy lần check-out muộn nhất còn hiệu lực (`payrollCalculator.js:37-38`).
  - Tái hiện bằng service thật và repo giả: nhân viên check-out 17:00 và 17:30, admin sửa giờ ra thành 16:00 → giờ ra vẫn là 17:00, 0 phút về sớm, không báo lỗi gì.
  - Bước kiểm tra "Giờ ra phải sau giờ vào" cũng chỉ xét lần check-out cuối.
  - Hậu quả: phút về sớm và tiền phạt bị tính sai mà admin không biết.
  - Đề xuất sửa bằng `/fix-bug`: khi sửa giờ ra thì huỷ mọi lần check-out còn hiệu lực.
- [ ] **Rủi ro đồng thời giữa sửa giờ và chốt lương:** `assertMonthEditable` đọc bảng lương mà không khoá dòng (`timesheet.service.js:21-27`), trong khi chốt lương chỉ khoá dòng bảng lương. Một lần sửa giờ đã qua kiểm tra nhưng commit **sau** khi chốt lương đọc dữ liệu thì không có trong số liệu đã chốt, và tháng đó bị khoá luôn. (Tương tự PAY-UC01.)
- [ ] **Comment trigger nói sai:** comment ghi "voided_at / voided_by chỉ được ghi đúng 1 lần", nhưng trigger chỉ chặn sửa `voided_at`. `voided_by_account_id` vẫn bị ghi đè được (`schema.sql:192-195`).
- [ ] **Lỗi từ trigger trả về 500:** lỗi do trigger DB ném ra không phải `AppError`, nên người dùng nhận 500 kèm thông báo kỹ thuật.
- [ ] **Xoá cả ngày không kiểm ngày tương lai:** kiểm tra "trong tương lai" chỉ có ở nhánh sửa giờ, không có ở nhánh xoá cả ngày (`clockingManagement.service.js:116-132`).
- [ ] **Thông báo không khớp logic:** "Ngày bắt đầu phải trước ngày kết thúc." nhưng code vẫn cho `from = to` (`clockingManagement.service.js:34`).
- [ ] **Bảng công không hiện cờ "ngoài phạm vi"** dù dữ liệu có trả về. Ngày chỉ có check-out (thiếu check-in) cũng không có cờ riêng.
- [ ] **Chưa có test** cho `clockingManagement.service`. Đây là nơi sửa dữ liệu công nên ảnh hưởng thẳng tới lương. Nên là việc tiếp theo sau nền test.
- [ ] **Ngày chưa có dòng công lấy giờ ca hiện tại:** bổ sung giờ cho một ngày cũ chưa từng chấm sẽ tạo dòng công với **giờ ca hiện tại** của cửa hàng, không phải giờ ca của ngày đó. Nếu giờ ca đã đổi, phút muộn và sớm của ngày đó tính theo ca mới (`timesheet.service.js:32-45`).
- [ ] **Admin tự sửa công của chính mình:** admin cũng chấm công và nhận lương, nhưng không có rule nào chặn admin sửa giờ hay xoá chấm công của chính mình. Có cần chặn, hoặc ít nhất cần một admin khác duyệt không?
- [ ] **Không kiểm ngày bắt đầu đi làm hay tương lai xa theo ngày:** có thể thêm công cho ngày trước `start_work_date` của nhân viên. Ngày trong tương lai chỉ bị chặn gián tiếp qua giờ.
- [ ] **Nhật ký có thể tách một lần sửa thành nhiều dòng:** khi sửa (không phải xoá), mỗi lần huỷ được gán `voided_at` riêng bằng `new Date()` của Node (`clockingManagement.service.js:182`). Lúc xoá cả ngày thì truyền chung một `voidedAt` (`:125-128`). Lần mới dùng `created_at` = `now()` của DB. Nhật ký gộp các dòng theo `created_at`, nên hiện tại vẫn đúng, nhưng phụ thuộc vào cách gộp ở giao diện.
- [ ] **Lệch R-DB-02:** các truy vấn `clocking` và `clocking_history` không lọc xoá mềm (ARCHITECTURE §6.12).
