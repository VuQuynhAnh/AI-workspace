# Giao diện mobile-first cho GoldFolio

Việc: 2026-11-03-mobile-ui · Spec: specs/holding/HOLD-UC01.md (không đổi hành vi) · Repo: goldfolio · Branch: feat/mobile-ui (tách từ `feat/mvp`, vì `main` chưa có code MVP)

## Bối cảnh
App dùng chủ yếu trên điện thoại (`projects/goldfolio/CLAUDE.md`, quy ước riêng). Giao diện MVP là một trang dài thiết kế từ màn rộng, form là hộp thoại. Việc này dựng lại web theo bố cục đã chốt ngày 2026-11-03:
- Thanh 3 tab dưới: **Tổng quan / Lịch sử / Lần mua**.
- Nút "+" nổi để thêm lần mua.
- Form thêm/sửa là màn hình riêng, chiếm toàn màn hình.

Không đổi API, server hay công thức. Mọi BR/SC của HOLD-UC01 giữ nguyên.

## Mẫu tham chiếu
- Nạp dữ liệu và tải lại sau khi sửa: `web/src/pages/PortfolioPage.tsx:21` (`load`), `web/src/pages/PortfolioPage.tsx:50` (`afterChange`). Sẽ chuyển thành context dùng chung cho 3 tab.
- Logic form (BR-1…7, R-UI-02): `web/src/components/PurchaseDialog.tsx:26`. **Giữ nguyên logic**, chỉ đổi vỏ từ hộp thoại (`web/src/components/PurchaseDialog.tsx:139`) sang trang toàn màn hình.
- Route có bảo vệ: `web/src/main.tsx:9`, `web/src/main.tsx:19-30`.
- Ô form, lỗi dưới ô, Pnl: `web/src/components/ui.tsx:8`, `web/src/components/ui.tsx:20`.

## Ảnh hưởng
- Spec/BR bị chạm: HOLD-UC01 mục Phạm vi (danh sách màn hình) và mục Cài đặt (`file:line` của web đổi hết). Hành vi BR-1…15 không đổi.
- Code dùng chung bị chạm:
  - `PortfolioPage` (chỉ `web/src/main.tsx` dùng) tách thành 3 trang.
  - `PurchaseDialog` (chỉ `PortfolioPage` dùng) thành trang `PurchaseFormPage`.
  - `DeleteConfirm` thành bottom sheet.
- Server, `shared`, dữ liệu: không đổi.

## Thiết kế

### Route (React Router, trong `AppShell`)
| Đường dẫn | Màn hình |
|---|---|
| `/` | **Tổng quan**: thẻ giá trị hiện tại + lãi/lỗ (to, đầu trang), tổng tiền mua, giờ giá, nhóm kim loại → sản phẩm. Trạng thái rỗng BR-11 |
| `/lich-su` | **Lịch sử**: chọn sản phẩm, biểu đồ cao gần hết màn, chú thích (BR-13, BR-14) |
| `/lan-mua` | **Lần mua**: danh sách thẻ, mới nhất trước; chạm thẻ để mở trang sửa |
| `/them`, `/sua/:id` | **Form toàn màn hình** (không có thanh tab): nút ← quay lại, nút Lưu dính đáy; trang sửa có nút "Xoá lần mua" ở cuối → bottom sheet xác nhận (BR-8) |

- `AppShell`: header gọn (tên app + menu tài khoản có Đăng xuất), vùng nội dung cuộn, `BottomNav` cố định đáy, nút `+` nổi phía trên thanh tab ở bên phải.
- Dữ liệu: `PortfolioProvider` nạp `/portfolio` và `/brands` một lần, cho cả 3 tab dùng chung; gọi `reload()` sau khi lưu hoặc xoá. Tab Lịch sử tự nạp `/portfolio/history`.
- Nút back của điện thoại: form là route riêng nên back là quay lại tab trước, không phải đóng hộp thoại.

### Quy tắc mobile (ghi thành luật R-UI-03 khi xong)
- Thiết kế cho khung 360–430px trước. Màn ≥ 768px: nội dung căn giữa, rộng tối đa khoảng 480px, vẫn giữ thanh tab dưới.
- Vùng bấm ≥ 44px; ô nhập cao 48px, chữ ≥ 16px (để iOS không tự phóng to khi chạm vào ô).
- `viewport-fit=cover` và chừa vùng an toàn (`env(safe-area-inset-bottom)`) cho thanh tab, nút Lưu và nút `+`.
- Bàn phím số: `inputMode="decimal"` cho khối lượng, `numeric` cho tiền (đã có ở MVP).
- Số tiền và lãi/lỗ hiện thẳng, không hiệu ứng (R-UI-01).

### Sửa luôn 2 lỗi Minor phần UI từ review MVP (vì đằng nào cũng làm lại các màn này)
- Biểu đồ dùng trục thời gian thật (khoảng cách theo số ngày), không dùng trục danh mục.
- Khi có lần mua chưa có giá, ghi "Không gồm N lần mua chưa có giá" ngay dưới số tổng, không để ở chân thẻ.

## Checklist
### 0. Chuẩn bị
- [x] Repo con: `git checkout -b feat/mobile-ui` từ `feat/mvp`
- [x] Thêm devDependency test web: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` (chờ user duyệt); script `test` cho `web`; `npm test` ở gốc chạy cả web

### 1. Khung app
- [x] `web/index.html`: `viewport-fit=cover`, `theme-color`
- [x] `web/src/index.css`: biến vùng an toàn, kích thước chạm tối thiểu
- [x] `web/src/portfolio-context.tsx`: `PortfolioProvider` / `usePortfolio()` (portfolio, brands, loading, error, reload)
- [x] `web/src/components/AppShell.tsx`: header + `<Outlet/>` + `BottomNav` + nút `+` (dẫn tới `/them`)
- [x] `web/src/components/BottomNav.tsx`: 3 tab, đánh dấu tab đang mở, có nhãn chữ (không chỉ icon)
- [x] `web/src/main.tsx`: route lồng trong `AppShell` theo bảng trên

### 2. Các màn hình
- [x] `web/src/pages/OverviewPage.tsx`: thẻ tổng quan (BR-9, BR-10), nhóm kim loại → sản phẩm, rỗng (BR-11), dòng "Không gồm N…" dưới số tổng
- [x] `web/src/pages/HistoryPage.tsx` + `HistoryChart` trục thời gian, chiều cao theo màn hình (BR-13, BR-14)
- [x] `web/src/pages/PurchasesPage.tsx`: thẻ lần mua (tên, khối lượng, ngày, tổng tiền, lãi/lỗ); chạm → `/sua/:id` (BR-10)
- [x] `web/src/pages/PurchaseFormPage.tsx`: chuyển logic từ `PurchaseDialog` sang trang toàn màn hình; nút Lưu dính đáy; trang sửa có "Xoá lần mua" (BR-1…8, BR-12, R-UI-02)
- [x] `web/src/components/ConfirmSheet.tsx`: bottom sheet "Xoá lần mua này? Không thể hoàn tác." (BR-8)
- [x] `web/src/pages/LoginPage.tsx`: soát lại kích thước ô và nút theo quy tắc mobile
- [x] Xoá `PortfolioPage.tsx`, `PurchaseDialog.tsx`, `DeleteConfirm.tsx` sau khi đã chuyển hết

### (phát sinh)
- [x] Kiểm test hồi quy race R-UI-02 có tác dụng: đưa tạm logic cũ (so với closure) vào thì test fail, hoàn nguyên thì pass
- [x] Trang đăng nhập: nút cao 48px, `min-h-dvh`
- [x] Nút `+` ẩn khi danh mục rỗng (đã có nút "Thêm lần mua" giữa trang, BR-11)

### Sửa sau review (phát sinh)
- [x] Test hồi quy biểu đồ quay về sản phẩm mặc định; `web/test/setup.ts` giả `ResizeObserver`
- [x] `LoadError` + trạng thái lỗi/thử lại cho 3 tab (R-UI-04)
- [x] Trang sửa: đang nạp khoá form, 404 hiện "Không tìm thấy lần mua"
- [x] ARCHITECTURE: R-UI-04

### Kiểm tra
- [x] Test web (vitest + Testing Library, `api` giả):
  - Form: SC1 (mặc định Phú Quý), SC9 (đổi thương hiệu xoá sản phẩm), SC13 (sửa tay không bị ghi đè), race của R-UI-02 (gõ giá trong lúc chờ gợi ý), SC20/SC24 (form sửa không gợi ý lại, giữ số đã nhập)
  - Xoá: SC21 (Huỷ thì còn, xác nhận thì gọi DELETE)
  - Tổng quan: SC19 (rỗng), SC17 (dòng "Không gồm 1 lần mua chưa có giá")
  - Điều hướng: 3 tab đổi đúng route; nút `+` mở `/them`
- [x] `npm test`, `npm run lint`, `npm run build` sạch
- [ ] Chạy tay trên điện thoại thật hoặc DevTools 375×812 (**cần user**, phiên này không có trình duyệt): thao tác bằng một tay, bàn phím số, nút Lưu không bị bàn phím che, nút back của điện thoại, vùng an toàn trên iPhone

### Tài liệu (CONVENTIONS §6)
- [x] HOLD-UC01: Phạm vi ghi 3 tab + trang form; Cài đặt cập nhật `file:line` phía web và test web
- [x] ARCHITECTURE: §1/§3 thêm `web` (route, context, test web); §5 thêm R-UI-03 (quy tắc mobile); §6.7 trỏ `file:line` mới; §7 cách chạy test web
- [x] `projects/goldfolio/CLAUDE.md`: lệnh test web
- [x] Glossary: không cần đổi — "Lần mua", "Lịch sử giá", "Tài sản của tôi" đã có trong `ui_label`
- [x] `node tools/check-docs.mjs`

## Rủi ro / bẫy liên quan
- **§6.7 (gợi ý không ghi đè giá sửa tay) và R-UI-02:** chuyển form sang trang mới dễ làm mất `priceNow`/`lastSuggested`. Có test SC13 và test race để giữ.
- **Cài package có thể bị lỗi chứng chỉ mạng (§6.6):** `npm install` từ registry trước đây vẫn chạy được (chỉ tải binary và `reactbits.dev` bị lỗi), nên nhiều khả năng cài được. Lỗi thì dừng và báo.
- **iOS Safari:** chữ < 16px trong ô nhập làm trang tự phóng to; `100vh` tính cả thanh địa chỉ, nên dùng `100dvh`.
- **Không kiểm được trên máy thật trong phiên:** layout trên iPhone/Android cần user xác nhận.

## Câu hỏi mở
- [x] Duyệt thêm devDependency test web — user đồng ý 2026-11-03 (thêm cả `@testing-library/dom`, gói bắt buộc đi kèm của `@testing-library/react` 16)
- [x] PWA (manifest, icon): user chọn để việc sau (2026-11-03)
