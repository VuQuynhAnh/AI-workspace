# Domain: Danh mục và lãi/lỗ (HOLD)

> Kiểm ở commit `fe2c586` (nhánh `feat/mvp`, 2026-11-03). Chi tiết theo UC: `HOLD-UC01.md` mục Cài đặt.

| ID | Rule | Code |
|---|---|---|
| HOLD-BR-001 | Một lần mua gồm: thương hiệu, sản phẩm, khối lượng, ngày mua (bắt buộc), giờ mua (tuỳ chọn), giá mua (đơn giá hoặc tổng tiền, xem HOLD-UC01/BR-5), ghi chú. | `server/src/purchases/validate.ts:42` |
| HOLD-BR-002 | Khối lượng nhập được theo chỉ, lượng, gram hoặc kg. Quy đổi: 1 lượng = 10 chỉ, 1 chỉ = 3,75 g, 1 kg = 1000 g. Lưu một đơn vị gốc thống nhất (miligram số nguyên) để không sai số khi đổi qua đổi lại. | `shared/src/units.ts:10`, `shared/src/units.ts:27` |
| HOLD-BR-003 | Giá mua do người dùng nhập. Nếu đã có ảnh chụp giá phù hợp (`PRICE-BR-004`) thì ô giá mua được điền sẵn giá bán ra để người dùng sửa. | `server/src/routes.ts:42`, `web/src/components/PurchaseDialog.tsx:89` |
| HOLD-BR-004 | Giá trị hiện tại = khối lượng × **giá mua vào** mới nhất của đúng sản phẩm đó. Lãi/lỗ = giá trị hiện tại − tổng tiền mua. Tỷ lệ = lãi/lỗ ÷ tổng tiền mua. | `shared/src/pnl.ts:8`, `shared/src/pnl.ts:13` |
| HOLD-BR-005 | Thống kê theo từng lần mua và cộng dồn theo sản phẩm, theo kim loại và toàn danh mục. Mỗi con số hiển thị kèm thời điểm của giá đang dùng. | `server/src/portfolio/service.ts:83` |
| HOLD-BR-006 | Sản phẩm chưa có giá hiện tại thì hiện "chưa có giá" và không cộng vào tổng lãi/lỗ (không coi là 0). | `server/src/portfolio/service.ts:67-68` |
| HOLD-BR-007 | Khi thêm lần mua, ô thương hiệu mặc định là **Phú Quý**, người dùng đổi được sang thương hiệu khác trong danh sách. Thương hiệu chưa có nguồn giá vẫn chọn được, sản phẩm lấy từ danh sách nhập sẵn, chỉ là không có gợi ý giá và lãi/lỗ (`HOLD-BR-006`). | `server/src/catalog.ts:28`, `web/src/components/PurchaseDialog.tsx:27` |

## Câu hỏi mở

- Ghi nhận **bán ra** (bán một phần hay toàn bộ, chốt lãi thực): để UC sau, không nằm trong HOLD-UC01.
