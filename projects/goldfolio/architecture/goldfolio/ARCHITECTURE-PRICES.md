# goldfolio — ARCHITECTURE-PRICES (bẫy nguồn giá)

> Tách từ `ARCHITECTURE.md` §6 vì file chính vượt 15 KB; giữ nguyên số thứ tự bẫy (§6.n) để các chỗ đang trích không đổi. Kiểm ở commit `59a6180` (nhánh `main`, 2026-11-05).

1. **Bảng bạc có 2 dòng nhóm** (`server/src/prices/phuquy/parse.ts:78`): "BẠC THƯƠNG HIỆU PHÚ QUÝ" đứng trước, "… KHÁC" đứng sau. Coi mọi dòng nhóm là "hãng khác" thì mất toàn bộ bạc Phú Quý.
2. **Bảng vàng trang chủ có dòng bạc theo chỉ** (`server/src/prices/phuquy/parse.ts:59`): bỏ khi lấy giá live; chỉ dùng trong giá theo ngày, nhân lên lượng qua `matchRows`. Sản phẩm theo kg không nhận giá quy từ chỉ (`server/src/prices/match.ts:46`).
3. **Dữ liệu XemLai bẩn**: có ngày 2 dòng "Nhẫn tròn" trùng (lấy dòng đầu), tên viết hoa/dấu cách không đều, năm 2023 không có bạc. Thêm tên khác vào `aliases` trong `catalog.ts`, đừng sửa bộ đọc.
4. **Ẩn sản phẩm theo bảng live** (`server/src/prices/service.ts:117`): mỗi lần lưu bảng mới, sản phẩm `live` cùng kim loại không có trong bảng bị `active = 0`. Bảng đọc thiếu dòng (nhưng không lỗi) sẽ ẩn nhầm sản phẩm khỏi form thêm mới; lần mua cũ vẫn giữ.
5. **Lỗi mạng ≠ không có dữ liệu** (`server/src/prices/service.ts:184`): fetch lỗi thì không ghi `daily_misses`, để lần sau thử lại. Ghi nhầm thì ngày đó không bao giờ được gợi ý giá.
9. **"Hôm nay chưa xong"** (`server/src/prices/service.ts:174`): cache kiểu "nguồn không có dữ liệu ngày X" chỉ được ghi cho ngày đã qua theo giờ VN. Ghi cho hôm nay thì ngày đó bị chặn vĩnh viễn; lỗi chỉ lộ khi chạy qua ngày.
