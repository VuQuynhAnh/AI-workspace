// PreToolUse (Edit|Write|MultiEdit|Bash): chặn ghi secret / số định danh thật vào
// file hoặc câu lệnh (kể cả commit message). Không gọi mạng.
// Chỉ bắt mẫu chắc chắn là secret thật; giá trị mẫu (change-me, example, your-…)
// và dữ liệu demo (SĐT, mật khẩu mẫu trong seed) không bị chặn.
const PATTERNS = [
  { re: /AIza[0-9A-Za-z_-]{35}/, what: "Google/Gemini API key" },
  { re: /cloudinary:\/\/\d+:[^@\s"'`]+@/, what: "CLOUDINARY_URL có api_secret" },
  { re: /(mongodb(\+srv)?|postgres(ql)?|redis(s)?):\/\/[^:\s/"'`]+:[^@\s"'`]+@(?!localhost|127\.0\.0\.1)/, what: "connection string có mật khẩu" },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: "private key" },
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, what: "GitHub token" },
  { re: /\bsk-[A-Za-z0-9_-]{20,}/, what: "API secret key (sk-…)" },
  { re: /\b[A-Z_]*(JWT|SESSION|APP)_SECRET\s*=\s*(?![^\s"'`]*(change-?me|example|your-|placeholder|dev-secret))[^\s"'`]{16,}/, what: "secret ứng dụng thật" },
  { re: /(CCCD|CMND|căn cước)[^\n]{0,30}?\b\d{9}(\d{3})?\b/i, what: "số CCCD/CMND" },
];

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let text = "";
  try {
    const t = JSON.parse(raw || "{}").tool_input || {};
    const edits = Array.isArray(t.edits) ? t.edits.map((e) => e.new_string) : [];
    text = [t.content, t.new_string, t.command, ...edits].filter(Boolean).join("\n");
  } catch {
    process.exit(0);
  }
  for (const { re, what } of PATTERNS) {
    if (re.test(text)) {
      process.stderr.write(
        `[pii-guard] Phát hiện ${what}. Không ghi secret/PII vào file hoặc lệnh — dùng biến môi trường (.env) hoặc dữ liệu giả.\n`
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
