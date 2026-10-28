// SessionStart (startup|resume|compact): nhắc lại trạng thái làm việc để Claude
// không mất dấu sau khi nén ngữ cảnh — branch + số file chưa commit của từng
// repo, và các việc (work item) còn mục chưa xong. Chỉ đọc, không gọi mạng.
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cwd, ...args) => {
  try {
    return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const dirs = (p) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
const dirty = (cwd) => {
  const s = run(cwd, "status", "--porcelain");
  return s ? s.split("\n").length : 0;
};

const lines = [`Workspace: ${run(root, "branch", "--show-current") || "?"}${dirty(root) ? ` (${dirty(root)} file chưa commit)` : ""}`];

for (const project of dirs(path.join(root, "projects"))) {
  const pDir = path.join(root, "projects", project);
  const repos = dirs(path.join(pDir, "repos")).map((r) => {
    const rDir = path.join(pDir, "repos", r);
    const n = dirty(rDir);
    return `${r}@${run(rDir, "branch", "--show-current") || "detached"}${n ? ` (${n} chưa commit)` : ""}`;
  });
  // Việc đang dở: plan.md còn "- [ ]", mới nhất trước
  const open = dirs(path.join(pDir, "work"))
    .map((w) => {
      const plan = path.join(pDir, "work", w, "plan.md");
      if (!fs.existsSync(plan)) return null;
      const text = fs.readFileSync(plan, "utf8");
      const todo = (text.match(/^\s*- \[ \]/gm) || []).length;
      const done = (text.match(/^\s*- \[x\]/gim) || []).length;
      return todo ? { w, todo, done, t: fs.statSync(plan).mtimeMs } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.t - a.t)
    .slice(0, 3)
    .map(({ w, todo, done }) => `work/${w} (${done}/${todo + done})`);
  lines.push(`Dự án ${project}: ${repos.join(", ") || "chưa có repo"}${open.length ? ` · việc dở: ${open.join(", ")}` : ""}`);
}
lines.push("Quy ước: .claude/kit/CONVENTIONS.md · bản đồ dự án: projects/<p>/CLAUDE.md");

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lines.join("\n") } })
);
