# STORE-UC01 — Đặt vị trí cửa hàng và phạm vi chấm công

> Trạng thái: implemented · Việc: 2026-10-28-chan-ngoai-ban-kinh · Cập nhật: 2026-10-28
> Kiểm ở commit `eb82f95`. Đường dẫn tính từ `repos/smartclocking/`.
> Phạm vi UC này chỉ gồm phần **vị trí và phạm vi chấm công** của màn Thiết lập cửa hàng. Giờ ca, tiền phạt và Wi-Fi sẽ được bổ sung khi reverse toàn màn.

## Mục tiêu
Admin cửa hàng đặt chính xác vị trí cửa hàng bằng cách chọn trên bản đồ (OpenStreetMap, miễn phí), thay vì gõ vĩ độ/kinh độ. Admin đặt bán kính chấm công và **tuỳ chọn chặn** nhân viên chấm công bằng QR khi đang ở ngoài bán kính đó.

## Phạm vi
- Vai trò: `admin` cửa hàng.
- Màn hình: `/admin/setting`, khối "Vị trí cửa hàng".
- API: `GET /api/hr/setting`, `PATCH /api/hr/setting`.
- Ngoài phạm vi:
  - Kiểm tra lúc nhân viên chấm công (CLK-UC01/BR-14).
  - Giờ ca, tiền phạt, chấm công Wi-Fi, mã QR.

## Quy tắc nghiệp vụ
- **BR-1:** Khối vị trí có bản đồ OpenStreetMap (thư viện Leaflet, không cần khoá API). Admin đặt vị trí cửa hàng bằng một trong các cách:
  - Bấm vào một điểm trên bản đồ.
  - Kéo ghim.
  - Tìm theo địa chỉ.
  - Bấm "Lấy vị trí hiện tại" (giữ nguyên như cũ).
  - Gõ thẳng vĩ độ/kinh độ.

  Ghim và hai ô toạ độ luôn đồng bộ với nhau, toạ độ lấy 6 chữ số thập phân.
- **BR-2:** Bản đồ vẽ **vòng tròn bán kính chấm công** quanh ghim, cập nhật ngay khi đổi bán kính.
- **BR-3:** Tìm theo địa chỉ: gõ địa chỉ rồi bấm "Tìm" hoặc Enter.
  - Tìm thấy: bản đồ chuyển tới và đặt ghim tại kết quả đầu tiên, chỉ tìm trong Việt Nam (dịch vụ Nominatim của OpenStreetMap; tìm khi bấm, không tìm tự động lúc gõ).
  - Không tìm thấy: báo "Không tìm thấy địa chỉ này trên bản đồ." Lỗi kết nối: báo "Không tìm được địa chỉ (lỗi kết nối) — thử lại hoặc chọn trực tiếp trên bản đồ."
- **BR-4:** Chưa có vị trí thì bản đồ mở ở trung tâm Hà Nội, chưa có ghim. Có vị trí thì bản đồ mở tại vị trí đó.
- **BR-5:** Bản đồ không cần khoá hay cấu hình. Mất mạng hoặc máy chủ bản đồ lỗi thì khung bản đồ trống, các cách nhập khác (gõ toạ độ, "Lấy vị trí hiện tại") vẫn dùng bình thường. Bản đồ luôn ghi nguồn "© OpenStreetMap".
- **BR-6:** Thêm công tắc **"Chặn chấm công QR ngoài bán kính"**:
  - Mặc định **tắt**: chấm ngoài bán kính chỉ bị gắn cờ, như hiện tại.
  - Cửa hàng chưa có vị trí thì không bật được. Gửi lên vẫn bị chặn: 400 "Cần đặt vị trí cửa hàng (vĩ độ, kinh độ) trước khi bật chặn chấm công ngoài bán kính."
  - Xoá vị trí khi công tắc đang bật cũng bị chặn với cùng thông báo.
  - Giá trị không phải true/false: 400 "Giá trị bật/tắt chặn chấm công ngoài bán kính không hợp lệ."
- **BR-7:** Bán kính chấm công vẫn trong khoảng 10–5000 m (không đổi). Dưới bản đồ: công tắc chặn, rồi tới ô bán kính (cùng kiểu khối Wi-Fi). Ghi chú trên màn hình nói rõ: khi bật chặn thì ngoài bán kính sẽ không chấm được bằng QR, còn khi tắt thì chỉ bị gắn cờ.
- **BR-8:** "Lấy vị trí hiện tại" dò GPS **tối đa 3 giây** và lấy lần đọc chính xác nhất. App dừng ngay khi sai số ≤ 50 m; trong lúc dò hiện "Đang dò GPS…". Lấy xong thì **luôn** điền vĩ độ, kinh độ, đặt ghim và bản đồ bay tới, phóng to vào vị trí đó. Màn hình hiện thêm sai số:
  - ≤ 100 m: "Vị trí hiện tại, độ chính xác khoảng ±<n> m."
  - > 100 m: vẫn điền vị trí, kèm cảnh báo "Vị trí lệch ±<n> m (quá 100 m) — kiểm tra và kéo ghim tới đúng cửa hàng." (dấu "?" giải thích: máy tính thường không có GPS, nên lấy vị trí bằng điện thoại tại cửa hàng).
  - Chọn trên bản đồ hoặc gõ tay toạ độ thì dòng sai số biến mất.

## Scenario
```gherkin
Scenario: STORE-UC01-SC1 Chọn vị trí trên bản đồ
  Given admin mở Thiết lập cửa hàng
  When bấm vào một điểm trên bản đồ
  Then ghim chuyển tới điểm đó; ô vĩ độ, kinh độ cập nhật theo (6 chữ số thập phân)
  And vòng tròn bán kính vẽ quanh ghim
  When bấm "Lưu thiết lập"
  Then vị trí mới được lưu

Scenario: STORE-UC01-SC2 Tìm theo địa chỉ
  When gõ "12 Hàng Bài, Hoàn Kiếm, Hà Nội" và bấm "Tìm"
  Then bản đồ chuyển tới và đặt ghim tại địa chỉ đó
  When gõ một địa chỉ không tồn tại
  Then thấy "Không tìm thấy địa chỉ này trên bản đồ."

Scenario: STORE-UC01-SC3 Mất kết nối tới máy chủ bản đồ
  Given không tải được bản đồ OpenStreetMap
  Then khung bản đồ trống; vẫn gõ toạ độ hoặc bấm "Lấy vị trí hiện tại" được
  And vẫn nhập toạ độ và lưu được

Scenario: STORE-UC01-SC4 Bật chặn khi chưa có vị trí
  Given cửa hàng chưa đặt vị trí
  Then công tắc "Chặn chấm công QR ngoài bán kính" bị vô hiệu
  When vẫn gửi checkInRadiusEnforced = true qua API
  Then bị từ chối 400 "Cần đặt vị trí cửa hàng (vĩ độ, kinh độ) trước khi bật chặn chấm công ngoài bán kính."

Scenario: STORE-UC01-SC5 Xoá vị trí khi đang bật chặn
  Given đang bật chặn
  When xoá trống vĩ độ, kinh độ và lưu
  Then bị từ chối với cùng thông báo trên

Scenario: STORE-UC01-SC6 Bật chặn
  Given cửa hàng đã có vị trí
  When bật công tắc và lưu
  Then thiết lập được lưu; nhân viên chấm QR ngoài bán kính bị từ chối (CLK-UC01-SC16)
```

## Cài đặt
| Mục | Code | Test |
|---|---|---|
| BR-1 (bản đồ, ghim, bấm chọn) | `frontend/src/components/hr/StoreLocationMap.jsx:50-65`, `frontend/src/pages/admin/StoreSetting.jsx:54-62`, `:179-185` | — (chạy tay) |
| BR-2 (vòng tròn bán kính) | `frontend/src/components/hr/StoreLocationMap.jsx:68-88` | — |
| BR-3 (tìm địa chỉ) | `frontend/src/components/hr/StoreLocationMap.jsx:90-111` | — |
| BR-4 (mở ở Hà Nội khi chưa có vị trí) | `frontend/src/components/hr/StoreLocationMap.jsx:8-11`, `:52` | — |
| BR-5 (bản đồ OSM, ghi nguồn) | `frontend/src/components/hr/StoreLocationMap.jsx:24-29`, `:53` | — |
| BR-6 (công tắc chặn) | `backend/src/constants/enums.js:66`, `:80-82`, `backend/src/services/storeSetting.service.js:47-52`, `:92-96`, `frontend/src/pages/admin/StoreSetting.jsx:194-239` | `storeSetting.service.test.js` (SC4, SC5, SC6) |
| BR-7 (ghi chú) | `frontend/src/pages/admin/StoreSetting.jsx:148-152`, `:209-214` | — |
| BR-8 (lấy vị trí + sai số) | `frontend/src/utils/geo.js:17-53`, `frontend/src/pages/admin/StoreSetting.jsx:12-14`, `:68-85`, `:157-162`, `:174-185` | — (chạy tay) |
| Thư viện | `frontend/package.json` (`leaflet` 1.9.4) | — |

## Câu hỏi mở
- [ ] Máy chủ bản đồ và tìm địa chỉ của OpenStreetMap có quy định dùng hợp lý. Lượng truy cập lớn thì nên đổi sang nhà cung cấp khác (sửa `TILE_URL` / `GEOCODE_URL`).
