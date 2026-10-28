// Kiểm tra tài liệu AI của workspace (CONVENTIONS §7, §8):
//  1. Ngân sách kích thước các file nạp vào ngữ cảnh.
//  2. Mọi tham chiếu `file:line` trong projects/<p>/{architecture,specs} trỏ tới
//     file có thật trong repo của dự án, và dòng không vượt quá số dòng của file.
//  3. File được trích đã đổi kể từ commit ghi ở đầu tài liệu ("Kiểm ở commit `sha`"),
//     tính cả thay đổi chưa commit -> cảnh báo: số dòng có thể đã lệch, cần đối chiếu
//     lại; đối chiếu xong (và đã commit code) thì cập nhật sha.
// Chạy ở gốc workspace: node tools/check-docs.mjs [--strict]
//   exit 1 khi có lỗi (hoặc có cảnh báo nếu --strict).
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const KB = 1024;
const errors = [];
const warnings = [];

const rel = (p) => path.relative(root, p).replace(/\\/g, "/");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const dirs = (p) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);

function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walkMd(p);
    return /\.(md|ya?ml)$/.test(d.name) ? [p] : [];
  });
}

// ---------- 1. Ngân sách ----------
const budgets = [
  ["CLAUDE.md", 4],
  [".claude/kit/CONVENTIONS.md", 8],
  ...dirs(path.join(root, ".claude/skills")).map((s) => [`.claude/skills/${s}/SKILL.md`, 8]),
  ...dirs(path.join(root, "projects")).flatMap((p) => [
    [`projects/${p}/CLAUDE.md`, 3],
    ...dirs(path.join(root, "projects", p, "architecture")).map((r) => [`projects/${p}/architecture/${r}/ARCHITECTURE.md`, 15]),
  ]),
];
for (const [file, maxKb] of budgets) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) continue;
  const size = fs.statSync(abs).size;
  if (size > maxKb * KB) errors.push(`${file}: ${(size / KB).toFixed(1)} KB > ${maxKb} KB — tách bớt sang references/ hoặc ARCHITECTURE-<TOPIC>.md`);
}

// ---------- 2 + 3. Tham chiếu file:line ----------
// `path/to/file.ext:12`, `file.ext:12-20`, `file.ext:16,30,38`
const REF_RE = /`([\w@./-]+\.[A-Za-z0-9]+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)`/g;
let refCount = 0;

for (const project of dirs(path.join(root, "projects"))) {
  const projectDir = path.join(root, "projects", project);
  const repos = dirs(path.join(projectDir, "repos")).map((name) => {
    const dir = path.join(projectDir, "repos", name);
    let files = [];
    try {
      // Gồm cả file mới chưa commit (đang làm dở), bỏ qua file bị .gitignore
      files = git(dir, "ls-files", "--cached", "--others", "--exclude-standard").split("\n").filter(Boolean);
    } catch {
      warnings.push(`projects/${project}/repos/${name}: không đọc được git (chưa init submodule?)`);
    }
    return { name, dir, files };
  });
  const lineCache = new Map();
  const changedCache = new Map();

  const docs = [...walkMd(path.join(projectDir, "architecture")), ...walkMd(path.join(projectDir, "specs"))];
  for (const doc of docs) {
    const text = fs.readFileSync(doc, "utf8");
    const sha = text.match(/Kiểm ở commit `([0-9a-f]{7,40})`/)?.[1];
    for (const m of text.matchAll(REF_RE)) {
      const [, refPath, linesSpec] = m;
      if (refPath.includes("<")) continue; // placeholder trong template
      refCount++;
      const where = `${rel(doc)}: \`${refPath}:${linesSpec}\``;
      const candidates = repos.flatMap((r) =>
        r.files.filter((f) => f === refPath || f.endsWith(`/${refPath}`)).map((f) => ({ repo: r, file: f }))
      );
      if (!candidates.length) {
        errors.push(`${where} — không tìm thấy file trong repo của dự án`);
        continue;
      }
      if (candidates.length > 1) {
        warnings.push(`${where} — mơ hồ, khớp ${candidates.map((c) => c.file).join(" | ")}; ghi đường dẫn dài hơn`);
      }
      const maxLine = Math.max(...linesSpec.split(/[,-]/).map((n) => Number(n.trim())));
      const fits = candidates.filter(({ repo, file }) => {
        const key = `${repo.dir}|${file}`;
        if (!lineCache.has(key)) {
          lineCache.set(key, fs.readFileSync(path.join(repo.dir, file), "utf8").split("\n").length);
        }
        return maxLine <= lineCache.get(key);
      });
      if (!fits.length) {
        errors.push(`${where} — dòng ${maxLine} vượt quá độ dài file`);
        continue;
      }
      if (!sha) continue;
      const { repo, file } = fits[0];
      const key = `${repo.dir}|${sha}|${file}`;
      if (!changedCache.has(key)) {
        let changed;
        try {
          // So với working tree (không phải HEAD): sửa code chưa commit cũng bị phát hiện
          changed = git(repo.dir, "diff", "--name-only", sha, "--", file).trim() !== "";
        } catch {
          changed = null; // sha không có trong repo này
        }
        changedCache.set(key, changed);
      }
      const changed = changedCache.get(key);
      if (changed === null) warnings.push(`${where} — repo ${repo.name} không có commit ${sha}`);
      else if (changed) warnings.push(`${where} — ${file} đã đổi từ ${sha}; đối chiếu lại dòng rồi cập nhật sha`);
    }
  }
}

// ---------- Kết quả ----------
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${refCount} tham chiếu · ${budgets.length} file ngân sách · ${errors.length} lỗi · ${warnings.length} cảnh báo`);
if (errors.length || (strict && warnings.length)) process.exit(1);
