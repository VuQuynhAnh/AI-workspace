# Review — 2026-11-03

Phạm vi: `git -C repos/goldfolio diff feat/mvp` + file mới chưa commit (nhánh `feat/mobile-ui`; 15 file theo dõi đổi, 25 mục trong `status`) · Spec: HOLD-UC01 (không đổi hành vi) · Luật: R-UI-01/02/03.
Đã chạy: `npm test -w web` (12/12 pass); trước đó `npm test` toàn repo (24 + 58 + 12 pass), `npm run lint` sạch, `npm run build` OK, `node tools/check-docs.mjs` (0 lỗi, 6 cảnh báo sha — xem mục Tài liệu). Không có slug trong code (đã grep).

## Blocker
Không có.

## Major
- [x] `web/src/pages/HistoryPage.tsx:12-21` — Logic "sản phẩm đang xem đã bị xoá thì quay về sản phẩm mặc định" (sửa lỗi Major 4 của review MVP) **chưa có test hồi quy**, dù web đã có bộ test. Kịch bản test cần có: `GET /portfolio/history?productId=11` trả 404 → trang gọi lại `/portfolio/history` không tham số và hiện biểu đồ. (Thiếu test cho logic; review MVP Major 4)

## Minor
- [x] `web/src/pages/HistoryPage.tsx:19` — Lỗi mạng khi nạp lịch sử (không có `productId`) → `setHistory(null)` → trang hiện "Đang tải…" mãi, không báo lỗi, không cho thử lại.
- [x] `web/src/pages/OverviewPage.tsx:10` — Khi `reload()` lỗi sau khi đã có dữ liệu (vd mất mạng lúc vừa lưu), tab Tổng quan thay toàn bộ nội dung bằng thông báo lỗi, mất cả số cũ. Tab Lần mua thì hiện cả hai. Nên hiện lỗi dạng dải trên cùng và giữ dữ liệu.
- [x] `web/src/pages/PurchaseFormPage.tsx:80` + `:271` — Mở `/sua/:id` của lần mua không tồn tại hoặc của người khác: server trả 404 đúng (R-OWN-01), nhưng trang vẫn hiện form trống có nút Lưu và "Xoá lần mua". Bấm thì chỉ nhận lại lỗi 404. Nên hiện trạng thái "Không tìm thấy lần mua" kèm nút quay lại.
- [x] `web/src/pages/PurchaseFormPage.tsx:66` — Trong lúc trang sửa đang nạp, các ô trống và nút Lưu bấm được; bấm thì nhận lỗi kiểm tra dữ liệu. Nên khoá form cho tới khi nạp xong.
- [ ] `web/src/components/ConfirmSheet.tsx:2` — Bảng xác nhận không đóng được bằng phím Esc và không đưa focus vào nút. Trên điện thoại ít ảnh hưởng, nhưng trình đọc màn hình sẽ khó dùng.
- [ ] `web/src/components/AppShell.tsx:22` — Email tài khoản chỉ nằm trong `title` của nút Đăng xuất, mà điện thoại không có hover nên người dùng không biết đang đăng nhập tài khoản nào.

## Tài liệu (CONVENTIONS §6)
- [ ] `check-docs` còn 6 cảnh báo "đã đổi từ fe2c586" ở `web/src/components/ui.tsx`, `HistoryChart.tsx`, `index.css`, `vite.config.ts`. Đã đối chiếu tay: các dòng trích đúng. Hết cảnh báo sau khi commit và cập nhật sha (`/track mobile-ui commit`).
- [ ] Chưa kiểm trên điện thoại thật (mục duy nhất còn mở trong plan) — cần user.
- Phần còn lại đủ: HOLD-UC01 (Phạm vi, Cài đặt, test web), ARCHITECTURE (R-UI-03, route/context, test web, checklist), README, CLAUDE.md dự án.

## Đề xuất bổ sung tri thức
> Đã ghi R-UI-04 vào ARCHITECTURE (user đồng ý 2026-11-03).
- **Đề xuất R-UI-04:** mọi trang nạp dữ liệu phải có đủ 3 trạng thái: đang tải, lỗi (kèm thử lại) và rỗng. Không được để "Đang tải…" là trạng thái cuối khi lỗi. Lỗi này lặp ở 2 chỗ trong review này (HistoryPage, trang sửa khi 404).

## Đã kiểm, không có vấn đề
- **Hành vi HOLD-UC01:** logic form chép nguyên vẹn, gồm `priceNow`/`lastSuggested` (R-UI-02). Test race fail khi đưa lại logic cũ (đã thử), pass với logic hiện tại.
- **Điều hướng:** form là route riêng. Back quay về tab trước; mở thẳng link thì về `/lan-mua` (`location.key === "default"`). Lưu/xoá xong `replace` sang `/lan-mua`, nên back không quay lại form đã lưu.
- **Dữ liệu:** không đổi API, server, công thức. `PortfolioProvider` nạp lại sau mọi lần ghi; tab Lịch sử nạp lại khi danh mục đổi.
- **R-UI-01:** số tiền hiện thẳng, không hiệu ứng.
- **R-UI-03:** nút/tab/ô ≥ 44px, chữ ô nhập 16px, `dvh`, vùng an toàn, nút `+` và thanh tab không che nội dung (main có padding đáy). Vị trí nút `+` đúng cả màn hẹp lẫn màn rộng.
- **Bảo mật:** không đổi phía server. Web không lưu gì ngoài cookie phiên httpOnly có sẵn.
- **Test:** 12 test web mới, có `// SC:`, chọn phần tử theo nhãn/role tiếng Việt.

## Đã xử lý — 2026-11-03
- Major: thêm test hồi quy `web/test/states.test.tsx` (sản phẩm đang xem bị xoá → quay về mặc định). Test pass ngay vì logic đã có từ MVP; trước đó phải thêm `web/test/setup.ts` giả `ResizeObserver` để Recharts chạy được trong jsdom.
- Minor 1–2: `LoadError` (thông báo + "Thử lại") dùng cho Tổng quan, Lần mua, Lịch sử; đã có dữ liệu thì giữ dữ liệu và hiện dải lỗi.
- Minor 3–4: trang sửa có trạng thái nạp; 404 hiện "Không tìm thấy lần mua" + "Về danh sách lần mua", không hiện form; đang nạp thì khoá form và nút Lưu; lỗi khác có "Thử lại".
- Test mới fail đúng lý do trước khi sửa (4/5; test hồi quy pass vì logic có sẵn), pass sau khi sửa.
- Kết quả: `npm test` 24 + 58 + 17 pass; `npm run lint` sạch; `npm run build` OK.
- Minor 5–6 (Esc/focus của bảng xác nhận, hiện email): để sau theo user.
