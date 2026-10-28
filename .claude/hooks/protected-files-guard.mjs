// PreToolUse (Edit|Write|MultiEdit|NotebookEdit): chặn ghi vào file được bảo vệ.
// Luật chung của khung nằm ở RULES; mỗi dự án thêm luật riêng trong
// projects/<p>/protected.json: [{ "pattern": "<regex trên đường dẫn tính từ projects/<p>/>", "why": "..." }].
// So theo TÊN FILE cho secret/khoá (không so chuỗi trên cả đường dẫn) để không
// chặn nhầm file code có chữ "secret" trong tên.
// Đọc JSON từ stdin; exit 2 + stderr = chặn và báo lý do cho Claude.
import fs from "fs";
import path from "path";

const RULES = [
  { test: (n) => n === ".env" || (n.startsWith(".env.") && n !== ".env.example"), why: "file .env chứa secret — chỉ sửa .env.example" },
  { test: (n) => /\.(pem|key|pfx|p12|jks|keystore)$/.test(n), why: "file khoá/chứng chỉ" },
  { test: (n) => /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock|poetry\.lock|Cargo\.lock|pubspec\.lock)$/.test(n), why: "lockfile chỉ đổi qua package manager" },
  // "build/" không chặn chung (có thể là source, vd skill .claude/skills/build/) — dự án cần thì khai báo trong protected.json
  { test: (n, p) => !/(^|\/)\.claude\//.test(p) && /(^|\/)(node_modules|\.git|dist|\.next|obj)\//.test(p), why: "thư mục do công cụ sinh ra — sửa source rồi build lại" },
  { test: (n) => /^LICEN[CS]E(\.[a-z]+)?$/i.test(n), why: "file license" },
];

function projectRules(p) {
  const m = p.match(/(^|\/)projects\/([^/]+)\/(.*)$/);
  if (!m) return [];
  const [, , project, inner] = m;
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  try {
    const list = JSON.parse(fs.readFileSync(path.join(root, "projects", project, "protected.json"), "utf8"));
    return list.filter((r) => new RegExp(r.pattern).test(inner)).map((r) => r.why);
  } catch {
    return [];
  }
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    const input = JSON.parse(raw || "{}");
    filePath = input.tool_input?.file_path || input.tool_input?.notebook_path || "";
  } catch {
    process.exit(0); // input lạ: không chặn nhầm
  }
  if (!filePath) process.exit(0);
  const p = filePath.replace(/\\/g, "/");
  const name = p.split("/").pop();
  const why = RULES.find((r) => r.test(name, p))?.why || projectRules(p)[0];
  if (why) {
    process.stderr.write(`[protected-files-guard] Chặn ghi "${filePath}": ${why}.\n`);
    process.exit(2);
  }
  process.exit(0);
});
