---
name: onboard
description: Áp dụng khung AI cho một dự án — tạo projects/<p>/ mới hoặc thêm repo vào dự án có sẵn, khảo sát code rồi viết ARCHITECTURE (luật R-*, bẫy, file:line thật), CLAUDE.md dự án, domain spec và glossary. Dùng khi user gõ `/onboard <p> [repo-url|path]`, hoặc nói "thêm dự án…", "đưa repo … vào workspace", "áp dụng khung cho dự án…".
---

# /onboard <p> [repo-url | path]

Mục tiêu: sau khi chạy xong, các skill `/spec`, `/plan`, `/build`, `/review` làm việc được ngay trên dự án, nhờ có tri thức nền viết từ code thật. Đọc `.claude/kit/CONVENTIONS.md` trước.

## 1. Dựng khung dự án

- `<p>` là tên ngắn, viết thường. Chưa có `projects/<p>/` thì tạo và chép `CLAUDE.md` từ `.claude/kit/templates/project-CLAUDE.md`.
- Thêm repo: `git submodule add -b <branch> <url> projects/<p>/repos/<repo>`.
  - Nếu user đưa đường dẫn local, đọc `git -C <path> remote -v` để lấy URL và dùng URL đó. Không đụng vào repo local.
  - Repo không có remote: hỏi user tạo remote trước, hoặc chép tạm và ghi chú lại.
- Thêm một dòng vào bảng "Dự án" của `CLAUDE.md` gốc (chỉ khi là dự án mới).

## 2. Khảo sát repo (đọc tận mắt, không đoán)

1. Đọc README, manifest (`package.json`, `*.csproj`, `pyproject.toml`, `pubspec.yaml`…), file env mẫu, `CLAUDE.md` và `AGENTS.md` có sẵn trong repo, cấu hình CI.
2. Liệt kê file theo thư mục kèm số dòng để thấy hình dạng repo.
3. Đọc entry point, nơi đăng ký route/DI/module, một luồng request đầy đủ từ đầu vào tới kho dữ liệu, cơ chế auth/tenant, xử lý lỗi, schema dữ liệu, và các comment "đừng làm X" trong code.
4. Tìm lệnh dev, build, test, lint, reset dữ liệu và kiểm chứng từng lệnh từ manifest. Chạy thử các lệnh chỉ đọc nếu chạy được.
5. Repo lớn (> ~300 file nguồn) hoặc dự án có ≥ 3 repo: chia sub-agent `Explore` khảo sát song song theo khu vực. Mỗi sub-agent trả về sự thật kèm `file:line`.

## 3. Viết tri thức nền

- `projects/<p>/architecture/<repo>/ARCHITECTURE.md` theo `.claude/kit/templates/ARCHITECTURE.md`:
  - Đầu file ghi `Kiểm ở commit <sha>` (sha lấy từ `git -C … rev-parse --short HEAD`).
  - §4 phải có ít nhất một luồng request với `file:line` thật.
  - §5 luật `R-*`: rút từ những gì code đang **thực thi nhất quán**, kèm các quy ước được ghi trong README/CLAUDE.md của repo. Không đặt luật mới mà code chưa theo.
  - §6 bẫy: điều chỉ sai khi chạy (múi giờ, kiểu dữ liệu, transaction, cache, cấu hình proxy…). Chỗ code đang lệch luật của chính nó thì ghi thành một mục bẫy, không sửa code.
  - Quá 15 KB thì tách chủ đề sâu sang `ARCHITECTURE-<TOPIC>.md`.
- `projects/<p>/CLAUDE.md`: bảng repo, bảng lệnh (đã kiểm), bảng domain/prefix, quy ước riêng. Tối đa 3 KB.
- `projects/<p>/specs/_glossary.yaml`: thuật ngữ lấy từ enum, tên bảng và nhãn trên UI.
- `projects/<p>/specs/<domain>/_domain.md` theo template domain: các rule chắc chắn đọc được từ code, kèm `file:line` và trạng thái *as-built*. Rule chỉ thấy trong README thì đánh dấu *(README)*.
- `projects/<p>/protected.json` nếu repo có thư mục dữ liệu runtime hoặc file sinh ra cần chặn ghi.

## 4. Kiểm tra và bàn giao

- Chạy `node tools/check-docs.mjs`. Sửa đến khi không còn lỗi, và không còn tham chiếu mơ hồ.
- In ra:
  - Số luật, số bẫy, số rule domain.
  - Những chỗ code lệch luật (ghi trong §6).
  - Lệnh chưa kiểm được.
  - Các tính năng nên chạy `/reverse` trước tiên (lõi nghiệp vụ, nhiều rule).
- Hỏi user có muốn commit workspace không. Repo con không bị sửa trong bước này.
