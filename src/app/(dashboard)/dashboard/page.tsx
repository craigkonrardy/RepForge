import Link from "next/link";
import { Activity, ArrowUpRight, ClipboardCheck, Dumbbell, Users, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user!.id).maybeSingle();
  const coach = profile?.role === "coach";

  const [exerciseResult, workoutResult, sessionResult, athleteResult] = await Promise.all([
    supabase.from("exercises").select("id", { count: "exact", head: true }),
    supabase.from("workouts").select("id", { count: "exact", head: true }),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("athlete_id", user!.id).eq("status", "completed"),
    coach ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "athlete") : Promise.resolve({ count: null, error: null }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-zinc-500">{coach ? "COACH WORKSPACE" : "ATHLETE WORKSPACE"}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Good to see you, {(profile?.display_name || user?.email?.split("@")[0] || "athlete").split(" ")[0]}.</h1><p className="mt-2 text-zinc-400">{coach ? "Build the plan. Track the work. Keep your athletes moving forward." : "Show up, put in the work, and keep your progress moving."}</p></div>{coach && <Link href="/workouts" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-200">Create workout <ArrowUpRight size={16}/></Link>}</div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Dumbbell size={19}/>} label="Exercises" value={exerciseResult.count ?? 0} note="In your library"/>
        <Stat icon={<ClipboardCheck size={19}/>} label="Workout templates" value={workoutResult.count ?? 0} note="Ready to program"/>
        <Stat icon={<Activity size={19}/>} label="Sessions completed" value={sessionResult.count ?? 0} note="Your completed sessions"/>
        {coach ? <Stat icon={<Users size={19}/>} label="Athlete profiles" value={athleteResult.count ?? 0} note="Active workspace users"/> : <Stat icon={<CalendarDays size={19}/>} label="Training focus" value="Build" note="Strength + conditioning"/>}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-2xl border border-white/10 bg-[#111512] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Your training workspace</h2><p className="mt-1 text-sm text-zinc-500">Start with the essentials</p></div><div className="rounded-xl bg-lime-300/10 p-3 text-lime-300"><Activity/></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{(coach ? [{title:"Build your exercise library",desc:"Add strength and conditioning movements.",href:"/exercises",icon:<Dumbbell/>},{title:"Create a workout",desc:"Set targets, reps, loads, and coaching notes.",href:"/workouts",icon:<ClipboardCheck/>}] : [{title:"View assigned workouts",desc:"Your assigned sessions will live here.",href:"/workouts",icon:<ClipboardCheck/>},{title:"Review your progress",desc:"Completed sessions and training history.",href:"/dashboard",icon:<Activity/>}]).map(item=><Link key={item.title} href={item.href} className="group rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-lime-300/40"><div className="flex items-center justify-between text-lime-300"><span>{item.icon}</span><ArrowUpRight size={16} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-5 text-zinc-500">{item.desc}</p></Link>)}</div></section>
        <section className="rounded-2xl border border-white/10 bg-[#111512] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-lime-300">Build status</p><h2 className="mt-3 text-xl font-bold">Foundation is ready</h2><p className="mt-2 text-sm leading-6 text-zinc-400">This starter includes the private app shell, Supabase authentication, initial database schema, and access policies.</p><div className="mt-5 space-y-3">{["Invite-only sign-in","Coach / athlete roles","Workout & program schema","Session and set logging schema"].map(x=><div key={x} className="flex items-center gap-3 text-sm text-zinc-300"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300/10 text-xs text-lime-300">✓</span>{x}</div>)}</div><p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-500">Next: wire up workout editing, assignments, and the athlete logging experience.</p></section>
      </div>
    </div>
  );
}
function Stat({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string|number;note:string}) {
  return <div className="rounded-2xl border border-white/10 bg-[#111512] p-5"><div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><span className="text-lime-300">{icon}</span></div><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-zinc-500">{note}</p></div>;
}