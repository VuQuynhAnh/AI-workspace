# Lịch gọn hơn: mở nhanh, 1 hồ sơ, đổi ngày gọn, chọn tháng/năm, màu ngày

## Yêu cầu (user, 2026-11-18)
1. Mở app là thấy lịch ngay.
2. Mỗi máy chỉ 1 hồ sơ; đã có hồ sơ thì tab Tiện ích hiện kiểu khác (thẻ hồ sơ).
3. Đổi ngày chiếm ít chỗ: một khung với nút mũi tên 2 chiều để đảo Dương ⇄ Âm.
4. Lịch cho chọn tháng, năm trực tiếp, không phải vuốt nhiều lần.
5. Bộ màu các ngày nổi bật hơn.

## Cách làm
1. **Mở nhanh:**
   - Web có service worker giữ sẵn giao diện; mở lại là hiện ngay từ bộ nhớ, rồi cập nhật bản mới ở nền.
   - `/api` luôn đi mạng.
   - Lịch không phải chờ server miễn phí đang ngủ.
2. **1 hồ sơ:**
   - Web chỉ cho tối đa 1 hồ sơ trên máy.
   - Tab Tiện ích:
     - chưa có hồ sơ: nút "Thêm hồ sơ";
     - có rồi: thẻ hiện tên, ngày giờ sinh, tuổi, mệnh, nút "Xem tử vi" và "Sửa".
   - Bỏ trang danh sách hồ sơ (`/ho-so` chuyển về Tiện ích) và bỏ chọn người ở trang Tử vi.
   - Server giữ nguyên.
3. **Đổi ngày:**
   - Một khung, đầu khung "Dương ⇄ Âm" với nút mũi tên 2 chiều đảo chiều.
   - Ô nhập đổi theo chiều; kết quả một dòng kèm "Xem trên lịch".
4. **Chọn tháng/năm:**
   - Chạm tiêu đề "Tháng 11 · 2026 ▾" mở khung chọn tháng (12 ô) và năm (1900–2100), cùng nút "Hôm nay".
   - Vẫn giữ vuốt ngang và ‹ ›.
5. **Màu:**
   - Hôm nay: nền vàng đặc, chữ tối.
   - Ngày đang chọn: viền.
   - Ngày nghỉ lễ: nền đỏ nhạt, chữ đỏ.
   - Lễ khác: chữ vàng.
   - Chủ nhật đỏ, thứ Bảy xanh.
   - Mùng 1 và rằm: ngày âm đỏ đậm.
   - Thêm token `sat` (xanh) cho cả sáng/tối. Widget Android đổi theo cùng bộ màu.

## Spec đổi
- CAL-UC01: BR-2 (màu), BR-5 (đổi ngày gọn), thêm BR-12 (chọn tháng/năm), BR-13 (mở nhanh).
- HORO-UC01: BR-1 (1 hồ sơ mỗi máy), BR-7 (bỏ chọn người).

## Rủi ro
- Service worker giữ bản cũ: lần mở đầu sau khi deploy vẫn là bản cũ, lần sau mới là bản mới. Chấp nhận để đổi lấy mở nhanh.
