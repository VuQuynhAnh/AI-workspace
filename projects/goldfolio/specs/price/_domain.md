# Domain: Giá (PRICE)

> Kiểm ở commit `3635158` (nhánh `main`, 2026-11-17). UC: `PRICE-UC02` (AI nhận định xu hướng), `PRICE-UC03` (chat hỏi AI). Phần còn lại là cài đặt tối thiểu cho HOLD-UC01 (adapter Phú Quý, lấy giá 15 phút/lần).

## Khảo sát nguồn giá (2026-11-02)

**Phú Quý (thương hiệu mặc định)**
- `phuquygroup.vn`: một bảng giá vàng + bạc, cột "Mua vào" / "Bán ra", đơn vị **VNĐ/Chỉ**, "đã bao gồm thuế GTGT", ghi "cập nhật lần cuối lúc HH:mm dd/MM/yyyy". Các dòng gồm Nhẫn tròn Phú Quý 999.9, Phú Quý 1 Lượng 999.9 / 99.9, Vàng miếng SJC, Vàng trang sức 999.9 / 999 / 99 / 98, Vàng 999.9 / 999.0 phi SJC (chỉ có 1 giá), Bạc thỏi Phú Quý 999, Đồng bạc mỹ nghệ 999. Đọc được bình thường.
- `giabac.phuquygroup.vn`: bảng giá bạc riêng, mỗi dòng có cột đơn vị. Đây là đơn vị niêm yết thật của bạc.
  - **VNĐ/lượng:** bạc miếng 1 lượng, bạc thỏi 10 / 5 lượng, đồng bạc mỹ nghệ.
  - **VNĐ/kg:** bạc thỏi 1 kilo.
  - Giá theo chỉ trên trang chính chỉ là giá theo lượng chia 10 (159.100 × 10 = 1.591.000).
- `phuquy.com.vn/bang-gia/vang`: có Cloudflare chặn bot. Gọi tự động nhận 403 "Just a moment…". Không được lách. Chỉ dùng được nếu tìm ra endpoint không bị chặn (user xem trong DevTools).
- **Lịch sử theo ngày (khảo sát 2026-11-03):** `phuquygroup.vn/XemLai?date=yyyy-MM-dd` trả về HTML cùng cấu trúc bảng (class `buy-price` / `sell-price`), tiêu đề "Giá vàng ngày dd/MM/yyyy", **không có giờ**. Đã thử: 01/11/2026, 15/01/2025, 01/06/2023 đều có dữ liệu.
  - Ngày 15/01/2025 có 2 dòng "Nhẫn tròn Phú Quý 999.9" trùng nhau, không có dòng "Phú Quý 1 Lượng 999.9".
  - Ngày 01/06/2023 không có dòng bạc.
  - Tên viết hoa và dấu cách không thống nhất: "Phú quý 1 lượng 99.9", "Vàng 999.0  phi SJC".
- Trang bạc lấy bảng qua `GET /PhuQuyPrice/SilverPricePartial` (HTML) và giờ cập nhật qua `GET /PhuQuyPrice/GetDateTimeUpdate`, trả về JSON `{"success":true,"lastTime":"08:42","lastDate":"03/11/2026"}`. Trang bạc không có lịch sử. Lịch sử bạc chỉ có trong `XemLai`, theo VNĐ/chỉ.
- Không có API công khai. Các endpoint trên là endpoint nội bộ của trang, có thể đổi bất cứ lúc nào.
- **API JSON phía sau `phuquy.com.vn` (khảo sát 2026-11-05):** `GET https://be.phuquy.com.vn/jewelry/product-payment-service/api/products/statistics-price/{id}?type=1&duration=&fromDate=dd/MM/yyyy&toDate=dd/MM/yyyy` (có lịch sử theo khoảng ngày). Gọi từ server với User-Agent của app → **403 thử thách Cloudflare**; trình duyệt chạy được nhờ cookie Cloudflare. Không dùng: phải giả trình duyệt/chép cookie = lách chặn bot (R-SRC-02). Chỉ dùng được nếu Phú Quý cấp quyền (API key / allowlist).

**Trang tổng hợp webgia.com** (có trang riêng cho Phú Quý, SJC, Bảo Tín Minh Châu, Bảo Tín Mạnh Hải, DOJI, PNJ)
- **Không dùng làm nguồn giá.** Lý do:
  - Không có API, chỉ có HTML.
  - Điều khoản sử dụng: chỉ cho dùng cá nhân, không thương mại; cấm "sao chép, phân phối, … tái xuất bản". App nhiều tài khoản là đăng lại dữ liệu.
  - Nhãn đơn vị không tin được: trang Bảo Tín Mạnh Hải ghi "đồng / chỉ" cho cả bạc thỏi 1 KG.
  - Lịch sử theo ngày chỉ có SJC (`/gia-vang/sjc/dd-mm-yyyy.html`). Trang tương ứng của Phú Quý trả về 404.
- Dùng được để biết thương hiệu nào có những sản phẩm gì, rồi tìm trang chính thức của thương hiệu đó.

| ID | Rule | Code |
|---|---|---|
| PRICE-BR-001 | Mỗi thương hiệu lấy giá qua một adapter riêng, đọc từ **trang chính thức** của thương hiệu. Adapter trả về danh sách sản phẩm gồm giá mua vào, giá bán ra (có thể thiếu), đơn vị niêm yết và thời điểm cập nhật do nguồn công bố. Phú Quý là adapter đầu tiên. | `server/src/prices/types.ts:30`, `server/src/prices/phuquy/adapter.ts:19` |
| PRICE-BR-002 | Hệ thống lấy giá định kỳ và lưu thành ảnh chụp giá. Bảng giá giống hệt lần trước thì không lưu thêm. | `server/src/prices/scheduler.ts:11`, `server/src/prices/service.ts:124` |
| PRICE-BR-003 | Nguồn lỗi hoặc đổi cấu trúc trang thì giữ ảnh chụp giá gần nhất và báo "giá cập nhật lúc …". Không bao giờ ghi giá 0 hoặc giá rỗng. | `server/src/prices/phuquy/parse.ts:10`, `server/src/prices/phuquy/adapter.ts:19` |
| PRICE-BR-004 | Gợi ý giá mua cho một lần mua: lấy ảnh chụp giá gần nhất ở **trước hoặc đúng** thời điểm mua của sản phẩm đó (không có giờ mua thì lấy cuối ngày mua). Trong ngày mua không có ảnh chụp nào thì dùng **giá theo ngày** do nguồn công bố, nếu nguồn có. Vẫn không có thì không gợi ý. | `server/src/prices/service.ts:154` |
| PRICE-BR-007 | Giá theo ngày của một ngày chỉ hỏi nguồn **khi cần** (lúc gợi ý giá, hoặc lúc lưu lần mua để so giá theo HOLD-UC01/BR-16) và chỉ hỏi một lần, kể cả khi nguồn báo ngày đó không có dữ liệu. Ngoại lệ duy nhất (user chốt 2026-11-05): tải bù **30 ngày đã qua gần nhất** cho nhận định xu hướng (PRICE-UC02/BR-1), tuần tự, nghỉ 1,5 giây giữa hai lần hỏi; không quét xa hơn. | `server/src/prices/service.ts:195`, `server/src/prices/service.ts:206`, `server/src/prices/service.ts:219` |
| PRICE-BR-008 | Dòng giá của nguồn được khớp với sản phẩm qua tên đã chuẩn hoá (không phân biệt hoa thường, gộp dấu cách) cùng danh sách tên khác của từng sản phẩm. Dòng không khớp sản phẩm nào thì bỏ qua và ghi log. Dòng trùng thì lấy dòng đầu. | `server/src/prices/match.ts:32` |
| PRICE-BR-005 | Giá lưu theo đơn vị niêm yết của từng sản phẩm (chỉ, lượng hoặc kg). Khi tính toán thì quy đổi khối lượng của lần mua sang đơn vị đó theo `HOLD-BR-002`. | `server/src/prices/match.ts:32`, `shared/src/money.ts:21` |
| PRICE-BR-006 | Một sản phẩm có thể chỉ có giá mua vào (vd vàng nguyên liệu của Bảo Tín Mạnh Hải, "phi SJC" của Phú Quý). Thiếu giá bán ra thì không gợi ý giá mua, nhưng vẫn tính được lãi/lỗ. | `server/src/schema.sql:66`, `server/src/routes.ts:42` |

## Câu hỏi mở

- Tần suất lấy giá hiện tại: **15 phút** (đã chốt 2026-11-03).
- Khảo sát nguồn của hãng khác (2026-11-03): Bảo Tín Minh Châu (`btmc.vn`) và Bảo Tín Mạnh Hải (`baotinmanhhai.vn/bang-gia-vang`) đọc được, giá vàng theo nghìn đồng/chỉ, bạc theo lượng hoặc kg. SJC trả 403. DOJI và PNJ nạp bảng giá bằng JavaScript nên chưa đọc được.
- Nguồn chính thức của SJC, Bảo Tín Minh Châu, Bảo Tín Mạnh Hải, DOJI, PNJ: cần khảo sát từng trang (có API không, có chặn bot không) trước khi viết adapter.
- Lịch sử giá: có giá theo ngày của 30 ngày gần nhất (tải bù, PRICE-BR-007) cộng ảnh chụp từ lúc app chạy. Có cần lịch sử xa hơn không?
