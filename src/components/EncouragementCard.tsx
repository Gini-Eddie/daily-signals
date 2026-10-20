import React, { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

const quotes = [
  { text: "A small step still changes where you stand.", note: "Choose one thing you can do today. Let that be enough to begin." },
  { text: "Consistency grows when you make room for imperfect days.", note: "Your minimum counts. Keep showing up at your own pace." },
  { text: "Progress is built in the ordinary moments.", note: "One page, one rep, one focused minute. It all adds up." },
  { text: "You can begin again without starting from nothing.", note: "Everything you have learned comes with you." },
];

export function EncouragementCard({ onGoals }: { onGoals: () => void }) {
  const [index, setIndex] = useState(new Date().getDate() % quotes.length);
  return <aside className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#f6f8f2] grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_200px]">
    <div className="p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">A little encouragement</p><blockquote key={index} className="encouragement-quote mt-2 text-lg sm:text-xl font-semibold leading-snug tracking-tight text-slate-800">“{quotes[index].text}”</blockquote><p className="mt-2 text-xs leading-relaxed text-slate-500">{quotes[index].note}</p><div className="mt-4 flex flex-wrap gap-4"><button onClick={onGoals} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">See your weekly focus <ArrowRight size={13} /></button><button onClick={() => setIndex(value => (value + 1) % quotes.length)} aria-label="Another encouragement" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"><RefreshCw size={12} /> Another thought</button></div></div>
    <img src="/images/steady-progress.webp" width={300} height={200} alt="A sunlit path winding through green hills beside a growing seedling" className="h-full w-full object-cover" />
  </aside>;
}
