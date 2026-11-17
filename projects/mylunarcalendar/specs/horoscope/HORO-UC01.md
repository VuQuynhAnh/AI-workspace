# HORO-UC01 — Hồ sơ ngày sinh và tử vi hằng ngày bằng AI

> Trạng thái: implemented · Việc: 2026-11-17-widget-lich · Cập nhật: 2026-11-17 · Kiểm ở commit `babc858` (nhánh `main`, 2026-11-17)

## Mục tiêu
Xem tử vi trong ngày cho bản thân và người nhà theo tuổi âm lịch, để vui (user chốt). Code tính phần lịch, AI viết lời luận giải.

## Phạm vi
- **Không có tài khoản, không có database** (user chốt 2026-11-17: dự án cá nhân, không thu thập dữ liệu người dùng). Hồ sơ và tử vi đã xem chỉ lưu trên máy (trình duyệt); không sao lưu.
- Màn hình: tab **Tử vi** (`/tu-vi`), tab **Hồ sơ** (`/ho-so`), form `/ho-so/them`, `/ho-so/:id`.
- Phụ thuộc: Gemini gói miễn phí qua server (khoá API phải nằm trên server).
- Ngoài phạm vi (đợt sau, user chốt "làm dần"): lá số Tử Vi Đẩu Số 12 cung, tử vi tháng/năm.

## Quy tắc nghiệp vụ
- BR-1: **Hồ sơ lưu trên máy:**
  - Gồm tên gọi (≤ 50 ký tự), ngày sinh dương lịch (31/01/1900 – hôm nay), giờ sinh không bắt buộc, giới tính.
  - Tối đa 10 hồ sơ. Lỗi hiện dưới từng ô; web và server kiểm cùng một luật.
  - Danh sách ghi tuổi (can chi năm âm), mệnh nạp âm, giờ sinh theo chi, và nhắc "Hồ sơ chỉ lưu trên máy này; xoá dữ liệu trình duyệt là mất".
  - Mỗi máy/trình duyệt một danh sách riêng. Xoá hồ sơ phải xác nhận, xoá luôn tử vi đã lưu của hồ sơ.
- BR-2: **Số liệu tử vi do code tính:**
  - tuổi theo năm âm (sinh trước Tết thuộc năm trước), tuổi âm, mệnh;
  - can chi ngày/tháng/năm, ngũ hành ngày, ngày hoàng đạo/hắc đạo, tiết khí, giờ hoàng đạo, ngày lễ;
  - quan hệ chi năm sinh với chi ngày (trùng, lục hợp, tam hợp, lục xung, tứ hành xung) và ngũ hành mệnh với ngày.
- BR-3: **Ngày xem:** hôm nay, chuyển ‹ › được trong 30 ngày trước/sau; ngoài khoảng thì server trả 400.
- BR-4: **AI viết** (tiếng Việt, JSON):
  - điểm ngày 1–5, tóm tắt; 4 mặt (công việc, tài chính, tình cảm, sức khỏe) có điểm và lời; nên làm, nên kiêng, lời khuyên.
  - Chỉ dựa trên số liệu BR-2; không phán chắc về bệnh tật, tai nạn; không khuyên tài chính cụ thể.
  - Web gửi hồ sơ lên mỗi lần xem; server tính số liệu, gửi AI tên gọi và số liệu lịch (không gửi ngày sinh dương lịch), trả kết quả, **không lưu gì**.
  - Luôn ghi "Tham khảo, giải trí".
- BR-5: **Lưu tử vi đã xem trên máy:**
  - Mở lại cùng hồ sơ, cùng ngày thì dùng bản đã lưu, không gọi AI.
  - Sửa ngày giờ sinh hay giới tính thì xem lại; đổi tên thì giữ bản cũ.
  - Chỉ giữ các bản trong 31 ngày gần nhất.
  - **Không giới hạn lượt** (user chốt: xem cho vui, không cần xử lý riêng).
  - Lỗi AI: hết hạn mức báo "AI đã hết lượt miễn phí, thử lại sau"; quá tải (sau khi đã thử model dự phòng) báo "AI đang quá tải, thử lại sau ít phút"; lỗi khác báo "Chưa xem được tử vi, thử lại sau"; kèm "Thử lại".
- BR-6: **Mật khẩu chung** (user chốt):
  - Server đặt `APP_PASSWORD` thì web hỏi mật khẩu một lần khi mở, máy nhớ, gửi kèm mọi lời gọi AI.
  - Sai thì server trả 401 "Sai mật khẩu, nhập lại mật khẩu chung" và web hỏi lại.
  - Không đặt thì không hỏi.
  - Không gọi được server (đang ngủ, mất mạng) thì vẫn vào app: lịch và hồ sơ chạy trên máy.
- BR-8: **Chưa bật AI thì ẩn, không báo lỗi** (user chốt 2026-11-17): server chưa có `GEMINI_API_KEY` (`/api/config` trả `aiEnabled: false`) hoặc không gọi được server thì ẩn tab Tử vi, tab Hồ sơ, nút Hỏi AI và thanh tab; chỉ còn tab Lịch. Mở link `/tu-vi`, `/ho-so` thì về Lịch. Lịch mở ngay, không chờ server: dùng cấu hình lần trước nhớ trên máy; máy chưa từng hỏi server thì các trang AI đợi server trả lời rồi mới quyết định.
- BR-7: **Màn Tử vi:**
  - Chọn hồ sơ (máy nhớ hồ sơ đã chọn), điểm dạng sao, giờ tốt.
  - "Hỏi thêm AI" mở chat với tóm tắt vừa xem.
  - Kết quả cũ về muộn không ghi đè ngày đang xem.

## Scenario

```gherkin
Scenario: HORO-UC01-SC3 Server tính số liệu, AI viết, không lưu
  When web gửi hồ sơ "Anh" sinh 01/03/1990 08:30, nam, ngày 17/11/2026
  Then server trả tuổi Canh Ngọ, 37 tuổi âm, giờ Thìn, mệnh Lộ Bàng Thổ kèm lời tử vi của AI

Scenario: HORO-UC01-SC5 AI lỗi
  Then báo lỗi theo loại; chưa cấu hình AI báo "Chưa bật AI (thiếu GEMINI_API_KEY)"

Scenario: HORO-UC01-SC6 Màn Tử vi
  Given hồ sơ "Anh" lưu trên máy
  When tôi mở tab Tử vi, sang ngày mai rồi quay lại hôm nay
  Then AI được gọi 2 lần (mỗi ngày một lần); quay lại dùng bản đã lưu
  When tôi bấm "Hỏi thêm AI" rồi hỏi
  Then chat gửi kèm hồ sơ và tóm tắt tử vi hôm nay

Scenario: HORO-UC01-SC7 Form hồ sơ
  When tôi lưu form trống
  Then lỗi hiện dưới ô "Tên gọi" và "Giới tính"
  When tôi nhập đủ và lưu
  Then hồ sơ có trong danh sách và lưu trên máy

Scenario: HORO-UC01-SC8 Server đòi mật khẩu chung
  Given server đặt APP_PASSWORD
  Then gọi AI không có hoặc sai mật khẩu báo 401

Scenario: HORO-UC01-SC9 Web hỏi mật khẩu một lần
  When tôi mở web lần đầu, nhập mật khẩu
  Then vào được lịch, máy nhớ mật khẩu

Scenario: HORO-UC01-SC10 Chưa bật AI
  Given server chưa có GEMINI_API_KEY (hoặc không gọi được)
  When tôi mở /tu-vi
  Then tôi ở tab Lịch, không có thanh tab, không có nút Hỏi AI, không có thông báo lỗi
```

## Cài đặt

| Quy tắc | Code | Test |
|---|---|---|
| BR-1 hồ sơ trên máy | `shared/src/profile.ts:31`, `web/src/profiles-context.tsx:23`, `web/src/pages/ProfileFormPage.tsx:35` | `shared/test/tuvi.test.ts`, `web/test/app.test.tsx` (SC7) |
| BR-2 số liệu | `shared/src/tuvi.ts:53`, `shared/src/tuvi.ts:73`, `shared/src/lunar.ts:327` | `shared/test/tuvi.test.ts` |
| BR-3 ngày xem | `server/src/horoscope/routes.ts:7` | `server/test/api.test.ts` |
| BR-4 AI | `server/src/horoscope/routes.ts:19`, `server/src/ai/model.ts:81`, `server/src/ai/model.ts:113` | `server/test/api.test.ts` (SC3), `server/test/gemini.test.ts` |
| BR-5 lưu trên máy, lỗi | `web/src/lib/readings.ts:13`, `web/src/lib/readings.ts:18`, `server/src/ai/model.ts:141`, `server/src/ai/gemini.ts:46` | `app.test.tsx` (SC6), `api.test.ts` (SC5) |
| BR-6 mật khẩu chung | `server/src/access.ts:15`, `server/src/app.ts:29`, `web/src/App.tsx:18`, `web/src/api.ts:39` | `api.test.ts` (SC8), `app.test.tsx` (SC9) |
| BR-8 ẩn khi chưa bật AI | `server/src/app.ts:29`, `web/src/App.tsx:21`, `web/src/App.tsx:66`, `web/src/components/AppShell.tsx:16` | `app.test.tsx` (SC10) |
| BR-7 màn Tử vi | `web/src/pages/HoroscopePage.tsx:30`, `web/src/pages/HoroscopePage.tsx:43` | `app.test.tsx` (SC6) |

Chưa kiểm: chất lượng lời tử vi của Gemini thật.
