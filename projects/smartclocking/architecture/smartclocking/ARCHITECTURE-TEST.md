# SmartClocking — ARCHITECTURE: Test

> Tách từ `ARCHITECTURE.md` §7 (giữ mục lục dưới 15 KB). Đường dẫn tính từ gốc repo `repos/smartclocking/`. Kiểm ở commit `eb82f95`.


Runner: `node:test` + `node:assert/strict`, có sẵn trong Node, **không cần dependency**. Không cần DB, Mongo hay Gemini để chạy test.

| Việc | Lệnh (trong `backend/`) |
|---|---|
| Chạy tất cả | `npm test` (= `node --test`, chạy được trên Node 18+) |
| Một file | `node --test test/payrollCalculator.test.js` |
| Lọc theo tên test | `node --test --test-name-pattern="đi muộn" test/payrollCalculator.test.js` |

- **Vị trí:** test nằm ở `backend/test/<module>.test.js`. Helper **không** được đặt trong `test/`, vì `node --test` chạy mọi file `.js` trong thư mục `test/` như file test. Helper đặt ở `backend/test-support/`.
- **Hàm thuần:** gọi thẳng hàm (mẫu: `test/payrollCalculator.test.js`). Mốc giờ dựng tường minh với `+07:00` hoặc `Z`, không dùng `new Date(y, m, d)` (bẫy §6.1–6.2).
- **Service:** dựng `createXxxService({ … })` với repo giả trong `test-support/fakes.js`. Đi qua service thật ở tầng dưới khi được (mẫu: `test/clocking.service.test.js` dùng `createTimesheetService` thật). Fake chỉ cài các method mà service gọi, giữ đúng chữ ký và dữ liệu `snake_case` như dòng DB.
- **Lỗi nghiệp vụ:** kiểm `err instanceof AppError` cùng `status`, `code` và một đoạn thông báo (helper `rejectsWith` trong `clocking.service.test.js`).
- **Đặt tên:** tên test mô tả rule bằng tiếng Việt, kèm ID rule `(CLK-BR-006)` hoặc `// SC: <UC>-SCn` (CONVENTIONS §5).
- **Kiểm tra test có thật sự bắt lỗi:** sửa tạm rule trong code, chạy để thấy test fail, rồi khôi phục bằng `git checkout -- <file>`.
- **Chưa phủ:** repository (SQL thật), route và middleware, frontend. Kiểm tra phần UI bằng cách chạy `npm run dev` ở cả hai phần và đăng nhập tài khoản demo (`frontend/src/constants/demoAccounts.js`, tạo bởi `npm run seed`).

