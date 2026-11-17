# mylunarcalendar — ARCHITECTURE

> Đường dẫn tính từ gốc repo. Kiểm ở commit `d7255cf` (nhánh `main`, 2026-11-17).
> Chỉ ghi điều KHÔNG suy ra được nhanh từ code. Mỗi khẳng định có `file:line` thật.

## 1. Tổng quan

npm workspaces, TypeScript, Node 22, cùng khung với GoldFolio:

| Phần | Vai trò |
|---|---|
| `shared/` | Lịch âm và tử vi thuần, không I/O: `lunar.ts` (thuật toán Hồ Ngọc Đức), `holidays.ts`, `tuvi.ts` (số liệu tử vi). Server và web import thẳng mã TS |
| `server/` | Express 4, **không database, không tài khoản** (user chốt 2026-11-17). Route ở `server/src/app.ts:29-36`: `GET /api/config`, `POST /api/horoscope`, `POST /api/chat` (sau mật khẩu chung); `/api` lạ trả 404 JSON. Có `web/dist` thì trả luôn giao diện |
| `web/` | React 18 + Vite 6 + Tailwind 4, mobile-first. Route ở `web/src/App.tsx:56`: `Gate` (mật khẩu chung, `web/src/App.tsx:18`) → 3 tab trong `AppShell` (`/` Lịch, `/tu-vi`, `/ho-so`) + trang form `/ho-so/them`, `/ho-so/:id`. Hồ sơ lưu trên máy qua `ProfilesProvider` (`web/src/profiles-context.tsx:23`), tử vi đã xem qua `web/src/lib/readings.ts:13` |
| `android/` | App Kotlin chỉ dùng SDK chuẩn: widget tháng `MonthWidgetProvider` (`android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:21`) tính offline; mở app là web trong webview (`android/app/src/main/java/app/mylunarcalendar/MainActivity.kt:21`, cấu hình `android/app/src/main/java/app/mylunarcalendar/WebScreen.kt:24`), địa chỉ web nhập một lần ở `SetupActivity` |

| Kho | Dùng cho | Bắt buộc |
|---|---|---|
| localStorage của trình duyệt (`web/src/lib/storage.ts:6`) | hồ sơ, hồ sơ đang chọn, tử vi đã xem (31 ngày), mật khẩu chung | có, mỗi máy riêng; xoá dữ liệu trình duyệt là mất |
| Gemini (gói miễn phí, `GEMINI_API_KEY`) | viết tử vi, chat | không (thiếu thì API AI trả 503, lịch và hồ sơ vẫn chạy) |

## 4. Luồng tiêu biểu: xem tử vi

1. `HoroscopePage` (`web/src/pages/HoroscopePage.tsx:30`) tìm bản đã lưu trên máy (`web/src/pages/HoroscopePage.tsx:45`); có thì hiện luôn.
2. Chưa có thì `POST /api/horoscope` kèm hồ sơ và ngày, header `x-app-password`; server báo 401 thì web hỏi lại mật khẩu (`web/src/api.ts:39`).
3. Server: `requirePassword` (`server/src/access.ts:15`) → `horoscopeRouter` (`server/src/horoscope/routes.ts:19`) kiểm hồ sơ bằng `checkProfile` (`shared/src/profile.ts:31`), tính `horoscopeFacts` (`server/src/horoscope/routes.ts:33`), gọi `AiModel.horoscope` (bản Gemini `server/src/ai/gemini.ts:64`, prompt `server/src/ai/model.ts:81`, kiểm kết quả `server/src/ai/model.ts:113`), trả về, không lưu.
4. Web lưu bản đó trên máy (`web/src/lib/readings.ts:18`).

## 5. Luật bắt buộc

| ID | Luật |
|---|---|
| R-LUNAR-01 | Lịch âm tính theo múi giờ +7 (`shared/src/lunar.ts:144`). Bản Kotlin (`android/app/src/main/java/app/mylunarcalendar/LunarCalendar.kt:130`) là bản dịch 1-1; sửa công thức thì sửa cả hai. Cả hai kiểm bằng `shared/test/lunar-cases.json` (test Kotlin đọc file này ở `android/app/src/test/java/app/mylunarcalendar/LunarCalendarTest.kt:30`). Số liệu kiểm tra lấy từ ngày thật, không sinh từ chính thuật toán. |
| R-AI-01 | Can chi, tuổi, mệnh, hợp xung, hoàng đạo do code tính (`shared/src/tuvi.ts:73`); AI chỉ luận giải trên số liệu đó và trả JSON theo schema, kiểm bằng `parseReading`. |
| R-AI-02 | Gửi AI chỉ tên gọi, giới tính và số liệu lịch; không gửi ngày sinh dương lịch đầy đủ (`server/src/ai/model.ts:81`, `server/src/chat/service.ts:51`). |
| R-AI-03 | Lỗi AI đổi thành thông báo người dùng qua `aiHttpError` (`server/src/ai/model.ts:141`). Quá tải/hết lượt thì thử model dự phòng (`server/src/ai/gemini.ts:46`). Không giới hạn lượt (user chốt). |
| R-LOCAL-01 | Không có database: dữ liệu người dùng chỉ lưu trên máy qua `load`/`save` (`web/src/lib/storage.ts:6`), luôn bọc try/catch (chế độ riêng tư, bị chặn lưu). Server không giữ trạng thái; hồ sơ gửi lên phải kiểm lại bằng `checkProfile` (`shared/src/profile.ts:31`), cùng luật với form. |
| R-AIHIDE-01 | Phần AI (tab Tử vi, Hồ sơ, nút Hỏi AI, thanh tab) chỉ hiện khi `/api/config` trả `aiEnabled` (`server/src/app.ts:29`, `web/src/App.tsx:21`). Thêm tính năng AI mới thì đặt route trong `AiOnly` (`web/src/App.tsx:66`) và ẩn nút bằng `useAiEnabled`. Lịch không được phụ thuộc server. |
| R-PASS-01 | API gọi AI đi sau `requirePassword` (`server/src/access.ts:15`), so băm bằng `timingSafeEqual` (`server/src/access.ts:20`). `/api/config` không cần mật khẩu, để web biết có phải hỏi không. |
| R-TIME-01 | "Hôm nay" theo `Asia/Ho_Chi_Minh` qua `vnDate`; đồng hồ tiêm qua `createApp({ now })` để test. |
| R-UI-02 | Kết quả async về muộn không ghi đè cái đang xem: so khoá hiện tại qua `ref` (`web/src/pages/HoroscopePage.tsx:43`). |
| R-UI-03..05 | Như GoldFolio: mobile-first, vùng bấm ≥ 44px, đủ trạng thái tải/lỗi/rỗng, màu chỉ dùng token trong `web/src/index.css` (`bg`, `surface`, `surface-2`, `line`, `ink`, `muted`, `gold`, `gold-deep`, `gold-soft`, `good`, `bad`). |

## 6. Bẫy âm thầm

1. **Thuật toán gốc ra ngày âm "0":** bản Hồ Ngọc Đức chỉ lùi một lần sóc khi ước lượng chỉ số tuần trăng, nên sai ở vài ngày sát sóc (vd 07/05/2054). Bản này lùi tới khi đúng (`shared/src/lunar.ts:151`). Test đổi qua lại mọi ngày 1900–2100 bắt lỗi này.
2. **Tết khác Trung Quốc:** 1985, 2007, 2030. Sóc rơi vào 23h–24h giờ VN là đã sang ngày sau giờ Trung Quốc. Đừng "sửa" số liệu theo lịch Trung Quốc.
3. **Tuổi theo năm âm:** sinh trước Tết thuộc năm âm trước (`shared/src/tuvi.ts:53`).
4. **Ngày hoàng đạo theo tháng âm**, không theo tiết khí (`shared/src/lunar.ts:288`). Một số lịch vạn niên dùng tháng tiết khí nên lệch vài ngày quanh đầu tháng.
5. **Khoá tử vi đã lưu gồm ngày giờ sinh và giới tính** (`web/src/lib/readings.ts:11`): sửa các ô này thì tự xem lại, đổi tên thì giữ. Đổi cách đặt khoá là mất các bản đã lưu của người dùng.
6. **Android chưa build được trên máy dev:** chỉ CI build. Kotlin `/` trên `Int` cắt về 0, còn TS dùng `Math.floor`: bản Kotlin dùng `floor` trên `Double` ở mọi chỗ TS dùng `INT`.
7. **Widget đổi ngày lúc 0 giờ** bằng `AlarmManager.setWindow` (`android/app/src/main/java/app/mylunarcalendar/MonthWidgetProvider.kt:180`). `DATE_CHANGED` có thể không tới trên Android 8+; báo thức và `updatePeriodMillis` 3 giờ là lưới an toàn.
9. **Webview Android chỉ chạy offline sau lần mở đầu:** `LOAD_CACHE_ELSE_NETWORK` khi mất mạng (`android/app/src/main/java/app/mylunarcalendar/WebScreen.kt:27`) dùng bộ nhớ đệm HTTP của webview, không phải service worker; chưa từng mở thì hiện trang lỗi "Thử lại". Widget thì luôn offline.
8. **Mật khẩu chung nằm trong localStorage** dạng chữ thường: chỉ chặn người lạ dùng hạn mức AI, không phải bảo mật thật; đừng dựa vào nó để giấu dữ liệu.

## 7. Test

- `shared`: `npx vitest run` (lịch âm, ngày lễ, số liệu tử vi).
- `server`: supertest, AI giả `FakeModel` trong `server/test/helpers.ts`; không cần DB.
- `web`: jsdom + Testing Library, `api` được mock, hồ sơ đặt sẵn vào localStorage; chỉ giả `Date` (`vi.useFakeTimers({ toFake: ["Date"] })`) để userEvent vẫn chạy.
- `android`: JUnit 4 trong CI.

## 8. Checklist thêm tính năng

Spec trước (`specs/<domain>/`), test theo SC, sửa công thức lịch thì sửa cả Kotlin và chạy CI, cập nhật README (API, cài widget) và file này.
