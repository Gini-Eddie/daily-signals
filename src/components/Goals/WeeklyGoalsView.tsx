import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flag, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../../services/api";

export interface WeeklyGoal { id: string; week_start: string; title: string; target: number; progress: number; unit: string }
export function weekStart(value = new Date()) {
  const date = new Date(value); date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const percent = (goal: WeeklyGoal) => Math.min(100, Math.round(goal.progress / goal.target * 100));
const colors = ["#059669", "#6366f1", "#d97706", "#0284c7"];

const GoalCard: React.FC<{ goal: WeeklyGoal; index: number; onUpdate: (g: WeeklyGoal) => void; onEdit: () => void; onDelete: () => void }> = ({ goal, index, onUpdate, onEdit, onDelete }) => {
  const [draft, setDraft] = useState(String(goal.progress));
  const draftRef = useRef(draft); draftRef.current = draft;
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lastProgress = useRef(String(goal.progress));
  useEffect(() => { if (draftRef.current === lastProgress.current) setDraft(String(goal.progress)); lastProgress.current = String(goal.progress); }, [goal.id, goal.progress]);
  const save = async (value: number) => {
    if (busy) return;
    if (!Number.isFinite(value) || value < 0) { setError("Enter a number of zero or more."); return; }
    setBusy(true); setError(""); const submitted = draftRef.current;
    try {
      const result = await api.updateWeeklyGoal(goal.id, { progress: value });
      onUpdate(result);
      if (draftRef.current === submitted) setDraft(String(result.progress));
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const color = colors[index % colors.length], pct = percent(goal);
  return <article className="rounded-2xl border border-slate-200 border-t-[3px] bg-white p-5 shadow-xs transition-shadow hover:shadow-md" style={{ borderTopColor: color }}>
    <div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-slate-400">GOAL {String(index + 1).padStart(2, "0")}</span><div className="flex gap-2"><button onClick={onEdit} aria-label={`Edit ${goal.title}`} className="text-slate-400 hover:text-slate-900"><Pencil size={15} /></button><button onClick={onDelete} aria-label={`Delete ${goal.title}`} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button></div></div>
    <h3 className="mt-3 text-lg font-semibold text-slate-900">{goal.title}</h3>
    <div className="mt-4 flex items-end justify-between"><span className="text-sm text-slate-500">{goal.progress} / {goal.target} {goal.unit}</span><strong style={{ color }} className="text-2xl tabular-nums">{pct}%</strong></div>
    <div role="progressbar" aria-label={`${goal.title} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
    <p className="mt-2 text-xs text-slate-500">{pct === 100 ? "Goal accomplished. Take a moment to enjoy it." : `${Math.max(0, Math.round((goal.target - goal.progress) * 100) / 100)} to go. One step at a time.`}</p>
    <form onSubmit={e => { e.preventDefault(); if (!draft.trim()) { setError("Enter your progress."); return; } save(Number(draft)); }} className="mt-5 flex items-end gap-2">
      <label className="flex-1 text-xs font-medium text-slate-500">Progress<input aria-label={`${goal.title} progress`} type="text" inputMode="decimal" value={draft} onChange={e => setDraft(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900" /></label>
      <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
    </form>
    <button disabled={busy || pct === 100} onClick={() => save(goal.target)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"><Check size={14} /> {pct === 100 ? "Accomplished" : "Mark accomplished"}</button>
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
  </article>;
}

export function WeeklyGoalsView({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const [week, setWeek] = useState(weekStart());
  const [goals, setGoals] = useState<WeeklyGoal[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [editing, setEditing] = useState<WeeklyGoal | "new" | null>(null), [saving, setSaving] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<WeeklyGoal | null>(null);
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current; setLoading(true); setError(""); setEditing(null); setDeleteGoal(null);
    api.getWeeklyGoals(week).then(data => { if (id === request.current) setGoals(data); }).catch(e => { if (id === request.current) setError(e.message); }).finally(() => { if (id === request.current) setLoading(false); });
    return () => { request.current++; };
  }, [week]);
  const move = (days: number) => { const date = new Date(week + "T12:00:00"); date.setDate(date.getDate() + days); setWeek(weekStart(date)); };
  const end = new Date(week + "T12:00:00"); end.setDate(end.getDate() + 6);
  const range = `${new Date(week + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  const completed = goals.filter(g => g.progress >= g.target).length;
  const average = goals.length ? Math.round(goals.reduce((sum, g) => sum + Math.min(100, g.progress / g.target * 100), 0) / goals.length) : 0;
  const saveGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = new FormData(e.currentTarget); const target = Number(form.get("target"));
    const payload = { title: String(form.get("title") || "").trim(), target, unit: String(form.get("unit") || "steps").trim() };
    if (!payload.title || !Number.isFinite(target) || target <= 0) { setError("Enter a goal name and a target greater than zero."); return; }
    setSaving(true); setError("");
    try {
      const result = editing === "new" ? await api.createWeeklyGoal({ ...payload, week_start: week, progress: 0 }) : await api.updateWeeklyGoal((editing as WeeklyGoal).id, payload);
      setGoals(prev => editing === "new" ? [...prev, result] : prev.map(g => g.id === result.id ? result : g)); setEditing(null);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  if (compact) return <button onClick={onOpen} className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-left transition-shadow hover:shadow-md flex items-center gap-3"><Flag size={22} className="text-emerald-600 shrink-0" /><div className="flex-1"><h3 className="text-sm font-semibold">Your weekly focus</h3><p className="text-xs text-slate-500">{loading ? "Loading your goals…" : error ? "Open weekly goals to try again" : goals.length ? `${completed} of ${goals.length} goals accomplished · ${average}% overall` : "Choose 3–4 things you want to move forward this week."}</p></div><ArrowRight size={18} className="text-slate-400" /></button>;
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">A little direction for your week</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Weekly goals</h2><p className="mt-1 text-sm text-slate-500">Start with 3–4 meaningful goals. Update progress as you go.</p></div><button onClick={() => { setEditing("new"); setError(""); }} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add goal</button></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><button aria-label="Previous week" disabled={saving} onClick={() => move(-7)} className="rounded-lg border border-slate-200 p-2"><ArrowLeft size={16} /></button><span className="text-sm font-semibold">{range}</span><button aria-label="Next week" disabled={saving} onClick={() => move(7)} className="rounded-lg border border-slate-200 p-2"><ArrowRight size={16} /></button></div><button onClick={() => setWeek(weekStart())} className="text-xs font-semibold text-slate-500">This week</button><span className="text-sm text-slate-500">{completed}/{goals.length} accomplished <strong className="ml-2 text-emerald-700">{average}% overall</strong></span></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {editing && <form key={typeof editing === "string" ? editing : editing.id} onSubmit={saveGoal} className="rounded-xl border border-emerald-200 bg-white p-5 space-y-4"><div className="flex justify-between"><h3 className="font-semibold">{editing === "new" ? "A goal for this week" : "Edit weekly goal"}</h3><button disabled={saving} type="button" aria-label="Cancel goal editing" onClick={() => setEditing(null)}><X size={18} /></button></div><label className="block text-xs font-medium text-slate-600">Goal<input name="title" required maxLength={200} defaultValue={editing === "new" ? "" : editing.title} placeholder="Finish four workouts" className="mt-1 block w-full rounded-lg border border-slate-200 p-3 text-sm" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium text-slate-600">Weekly target<input name="target" required type="text" inputMode="decimal" defaultValue={editing === "new" ? "4" : editing.target} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-medium text-slate-600">Unit<input name="unit" required maxLength={50} defaultValue={editing === "new" ? "workouts" : editing.unit} placeholder="hours, pages, applications" className="mt-1 block w-full rounded-lg border border-slate-200 p-3 text-sm" /></label></div><p className="text-xs text-slate-500">For a one-off goal, use a target of 1. Completion is progress ÷ target, capped at 100%.</p><button disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save goal"}</button></form>}
    {deleteGoal && <div role="alertdialog" aria-label="Delete weekly goal" className="rounded-xl border border-rose-200 bg-white p-5"><p className="text-sm">Delete “{deleteGoal.title}” and its progress?</p><div className="mt-3 flex gap-3"><button disabled={saving} onClick={async () => { setSaving(true); try { await api.deleteWeeklyGoal(deleteGoal.id); setGoals(prev => prev.filter(g => g.id !== deleteGoal.id)); setDeleteGoal(null); } catch (e: any) { setError(e.message); } finally { setSaving(false); } }} className="text-sm font-semibold text-rose-700">Delete goal</button><button disabled={saving} onClick={() => setDeleteGoal(null)} className="text-sm text-slate-500">Keep goal</button></div></div>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading this week…</p> : goals.length ? <div className="grid gap-4 md:grid-cols-2">{goals.map((goal, index) => <GoalCard key={`${week}-${goal.id}`} goal={goal} index={index} onEdit={() => { setEditing(goal); setError(""); }} onDelete={() => setDeleteGoal(goal)} onUpdate={updated => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))} />)}</div> : !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Flag className="mx-auto mb-3 text-emerald-600" size={30} /><h3 className="font-semibold">Make room for what matters.</h3><p className="mt-2 text-sm text-slate-500">Your week is a blank page. Add your first goal to get started.</p></div>}
  </section>;
}
