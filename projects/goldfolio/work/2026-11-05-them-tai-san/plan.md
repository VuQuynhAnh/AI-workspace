# Thêm tài sản nhiều sản phẩm, lọc Vàng/Bạc, ô khối lượng chọn/gõ, ô tiền VNĐ

Việc: 2026-11-05-them-tai-san · Spec: HOLD-UC01 (BR-1, BR-3, BR-11 sửa; BR-17…BR-20 mới; SC1, SC5, SC19 sửa; SC38…SC43 mới) · Repo: goldfolio · Branch: `feat/them-tai-san` (từ `main`)

## Quyết định của user (2026-11-05)
- Sản phẩm và thương hiệu như cũ (mặc định Phú Quý); **sản phẩm mặc định Nhẫn tròn Phú Quý 999.9**.
- Giữ ô đơn vị; ô khối lượng vừa chọn vừa gõ; chỉ: 0,5–10 bước 0,5, mặc định 0,5, bước nhỏ nhất 0,1. Gợi ý đơn vị khác do mình đặt: lượng 1/2/3/5/10, gram 1/2/5/10/37,5, kg 0,5/1/2/5.
- Lọc **Vàng | Bạc | Tất cả** ở cả 3 tab, mặc định Vàng.
- **"Thêm tài sản"** nhiều dòng, mỗi dòng lưu thành một lần mua.
- Ô đơn giá/tổng tiền hiển thị dạng VNĐ.

## Thiết kế
- `shared/units.ts`: `parseWeight(input, unit)` — chỉ: tối đa 1 chữ số thập phân ("Khối lượng nhập theo bước 0,1 chỉ"); đơn vị khác 3. `WEIGHT_PRESETS` theo đơn vị.
- `catalog.ts`: cờ `isDefault` cho sản phẩm; `GET /api/brands` trả `isDefault` của sản phẩm.
- `POST /api/purchases/batch` `{ purchaseDate, purchaseTime, note, items: [...] }`: kiểm tra mọi dòng (gom lỗi dạng `items.<i>.<ô>`), tự lấy giá từng dòng (BR-16), rồi ghi tất cả trong **một transaction**. Tối đa 20 dòng.
- `GET /api/portfolio/history`: danh sách sản phẩm kèm `metal` để web lọc.
- Web:
  - Bộ lọc kim loại lưu trong `PortfolioProvider` (giữ khi chuyển tab).
  - Trang thêm: nhiều dòng (`PurchaseLine` giữ logic gợi ý giá R-UI-02 cho từng dòng), dùng chung ngày/giờ/thương hiệu/ghi chú.
  - Trang sửa: một dòng như cũ.
  - `WeightCombo` (ô gõ + nút mở danh sách theo đơn vị), `MoneyInput` (hiện "13.850.000 VNĐ").
  - Đổi nhãn "Thêm lần mua" → "Thêm tài sản" (nút +, trạng thái rỗng, tiêu đề).

## Checklist
- [x] Test trước: shared (`parseWeight` theo đơn vị, preset), server (SC1 `isDefault`, SC5 bước 0,1, SC39, batch SC41/SC42 + giới hạn + lỗi tự lấy giá, history `metal`), web (SC1, SC38, SC40, SC41, SC42, SC43 + cập nhật test cũ)
- [x] Server: `units.ts`, `catalog.ts`, `routes.ts`, `validate.ts`, `purchases/routes.ts` (batch), `portfolio/service.ts`
- [x] Web: `api.ts`, context lọc, `MetalFilter`, `WeightCombo`, `MoneyInput`, `PurchaseFormPage` (nhiều dòng), 3 trang tab
- [x] `npm test`, `npm run lint`, `npm run build`; spec Cài đặt, ARCHITECTURE, README API, glossary; `check-docs`

## Rủi ro
- Form nhiều dòng giữ logic gợi ý giá R-UI-02 cho từng dòng: dễ mất khi tách component → giữ test race.
- Định dạng tiền khi gõ làm con trỏ nhảy nếu sửa giữa số; chấp nhận (gõ ở cuối là chính) — ghi lại nếu user thấy khó chịu.

## Ghi chú khi làm
- Yêu cầu đổi giữa chừng: bản "chỉ 2 sản phẩm" bị huỷ (user: "sản phẩm để như cũ, mặc định nhẫn tròn"); spec đã khôi phục rồi viết lại, không có code nào của bản đó.
- Logic gợi ý giá R-UI-02 chuyển sang `PurchaseLine` (mỗi dòng một bộ ref); đã thử đưa lại logic cũ → test race fail, khôi phục → pass.
- Nút Lưu ghi "Lưu N sản phẩm" khi có từ 2 sản phẩm.
- Gợi ý khối lượng cho lượng/gram/kg do mình đặt (user chưa nêu), dễ đổi trong `WEIGHT_PRESETS`.
- Đổi "món" → "sản phẩm" trên giao diện, thông báo server và tài liệu (user 2026-11-05).
- **Đơn giá theo đơn vị đang chọn** (user 2026-11-05): VNĐ/chỉ, VNĐ/lượng, VNĐ/g, VNĐ/kg; giá gợi ý và giá tự lấy quy từ đơn vị niêm yết (`convertUnitPrice`). Dữ liệu cũ có đơn vị nhập ≠ đơn vị niêm yết: tính lại `unit_cost` từ tổng tiền **một lần** (`runOnce`, bảng `app_migrations`), tổng tiền giữ nguyên. Test: SC44, SC45.
- ARCHITECTURE vượt 15 KB → tách bẫy nguồn giá (§6.1–6.5, §6.9) sang `ARCHITECTURE-PRICES.md`, giữ nguyên số thứ tự.
