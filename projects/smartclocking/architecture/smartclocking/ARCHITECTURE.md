# SmartClocking — ARCHITECTURE

> Đường dẫn tính từ gốc repo `repos/smartclocking/`. Kiểm ở commit `008f4f7`. Sửa code thì cập nhật lại các dòng bị lệch (`node tools/check-docs.mjs` báo).
> Repo có sẵn `CLAUDE.md` riêng (luật DB + nút bấm). File này bổ sung chứ không thay thế nó.

## 1. Tổng quan

Monorepo hai phần:
- `backend/`: Express 4, ESM, chạy bằng `node src/index.js`.
- `frontend/`: React 18 SPA (Vite), deploy lên Vercel (`vercel.json` rewrite mọi path về `index.html`).

Đa cửa hàng (multi-tenant theo `store_id`), có 3 vai trò: `superadmin` (không thuộc cửa hàng nào), `admin` và `user` (mỗi tài khoản thuộc đúng 1 cửa hàng).

| Kho dữ liệu | Dùng cho | Bắt buộc |
|---|---|---|
| PostgreSQL + pgvector | Toàn bộ nghiệp vụ, embedding `VECTOR(768)` | Có |
| MongoDB (mongoose) | Hội thoại và tin nhắn chat (`backend/src/models/`) | Không. Thiếu thì chat trả 503, phần còn lại vẫn chạy |
| Redis | Cache dữ liệu đã đóng băng | Không. Không có `REDIS_URL` thì bỏ qua |
| Ổ đĩa `backend/uploads/` / Cloudinary | File quy chế / ảnh đại diện | Cloudinary là tuỳ chọn |
| Gemini | Chat + embedding | Cần cho AI |

## 2. Khởi động và lắp ráp

- `backend/src/index.js:8`: `createApp(createContainer())`, sau đó Mongo (`:22`) và Redis (`:25`) kết nối ở nền, không chặn khởi động.
- `backend/src/container.js:81`: **composition root**, là nơi duy nhất tạo và nối repo → service → router. Router gắn vào `/api/<key>` theo object `routers` (`container.js:180-190`).
- `backend/src/app.js:24`: `accountAccessGuard` chạy cho mọi `/api`. `app.js:29-31` mount router. `app.js:34` đặt `errorHandler` cuối cùng.

## 3. Sơ đồ layer (backend)

```
routes/        nhận req → gọi đúng 1 hàm service → trả res. Chỉ requireAuth/requireRole/multer
services/      toàn bộ nghiệp vụ, validate, ném AppError; không biết req/res
  serializers.js   row DB → JSON trả client
  payrollCalculator.js  hàm thuần tính công/lương
repositories/  chỉ chạy SQL/Mongo, trả row thô; tham số cuối `executor = db`
providers/     chỉ gọi API ngoài (Gemini), retry; không có prompt nghiệp vụ
cache/         decorator bọc service (Redis)
utils/         vnTime, validators, AppError, geo, network...
constants/enums.js  nguồn duy nhất cho giá trị cố định (+ sinh ENUM Postgres)
```

## 4. Đường đi một request: `POST /api/clocking/check` (nhân viên chấm công)

1. `app.js:24` → `middleware/accountAccess.js:22-29`: tài khoản bị khoá → 401; cửa hàng tạm ngưng hoặc hết hạn → 403 `STORE_LOCKED`. Token sai thì cho qua để router trả 401.
2. `routes/clocking.routes.js:22`: `requireAuth` (`middleware/auth.js:4`, gán `req.user = { id, email, role, fullName, storeId }`) + `requireRole(USER, ADMIN)`.
3. `clocking.routes.js:34-36` → `clockingService.check(req.user, req.body, { ip: req.ip })`.
4. `services/clocking.service.js:109`: kiểm GPS (`:112-115`). Nếu chấm bằng QR thì QR phải đúng cửa hàng của nhân viên (`:122`). Nếu chấm bằng Wi-Fi thì cần IP trùng và GPS trong bán kính (`:123-132`).
5. `clocking.service.js:137` `transaction.run(tx)`:
   - `timesheet.service.js:21` `assertMonthEditable`: tháng đã chốt lương → 403 `MONTH_LOCKED`.
   - `timesheet.service.js:32` `lockDailyClocking`: `findOrCreate … ON CONFLICT` + `SELECT … FOR UPDATE` (`repositories/clocking.repository.js:8-26`).
   - Luật trong ngày: chỉ check-in 1 lần (`:149`), hai lần bấm phải cách nhau 20s (`:155`, trả 429).
   - `clockingRepository.createHistory` (`clocking.repository.js:75`). Giờ chấm do **server** ghi bằng `COALESCE($3, now())`.
   - `timesheet.service.js:48` `recalculateClocking` → `payrollCalculator.js:21` `summarizeClockingDay` → `updateSummary`.
6. Lỗi `AppError` được `middleware/errorHandler.js:8` chuyển thành `{ error, code?, ...details }`.

Phía frontend gọi qua `frontend/src/api/client.js:119` (`api.post`). Khi nhận 401 hoặc `STORE_LOCKED`, client tự đăng xuất (`client.js:69`).

## 5. Luật bắt buộc

| ID | Luật |
|---|---|
| R-LAYER-01 | Route không chứa nghiệp vụ: mỗi handler gọi đúng 1 hàm service và bọc bằng `asyncHandler` (`utils/asyncHandler.js:5`) |
| R-LAYER-02 | Service báo lỗi bằng `AppError.badRequest/notFound/forbidden/conflict` (`utils/AppError.js`), không đụng `req/res` |
| R-LAYER-03 | Repository chỉ chạy truy vấn. Mọi method có tham số cuối `executor = db` |
| R-LAYER-04 | Provider chỉ gọi API ngoài. Prompt và quyết định khi nào gọi AI nằm ở service |
| R-DI-01 | Mỗi module là factory `createXxx(deps)`, không `import` repo/service khác để gọi trực tiếp. Lắp ráp chỉ ở `container.js` |
| R-TENANT-01 | `storeId` **chỉ lấy từ `req.user`** (JWT), không bao giờ từ body/query. Truy vấn theo id phải kèm `store_id` (mẫu `findInStore`: `employee.repository.js:28`) hoặc kiểm `row.store_id !== actor.storeId` → `notFound` |
| R-TENANT-02 | Mongo: mọi document hội thoại/tin nhắn có `storeId` và mọi query lọc theo nó |
| R-DB-01 | Không viết migration. Đổi cấu trúc: sửa `db/schema.sql` (+ `db/drop.sql` khi thêm bảng/hàm), cập nhật `db/seed.js`, chạy `npm run seed` |
| R-DB-02 | Xoá mềm mọi bảng (`is_deleted`, `deleted_at`; Mongo `isDeleted`, `deletedAt`). Không `DELETE`. Truy vấn đọc lọc `NOT is_deleted`. Unique dùng index một phần `WHERE NOT is_deleted` |
| R-DB-03 | Nhiều lệnh ghi liên quan nhau phải nằm trong `transaction.run(async (tx) => …)` (`repositories/transaction.js:8`) và truyền `tx` xuống **mọi** lệnh repo bên trong |
| R-DB-04 | `clocking_history` bất biến (trigger `db/schema.sql:180-200`). "Sửa giờ" = `voidHistory` + `createHistory` với `replacedHistoryId` |
| R-DB-05 | Đặt tên theo quy ước ở đầu `db/schema.sql:5-11`: bảng số ít, đơn vị nằm trong tên, boolean có tiền tố `is_` |
| R-ENUM-01 | Không viết chuỗi cố định (`"admin"`, `"draft"`…). Dùng `constants/enums.js`. Sửa enum thì sửa **cả** `frontend/src/constants/enums.js`. ENUM Postgres sinh từ `POSTGRES_ENUM_TYPES` (`db/seed.js:128`) |
| R-SETTING-01 | Thiết lập cửa hàng mới = thêm `SETTING_KEY` + `SETTING_DEFINITIONS` (`backend/src/constants/enums.js:59-85`), **không** thêm cột |
| R-TIME-01 | Ngày/tháng nghiệp vụ theo giờ VN: luôn dùng `utils/vnTime.js`, không dùng `getHours()/getMonth()`. Mốc thời gian chấm công do server ghi, không nhận từ client |
| R-PAY-01 | Logic tính công/lương nằm trong hàm thuần ở `services/payrollCalculator.js`. Tháng đã chốt lương thì khoá chấm công (`assertMonthEditable`) |
| R-CACHE-01 | Chỉ cache dữ liệu đã đóng băng. Method ghi làm đổi dữ liệu đã cache phải nằm trong danh sách `invalidateAfter` (`cache/cachedServices.js:43`, `:86`) |
| R-AI-01 | Nội dung tài liệu `is_sensitive` **không bao giờ** được đưa vào prompt Gemini. Câu hỏi khớp tài liệu nhạy cảm → gắn cờ chuyển admin (`services/assistant.service.js:150`) |
| R-AI-02 | RAG chỉ tìm trong văn bản của cửa hàng người hỏi (`assistant.service.js:84-85`, `document.repository.js:111`) |
| R-AI-03 | Số liệu cá nhân (lương, đi muộn) lấy từ hệ thống (`salaryInquiry.service.js`). Gemini chỉ diễn đạt lại, khi Gemini lỗi thì trả số liệu thô |
| R-API-01 | Lỗi trả `{ error: "<tiếng Việt>", code? }`. Code máy đọc dạng `UPPER_SNAKE` (`MONTH_LOCKED`, `STORE_LOCKED`) |
| R-FE-01 | Mọi gọi API đi qua `api` trong `frontend/src/api/client.js`, không gọi `fetch` trực tiếp. Tải file dùng `api.downloadFile` |
| R-FE-02 | Khi đang lưu/tải, nút chỉ `disabled`, **không đổi chữ** (đã có lớp phủ `components/GlobalLoading.jsx`). Request chạy ngầm truyền `{ silent: true }` |
| R-FE-03 | Ưu tiên class/component Bootstrap 5.3. CSS riêng đặt trong `styles/custom.css`, không viết style inline trong JSX |
| R-FE-04 | Hộp thoại xác nhận và thông báo dùng `useNotification()` (`context/NotificationContext.jsx`), không dùng `window.alert/confirm` |
| R-FE-05 | Trang cần đăng nhập được bọc `<ProtectedRoute allowedRoles={[ROLE.…]}>` trong `App.jsx`. Quyền thật vẫn kiểm ở backend |
| R-FE-06 | Chữ hướng dẫn tĩnh đặt trong tooltip `HelpTip` ("?"), không viết thành đoạn văn trên trang |

## 6. Bẫy âm thầm (build vẫn chạy, sai khi chạy)

1. **Cột `DATE` là chuỗi `'YYYY-MM-DD'`**, không phải `Date` (`config/db.js:10-11`). So sánh và cộng ngày bằng `vnTime` (`addDays`, `monthDateRange`), không dùng `new Date(work_date)`.
2. **Server chạy UTC** (Render). `new Date().getDate()` có thể lệch sang ngày khác so với giờ VN. Phải dùng `vnDateKey`/`vnMonthKey`.
3. **Quên truyền `tx`** vào repo trong `transaction.run`: câu lệnh chạy trên pool, nằm ngoài transaction và ngoài khoá `FOR UPDATE`. Không có lỗi nào báo ra, chỉ hỏng khi hai request chạy đồng thời.
4. **Thêm method ghi vào service đã bọc cache** (`paysheet`, `employee`) mà không thêm vào `invalidateAfter` thì màn hình hiện số cũ tới 1 giờ. Chỉ thấy lỗi khi bật Redis.
5. **Enum lệch FE/BE**: thêm giá trị ở backend mà quên bản sao frontend thì UI hiện sai hoặc trống. Thêm vào `POSTGRES_ENUM_TYPES` thì phải `npm run seed`.
6. **Mongo tắt buffer** (`config/mongodb.js:13`): route mới dùng Mongo phải có `requireMongo` (mẫu `routes/chat.routes.js:16`), nếu không sẽ ném lỗi kỹ thuật khó hiểu.
7. **`req.ip` phụ thuộc `TRUST_PROXY_HOPS`** (`app.js:14-15`). Đặt sai thì chấm công Wi-Fi so sai IP. Không đặt `trust proxy = true` vì client có thể giả header.
8. **Số chiều embedding** phải khớp `VECTOR(768)` (`db/schema.sql:283`) và `GEMINI_EMBEDDING_DIMENSIONS`. Lệch thì insert lỗi và tài liệu bị `failed`.
9. **Handler async không bọc `asyncHandler`** thì Express 4 không bắt được reject và request bị treo.
10. **`accountAccessGuard` cho qua khi token sai.** Router mới quên `requireAuth` sẽ thành API công khai.
11. **Đổi schema mà không sửa `seed.js`**: seed chạy qua chính các service, nên `npm run seed` sẽ vỡ ngay lần sau.
12. **Lệch luật hiện có:** các query đọc trong `repositories/clocking.repository.js:16,30,38,47` chưa lọc `NOT is_deleted`. Hiện chưa có luồng nào xoá mềm `clocking` nên chưa thấy lỗi. Khi thêm luồng xoá thì phải sửa các query này.
13. **Model Gemini bị Google gỡ định kỳ** (`config/gemini.js:23`). Lỗi 404 ở đây là do model, không phải do key sai.

## 7. Test

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

## 8. Checklist: thêm tính năng mới

**Backend**
- [ ] Giá trị cố định → `constants/enums.js` (+ bản sao FE, + `POSTGRES_ENUM_TYPES` nếu là cột enum)
- [ ] Bảng/cột mới → `schema.sql` (soft delete, đặt tên đúng R-DB-05) + `drop.sql` + `seed.js` → `npm run seed`
- [ ] Repository: method nhận `executor = db`, lọc `NOT is_deleted` và `store_id`
- [ ] Service factory: validate (`utils/validators.js`), `AppError`, transaction khi ghi nhiều bảng, serializer cho output
- [ ] Test viết trước cho logic mới (`test/<module>.test.js`, §7): mỗi rule có ít nhất 1 test, gồm cả nhánh lỗi
- [ ] Nối trong `container.js`. Bọc cache hoặc thêm `invalidateAfter` nếu chạm dữ liệu đã cache
- [ ] Route: `requireAuth` + `requireRole`, `asyncHandler`, đúng 1 lời gọi service. Ghi chú endpoint ở comment đầu file
- [ ] Cập nhật mục API trong `README.md` của repo nếu thêm endpoint

**Frontend**
- [ ] Trang trong `pages/<role>/`, route trong `App.jsx` có `ProtectedRoute`
- [ ] Gọi API qua `api.*`, xử lý lỗi bằng `notifyError`
- [ ] Bootstrap trước, CSS riêng trong `custom.css`, help text đặt trong `HelpTip`
- [ ] Dùng enum từ `constants/enums.js`, định dạng tiền/ngày bằng `utils/format.js`
