# Chọn vị trí cửa hàng trên Google Maps + chặn chấm QR ngoài bán kính

Việc: 2026-10-28-chan-ngoai-ban-kinh · Spec: specs/store/STORE-UC01.md, specs/clocking/CLK-UC01.md (BR-14, SC16–18) · Repo: smartclocking · Branch: feat/chan-ngoai-ban-kinh

## Bối cảnh
Hiện admin phải gõ vĩ độ/kinh độ bằng tay, và chấm công ngoài bán kính chỉ bị gắn cờ (CLK-BR-008). Việc này thêm hai phần:
- Bản đồ Google Maps để chọn vị trí cửa hàng.
- Công tắc (mặc định tắt) để chặn chấm QR ngoài bán kính, có trừ hao sai số GPS tối đa 100 m.

Chấm bằng Wi-Fi giữ nguyên.

## Mẫu tham chiếu
- Thiết lập boolean + ràng buộc "cần có vị trí": `wifi_clocking_enabled` (`backend/src/services/storeSetting.service.js:46-49`, `:81-85`; `frontend/src/pages/admin/StoreSetting.jsx:152-172`).
- Kiểm khoảng cách có trừ hao GPS và thông báo lỗi: `nearStoreForWifi` / `assertNearStoreForWifi` (`backend/src/services/clocking.service.js:80-105`).
- Test service với repo giả: `backend/test/clocking.service.test.js` (khối Wi-Fi).

## Ảnh hưởng
- `clocking.service.check` (nhánh QR) là luồng nóng của CLK-UC01. Nhánh Wi-Fi dùng chung hàm đo khoảng cách → refactor phải giữ nguyên hành vi Wi-Fi (test Wi-Fi hiện có phải vẫn pass).
- `serializeSetting` dùng cho `/hr/setting` và `/clocking/me/today` → thêm 1 trường, không đổi trường cũ.
- Không đổi schema (thiết lập key-value, R-SETTING-01). Không cần reset DB.

## Thiết kế
- **Dữ liệu:** `SETTING_KEY.CHECK_IN_RADIUS_ENFORCED = "check_in_radius_enforced"`, kiểu BOOLEAN, mặc định `false`.
- **API:** `PATCH /api/hr/setting` nhận thêm `checkInRadiusEnforced: boolean`. `serializeSetting` trả thêm `checkInRadiusEnforced`. `POST /api/clocking/check` (QR) có thêm lỗi 403 khi ngoài bán kính.
- **Kiểm tra khi chấm:** tổng quát hoá `nearStoreForWifi(setting, gps)` thành `nearStore(setting, gps, maxDistanceMeters)`. Wi-Fi gọi với `wifi_max_distance_meters`, QR gọi với `check_in_radius_meters`. Kiểm tra trước transaction, ngay sau bước kiểm cửa hàng còn hoạt động.
- **UI:**
  - Component `StoreLocationMap` gồm: bản đồ, ghim kéo được, bấm để đặt ghim, vòng tròn bán kính, ô tìm địa chỉ (Geocoder).
  - Nạp Google Maps JS động bằng bootstrap `importLibrary`, không thêm dependency npm. Nếu không có khoá hoặc nạp lỗi thì hiện dòng thông báo thay cho bản đồ.
  - Thêm công tắc chặn. Sửa lại các ghi chú (HelpTip) đang ghi "không chặn".
- **Cấu hình:** `VITE_GOOGLE_MAPS_API_KEY` (bắt buộc để hiện bản đồ) và `VITE_GOOGLE_MAPS_MAP_ID` (tuỳ chọn, mặc định `DEMO_MAP_ID`). Thêm vào `frontend/.env.example` và README.

## Checklist
### Backend
- [x] `backend/src/constants/enums.js`: thêm `CHECK_IN_RADIUS_ENFORCED` vào `SETTING_KEY` và `SETTING_DEFINITIONS` (STORE-UC01/BR-6)
- [x] `backend/src/services/serializers.js` `serializeSetting`: thêm `checkInRadiusEnforced`
- [x] `backend/src/services/storeSetting.service.js`: parse và validate boolean; chặn bật khi chưa có vị trí, và chặn xoá vị trí khi đang bật (BR-6)
- [x] `backend/src/services/clocking.service.js`: `nearStore` dùng chung; chặn QR ngoài bán kính khi bật (CLK-UC01/BR-14)
- [x] `backend/src/db/seed.js`: bật chặn cho cửa hàng mẫu thứ 2 để demo được cả hai chế độ
### Test (viết trước)
- [x] `backend/test/clocking.service.test.js`: SC16, SC17, SC18; các test Wi-Fi cũ vẫn pass
- [x] `backend/test/storeSetting.service.test.js` (mới): bật khi chưa có vị trí, xoá vị trí khi đang bật, giá trị không phải boolean, bật hợp lệ
### Frontend
- [x] `frontend/src/utils/googleMaps.js`: nạp Google Maps JS một lần, trả về null nếu không có khoá
- [x] `frontend/src/components/hr/StoreLocationMap.jsx`: bản đồ, ghim, bấm để đặt, vòng tròn bán kính, tìm địa chỉ (BR-1..5)
- [x] `frontend/src/pages/admin/StoreSetting.jsx`: gắn bản đồ, công tắc chặn, sửa HelpTip (BR-6, BR-7)
- [x] `frontend/src/pages/employee/CheckIn.jsx`: ghi chú cách chấm công nói rõ giới hạn phạm vi khi cửa hàng bật chặn
- [x] `frontend/src/styles/custom.css`: chiều cao khung bản đồ (R-FE-03, không viết style inline)
- [x] `frontend/.env.example`: thêm `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`
### Kiểm tra
- [x] `npm test` (backend) pass
- [x] `npm run build` (frontend) pass
- [x] Backend import được (`createContainer`)
- [ ] Chạy tay: **cần bạn làm**, vì cần khoá Google Maps và DB thật — xem hướng dẫn ở mục Kết quả
### Tài liệu (CONVENTIONS §6)
- [x] STORE-UC01 và CLK-UC01 → `implemented`, điền mục "Cài đặt"
- [x] ARCHITECTURE: thêm Google Maps vào bảng dịch vụ ngoài §1, thêm bẫy về khoá Google Maps
- [x] README của repo: thêm biến `VITE_GOOGLE_MAPS_API_KEY`; sửa mô tả "chỉ gắn cờ, không chặn"
- [x] `node tools/check-docs.mjs` sạch

## Rủi ro / bẫy liên quan
- ARCHITECTURE §6.2: không ảnh hưởng, vì việc này không xử lý ngày giờ.
- Google Maps chỉ chạy được khi có khoá thật. Không có khoá thì mình không kiểm được phần bản đồ trên trình duyệt; chỉ kiểm được build và nhánh không có khoá.
- Sai số GPS do client tự khai có thể nới bán kính thêm tối đa 100 m. Bạn đã chấp nhận điều này (giống cách chấm Wi-Fi).

## Câu hỏi mở
- [x] ~~Bạn tự tạo khoá Google Maps~~ — không còn cần: đã đổi sang OpenStreetMap (xem "Thay đổi sau khi chạy thử").

## Kết quả
- `npm test` (backend): 94 test, pass 94, fail 0. 13 test mới: 6 test chặn ngoài bán kính, 7 test thiết lập. Trước khi viết code, 8 test mới fail đúng lý do.
- Đột biến thử: bỏ dòng chặn (`if (!byWifi) await assertWithinCheckInRadius…`) thì 2 test fail. Đã khôi phục, chạy lại pass 94.
- `npm run build` (frontend): pass. Cảnh báo bundle > 500 kB đã có sẵn trên `main`, không do việc này.
- Backend import được (`createContainer`).
- **Chưa kiểm trên trình duyệt:** phần bản đồ cần khoá Google Maps thật. Đã kiểm qua build và đọc code, chưa chạy giao diện.
- Phát sinh: `tools/check-docs.mjs` so với working tree thay vì HEAD, để phát hiện cả thay đổi code chưa commit.

### Hướng dẫn chạy tay
1. Đặt `VITE_GOOGLE_MAPS_API_KEY` trong `frontend/.env`, rồi chạy `npm run dev` ở cả hai thư mục.
2. Đăng nhập `admin.hoankiem@smartclocking.vn` / `Admin@123` → Thiết lập. Kiểm tra: bản đồ, bấm và kéo ghim, tìm địa chỉ, vòng tròn bán kính, bật chặn rồi lưu.
3. Chạy `npm run seed` (**xoá sạch DB**) để cửa hàng Cầu Giấy bật sẵn chặn. Đăng nhập nhân viên Cầu Giấy, chấm QR ở xa cửa hàng → thấy thông báo "Bạn đang cách cửa hàng khoảng … m".

## Thay đổi sau khi chạy thử (theo yêu cầu của user)
- Bố cục màn Thiết lập: form chiếm toàn chiều ngang tới 1200 px, chia 3 nhóm ("Ca làm và tiền phạt", "Vị trí và phạm vi chấm công", "Chấm công bằng Wi-Fi"). `TimeInput` thêm prop `block` để ô giờ cao bằng các ô khác. Công tắc chặn đặt trên ô bán kính, cùng kiểu khối Wi-Fi.
- **Đổi Google Maps → OpenStreetMap + Leaflet** (miễn phí, không cần khoá API, không cần thẻ thanh toán). Tìm địa chỉ dùng Nominatim. Thêm dependency `leaflet` 1.9.4 (user đồng ý). Bỏ `utils/googleMaps.js` và các biến `VITE_GOOGLE_MAPS_*`. `npm audit` vẫn báo đúng 4 lỗ hổng như trước khi thêm `leaflet`.
