import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addWorkout } from "./actions";
import { ClipboardList, ArrowUpRight } from "lucide-react";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
  const coach = profile?.role === "coach";
  const { data: workouts, error } = await supabase.from("workouts").select("id,title,description,created_at,workout_exercises(count)").order("created_at", { ascending: false });

  return <div><div><p className="text-sm text-zinc-500">PROGRAMMING</p><h1 className="mt-2 text-3xl font-black">Workouts</h1><p className="mt-2 text-zinc-400">Build standalone sessions that can also become part of a training program.</p></div>
    {coach && <form action={addWorkout} className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-[#111512] p-4 sm:grid-cols-[1fr_2fr_auto]"><input name="title" required minLength={2} maxLength={120} placeholder="Workout title (e.g. Lower Body A)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-lime-300"/><input name="description" maxLength={2000} placeholder="Focus or coaching notes (optional)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-lime-300"/><button className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-200">+ Create workout</button></form>}
    {error ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Could not load workouts. Apply the database migration and check your account permissions.</div> : workouts?.length ? <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{workouts.map(w=><article key={w.id} className="rounded-2xl border border-white/10 bg-[#111512] p-5"><div className="flex items-start justify-between"><div className="rounded-xl bg-lime-300/10 p-3 text-lime-300"><ClipboardList/></div><span className="text-xs text-zinc-500">{w.workout_exercises?.[0]?.count ?? 0} exercises</span></div><h3 className="mt-4 font-bold">{w.title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">{w.description || "No description yet."}</p><div className="mt-4 border-t border-white/10 pt-4 text-xs text-zinc-500">Created {new Date(w.created_at).toLocaleDateString()}</div></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-zinc-400"><ClipboardList/></div><h3 className="mt-4 font-bold">No workouts yet</h3><p className="mt-2 text-sm text-zinc-500">Create your first template above. Exercise sequencing is the next build step.</p><Link href="/exercises" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200">Set up your exercise library <ArrowUpRight size={15}/></Link></div>}
  </div>;
}