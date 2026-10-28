# CLK-UC01 — Nhân viên tự chấm công (QR / Wi-Fi + GPS)

> Trạng thái: implemented · Việc: 2026-10-28-chan-ngoai-ban-kinh · Cập nhật: 2026-10-28
> Kiểm ở commit `eb82f95`. Đường dẫn tính từ `repos/smartclocking/`.

## Mục tiêu
Nhân viên (và admin cửa hàng) tự ghi nhận giờ vào/ra trên điện thoại khi đang ở cửa hàng. Mục đích là có dữ liệu công chính xác để tính lương mà quản lý không phải nhập tay. Cửa hàng được chứng minh bằng mã QR dán tại quầy, hoặc bằng Wi-Fi cửa hàng kết hợp GPS. Giờ chấm luôn do server ghi.

## Phạm vi
- Vai trò:
  - `user` (nhân viên) và `admin` cửa hàng: chấm công.
  - `superadmin`: không chấm công.
  - Trang QR là trang công khai, ai cũng mở được.
- Màn hình:
  - `/s/:storeId`: trang đích khi quét QR, công khai.
  - `/work`: màn chấm công.
- API:
  - `GET /api/clocking/store/:id` (công khai)
  - `GET /api/clocking/me/today`
  - `GET /api/clocking/me/wifi`
  - `POST /api/clocking/check`
- Ngoài phạm vi:
  - Xem lịch sử và lương theo tháng/ngày (`/work/history`, `GET /me/month`, `GET /me/day`).
  - Admin sửa giờ.
  - Ghi nhận Wi-Fi cửa hàng khi admin đăng nhập (STORE-BR-005).
  - Cách tính công và lương (PAY-BR-001..005).

## Quy tắc nghiệp vụ

**Áp dụng rule domain:** CLK-BR-001 (giờ do server ghi) · CLK-BR-002 (1 dòng công/ngày, chụp giờ ca) · CLK-BR-003 (bắt buộc GPS) · CLK-BR-004 (QR đúng cửa hàng) · CLK-BR-005 (điều kiện chấm bằng Wi-Fi) · CLK-BR-006 (check-in 1 lần/ngày, check-out luôn được) · CLK-BR-007 (cách nhau ≥ 20 giây) · CLK-BR-008 (ngoài bán kính chỉ gắn cờ) · CLK-BR-009 (khoá khi tháng đã chốt lương) · CLK-BR-011 (tài khoản hoặc cửa hàng ngừng hoạt động) · CLK-BR-012 (admin cũng chấm công) · STORE-BR-002 (cửa hàng bị khoá thì chặn mọi request).

**Rule riêng của UC:**
- **BR-1:** Trang QR công khai chỉ hiện tên và địa chỉ của cửa hàng đang hoạt động. Mã không phải UUID, cửa hàng không tồn tại hoặc đang tạm ngưng thì báo "Không tìm thấy cửa hàng."
- **BR-2:** Mở trang QR khi đã đăng nhập với vai trò `user` hoặc `admin` thì tự chuyển sang màn chấm công. Chưa đăng nhập thì hiện nút "Đăng nhập để chấm công". Sau khi đăng nhập, người dùng luôn về trang chủ theo vai trò (`user` → `/work`, `admin` → `/admin`), không quay lại cửa hàng vừa quét.
- **BR-3:** Mã QR hợp lệ là URL chứa `/s/<UUID cửa hàng>`, hoặc chỉ chứa đúng UUID. Mã khác thì báo "Mã QR này không phải mã chấm công của cửa hàng." và không gửi gì lên server.
- **BR-4:** Không gửi loại chấm công thì hệ thống tự chọn lần tiếp theo: chưa có check-in hợp lệ trong ngày thì là check-in, đã có thì là check-out. Loại khác `check_in` / `check_out` bị từ chối.
- **BR-5:** Check-out nhiều lần trong ngày đều được ghi nhận. Giờ ra là lần check-out cuối cùng (PAY-BR-001).
- **BR-6:** Mỗi lần chấm lưu lại:
  - Vị trí GPS và sai số GPS.
  - Khoảng cách tới cửa hàng (khi cửa hàng đã đặt vị trí).
  - Cờ ngoài phạm vi.
  - Mã thiết bị (tối đa 100 ký tự).
  - Hình thức (`qr` / `wifi`).
  - IP của client.
  - Tài khoản đã chấm.

  Lịch sử chấm trả cho nhân viên **không** có toạ độ, khoảng cách hay IP. Riêng kết quả kiểm tra Wi-Fi (`/me/wifi`) có trả về khoảng cách hiện tại tới cửa hàng và giới hạn cho phép.
- **BR-7:** Nút "Chấm bằng Wi-Fi" chỉ hiện khi cửa hàng bật chấm công Wi-Fi **và** server xác nhận cả hai điều kiện: đang dùng Wi-Fi cửa hàng, và điện thoại ở gần cửa hàng theo GPS gửi kèm. Không lấy được GPS thì nút không hiện. Khi bấm, server kiểm tra lại toàn bộ điều kiện (CLK-BR-005).
- **BR-8:** "Wi-Fi cửa hàng" là một IP công cộng duy nhất: IP lúc admin đăng nhập gần nhất. So khớp IPv4 theo nguyên địa chỉ, IPv6 theo prefix /64.
- **BR-9:** Khi chưa check-in, màn chấm công vẫn có nút "Check-out" (quên check-in). Ngày đó hiện cảnh báo "Thiếu check-in — báo quản lý bổ sung giờ vào".
- **BR-10:** Màn chấm công hiện các thông tin của hôm nay:
  - Giờ vào, giờ ra, giờ làm.
  - Số phút đi muộn và về sớm.
  - "Phạt tạm tính" = (phút muộn + phút về sớm) × phạt/phút hiện tại. Số này do giao diện tự tính, không làm tròn. Số chính thức nằm ở bảng lương.
  - Danh sách các lần chấm hợp lệ, có nhãn Wi-Fi, "Admin chỉnh", "Ngoài phạm vi".
- **BR-11:** Ngày làm việc là ngày theo giờ Việt Nam tại thời điểm server ghi nhận lần chấm. Check-out sau 00:00 rơi vào ngày mới, thành một lần check-out không có check-in.
- **BR-12:** Tài khoản không có hồ sơ nhân viên (hoặc hồ sơ đã xoá) thì không xem được trạng thái hôm nay, không kiểm tra được Wi-Fi và không chấm công được: 404 "Không tìm thấy hồ sơ nhân viên của tài khoản."
- **BR-14:** Khi cửa hàng **bật chặn chấm công ngoài bán kính** và đã đặt vị trí (STORE-UC01/BR-6):
  - Chấm bằng **QR** mà điện thoại ở xa cửa hàng hơn bán kính chấm công thì bị từ chối 403 "Bạn đang cách cửa hàng khoảng <n> m — chỉ được chấm công trong phạm vi <bán kính> m quanh cửa hàng. Hãy tới cửa hàng rồi chấm công lại."
  - Được trừ hao sai số GPS do điện thoại báo, tối đa 100 m, giống cách chấm Wi-Fi.
  - Lần chấm nằm trong phần trừ hao (khoảng cách thật lớn hơn bán kính) vẫn được ghi nhận và vẫn gắn cờ ngoài phạm vi (CLK-BR-008).
  - Chấm bằng **Wi-Fi** không đổi: vẫn theo giới hạn riêng (CLK-BR-005).
  - Khi tắt chặn, hoặc cửa hàng chưa đặt vị trí: giữ cách cũ, chỉ gắn cờ.
- **BR-15:** Khi bấm chấm công, app dò GPS **tối đa 3 giây** và gửi lần đọc có sai số nhỏ nhất. App dừng ngay khi sai số ≤ 50 m. Trong lúc dò, màn hình hiện "Đang dò vị trí GPS…" và các nút chấm bị vô hiệu. Không lấy được lần đọc nào thì báo lỗi GPS như cũ. Kiểm tra Wi-Fi (BR-7) cũng dò GPS theo cách này.
- **BR-13:** Ngày đã có check-out mà chưa có check-in thì vẫn check-in được. Lần check-out trước đó nằm trước giờ vào nên không được tính là giờ ra, và ngày đó trở thành "thiếu check-out" cho tới khi check-out lại.

## Scenario
```gherkin
Scenario: CLK-UC01-SC1 Check-in bằng QR tại cửa hàng
  Given nhân viên đang hoạt động của cửa hàng A, hôm nay chưa chấm công
  And đang đứng trong bán kính cửa hàng, đã bật GPS
  When quét mã QR của cửa hàng A và bấm "Check-in"
  Then lần chấm check-in được ghi với giờ của server, hình thức "qr"
  And nút chính đổi thành "Check-out"

Scenario: CLK-UC01-SC2 Không bật GPS
  When gửi chấm công mà thiếu toạ độ, hoặc toạ độ không hợp lệ
  Then bị từ chối 400 "Cần bật định vị (GPS) để chấm công."

Scenario: CLK-UC01-SC3 Quét QR của cửa hàng khác
  Given nhân viên thuộc cửa hàng A
  When quét QR của cửa hàng B
  Then bị từ chối 403 "QR này không phải cửa hàng của bạn."

Scenario: CLK-UC01-SC4 Quét mã QR lạ
  When quét một mã QR không chứa mã cửa hàng
  Then giao diện báo "Mã QR này không phải mã chấm công của cửa hàng." và không gửi lên server

Scenario: CLK-UC01-SC5 Check-in lần thứ hai trong ngày
  Given hôm nay đã có check-in hợp lệ
  When gửi chấm công loại check-in
  Then bị từ chối 409 "Hôm nay bạn đã check-in rồi — chỉ có thể check-out." kèm nextActionType = check_out

Scenario: CLK-UC01-SC6 Quên check-in, vẫn check-out
  Given hôm nay chưa check-in
  When bấm "Check-out bằng QR"
  Then lần check-out được ghi nhận, lần tiếp theo vẫn là check-in
  And màn hình báo "Thiếu check-in — báo quản lý bổ sung giờ vào"

Scenario: CLK-UC01-SC7 Bấm đúp
  Given vừa chấm công cách đây dưới 20 giây
  When gửi chấm công tiếp
  Then bị từ chối 429 "Bạn vừa chấm công xong, vui lòng đợi vài giây."

Scenario: CLK-UC01-SC8 Chấm ngoài bán kính
  Given cửa hàng đặt bán kính 100 m
  When nhân viên chấm từ vị trí cách cửa hàng 1 km bằng QR
  Then lần chấm vẫn được ghi nhận, gắn cờ "Ngoài phạm vi" cho admin xem

Scenario: CLK-UC01-SC9 Tháng đã chốt lương
  Given bảng lương của tháng hiện tại đã chốt
  When gửi chấm công
  Then bị từ chối 403 "Bảng lương tháng này đã chốt, không thể chỉnh sửa chấm công." mã MONTH_LOCKED

Scenario: CLK-UC01-SC10 Chấm bằng Wi-Fi hợp lệ
  Given cửa hàng bật chấm công Wi-Fi, đã đặt vị trí, giới hạn 200 m
  And điện thoại dùng đúng Wi-Fi cửa hàng và cách cửa hàng 50 m
  When bấm "Check-in Wi-Fi"
  Then lần chấm được ghi với hình thức "wifi", không cần quét QR

Scenario: CLK-UC01-SC11 Wi-Fi bị từ chối
  Given cửa hàng bật chấm công Wi-Fi
  Then chấm bằng Wi-Fi bị từ chối 403 khi:
    | trường hợp                    | thông báo (đoạn đầu)                                     |
    | cửa hàng chưa bật Wi-Fi       | Cửa hàng chưa bật chấm công bằng Wi-Fi.                  |
    | IP khác Wi-Fi cửa hàng        | Bạn không kết nối Wi-Fi cửa hàng.                        |
    | cửa hàng chưa đặt vị trí      | Cửa hàng chưa đặt vị trí nên chưa chấm công bằng Wi-Fi được. |
    | GPS xa hơn giới hạn           | Bạn đang cách cửa hàng khoảng <n> m — chấm công bằng Wi-Fi chỉ được trong phạm vi <max> m. |

Scenario: CLK-UC01-SC12 Trừ hao sai số GPS khi chấm Wi-Fi
  Given giới hạn Wi-Fi 200 m
  When điện thoại cách cửa hàng 250 m với sai số GPS báo 80 m
  Then được chấm (250 − 80 ≤ 200)
  When cách 350 m với sai số GPS báo 500 m
  Then bị từ chối (chỉ trừ tối đa 100 m: 350 − 100 > 200)

Scenario: CLK-UC01-SC13 Tài khoản hoặc cửa hàng ngừng hoạt động
  Given token đăng nhập vẫn còn hạn
  When tài khoản bị khoá và gửi chấm công
  Then bị chặn ngay ở mọi request: 401 "Tài khoản không còn hoạt động. Vui lòng đăng nhập lại."
  When cửa hàng bị tạm ngưng và gửi chấm công
  Then bị chặn: 403 "Cửa hàng của bạn đang tạm ngưng hoạt động. Vui lòng liên hệ nhà cung cấp." mã STORE_LOCKED
  # Lớp bảo vệ thứ hai trong service ("Tài khoản đã bị vô hiệu hoá." / "Cửa hàng đang tạm ngưng.") chỉ chạy khi gọi service trực tiếp

Scenario: CLK-UC01-SC15 Check-in sau khi đã lỡ check-out
  Given hôm nay nhân viên đã check-out lúc 07:50 mà chưa check-in
  When check-in lúc 08:00
  Then được ghi nhận; giờ ra của ngày để trống và ngày bị gắn "thiếu check-out"

Scenario: CLK-UC01-SC16 Bật chặn — chấm QR ngoài bán kính bị từ chối
  Given cửa hàng bật chặn chấm công ngoài bán kính, bán kính 100 m
  When nhân viên quét QR khi đang cách cửa hàng 1 km (sai số GPS 10 m)
  Then bị từ chối 403 "Bạn đang cách cửa hàng khoảng 1000 m — chỉ được chấm công trong phạm vi 100 m quanh cửa hàng. Hãy tới cửa hàng rồi chấm công lại."
  And không có lần chấm nào được ghi

Scenario: CLK-UC01-SC17 Bật chặn — được trừ hao sai số GPS
  Given cửa hàng bật chặn, bán kính 100 m
  When nhân viên quét QR khi cách 150 m với sai số GPS 80 m
  Then được chấm (150 − 80 ≤ 100), lần chấm vẫn gắn cờ "Ngoài phạm vi"
  When cách 250 m với sai số GPS 500 m
  Then bị từ chối (chỉ trừ tối đa 100 m: 250 − 100 > 100)

Scenario: CLK-UC01-SC18 Tắt chặn hoặc chấm bằng Wi-Fi
  Given cửa hàng tắt chặn
  When nhân viên quét QR khi cách 1 km
  Then vẫn được chấm, gắn cờ "Ngoài phạm vi"
  Given cửa hàng bật chặn và bật chấm Wi-Fi (giới hạn Wi-Fi 200 m)
  When nhân viên chấm bằng Wi-Fi khi cách 150 m
  Then được chấm (Wi-Fi không theo bán kính chấm công QR)

Scenario: CLK-UC01-SC14 Trang QR công khai
  When mở /s/<id> của cửa hàng đang hoạt động
  Then thấy tên và địa chỉ cửa hàng cùng nút "Đăng nhập để chấm công"
  When id không hợp lệ hoặc cửa hàng tạm ngưng
  Then thấy "Không tìm thấy cửa hàng."
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| Route và quyền | `backend/src/routes/clocking.routes.js:17-36` | — |
| BR-1 | `backend/src/services/clocking.service.js:30-34` | — |
| BR-2 | `frontend/src/pages/employee/StoreLanding.jsx:20-33` | — |
| BR-3 | `frontend/src/pages/employee/CheckIn.jsx:19-25`, `:77-86` | — |
| BR-4 | `backend/src/services/clocking.service.js:164-167`, `backend/src/services/timesheet.service.js:63-67` | `clocking.service.test.js` (mặc định check-in; loại lạ) |
| BR-5 | `backend/src/services/payrollCalculator.js:36-38` | `payrollCalculator.test.js` (check-out nhiều lần) |
| BR-6 | `backend/src/services/clocking.service.js:185-201`, `backend/src/services/serializers.js:80-104` | `clocking.service.test.js` (ghi IP, ngoài phạm vi) |
| BR-7 | `frontend/src/pages/employee/CheckIn.jsx:51-60`, `:156-160`; `backend/src/services/clocking.service.js:60-78` | — |
| BR-8 | `backend/src/services/storeNetwork.service.js:29-32`, `backend/src/utils/network.js:30-32` | `network.test.js` |
| SC13 (chặn ở guard) | `backend/src/middleware/accountAccess.js:22-29` | — |
| BR-9 | `frontend/src/pages/employee/CheckIn.jsx:164-181`, `:212-214` | `clocking.service.test.js` (quên check-in) |
| BR-10 | `frontend/src/pages/employee/CheckIn.jsx:126-127`, `:198-242` | — |
| BR-11 | `backend/src/services/clocking.service.js:155` | `vnTime.test.js` |
| BR-12 | `backend/src/services/clocking.service.js:23-27`, `backend/src/repositories/employee.repository.js:19-26` | — |
| BR-13 | `backend/src/services/clocking.service.js:168`, `backend/src/services/payrollCalculator.js:36-38` | `payrollCalculator.test.js` (check-out trước check-in) |
| BR-14 | `backend/src/services/clocking.service.js:80-107`, `:152-153`; `frontend/src/pages/employee/CheckIn.jsx:125`, `:193` (ghi chú phạm vi cho nhân viên) | `clocking.service.test.js` (SC16, SC17, SC18) |
| BR-15 | `frontend/src/utils/geo.js:17-53`, `frontend/src/pages/employee/CheckIn.jsx:7-10`, `:93-97`, `:184` | — (chạy tay trên điện thoại) |
| CLK-BR-001..009, 011 | xem `_domain.md` | `clocking.service.test.js` |
| SC1–SC3, SC5–SC13 | — | `clocking.service.test.js` |

## Câu hỏi mở
- [ ] **Có vẻ là bug — GPS rỗng lọt kiểm tra:** `check()` chỉ chặn `null`/`undefined`. Chuỗi rỗng `""` qua `Number("")` thành `0`, nên toạ độ (0, 0) được chấp nhận (`clocking.service.js:127-132`, đã chạy thử xác nhận). Hậu quả: chấm QR không có GPS thật vẫn được ghi, chỉ bị gắn cờ ngoài phạm vi. Trong khi đó `checkWifi` lại chặn chuỗi rỗng (`:67-68`). Khi cửa hàng bật chặn (BR-14), toạ độ (0, 0) ở rất xa nên bị chặn; khi tắt chặn thì lỗi vẫn còn.
- [ ] **Sai số GPS do client tự khai:** `accuracy` do client gửi lên được trừ hao tối đa 100 m. Khai sai số lớn thì giới hạn chấm Wi-Fi mặc định 200 m thực chất thành 300 m (`clocking.service.js:89-90`).
- [ ] **Trang QR công khai bỏ qua 2 kiểm tra:** chỉ kiểm `is_active`, không kiểm hạn dùng hay xoá mềm (`clocking.service.js:31-32`). Cửa hàng đã hết hạn vẫn hiện tên ở trang QR.
- [ ] **Lộ thông tin cho nhân viên:** `/me/today` trả nguyên thiết lập cửa hàng gồm toạ độ, bán kính, mức phạt và cấu hình Wi-Fi (`clocking.service.js:52`, `serializers.js:49-62`). Đây có phải chủ đích không?
- [ ] **Thông báo khoá tháng viết cho admin:** nhân viên chấm công vào tháng đã chốt nhận câu "…không thể chỉnh sửa chấm công." (`timesheet.service.js:23`), dễ gây khó hiểu.
- [ ] **Hai nguồn giờ trong kiểm tra chống bấm đúp:** so `Date.now()` của Node với `clock_time` lấy từ `now()` của DB (`clocking.service.js:174`). Nếu đồng hồ hai máy lệch nhau thì khoảng 20 giây cũng lệch theo.
- [ ] **QR cố định, có thể chấm từ xa:** mã QR chỉ là URL chứa UUID cửa hàng, không đổi theo thời gian. Ai có ảnh chụp QR đều chấm được từ bất kỳ đâu: GPS ngoài bán kính chỉ bị gắn cờ, không bị chặn (CLK-BR-008). Đây có phải chủ đích, chấp nhận vì admin xem cờ, không? **Đã xử lý một phần:** cửa hàng có thể bật chặn chấm QR ngoài bán kính (BR-14). Vẫn còn rủi ro giả GPS ngay trên điện thoại.
- [ ] **`qrStoreId` được lưu nhưng không ai đọc:** `StoreLanding.jsx:28` lưu id cửa hàng vào localStorage, nhưng không có code nào đọc lại. Comment nói dùng để "đưa sang đăng nhập / màn chấm công". Có thể là code thừa, hoặc tính năng làm dở.
- [ ] **Lệch R-DB-02 (đọc không lọc xoá mềm):**
  - `store.repository.js:24` (`findById`): cửa hàng đã xoá mềm nhưng `is_active` vẫn là true thì vẫn hiện ở trang QR và vẫn chấm công được.
  - `storeNetwork.repository.js:5-11` (`findLatest`).
  - `store.repository.js:55` (`findSetting`).
  - Các truy vấn trong `clocking.repository.js` (ARCHITECTURE §6.12).
- [ ] **README nói sai so với code:** mục "Quy tắc tính" của README ghi "Chỉ lưu vị trí GPS, không lưu IP", nhưng code lưu `client_ip` cho mọi lần tự chấm (`clocking.service.js:198`). README chưa được cập nhật sau khi thêm tính năng Wi-Fi.
- [ ] **Đoạn code không bao giờ chạy tới:** `timesheet.service.js` ném "Cửa hàng chưa có thiết lập." khi không có thiết lập, nhưng `findSetting` luôn trả về object kèm giá trị mặc định (`store.repository.js:54-63`).
- [ ] **Mã thiết bị chỉ để lưu:** mã thiết bị được lưu nhưng không dùng cho rule nào, kể cả việc chặn một tài khoản chấm trên nhiều máy. Có cần rule ở đây không?
