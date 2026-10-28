# Dựng nền test cho backend

Việc: 2026-10-28-test-foundation · Spec: không có (việc hạ tầng — test bám theo rule domain CLK/PAY/STORE) · Repo: smartclocking · Branch: feat/test-foundation

## Bối cảnh
Repo chưa có test nào, trong khi tính công/lương là tiền thật. Cần test runner và bộ test đầu tiên cho lõi nghiệp vụ, để `/build` làm TDD được và `/review` có căn cứ xác nhận. Không thêm dependency: dùng `node:test` + `node:assert/strict` có sẵn trong Node.

## Mẫu tham chiếu
- DI factory nhận phụ thuộc qua tham số → dựng service với repo giả (`backend/src/container.js:1-18`, README "Kiến trúc phân tầng").
- `app.js` tách khỏi `index.js` để test không cần mở cổng (`backend/src/app.js:1-3`).

## Ảnh hưởng
- Không sửa code nghiệp vụ. Chỉ thêm `backend/test/`, `backend/test-support/` và script `test` trong `backend/package.json`.
- Rule được phủ: CLK-BR-001..009, 011 · PAY-BR-001..005, 008 · STORE-BR-002 · EMP-BR-003.
- Chưa phủ: CLK-BR-010 (lịch sử bất biến, nằm ở trigger DB), CLK-BR-012 (quyền ở route), admin sửa giờ, vòng đời bảng lương.

## Checklist
### Hạ tầng
- [x] `backend/package.json`: script `"test": "node --test"`, chạy được trên Node 18 và 22
- [x] `backend/test-support/fakes.js` (phát sinh: chuyển ra khỏi `test/` vì `node --test` chạy mọi `.js` trong `test/`): repo giả trong bộ nhớ (store, employee, clocking, paysheet, storeNetwork) + transaction giả
### Hàm thuần
- [x] `test/payrollCalculator.test.js`: tổng hợp ngày (PAY-BR-001, 002, 005) và lương tháng (PAY-BR-003, 004)
- [x] `test/vnTime.test.js`: ranh giới ngày/tháng theo giờ VN, ngày hợp lệ, cộng ngày, tháng trước
- [x] `test/network.test.js`: chuẩn hoá IP, so mạng IPv4 và IPv6 /64
- [x] `test/storePlan.test.js`: cửa hàng tạm ngưng / hết hạn theo giờ VN (STORE-BR-002), số chỗ trong gói
- [x] `test/settingValue.test.js`: đổi giá trị thiết lập ↔ chuỗi
- [x] `test/validators.test.js`: email, tiền, chuỗi bắt buộc
### Service với repo giả
- [x] `test/clocking.service.test.js`: chấm công QR/Wi-Fi/GPS (CLK-BR-003..009, 011)
### Kiểm tra
- [x] `npm test` pass toàn bộ
- [x] Đột biến thử (mutation): sửa tạm một rule trong code thì phải có test fail, sau đó khôi phục
### Tài liệu (CONVENTIONS §6)
- [x] ARCHITECTURE §7 (Test) + §8 checklist: runner, lệnh chạy 1 file, mẫu repo giả
- [x] `projects/smartclocking/CLAUDE.md`: lệnh test
- [x] `node tools/check-docs.mjs` sạch

## Rủi ro / bẫy liên quan
- §6.1–6.2: test ngày tháng phải dựng mốc thời gian UTC tường minh, không phụ thuộc múi giờ của máy chạy test.
- `clocking.service` dùng `new Date()` / `Date.now()` → test chỉ kiểm rule không phụ thuộc giờ cụ thể, hoặc dựng lịch sử tương đối so với hiện tại.

## Câu hỏi mở
- [ ] `parseCorsOrigin` (`app.js`) chưa export nên chưa test được trực tiếp — có export ra để test không? (để sau)

## Kết quả
- `npm test`: 81 test / 16 suite, pass 81, fail 0 (Node 22.14, Windows: chạy cả qua bash lẫn npm/cmd).
- Đột biến thử 3 rule (khoảng cách chống bấm đúp 20s → 1s, phút muộn floor → round, thực nhận tháng bỏ `max(0, …)`): 3 test fail đúng rule, sau đó khôi phục bằng `git checkout`, chạy lại pass 81.
- Phát sinh: không dùng glob trong script (`node --test "test/**/*.test.js"` cần Node ≥ 21, trong khi README ghi Node 18+).
