# Lịch âm + tử vi AI: web, app và widget Android

## Yêu cầu
- Widget tháng trên màn hình chính Android: lịch dương kèm ngày âm, ngày lễ/Tết, giờ hoàng đạo, tiết khí. Không phí, không quảng cáo.
- Hướng tới **xem tử vi bằng AI**, nên làm một web/app giống GoldFolio (dùng tốt trên điện thoại), widget đi kèm như GoldFolio Widget.

## Hướng làm: dùng lại công thức đã chạy tốt của GoldFolio
- **Stack:** Node 22 + TypeScript, npm workspaces (`shared`, `server`, `web`), Express, React + Vite + Tailwind, giao diện tối mobile-first. Deploy một service trên Render free.
- **AI:** Gemini gói miễn phí, có model dự phòng khi quá tải, giới hạn lượt mỗi ngày (giống chat của GoldFolio).
- **Lịch âm tính bằng code, không gọi mạng:**
  - Thuật toán thiên văn Hồ Ngọc Đức, múi giờ +7. Lịch Việt Nam khác lịch Trung Quốc ở vài năm (vd Tết 1985, 2007).
  - Viết một bản TypeScript (`shared/`, cho web và server) và một bản Kotlin (widget).
  - **Cả hai bản chạy chung một bộ số liệu kiểm tra** (file JSON: Tết 1985–2050, tháng nhuận, ngày lễ), để hai bản không lệch nhau.
- **AI không tự bịa số liệu:** code tính sẵn can chi ngày/tháng/năm, tuổi, tiết khí, giờ hoàng đạo (và lá số nếu chọn), AI chỉ luận giải dựa trên số liệu đó. Luôn ghi "Chỉ để tham khảo, giải trí".
- **Widget Android tháng:** tính offline trên máy, không cần server (đúng lựa chọn trước). Kotlin chỉ dùng SDK chuẩn; GitHub Actions chạy test, build APK, đính vào Releases.

## Các phần
1. **Lịch (web):** lịch tháng có ngày âm; chạm một ngày xem chi tiết (âm lịch, can chi, ngày lễ, tiết khí, giờ hoàng đạo); đổi ngày âm ↔ dương.
2. **Tử vi AI (web):** nhập ngày giờ sinh và giới tính, sau đó xem nội dung theo phạm vi chọn ở dưới, kèm chat hỏi thêm.
3. **Widget Android tháng** (4x4):
   - lưới tháng có ngày âm, chuyển tháng ‹ ›;
   - ngày lễ tô màu, hôm nay đánh dấu;
   - dòng cuối: hôm nay âm lịch, tiết khí và giờ hoàng đạo;
   - chạm vào một ngày thì mở web.

## User đã chốt (2026-11-17)
- Tử vi làm dần: đợt 1 là tử vi hằng ngày theo tuổi + chat; lá số Tử Vi Đẩu Số để đợt sau.
- ~~Có tài khoản~~ → đổi lại cùng ngày: **không tài khoản, không database**; hồ sơ và tử vi đã xem lưu trên máy, không sao lưu, không giới hạn lượt AI, có mật khẩu chung `APP_PASSWORD`.
- Repo `VuQuynhAnh/MyLunarCalendar`, dự án `projects/mylunarcalendar/`.
- Widget: chỉ widget tháng; thêm ngày lễ/Tết, giờ hoàng đạo, tiết khí.

## Kết quả
- Spec: `specs/calendar/CAL-UC01.md`, `specs/horoscope/HORO-UC01.md`, `HORO-UC02.md`.
- Test: shared 18, server 13, web 9 qua; Android chỉ build/test ở GitHub Actions.
- Phát hiện khi test: thuật toán gốc ra ngày âm "0" ở vài ngày sát sóc (vd 07/05/2054), đã sửa; Tết 2030 ở Việt Nam là 02/02/2030.

## Rủi ro
- **Lá số Tử Vi Đẩu Số đầy đủ** (an 14 chính tinh, hàng chục phụ tinh, 12 cung) là phần lớn nhất và dễ sai. Mỗi trường phái an sao hơi khác nhau, nên cần chọn một trường phái và đối chiếu với vài lá số mẫu.
- **Supabase free** chỉ cho 2 project đang chạy; không cần tài khoản thì không cần DB.
- **Gemini dùng chung key** với GoldFolio và SmartClocking, nên chung hạn mức miễn phí.
