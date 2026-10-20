import { Express } from "express";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// One private account protects this personal installation and its existing data.
export function installAuth(app: Express) {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "account.json");
  let account = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const sessions = new Map<string, number>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  const hash = (value: string) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(value, salt, 64).toString("hex")}`; };
  const verify = (value: string, stored: string) => { const [salt, key] = stored.split(":"); return timingSafeEqual(scryptSync(value, salt, 64), Buffer.from(key, "hex")); };
  const save = () => { fs.writeFileSync(`${file}.tmp`, JSON.stringify(account), { mode: 0o600 }); fs.renameSync(`${file}.tmp`, file); };
  const tokenKey = (req: any) => digest(String(req.headers.authorization || "").replace(/^Bearer /, ""));
  const authenticated = (req: any) => (sessions.get(tokenKey(req)) || 0) > Date.now();
  app.get("/api/auth/status", (req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ configured: !!account, authenticated: authenticated(req), email: authenticated(req) ? account?.email : undefined, must_change_password: authenticated(req) && !!account?.must_change_password, role: authenticated(req) ? "owner" : undefined }); });
  app.post("/api/auth/:action", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const action = req.params.action;
    if (action === "logout") { sessions.delete(tokenKey(req)); return res.json({ ok: true }); }
    if (action === "change-password") {
      if (!authenticated(req)) return res.status(401).json({ detail: "Please sign in." });
      const { current_password, password } = req.body;
      if (typeof current_password !== "string" || current_password.length > 256 || typeof password !== "string" || password.length < 12 || password.length > 256) return res.status(400).json({ detail: "Enter your current password and a new password of at least 12 characters." });
      if (!verify(current_password, account.password)) return res.status(400).json({ detail: "Your current password is incorrect." });
      if (current_password === password) return res.status(400).json({ detail: "Choose a different password." });
      account.password = hash(password); account.must_change_password = false; save(); sessions.clear();
      const token = randomBytes(32).toString("hex"); sessions.set(digest(token), Date.now() + 7 * 86400000);
      return res.json({ token });
    }
    if (!["register", "login", "recover"].includes(action)) return res.status(404).json({ detail: "Unknown account action" });
    const ip = req.ip || "local";
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
    const limit = attempts.get(ip) || { count: 0, expires: now + 900000 };
    attempts.set(ip, limit);
    if (++limit.count > 10) return res.status(429).json({ detail: "Too many attempts. Try again in 15 minutes." });
    const { email, password, recovery_code, setup_key } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length > 256) return res.status(400).json({ detail: "Enter a valid email and password." });
    if (action !== "login" && password.length < 12) return res.status(400).json({ detail: "Use at least 12 characters for your password." });
    let recovery: string | undefined;
    if (action === "register") {
      if (account) return res.status(409).json({ detail: "This personal app already has an account. Please sign in." });
      if ((process.env.NODE_ENV === "production" && !process.env.ACCOUNT_SETUP_KEY) || (process.env.ACCOUNT_SETUP_KEY && digest(String(setup_key || "")) !== digest(process.env.ACCOUNT_SETUP_KEY))) return res.status(403).json({ detail: "Ask your app administrator for the account setup key." });
      recovery = randomBytes(24).toString("hex");
      account = { email: email.trim().toLowerCase(), password: hash(password), recovery: digest(recovery) };
      save();
    } else {
      const validEmail = account && email.trim().toLowerCase() === account.email;
      const valid = action === "login" ? verify(password, account?.password || hash("invalid-password")) : typeof recovery_code === "string" && digest(recovery_code.trim()) === account?.recovery;
      if (!validEmail || !valid) return res.status(400).json({ detail: "Email or credentials are incorrect." });
      if (action === "recover") {
        recovery = randomBytes(24).toString("hex");
        account.password = hash(password); account.recovery = digest(recovery); account.must_change_password = false; save(); sessions.clear();
      }
    }
    attempts.delete(ip);
    for (const [key, expiry] of sessions) if (expiry < now) sessions.delete(key);
    const token = randomBytes(32).toString("hex");
    sessions.set(digest(token), now + 7 * 86400000);
    return res.json({ token, recovery_code: recovery });
  });
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!authenticated(req)) return res.status(401).json({ detail: "Please sign in." });
    next();
  });
}
