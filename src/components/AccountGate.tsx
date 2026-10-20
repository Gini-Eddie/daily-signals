import React, { useEffect, useState } from "react";
import { Activity, LogOut } from "lucide-react";
import { authRequest } from "../services/api";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<any>(null);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState("");
  const changingPassword = !!status?.authenticated && (!!status?.must_change_password || mode === "change-password");
  const load = () => authRequest("status").then(setStatus).catch(e => setError(e.message));
  useEffect(() => {
    load();
    const expired = () => { sessionStorage.removeItem("daily-signals-session"); setStatus((s: any) => ({ ...s, authenticated: false })); };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const action = changingPassword ? "change-password" : status?.configured ? mode : "register";
    if (action !== "login" && payload.password !== payload.confirm) { setError("Passwords do not match."); setBusy(false); return; }
    try {
      const data = await authRequest(action, payload);
      if (data.token) sessionStorage.setItem("daily-signals-session", data.token);
      if (data.recovery_code) setRecovery(data.recovery_code);
      await load();
      setMode("login");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  if (status?.authenticated && !recovery && !changingPassword) return <><div className="flex justify-end gap-3 px-6 py-2 text-xs text-slate-500 bg-white border-b border-slate-100"><span>{status.email} · Owner</span><button onClick={() => { setMode("change-password"); setError(""); }}>Change password</button><button className="flex items-center gap-1 hover:text-slate-900" onClick={async () => { try { await authRequest("logout", {}); sessionStorage.removeItem("daily-signals-session"); setStatus({ ...status, authenticated: false }); } catch (e: any) { setError(e.message); } }}><LogOut size={14} /> Sign out</button>{error && <span role="alert">{error}</span>}</div>{children}</>;
  const creating = status && !status.configured;
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5 py-12"><div className="w-full max-w-md">
    <div className="flex items-center gap-2 mb-10 font-bold text-xl tracking-tight"><Activity className="text-emerald-600" /> Daily Signals</div>
    <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight">{recovery ? "Keep your recovery code" : changingPassword ? "Choose your password" : creating ? "Make this space yours" : mode === "recover" ? "Recover your account" : "Welcome back"}</h1>
      <img src="/images/steady-progress.webp" alt="Sunrise over a quiet green path" width={480} height={150} className="mt-4 mb-4 h-28 w-full rounded-xl object-cover" />
      <p className="text-sm text-slate-500 mt-2 mb-6">{recovery ? "Save this code somewhere private. Use it with your email if you forget your password. Each recovery generates a new code." : changingPassword ? "Your existing profile, habits and history stay with this owner account. Choose a password only you know." : "Small actions. Clear progress. A little better each day."}</p>
      {error && <p role="alert" className="bg-rose-50 text-rose-700 rounded-lg p-3 mb-4 text-sm">{error}</p>}
      {recovery ? <><code className="block break-all bg-slate-50 rounded-lg p-4 select-all">{recovery}</code><button className="mt-5 w-full bg-slate-900 text-white rounded-lg p-3" onClick={() => setRecovery("")}>I saved my code — continue</button></> : status ? <form onSubmit={submit} className="space-y-4">
        {changingPassword ? <label className="block text-sm font-medium">Current password<input required name="current_password" type="password" autoComplete="current-password" className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label> : <label className="block text-sm font-medium">Email<input required name="email" type="email" autoComplete="username" className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>}
        {creating && <label className="block text-sm font-medium">Setup key<input name="setup_key" type="password" className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /><span className="text-xs text-slate-500">Use the key configured by your app administrator. Optional in local development.</span></label>}
        {mode === "recover" && !creating && !changingPassword && <label className="block text-sm font-medium">Recovery code<input required name="recovery_code" autoComplete="off" className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>}
        <label className="block text-sm font-medium">{(mode === "recover" || changingPassword) ? "New password" : "Password"}<input required minLength={creating || mode === "recover" || changingPassword ? 12 : 1} maxLength={256} name="password" type="password" autoComplete={creating || mode === "recover" || changingPassword ? "new-password" : "current-password"} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
        {(creating || mode === "recover" || changingPassword) && <label className="block text-sm font-medium">Confirm password<input required name="confirm" type="password" autoComplete="new-password" className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /><span className="text-xs text-slate-500">Use at least 12 characters.</span></label>}
        <button disabled={busy} className="w-full bg-slate-900 text-white rounded-lg p-3 font-semibold disabled:opacity-50">{busy ? "Please wait…" : changingPassword ? "Save my password" : creating ? "Create personal account" : mode === "recover" ? "Reset password" : "Sign in"}</button>
        {!creating && !changingPassword && <button type="button" className="text-sm text-slate-600 underline" onClick={() => { setMode(mode === "login" ? "recover" : "login"); setError(""); }}>{mode === "login" ? "Forgot password?" : "Back to sign in"}</button>}
        {changingPassword && !status?.must_change_password && <button type="button" onClick={() => setMode("login")} className="text-sm underline">Cancel</button>}
      </form> : <button onClick={load} className="text-sm underline">{error ? "Retry connection" : "Connecting…"}</button>}
    </div><p className="text-center text-xs text-slate-400 mt-6">Your habits, your pace.</p>
  </div></main>;
}
