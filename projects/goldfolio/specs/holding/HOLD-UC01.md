# HOLD-UC01 — Ghi lần mua và xem lãi/lỗ

> Trạng thái: implemented · Việc: 2026-11-03-mvp, 2026-11-03-mobile-ui, 2026-11-03-gia-tu-dong, 2026-11-05-them-tai-san · Cập nhật: 2026-11-03

## Mục tiêu
Người mua vàng bạc tích trữ (chủ yếu ở Phú Quý) ghi lại từng lần mua theo hoá đơn và luôn biết danh mục đang lãi hay lỗ bao nhiêu nếu bán lại cho cửa hàng ngay bây giờ. Thành công khi người dùng thêm được một lần mua trong dưới 1 phút và thấy ngay lãi/lỗ của lần mua đó cùng toàn danh mục.

## Phạm vi
- Vai trò: tài khoản đã đăng nhập, chỉ thao tác trên lần mua của chính mình (ACC-BR-002).
- Thiết bị chính: **điện thoại** (thiết kế mobile-first, xem `projects/goldfolio/CLAUDE.md`).
- Màn hình:
  - **"Tài sản của tôi" chia 3 tab dưới:** Tổng quan (khối tổng quan, nhóm kim loại → sản phẩm), **Biểu đồ** (biểu đồ giá), **Chi tiết** (danh sách lần mua). Tên tab đổi 2026-11-05 (trước là "Lịch sử", "Lần mua"); đường dẫn cũ `/lich-su`, `/lan-mua` tự chuyển sang `/bieu-do`, `/chi-tiet`. Nút "+" nổi để thêm.
  - **Thêm / sửa lần mua:** trang riêng toàn màn hình; trang sửa có nút "Xoá lần mua".
  - **Xoá lần mua:** bảng xác nhận trượt từ đáy màn hình.
- Phụ thuộc:
  - Đăng nhập (domain ACC).
  - Giá mua vào hiện tại và ảnh chụp giá (domain PRICE). Khi chưa có giá thì UC vẫn chạy được theo BR-9.
- Ngoài phạm vi:
  - Ghi nhận bán ra và lãi đã chốt.
  - Lọc và phân trang danh sách lần mua.
  - Nhập hoặc xuất file.
  - Thêm thương hiệu hay sản phẩm mới từ giao diện.
  - Phí, thuế ngoài số tiền trên hoá đơn.

## Quy tắc nghiệp vụ
- BR-1: Form thêm lần mua gồm các ô sau.
  - Bắt buộc: thương hiệu, sản phẩm, khối lượng + đơn vị, ngày mua, giá mua.
  - Không bắt buộc: giờ mua.
  - Không có ô ghi chú (2026-11-05: user thấy không dùng). Cột ghi chú vẫn giữ trong dữ liệu và API (tối đa 200 ký tự) cho lần mua cũ: sửa lần mua cũ thì giữ nguyên ghi chú đã có, danh sách lần mua không hiện ghi chú.
  - Ô giờ mua ẩn mặc định, ô ngày mua đứng một hàng; bấm "+ Thêm giờ mua" mới hiện ô giờ, "Bỏ giờ mua" thì xoá giờ và ẩn lại. Lần mua đang sửa có giờ, hoặc ô giờ đang báo lỗi, thì ô giờ hiện sẵn (2026-11-05: nhãn dài làm vỡ hàng trên màn nhỏ).
  - Thương hiệu mặc định là Phú Quý và đổi được (HOLD-BR-007). Sản phẩm mặc định là **Nhẫn tròn Phú Quý 999.9**; đổi thương hiệu thì sản phẩm về sản phẩm mặc định của thương hiệu đó (không có thì để trống).
  - Form thêm mới tên là **"Thêm tài sản"** và nhập được nhiều sản phẩm một lần (BR-18).
- BR-2: Sản phẩm chỉ chọn được trong danh sách sản phẩm của thương hiệu đã chọn. Đổi thương hiệu thì xoá lựa chọn sản phẩm cũ.
  - Thương hiệu đã có nguồn giá: danh sách lấy theo bảng giá mới nhất của thương hiệu.
  - Thương hiệu chưa có nguồn giá: dùng **danh sách sản phẩm nhập sẵn** (tên sản phẩm, kim loại, đơn vị niêm yết). Sản phẩm trong danh sách này hiện "Chưa có giá" cho tới khi thương hiệu có nguồn giá.
- BR-3: Khối lượng nhập theo chỉ, lượng, gram hoặc kg (HOLD-BR-002).
  - Phải lớn hơn 0 và không quá 1.000 kg. Theo **chỉ**: bước nhỏ nhất 0,1 (tối đa 1 chữ số thập phân), sai thì báo "Khối lượng nhập theo bước 0,1 chỉ". Đơn vị khác: tối đa 3 chữ số thập phân.
  - Ô khối lượng vừa chọn vừa gõ, danh sách gợi ý theo đơn vị đang chọn: chỉ 0,5 – 10 (bước 0,5); lượng 1, 2, 3, 5, 10; gram 1, 2, 5, 10, 37,5; kg 0,5, 1, 2, 5. Mặc định **0,5 chỉ** (user chốt 2026-11-05).
  - Trên màn hình, khối lượng hiển thị quy đổi ra **đơn vị niêm yết của sản phẩm** (vd vàng nhẫn: chỉ; bạc 1 lượng: lượng; bạc thỏi 1 kilo: kg), tối đa 3 chữ số thập phân, kèm đơn vị người dùng đã nhập nếu khác.
- BR-4: Ngày mua không được sau hôm nay. Nếu có nhập giờ mua thì thời điểm mua không được sau hiện tại. Mọi ngày giờ tính theo giờ Việt Nam.
- BR-5: Giá mua nhập theo **một trong hai** cách, hoặc để trống cả hai để hệ thống tự lấy (BR-16). Cách còn lại tự tính và hiển thị ngay. **Tổng tiền mua** là số được lưu và dùng để tính lãi/lỗ.
  - Theo **đơn giá** (VNĐ theo **đơn vị khối lượng đang chọn**: VNĐ/chỉ, VNĐ/lượng, VNĐ/g, VNĐ/kg; user chốt 2026-11-05): tổng tiền = đơn giá × khối lượng đã nhập, làm tròn tới đồng.
  - Theo **tổng tiền** (VNĐ, như trên hoá đơn): đơn giá = tổng tiền ÷ khối lượng đã nhập (theo đơn vị đang chọn), làm tròn tới đồng.
  - Nhãn ô đơn giá đổi theo đơn vị đang chọn, vd "Đơn giá (VNĐ/lượng)".
  - Cả hai đều phải là số nguyên lớn hơn 0 và không quá 1.000 tỷ đồng, kể cả số tự tính. Số tự tính làm tròn ra 0 thì báo "Giá mua quá nhỏ so với khối lượng".
  - Lần mua nhớ cách nhập đã dùng. Khi đổi khối lượng, số người dùng đã nhập được giữ nguyên, số kia tính lại.
  - Đổi đơn vị khi đơn giá chưa bị sửa tay (giá gợi ý, hoặc giá đã lưu trên trang sửa) thì đơn giá quy đổi ngay sang đơn vị mới, vd 13.850.000/chỉ → 138.500.000/lượng. Đơn giá người dùng vừa gõ thì giữ nguyên.
- BR-6: Gợi ý giá mua (HOLD-BR-003, PRICE-BR-004).
  - Khi đã chọn sản phẩm và ngày mua, nếu có ảnh chụp giá phù hợp thì điền sẵn **đơn giá = giá bán ra** của ảnh chụp đó (quy từ đơn vị niêm yết sang đơn vị khối lượng đang chọn; đổi đơn vị khi chưa sửa tay giá thì quy lại), ghi chú bên cạnh "Giá Phú Quý lúc HH:mm dd/MM/yyyy". Phần thương hiệu trong câu đổi theo thương hiệu đã chọn.
  - Nếu chỉ có **giá theo ngày** do nguồn công bố (không có giờ) thì ghi "Giá Phú Quý ngày dd/MM/yyyy".
  - Gợi ý chỉ điền vào khi ô giá đang trống hoặc vẫn đang giữ đúng số đã gợi ý lần trước. Đã sửa tay thì không ghi đè.
  - Không có ảnh chụp giá phù hợp thì để trống ô giá và ghi "Chưa có giá tham khảo cho thời điểm này".
  - Trong lúc chờ giá gợi ý thì dưới ô đơn giá hiện "Đang lấy giá…". Đổi đơn vị khi đã có giá gợi ý thì quy đổi ngay tại chỗ, không chờ lấy lại giá.
- BR-7: Sửa lần mua: sửa được mọi ô của BR-1, áp dụng lại BR-2…BR-6.
  - Mở form sửa thì giữ giá đã lưu, không gợi ý lại.
  - Sau khi mở, đổi sản phẩm, ngày hoặc giờ thì lấy giá gợi ý như thêm mới (có "Đang lấy giá…"). Giá đã lưu coi như giá gợi ý: chưa gõ lại giá trong lần sửa này thì được thay bằng giá mới; đã gõ thì giữ (2026-11-05).
  - Lần mua nhập theo tổng tiền thì giữ tổng tiền (số đã trả thật), đơn giá tự tính lại; lần mua có giá tự lấy thì ô giá vẫn để trống, lưu thì lấy lại theo BR-16.
- BR-8: Xoá lần mua phải xác nhận ("Xoá lần mua này? Không thể hoàn tác."). Xoá xong thì biến mất khỏi danh sách và khỏi mọi con số tổng.
- BR-9: Lãi/lỗ (HOLD-BR-004, HOLD-BR-006).
  - Với mỗi lần mua: giá trị hiện tại = khối lượng quy đổi × **giá mua vào mới nhất** của đúng sản phẩm đó. Lãi/lỗ = giá trị hiện tại − tổng tiền mua. Tỷ lệ = lãi/lỗ ÷ tổng tiền mua, làm tròn 2 chữ số thập phân.
  - Sản phẩm chưa có giá hiện tại thì hiện "Chưa có giá" và không đưa vào tổng.
  - Khi có lần mua bị loại khỏi tổng, khối tổng quan ghi "Không gồm N lần mua chưa có giá".
- BR-10: Màn hình "Tài sản của tôi" (HOLD-BR-005) gồm:
  - Khối tổng quan: tổng tiền mua, giá trị hiện tại, lãi/lỗ, tỷ lệ.
  - Nhóm theo kim loại, rồi theo sản phẩm: tổng khối lượng, tổng tiền mua, giá trị hiện tại, lãi/lỗ. Dòng sản phẩm ghi khối lượng theo đơn vị niêm yết của sản phẩm. Dòng kim loại ghi khối lượng theo **chỉ cho vàng** và **lượng cho bạc**.
  - Danh sách toàn bộ lần mua, mới nhất trước, không phân trang.
  - Lãi hiện màu xanh có dấu "+", lỗ màu đỏ có dấu "−".
  - Mọi giá trị hiện tại ghi kèm "Giá cập nhật lúc HH:mm dd/MM/yyyy" theo ảnh chụp giá đang dùng.
  - Mỗi dòng sản phẩm có thêm giá hiện tại của cửa hàng theo đơn vị niêm yết: "Mua vào 13.550.000 · Bán ra 13.850.000 /chỉ" (không có giá bán ra thì chỉ ghi mua vào). Sản phẩm chưa có giá thì không ghi dòng này.
- BR-11: Danh mục rỗng thì hiện "Bạn chưa có lần mua nào" và nút "Thêm tài sản".
- BR-12: Lỗi kiểm tra dữ liệu hiện ngay dưới ô bị lỗi, giữ nguyên các ô đã nhập. Sửa hoặc xoá lần mua không thuộc tài khoản đang đăng nhập (hoặc không tồn tại) thì trả về 404 "Không tìm thấy lần mua".
- BR-13: Biểu đồ lịch sử giá theo các mốc mua, xem cho **một sản phẩm** mỗi lần.
  - Chọn sản phẩm trong các sản phẩm mà tôi đang có lần mua. Mặc định là sản phẩm có tổng tiền mua lớn nhất.
  - Trục ngang chia theo ngày. Mỗi **ngày mua** là một điểm, giá trị là đơn giá mua của ngày đó. Nhiều lần mua cùng ngày gộp thành một điểm, lấy đơn giá bình quân theo khối lượng.
  - Điểm cuối là **hôm nay**, giá trị là giá mua vào hiện tại, vẽ khác màu và ghi "Giá cập nhật lúc HH:mm dd/MM/yyyy".
  - Có một đường ngang nét đứt là **giá vốn bình quân** = tổng tiền mua ÷ tổng khối lượng của sản phẩm đó.
  - Di chuột hoặc chạm vào một điểm mua thì hiện: ngày, đơn giá mua, khối lượng mua trong ngày, chênh lệch giữa giá mua vào hiện tại và đơn giá đó.
  - Biểu đồ chỉ dùng đơn giá đã nhập của các lần mua và giá hiện tại, không cần lịch sử ảnh chụp giá.
  - Lần mua đã xoá không xuất hiện trên biểu đồ.
- BR-14: Biểu đồ khi thiếu dữ liệu.
  - Sản phẩm chưa có giá hiện tại thì không có điểm "hôm nay" và ghi "Chưa có giá hiện tại".
  - Danh mục rỗng thì không hiện biểu đồ (theo BR-11).
- BR-15: Sản phẩm đã biến mất khỏi bảng giá của thương hiệu thì không chọn được cho lần mua mới. Lần mua cũ vẫn giữ tên sản phẩm và hiện "Chưa có giá" (theo BR-9).
- BR-16: Để trống cả đơn giá và tổng tiền thì khi bấm Lưu, hệ thống **tự lấy giá** (user chốt 2026-11-03).
  - Đơn giá = **giá bán ra** tại thời điểm mua (quy sang đơn vị khối lượng đã nhập), tìm theo PRICE-BR-004 (ảnh chụp trong ngày trước giờ mua, không có thì giá theo ngày của nguồn). Tổng tiền tính theo BR-5.
  - Lần mua ghi là "giá tự lấy" kèm nguồn. Trang sửa ghi "Hệ thống lấy · Giá Phú Quý ngày 15/01/2025".
  - Tab Chi tiết: mỗi lần mua có dòng "Đơn giá 13.850.000/chỉ" theo đơn vị đã nhập. Chỉ giá người dùng nhập có nhãn đánh dấu **"Người dùng nhập"**; giá hệ thống lấy không ghi nhãn ở danh sách cho gọn, nguồn giá xem ở trang sửa ("Hệ thống lấy · Giá Phú Quý ngày 15/01/2025") (user chốt 2026-11-05).
  - Không tìm được giá (thương hiệu chưa có nguồn giá, ngày không có dữ liệu, sản phẩm chỉ có giá mua vào, hoặc nguồn đang lỗi) thì không lưu và báo dưới ô giá: "Không tìm được giá ngày này, vui lòng nhập giá mua".
  - **Nguồn giá quyết định lúc lưu** (thêm hoặc sửa, user chốt 2026-11-05): giá có nhập thì so với giá bán ra của hệ thống tại thời điểm mua đã chọn (quy cùng đơn vị; nhập theo tổng tiền thì so tổng tiền). **Trùng** thì là giá hệ thống, kèm nhãn nguồn. **Khác** thì là giá người dùng nhập. Không tra được giá (chưa có nguồn, nguồn lỗi) thì coi là người dùng nhập, vẫn lưu.
  - Trang sửa điền sẵn số đã lưu vào ô giá, kể cả giá tự lấy. Ngay dưới ô đơn giá ghi nguồn của giá đã lưu bằng chữ thường (không khung nhãn): "Người dùng nhập", hoặc "Hệ thống lấy · Giá Phú Quý ngày …". Gõ giá khác hoặc giá được thay bằng gợi ý mới thì bỏ nhãn (lưu xong server so giá lại). Xoá trống ô giá thì lấy lại giá theo ngày giờ mua mới.
  - **Dữ liệu cũ** (lần mua có trước 2026-11-05) được đánh dấu một lần là giá hệ thống, nhãn "Dữ liệu cũ, chưa xác nhận", số tiền giữ nguyên. Người dùng mở sửa và lưu thì nguồn giá được xác định lại theo quy tắc so giá ở trên.
  - Ô giá trên form ghi gợi ý "Để trống để tự lấy giá ngày mua".
- BR-17: **Lọc Tất cả | Vàng | Bạc** ở đầu cả 3 tab, mặc định **Tất cả** (đứng đầu); lựa chọn giữ nguyên khi chuyển tab (2026-11-05: trước mặc định Vàng).
  - Tổng quan: chọn Vàng/Bạc thì thẻ đầu trang là giá trị, tiền mua, lãi/lỗ của riêng kim loại đó ("Giá trị vàng"…) kèm danh sách sản phẩm của nó; Tất cả thì như BR-10.
  - Biểu đồ: bộ lọc chỉ có **Vàng | Bạc**; đang lọc Tất cả thì hiện Vàng. Ô chọn sản phẩm chỉ gồm sản phẩm của kim loại đang lọc; mặc định là sản phẩm tiền mua lớn nhất trong nhóm đó.
  - Chi tiết: chỉ hiện lần mua của kim loại đang lọc.
  - Kim loại đang lọc chưa có lần mua nào thì hiện "Chưa có tài sản vàng" / "Chưa có tài sản bạc".
- BR-18: **Thêm tài sản nhiều sản phẩm**: ngày mua, giờ mua và thương hiệu dùng chung; bấm "+ Thêm sản phẩm" để thêm dòng (sản phẩm, khối lượng + đơn vị, giá); dòng có nút xoá (còn một dòng thì không xoá được).
  - Lưu ra **mỗi dòng một lần mua** riêng (sửa/xoá từng lần mua như cũ). Tối đa 20 dòng.
  - **Tất cả hoặc không:** một dòng sai (kể cả không tự lấy được giá, BR-16) thì không lưu dòng nào; lỗi hiện dưới đúng ô của đúng dòng.
  - Mỗi dòng có gợi ý giá riêng (BR-6) theo sản phẩm của dòng và ngày giờ chung.
- BR-19: Ô **đơn giá** và **tổng tiền** hiển thị số tiền dạng VNĐ ngay khi gõ (dấu chấm ngăn cách hàng nghìn, vd "13.850.000"), có chữ "VNĐ" cuối ô; giá trị gửi đi là số nguyên.
- BR-20: Trang sửa vẫn là một lần mua (không thêm sản phẩm), tiêu đề "Sửa lần mua".
- Áp dụng: ACC-BR-002, HOLD-BR-002, HOLD-BR-003, HOLD-BR-004, HOLD-BR-005, HOLD-BR-006, HOLD-BR-007, PRICE-BR-004, PRICE-BR-005.

- BR-21: **Từ Tổng quan sang Chi tiết, giá tham chiếu** (user yêu cầu 2026-11-05).
  - Chạm thẻ Vàng / Bạc (dòng tên nhóm hoặc tên sản phẩm) ở Tổng quan thì sang tab Chi tiết với bộ lọc đúng kim loại đó. Ô giá trị / % lãi/lỗ của sản phẩm dành cho bong bóng nhận định AI (PRICE-UC02/BR-11).
  - Tab Chi tiết có khối **"Giá hiện tại"** dưới bộ lọc: mỗi sản phẩm đang có (theo bộ lọc) một dòng "Mua vào … · Bán ra …/đơn vị niêm yết", để so với đơn giá từng lần mua.

## Scenario
```gherkin
Scenario: HOLD-UC01-SC1 Form thêm lần mua mặc định thương hiệu Phú Quý
  Given tôi đã đăng nhập
  When tôi mở form "Thêm tài sản"
  Then ô thương hiệu đang chọn "Phú Quý"
  And danh sách sản phẩm là các sản phẩm của Phú Quý, đang chọn "Nhẫn tròn Phú Quý 999.9"
  And ô khối lượng là "0,5", đơn vị "chỉ"

Scenario: HOLD-UC01-SC2 Thêm lần mua theo đơn giá
  Given sản phẩm "Nhẫn tròn Phú Quý 999.9" niêm yết theo chỉ
  When tôi nhập khối lượng 2 chỉ, ngày mua hôm qua, đơn giá 13.850.000
  Then tổng tiền mua hiển thị 27.700.000
  And sau khi lưu, lần mua xuất hiện đầu danh sách với tổng tiền mua 27.700.000

Scenario: HOLD-UC01-SC3 Thêm lần mua theo tổng tiền
  When tôi nhập khối lượng 3 chỉ và tổng tiền 41.000.000
  Then đơn giá hiển thị 13.666.667
  And tổng tiền mua được lưu là 41.000.000

Scenario: HOLD-UC01-SC4 Nhập khối lượng theo lượng và gram
  When tôi nhập 1 lượng
  Then khối lượng hiển thị "10 chỉ (1 lượng)"
  When tôi nhập 7,5 gram
  Then khối lượng hiển thị "2 chỉ (7,5 g)"

Scenario: HOLD-UC01-SC25 Bạc niêm yết theo lượng và kg
  Given "Bạc thỏi Phú Quý 999 10 lượng, 5 lượng" niêm yết theo lượng, giá mua vào 1.591.000
  And "Bạc thỏi Phú Quý 999 1 kilo" niêm yết theo kg, giá mua vào 42.426.561
  When tôi thêm lần mua 1 kg của sản phẩm niêm yết theo lượng
  Then khối lượng hiển thị "26,667 lượng (1 kg)" và giá trị hiện tại là 42.426.667
  When tôi thêm lần mua 1 kg của sản phẩm niêm yết theo kg
  Then khối lượng hiển thị "1 kg" và giá trị hiện tại là 42.426.561

Scenario Outline: HOLD-UC01-SC5 Khối lượng không hợp lệ
  When tôi nhập khối lượng "<kl>" rồi bấm Lưu
  Then dưới ô khối lượng hiện "<thông báo>" và lần mua không được lưu
  Examples:
    | kl     | thông báo                                 |
    | 0      | Khối lượng phải lớn hơn 0                  |
    | -1     | Khối lượng phải lớn hơn 0                  |
    | 1,25   | Khối lượng nhập theo bước 0,1 chỉ          |
    |        | Vui lòng nhập khối lượng                   |

Scenario: HOLD-UC01-SC38 Ô khối lượng vừa chọn vừa gõ, gợi ý theo đơn vị
  When tôi mở danh sách khối lượng khi đơn vị là "chỉ"
  Then thấy 20 lựa chọn 0,5; 1; 1,5; …; 10
  When tôi chọn "1,5"
  Then ô khối lượng là "1,5"
  When tôi đổi đơn vị sang "lượng" và mở danh sách
  Then thấy 1; 2; 3; 5; 10
  When tôi gõ "2,3" với đơn vị "chỉ"
  Then ô khối lượng là "2,3" và lưu được

Scenario: HOLD-UC01-SC39 Bước nhỏ nhất 0,1 chỉ
  When tôi lưu khối lượng "0,1" chỉ
  Then lần mua được lưu với 0,1 chỉ
  When tôi lưu khối lượng "0,05" chỉ
  Then dưới ô khối lượng hiện "Khối lượng nhập theo bước 0,1 chỉ"

Scenario: HOLD-UC01-SC40 Lọc Vàng | Bạc | Tất cả
  Given tôi có lần mua vàng và lần mua bạc
  When tôi mở Tổng quan
  Then đang lọc "Tất cả" (nút đầu tiên), thẻ đầu trang là giá trị cả danh mục
  When tôi chọn "Bạc"
  Then thẻ đầu trang là giá trị bạc
  When tôi chuyển sang tab Chi tiết
  Then vẫn đang lọc "Bạc" và chỉ thấy lần mua bạc
  When tôi chọn "Tất cả"
  Then thấy cả hai

Scenario: HOLD-UC01-SC41 Thêm tài sản nhiều sản phẩm một lần
  When tôi mở "Thêm tài sản", dòng 1 chọn nhẫn tròn 2 chỉ, bấm "+ Thêm sản phẩm", dòng 2 chọn "Bạc thỏi Phú Quý 999 10 lượng, 5 lượng" 5 lượng, rồi bấm Lưu
  Then có 2 lần mua mới cùng ngày mua, mỗi sản phẩm một lần mua

Scenario: HOLD-UC01-SC42 Một dòng sai thì không lưu dòng nào
  Given dòng 1 hợp lệ, dòng 2 khối lượng "0"
  When tôi bấm Lưu
  Then không lần mua nào được lưu
  And dưới ô khối lượng của dòng 2 hiện "Khối lượng phải lớn hơn 0"

Scenario: HOLD-UC01-SC43 Ô tiền hiển thị dạng VNĐ
  When tôi gõ "13850000" vào ô đơn giá
  Then ô hiện "13.850.000" kèm chữ "VNĐ"
  And giá gửi đi là 13850000

Scenario: HOLD-UC01-SC44 Đơn giá theo đơn vị đang chọn
  Given sản phẩm "Nhẫn tròn Phú Quý 999.9" niêm yết theo chỉ, gợi ý giá bán ra 13.900.000/chỉ
  When tôi chọn đơn vị "lượng"
  Then ô đơn giá có nhãn "Đơn giá (VNĐ/lượng)" và được điền 139.000.000
  When tôi nhập khối lượng 1 lượng, đơn giá 138.500.000 rồi lưu
  Then tổng tiền mua là 138.500.000 và đơn giá lưu là 138.500.000 (VNĐ/lượng)

Scenario: HOLD-UC01-SC45 Lần mua cũ có đơn vị nhập khác đơn vị niêm yết
  Given lần mua lưu trước 2026-11-05: 7,5 gram "Nhẫn tròn Phú Quý 999.9", tổng tiền 27.700.000, đơn giá lưu theo chỉ 13.850.000
  When hệ thống nâng cấp dữ liệu
  Then đơn giá thành 3.693.333 (VNĐ/g), tổng tiền vẫn 27.700.000

Scenario: HOLD-UC01-SC46 Tổng quan hiện giá hiện tại của từng sản phẩm
  Given tôi có lần mua "Nhẫn tròn Phú Quý 999.9" và "Vàng miếng SJC"
  And bảng giá mới nhất chỉ có nhẫn tròn: mua vào 13.550.000, bán ra 13.850.000 (theo chỉ)
  When tôi mở tab Tổng quan
  Then dòng "Nhẫn tròn Phú Quý 999.9" ghi "Mua vào 13.550.000 · Bán ra 13.850.000 /chỉ"
  And dòng "Vàng miếng SJC" không ghi giá hiện tại

Scenario: HOLD-UC01-SC47 Giờ mua ẩn sau nút
  When tôi mở form "Thêm tài sản"
  Then chỉ có ô ngày mua, kèm nút "+ Thêm giờ mua"
  When tôi bấm "+ Thêm giờ mua", nhập 10:30, rồi bấm "Bỏ giờ mua"
  Then ô giờ ẩn đi và lần mua được lưu không có giờ

Scenario: HOLD-UC01-SC48 Báo đang lấy giá; đổi đơn vị quy đổi ngay
  Given giá gợi ý trả về chậm
  When tôi mở form "Thêm tài sản"
  Then dưới ô đơn giá hiện "Đang lấy giá…"
  When giá gợi ý về: 13.900.000/chỉ
  Then dòng "Đang lấy giá…" mất, ô đơn giá là 13.900.000
  When tôi đổi đơn vị sang lượng
  Then ô đơn giá là 139.000.000 ngay, không lấy lại giá

Scenario: HOLD-UC01-SC49 Không còn ô ghi chú
  Given lần mua cũ có ghi chú "Mua ở Phú Quý"
  When tôi mở form sửa lần mua đó
  Then không có ô ghi chú
  When tôi bấm Lưu
  Then ghi chú "Mua ở Phú Quý" vẫn được giữ
  And danh sách lần mua không hiện ghi chú

Scenario: HOLD-UC01-SC50 Trang sửa lấy lại giá khi đổi sản phẩm, quy đổi khi đổi đơn vị
  Given lần mua 2 chỉ nhẫn tròn, đơn giá 13.850.000/chỉ
  When tôi mở trang sửa
  Then ô đơn giá là 13.850.000 và không lấy giá gợi ý
  When tôi đổi đơn vị sang lượng
  Then ô đơn giá là 138.500.000
  When tôi đổi sản phẩm sang "Vàng miếng SJC" (giá gợi ý 14.000.000/chỉ)
  Then ô đơn giá là giá gợi ý của SJC theo đơn vị đang chọn

Scenario: HOLD-UC01-SC51 Sửa lần mua nhập theo tổng tiền: giữ tổng tiền
  Given lần mua nhập theo tổng tiền 27.700.000
  When tôi mở trang sửa rồi đổi sản phẩm
  Then tổng tiền vẫn là 27.700.000 và hiện giá tham khảo

Scenario: HOLD-UC01-SC52 Tab Biểu đồ chỉ lọc Vàng | Bạc
  Given đang lọc "Tất cả"
  When tôi mở tab Biểu đồ
  Then bộ lọc chỉ có "Vàng", "Bạc", đang chọn "Vàng"
  When tôi chọn "Bạc"
  Then biểu đồ chuyển sang sản phẩm bạc tiền mua lớn nhất

Scenario: HOLD-UC01-SC53 Tab Chi tiết đánh dấu đơn giá người dùng nhập
  Given lần mua A nhập đơn giá 13.850.000/chỉ, lần mua B để trống giá (tự lấy 140.000.000/lượng)
  When tôi mở tab Chi tiết
  Then A ghi "Đơn giá 13.850.000/chỉ" kèm nhãn "Người dùng nhập"
  And B chỉ ghi "Đơn giá 140.000.000/lượng", không có nhãn nào

Scenario: HOLD-UC01-SC56 Trang sửa ghi nguồn của giá đã lưu
  Given lần mua 2 lượng bạc miếng, đơn giá 1.436.000/lượng là giá người dùng nhập
  When tôi mở trang sửa
  Then ngay dưới ô đơn giá có nhãn "Người dùng nhập"
  When tôi gõ đơn giá 1.500.000
  Then nhãn "Người dùng nhập" mất
  Given lần mua khác là giá hệ thống lấy
  When tôi mở trang sửa
  Then dưới ô đơn giá ghi "Hệ thống lấy · Giá Phú Quý ngày …", không có nhãn "Người dùng nhập"

Scenario: HOLD-UC01-SC57 Chạm thẻ kim loại sang Chi tiết
  When tôi chạm thẻ "Bạc" ở Tổng quan
  Then mở tab Chi tiết, bộ lọc đang là "Bạc", chỉ thấy lần mua bạc

Scenario: HOLD-UC01-SC58 Giá hiện tại ở Chi tiết
  Given giá nhẫn tròn mua vào 13.900.000, bán ra 14.200.000/chỉ; bạc miếng 1.598.000 / 1.647.000/lượng
  When tôi mở tab Chi tiết (Tất cả)
  Then khối "Giá hiện tại" có "Mua vào 13.900.000 · Bán ra 14.200.000/chỉ" và "Mua vào 1.598.000 · Bán ra 1.647.000/lượng"
  When tôi chọn "Vàng"
  Then khối chỉ còn giá nhẫn tròn

Scenario: HOLD-UC01-SC6 Ngày mua ở tương lai bị chặn
  When tôi chọn ngày mua là ngày mai (giờ Việt Nam) rồi bấm Lưu
  Then dưới ô ngày mua hiện "Ngày mua không được sau hôm nay"

Scenario: HOLD-UC01-SC7 Giờ mua sau thời điểm hiện tại bị chặn
  Given bây giờ là 10:00 hôm nay
  When tôi chọn ngày mua hôm nay, giờ mua 11:00 rồi bấm Lưu
  Then dưới ô giờ mua hiện "Thời điểm mua không được sau hiện tại"

Scenario: HOLD-UC01-SC8 Giá mua không hợp lệ
  When tôi nhập đơn giá 0
  Then hiện "Giá mua phải lớn hơn 0"

Scenario: HOLD-UC01-SC9 Đổi thương hiệu xoá sản phẩm đã chọn
  Given tôi đã chọn "Nhẫn tròn Phú Quý 999.9"
  When tôi đổi thương hiệu sang một thương hiệu khác
  Then ô sản phẩm trở về trống và danh sách là sản phẩm của thương hiệu mới

Scenario: HOLD-UC01-SC10 Gợi ý giá từ ảnh chụp giá
  Given có ảnh chụp giá Phú Quý lúc 09:00 và 14:00 ngày 01/11/2026
  And lúc 14:00 "Nhẫn tròn Phú Quý 999.9" có giá bán ra 13.900.000
  When tôi chọn sản phẩm đó, ngày mua 01/11/2026, không nhập giờ
  Then ô đơn giá được điền 13.900.000
  And bên cạnh ghi "Giá Phú Quý lúc 14:00 01/11/2026"

Scenario: HOLD-UC01-SC11 Gợi ý theo giờ mua lấy ảnh chụp trước giờ đó
  Given có ảnh chụp giá lúc 09:00 (bán ra 13.800.000) và 14:00 (bán ra 13.900.000) ngày 01/11/2026
  When tôi nhập ngày 01/11/2026, giờ mua 10:30
  Then ô đơn giá được điền 13.800.000

Scenario: HOLD-UC01-SC32 Lần mua cũ dùng giá theo ngày của nguồn
  Given hệ thống không có ảnh chụp giá nào trong ngày 15/01/2025
  And Phú Quý công bố giá ngày 15/01/2025: "Nhẫn tròn Phú Quý 999.9" bán ra 8.610.000
  When tôi chọn sản phẩm đó, ngày mua 15/01/2025
  Then ô đơn giá được điền 8.610.000
  And bên cạnh ghi "Giá Phú Quý ngày 15/01/2025"

Scenario: HOLD-UC01-SC12 Không có ảnh chụp giá thì không gợi ý
  Given không có ảnh chụp giá nào trước hoặc vào ngày 01/01/2024, kể cả giá theo ngày của nguồn
  When tôi chọn ngày mua 01/01/2024
  Then ô đơn giá để trống và ghi "Chưa có giá tham khảo cho thời điểm này"

Scenario: HOLD-UC01-SC13 Giá đã sửa tay không bị gợi ý ghi đè
  Given ô đơn giá đã được gợi ý 13.900.000 và tôi sửa thành 13.700.000
  When tôi đổi giờ mua
  Then ô đơn giá vẫn là 13.700.000

Scenario: HOLD-UC01-SC14 Tính lãi/lỗ theo giá mua vào
  Given tôi có lần mua 2 chỉ "Nhẫn tròn Phú Quý 999.9", tổng tiền mua 27.000.000
  And giá mới nhất của sản phẩm đó: mua vào 13.550.000, bán ra 13.850.000
  When tôi mở "Tài sản của tôi"
  Then giá trị hiện tại của lần mua là 27.100.000
  And lãi/lỗ là "+100.000" màu xanh, tỷ lệ "+0,37%"

Scenario: HOLD-UC01-SC15 Lỗ hiển thị màu đỏ
  Given lần mua 1 chỉ, tổng tiền mua 14.000.000, giá mua vào hiện tại 13.550.000
  Then lãi/lỗ là "−450.000" màu đỏ, tỷ lệ "−3,21%"

Scenario: HOLD-UC01-SC16 Tổng hợp theo kim loại và sản phẩm
  Given tôi có 2 lần mua "Nhẫn tròn Phú Quý 999.9" và 1 lần mua "Bạc thỏi Phú Quý 999"
  When tôi mở "Tài sản của tôi"
  Then nhóm "Vàng" có 1 dòng sản phẩm, cộng khối lượng và tiền của 2 lần mua
  And nhóm "Bạc" có 1 dòng sản phẩm
  And khối tổng quan bằng tổng của cả hai nhóm

Scenario: HOLD-UC01-SC17 Sản phẩm chưa có giá không vào tổng
  Given tôi có 1 lần mua sản phẩm chưa có giá hiện tại và 1 lần mua sản phẩm có giá
  Then lần mua chưa có giá hiện "Chưa có giá"
  And khối tổng quan chỉ tính lần mua có giá và ghi "Không gồm 1 lần mua chưa có giá"

Scenario: HOLD-UC01-SC18 Hiển thị thời điểm giá đang dùng
  Given ảnh chụp giá mới nhất của Phú Quý là lúc 17:26 02/11/2026
  Then giá trị hiện tại ghi "Giá cập nhật lúc 17:26 02/11/2026"

Scenario: HOLD-UC01-SC19 Danh mục rỗng
  Given tôi chưa có lần mua nào
  When tôi mở "Tài sản của tôi"
  Then hiện "Bạn chưa có lần mua nào" và nút "Thêm tài sản"

Scenario: HOLD-UC01-SC20 Sửa lần mua đã nhập theo đơn giá
  Given lần mua 2 chỉ, nhập theo đơn giá 13.850.000, tổng tiền 27.700.000
  When tôi sửa khối lượng thành 3 chỉ và giữ đơn giá 13.850.000
  Then tổng tiền mua thành 41.550.000 và lãi/lỗ được tính lại
  And ô đơn giá không bị gợi ý ghi đè khi mở form sửa

Scenario: HOLD-UC01-SC24 Sửa lần mua đã nhập theo tổng tiền
  Given lần mua 3 chỉ, nhập theo tổng tiền 41.000.000
  When tôi sửa khối lượng thành 4 chỉ
  Then tổng tiền mua vẫn là 41.000.000 và đơn giá hiển thị 10.250.000

Scenario: HOLD-UC01-SC21 Xoá lần mua có xác nhận
  When tôi bấm xoá một lần mua
  Then hiện "Xoá lần mua này? Không thể hoàn tác."
  When tôi bấm "Huỷ"
  Then lần mua vẫn còn
  When tôi bấm xoá rồi xác nhận
  Then lần mua biến mất khỏi danh sách và các con số tổng được tính lại

Scenario: HOLD-UC01-SC22 Không xem hay sửa được lần mua của tài khoản khác
  Given tài khoản A có lần mua X
  When tài khoản B mở "Tài sản của tôi"
  Then không thấy lần mua X
  When tài khoản B gửi yêu cầu sửa hoặc xoá lần mua X
  Then nhận 404 "Không tìm thấy lần mua" và lần mua X không đổi

Scenario: HOLD-UC01-SC34 Để trống giá thì tự lấy giá bán ra của ngày mua
  Given Phú Quý công bố giá ngày 15/01/2025: "Nhẫn tròn Phú Quý 999.9" bán ra 8.610.000
  When tôi thêm lần mua 2 chỉ sản phẩm đó, ngày 15/01/2025, để trống đơn giá và tổng tiền rồi bấm Lưu
  Then lần mua được lưu với đơn giá 8.610.000, tổng tiền 17.220.000
  And trang sửa lần mua đó ghi "Hệ thống lấy · Giá Phú Quý ngày 15/01/2025"; tab Chi tiết không có nhãn "Người dùng nhập"

Scenario: HOLD-UC01-SC35 Có giờ mua thì tự lấy theo ảnh chụp trước giờ đó
  Given có ảnh chụp giá lúc 09:00 (bán ra 13.800.000) và 14:00 (bán ra 13.900.000) ngày 01/11/2026
  When tôi thêm lần mua 1 chỉ ngày 01/11/2026 lúc 10:30, để trống giá rồi bấm Lưu
  Then đơn giá được lưu là 13.800.000 và nhãn ghi "Hệ thống lấy · Giá Phú Quý lúc 09:00 01/11/2026"

Scenario Outline: HOLD-UC01-SC36 Không tìm được giá thì bắt nhập tay
  Given <tình huống>
  When tôi để trống giá rồi bấm Lưu
  Then lần mua không được lưu và dưới ô giá hiện "Không tìm được giá ngày này, vui lòng nhập giá mua"
  Examples:
    | tình huống                                              |
    | sản phẩm thuộc thương hiệu chưa có nguồn giá             |
    | nguồn không có dữ liệu ngày mua                          |
    | sản phẩm chỉ có giá mua vào (vd "Vàng 999.9 phi SJC")    |

Scenario: HOLD-UC01-SC37 Sửa lần mua giá tự lấy
  Given lần mua có giá tự lấy 8.610.000/chỉ
  When tôi mở trang sửa
  Then thấy nhãn "Hệ thống lấy · …" và ô đơn giá điền sẵn 8.610.000
  When tôi nhập đơn giá 13.700.000 rồi bấm Lưu
  Then đơn giá là 13.700.000 và lần mua là giá người dùng nhập

Scenario: HOLD-UC01-SC54 Dữ liệu cũ là giá hệ thống, chưa xác nhận
  Given DB có lần mua từ trước 2026-11-05 (đang ghi là nhập tay)
  When server khởi động bản mới
  Then lần mua đó thành giá hệ thống, nhãn "Dữ liệu cũ, chưa xác nhận", số tiền giữ nguyên
  And các lần khởi động sau không đánh dấu lại

Scenario: HOLD-UC01-SC55 Lưu thì so giá với giá hệ thống tại thời điểm mua
  Given giá bán ra nhẫn tròn ngày 15/01/2025 là 8.610.000/chỉ
  When tôi lưu 2 chỉ ngày 15/01/2025 với đơn giá 8.610.000 (hoặc 1 lượng 86.100.000, hoặc tổng tiền 17.220.000)
  Then lần mua là giá hệ thống, nhãn "Giá Phú Quý ngày 15/01/2025"
  When tôi lưu với đơn giá 8.700.000
  Then lần mua là giá người dùng nhập
  When tôi sửa lần mua đó về 8.610.000 rồi lưu
  Then lần mua thành giá hệ thống

Scenario: HOLD-UC01-SC33 Khối lượng và giá vượt giới hạn
  When tôi nhập 1.001 kg rồi bấm Lưu
  Then dưới ô khối lượng hiện "Khối lượng tối đa 1.000 kg"
  When tôi nhập 1 chỉ, đơn giá 1.000.000.000.001
  Then hiện "Giá mua tối đa 1.000 tỷ đồng"
  When tôi nhập 1.000 kg, đơn giá 999.999.999.999
  Then hiện "Tổng tiền tối đa 1.000 tỷ đồng"

Scenario: HOLD-UC01-SC23 Ghi chú quá dài (API)
  When gửi lần mua qua API kèm ghi chú 201 ký tự
  Then API báo lỗi ô ghi chú "Ghi chú tối đa 200 ký tự"

Scenario: HOLD-UC01-SC26 Biểu đồ giá theo các mốc mua
  Given với "Nhẫn tròn Phú Quý 999.9" tôi có 2 lần mua
    | ngày       | khối lượng | đơn giá    |
    | 01/10/2026 | 2 chỉ      | 13.000.000 |
    | 15/10/2026 | 1 chỉ      | 13.500.000 |
  And giá mua vào hiện tại là 13.550.000
  When tôi mở biểu đồ lịch sử của sản phẩm đó
  Then có điểm 01/10/2026 = 13.000.000, điểm 15/10/2026 = 13.500.000 và điểm hôm nay = 13.550.000 vẽ khác màu
  And đường giá vốn bình quân ở mức 13.166.667
  And chạm vào điểm 01/10/2026 hiện "2 chỉ" và chênh lệch "+550.000"

Scenario: HOLD-UC01-SC27 Nhiều lần mua cùng ngày gộp một điểm
  Given ngày 20/10/2026 tôi mua 1 chỉ giá 13.400.000 và 3 chỉ giá 13.000.000 cùng sản phẩm
  Then biểu đồ có một điểm 20/10/2026 = 13.100.000, khối lượng "4 chỉ"

Scenario: HOLD-UC01-SC28 Sản phẩm chưa có giá hiện tại
  Given tôi có lần mua sản phẩm nhập sẵn của một thương hiệu chưa có nguồn giá
  When tôi chọn sản phẩm đó trên biểu đồ
  Then biểu đồ có các điểm mua nhưng không có điểm hôm nay, và ghi "Chưa có giá hiện tại"

Scenario: HOLD-UC01-SC31 Thương hiệu chưa có nguồn giá dùng danh sách nhập sẵn
  Given thương hiệu "Bảo Tín Mạnh Hải" chưa có nguồn giá và có danh sách sản phẩm nhập sẵn
  When tôi chọn thương hiệu đó trong form thêm lần mua
  Then danh sách sản phẩm là danh sách nhập sẵn
  And sau khi lưu, lần mua hiện "Chưa có giá" và không vào tổng lãi/lỗ

Scenario: HOLD-UC01-SC29 Sản phẩm biến mất khỏi bảng giá
  Given tôi có lần mua sản phẩm "X" của Phú Quý
  And bảng giá Phú Quý mới nhất không còn sản phẩm "X"
  Then lần mua vẫn hiện tên "X" kèm "Chưa có giá"
  And form thêm lần mua không còn "X" trong danh sách sản phẩm

Scenario: HOLD-UC01-SC30 Danh sách không phân trang
  Given tôi có 300 lần mua
  When tôi mở "Tài sản của tôi"
  Then cả 300 lần mua nằm trong cùng một danh sách, mới nhất trước
```

## Cài đặt
> Kiểm ở commit `3478da4` (nhánh `main`, 2026-11-05). Test: `server/test/api.test.ts` (API), `shared/test/*.test.ts` (công thức), `server/test/price-service.test.ts` (giá).

| Mục | Code | Test |
|---|---|---|
| BR-1 thương hiệu mặc định, các ô form; giờ mua ẩn sau nút | `server/src/routes.ts:10`, `web/src/pages/PurchaseFormPage.tsx:64`, `web/src/pages/PurchaseFormPage.tsx:43`; không có ô ghi chú, giữ ghi chú cũ khi sửa `web/src/pages/PurchaseFormPage.tsx:45` | `api.test.ts` (SC1), `assets.test.tsx` (SC47, SC49) |
| BR-2 sản phẩm theo thương hiệu, danh sách nhập sẵn | `server/src/catalog.ts:30`, `web/src/pages/PurchaseFormPage.tsx:211` | `api.test.ts` (SC31), `purchase-form.test.tsx` (SC9) |
| BR-3 khối lượng, đơn vị | `shared/src/units.ts:54`, `shared/src/format.ts:35` | `units.test.ts`, `format.test.ts`, `api.test.ts` (SC4, SC5, SC25, SC33) |
| BR-4 ngày giờ không ở tương lai (giờ VN) | `server/src/purchases/validate.ts:77-86` | `api.test.ts` (SC6, SC7) |
| BR-5 đơn giá ↔ tổng tiền, nhớ cách nhập | `shared/src/money.ts:21-26`, `server/src/purchases/validate.ts:107-108` | `money.test.ts`, `api.test.ts` (SC2, SC3, SC8, SC20, SC24, SC33) |
| BR-6 gợi ý giá, không ghi đè giá sửa tay (kể cả khi gõ trong lúc chờ gợi ý) | `server/src/routes.ts:42`, `server/src/prices/service.ts:154`, `web/src/components/PurchaseLine.tsx:92`; "Đang lấy giá…" và quy đổi khi đổi đơn vị `web/src/components/PurchaseLine.tsx:68`, `web/src/components/PurchaseLine.tsx:141` | `price-service.test.ts`, `api.test.ts` (SC10, SC11, SC12, SC32), `purchase-form.test.tsx` (SC13 + ca race R-UI-02), `assets.test.tsx` (SC48) |
| BR-7 sửa: giữ giá đã lưu, đổi sản phẩm/ngày/giờ thì gợi ý lại | `server/src/purchases/routes.ts:129`, `web/src/pages/PurchaseFormPage.tsx:68`, `web/src/components/PurchaseLine.tsx:71`, `web/src/components/PurchaseLine.tsx:80` | `api.test.ts` (SC20, SC24), `assets.test.tsx` (SC50, SC51) |
| BR-8 xoá có xác nhận | `server/src/purchases/routes.ts:146`, `web/src/components/ConfirmSheet.tsx:2` | `api.test.ts` (SC21) |
| BR-9 lãi/lỗ theo giá mua vào, loại lần mua chưa có giá | `shared/src/pnl.ts:8`, `server/src/portfolio/service.ts:67` | `pnl.test.ts`, `api.test.ts` (SC14, SC15, SC17) |
| BR-10 tổng quan, nhóm kim loại/sản phẩm, giờ giá, giá hiện tại từng sản phẩm | `server/src/portfolio/service.ts:114`, `server/src/portfolio/service.ts:130`, `web/src/pages/OverviewPage.tsx:15`, `web/src/pages/OverviewPage.tsx:105` | `api.test.ts` (SC16, SC18, SC30, SC46), `assets.test.tsx` (SC46) |
| BR-11 danh mục rỗng | `web/src/pages/OverviewPage.tsx:24` | `api.test.ts` (SC19) |
| BR-12 lỗi theo ô, 404 lần mua của người khác | `server/src/purchases/routes.ts:53-57`, `web/src/components/ui.tsx:10` | `api.test.ts` (SC22, SC23) |
| BR-13 biểu đồ theo mốc mua, giá vốn bình quân | `server/src/portfolio/service.ts:155`, `shared/src/pnl.ts:25-32`, `web/src/components/HistoryChart.tsx:71` | `pnl.test.ts`, `api.test.ts` (SC26, SC27) |
| BR-14 thiếu giá hiện tại | `server/src/portfolio/service.ts:155` | `api.test.ts` (SC28) |
| BR-17 lọc Tất cả/Vàng/Bạc, mặc định Tất cả; Biểu đồ chỉ Vàng/Bạc | `web/src/components/MetalFilter.tsx:15`, `web/src/portfolio-context.tsx:25`, `web/src/pages/OverviewPage.tsx:39`, `web/src/pages/HistoryPage.tsx:14` | `assets.test.tsx` (SC40, SC52) |
| BR-18 thêm tài sản nhiều sản phẩm, tất cả hoặc không | `server/src/purchases/routes.ts:97`, `server/src/purchases/routes.ts:118`, `web/src/pages/PurchaseFormPage.tsx:140`, `web/src/components/PurchaseLine.tsx:65` | `api.test.ts` (SC41, SC42), `assets.test.tsx` (SC41, SC42) |
| BR-5 (2026-11-05) đơn giá theo đơn vị đang chọn | `shared/src/money.ts:31`, `server/src/purchases/validate.ts:107-108`, `server/src/purchases/validate.ts:136`, `web/src/components/PurchaseLine.tsx:98`, đổi đơn vị quy đổi đơn giá `web/src/components/PurchaseLine.tsx:141`, nâng cấp dữ liệu cũ `server/src/db.ts:102` | `money.test.ts`, `api.test.ts` (SC44), `db.test.ts` (SC45), `assets.test.tsx` (SC44, SC50) |
| BR-19 ô tiền dạng VNĐ | `web/src/components/MoneyInput.tsx:9` | `assets.test.tsx` (SC43) |
| BR-20 trang sửa một sản phẩm | `web/src/pages/PurchaseFormPage.tsx:68` | `purchase-form.test.tsx` (SC20, SC24) |
| BR-3 (2026-11-05) bước 0,1 chỉ, ô khối lượng chọn/gõ, sản phẩm mặc định | `shared/src/units.ts:42`, `shared/src/units.ts:54`, `web/src/components/WeightCombo.tsx:13`, `server/src/catalog.ts:134` | `units.test.ts`, `api.test.ts` (SC1, SC5, SC39), `assets.test.tsx` (SC38) |
| BR-16 tự lấy giá khi để trống | `server/src/purchases/validate.ts:130`, `server/src/prices/suggest.ts:11`, `server/src/db.ts:88`, `web/src/pages/PurchaseFormPage.tsx:77`, `web/src/pages/PurchasesPage.tsx:70` (Chi tiết: đơn giá, chỉ giá người dùng nhập có nhãn); so giá lúc lưu `server/src/purchases/validate.ts:143`; dữ liệu cũ `server/src/db.ts:114`; trang sửa điền sẵn giá và ghi nguồn giá đã lưu `web/src/pages/PurchaseFormPage.tsx:86`, `web/src/components/PurchaseLine.tsx:31` | `api.test.ts` (SC8, SC34, SC35, SC36, SC37, SC53, SC55), `db.test.ts` (SC54), `auto-price.test.tsx` (SC34, SC37), `assets.test.tsx` (SC53, SC56) |
| BR-21 thẻ kim loại sang Chi tiết, giá tham chiếu | `web/src/pages/OverviewPage.tsx:67`, `web/src/pages/PurchasesPage.tsx:26` | `chat.test.tsx` (SC57, SC58) |
| BR-15 sản phẩm biến mất khỏi bảng giá | `server/src/prices/service.ts:129`, `server/src/purchases/validate.ts:64` | `price-service.test.ts`, `api.test.ts` (SC29) |

Test web (vitest + Testing Library): `web/test/purchase-form.test.tsx` (SC1, SC9, SC13, race R-UI-02, SC20, SC24, SC21), `web/test/shell.test.tsx` (SC17, SC19, 3 tab, nút +), `web/test/auto-price.test.tsx` (nhãn giá tự lấy, form để trống giá), `web/test/states.test.tsx` (biểu đồ quay về sản phẩm mặc định sau SC21, lỗi/thử lại, SC22 phía web: trang sửa báo không tìm thấy).

Chưa kiểm: chạy trên điện thoại thật (bố cục 360–430px, bàn phím số, vùng an toàn iPhone, nút back) và biểu đồ SC26 trên màn hình thật.

## Câu hỏi mở
- [ ] Danh sách sản phẩm nhập sẵn: xem `work/2026-11-03-mvp/plan.md` (mục Dữ liệu khởi tạo). SJC, DOJI, PNJ chưa đọc được trang chính thức.
