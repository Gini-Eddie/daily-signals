import { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function installWeeklyGoals(app: Express) {
  const file = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "weekly-goals.json");
  const goals: any[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const save = () => { fs.writeFileSync(file + ".tmp", JSON.stringify(goals, null, 2)); fs.renameSync(file + ".tmp", file); };
  const week = (value: unknown) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + "T12:00:00Z");
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value || date.getUTCDay() !== 1) return null;
    return value;
  };
  const validate = (g: any) => typeof g.title === "string" && g.title.trim().length > 0 && g.title.length <= 200 && typeof g.target === "number" && Number.isFinite(g.target) && g.target > 0 && typeof g.progress === "number" && Number.isFinite(g.progress) && g.progress >= 0 && typeof g.unit === "string" && g.unit.length <= 50;
  app.get("/api/weekly-goals", (req, res) => {
    const start = week(req.query.week_start);
    if (!start) return res.status(400).json({ detail: "Choose a Monday as the week start." });
    res.json(goals.filter(g => g.week_start === start));
  });
  app.post("/api/weekly-goals", (req, res) => {
    const start = week(req.body.week_start);
    const data = { title: req.body.title, target: req.body.target, progress: req.body.progress ?? 0, unit: req.body.unit ?? "steps" };
    if (!start || !validate(data)) return res.status(400).json({ detail: "Enter a title, positive target and non-negative progress." });
    const goal = { ...data, title: data.title.trim(), id: randomUUID(), week_start: start, created_at: new Date().toISOString() };
    goals.push(goal); save(); res.status(201).json(goal);
  });
  app.put("/api/weekly-goals/:id", (req, res) => {
    const index = goals.findIndex(g => g.id === req.params.id);
    if (index < 0) return res.status(404).json({ detail: "Goal not found." });
    const data = { ...goals[index], ...Object.fromEntries(Object.entries(req.body).filter(([key]) => ["title", "target", "progress", "unit"].includes(key))) };
    if (!validate(data)) return res.status(400).json({ detail: "Enter a title, positive target and non-negative progress." });
    goals[index] = { ...data, title: data.title.trim() }; save(); res.json(goals[index]);
  });
  app.delete("/api/weekly-goals/:id", (req, res) => {
    const index = goals.findIndex(g => g.id === req.params.id);
    if (index < 0) return res.status(404).json({ detail: "Goal not found." });
    goals.splice(index, 1); save(); res.status(204).send();
  });
}
