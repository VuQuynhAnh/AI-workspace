# sql

Script SQL một lần, dùng để tra cứu hoặc vá dữ liệu trên môi trường thật. **Đây không phải migration**: cấu trúc DB chỉ đổi qua `repos/smartclocking/backend/src/db/schema.sql` (R-DB-01).

- Đặt tên `<YYYY-MM-DD>-<mô-tả>.sql` cho script chỉ đọc, `<YYYY-MM-DD>-<mô-tả>.EXECUTE.sql` cho script cần chạy để sửa dữ liệu.
- Script sửa dữ liệu phải chạy trong `BEGIN … COMMIT`, chỉ cập nhật cờ xoá mềm (không `DELETE`, R-DB-02), và luôn lọc theo `store_id`.
- Không ghi secret hay dữ liệu cá nhân thật vào file.
