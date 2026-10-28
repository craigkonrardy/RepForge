import { createClient } from "@/lib/supabase/server";
import { addProgram } from "./actions";
import { CalendarDays } from "lucide-react";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
  const { data: programs, error } = await supabase.from("programs").select("id,title,description,duration_weeks,created_at").order("created_at", { ascending: false });
  const coach = profile?.role === "coach";
  return <div><p className="text-sm text-zinc-500">LONG-TERM PROGRAMMING</p><h1 className="mt-2 text-3xl font-black">Training programs</h1><p className="mt-2 text-zinc-400">Organize sessions into a multi-week plan.</p>
    {coach && <form action={addProgram} className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-[#111512] p-4 sm:grid-cols-[1fr_2fr_120px_auto]"><input name="title" required minLength={2} maxLength={120} placeholder="Program name" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-lime-300"/><input name="description" placeholder="Program goal (optional)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-lime-300"/><input name="duration_weeks" type="number" min="1" max="104" defaultValue="4" required className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-lime-300"/><button className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-200">+ Create</button></form>}
    {error ? <p className="mt-5 text-sm text-amber-200">Could not load programs. Apply the database migration and check your permissions.</p> : programs?.length ? <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{programs.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-[#111512] p-5"><div className="flex items-center justify-between"><CalendarDays className="text-lime-300"/><span className="text-xs text-zinc-500">{p.duration_weeks} weeks</span></div><h3 className="mt-4 font-bold">{p.title}</h3><p className="mt-2 text-sm text-zinc-400">{p.description || "No program description yet."}</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center"><CalendarDays className="mx-auto text-zinc-500"/><h3 className="mt-4 font-bold">No programs yet</h3><p className="mt-2 text-sm text-zinc-500">Create a program, then add weekly workouts in the next iteration.</p></div>}
  </div>;
}