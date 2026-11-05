# Deploy GoldFolio lên Render (một Web Service)

Việc: 2026-11-05-deploy-render · Spec: không đổi hành vi · Repo: goldfolio · Branch: `feat/postgres` → gộp vào `main`

## Bối cảnh
Lần deploy đầu thất bại: Render build nhánh `main` (chỉ có commit khởi tạo, không có `package.json`) nên tự nhận là dự án Ruby. Ngoài ra server chưa phục vụ giao diện web, nên một service không chạy đủ app.

## Checklist
- [x] Test trước: `server/test/static.test.ts` (trả file tĩnh, route web trả `index.html`, `/api` lạ trả 404 JSON, API cũ không đổi)
- [x] `server/src/app.ts`: `webDist` → `express.static` + fallback `index.html`; 404 JSON cho `/api` lạ
- [x] `server/src/index.ts`: dùng `web/dist` nếu đã build
- [x] `tsx` chuyển sang dependencies của server; script `start` ở gốc
- [x] Chạy thử đúng lệnh Render: `NODE_ENV=production npm run build` OK; server production (Supabase thật) trả web `/`, `/lan-mua` và API
- [x] README mục "Deploy lên Render"; ARCHITECTURE bẫy §6.13 (`NODE_ENV=production` lúc build bỏ devDependencies)
- [x] Commit, push, gộp vào `main` (fast-forward)
- [ ] User cấu hình Render (Language Node, Build/Start Command, biến môi trường, bỏ `PORT`) rồi Manual Deploy

## Ghi chú
- `npm ci` trên máy Windows của user lỗi EPERM vì `npm run dev` đang chạy giữ file native; không ảnh hưởng Render (Linux, thư mục sạch).
- Ảnh chụp màn hình Render để lộ mật khẩu DB trong `DATABASE_URL`: user nên đổi mật khẩu Supabase và cập nhật lại biến.
