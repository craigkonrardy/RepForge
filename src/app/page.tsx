import Link from "next/link";
import { Activity, ArrowRight, Dumbbell, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0e0d] px-6 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between py-6">
        <div className="flex items-center gap-2 font-bold tracking-tight"><Activity className="text-lime-300" /> REPFORGE</div>
        <Link href="/login" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-lime-300/60">Sign in</Link>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 py-20 md:grid-cols-[1.1fr_.9fr] md:py-28">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-lime-200"><ShieldCheck size={14}/> Private training workspace</div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">Train with a plan.<br/><span className="text-lime-300">Track every rep.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">A focused space for coaches to program strength and conditioning—and for athletes to log the work that moves them forward.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-bold text-zinc-950 transition hover:bg-lime-200">Open workspace <ArrowRight size={17}/></Link>
            <a href="#features" className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5">Explore features</a>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Invite-only access · Built for strength, conditioning, and HYROX-style training</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#171c18] to-[#101311] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-sm text-zinc-400">TRAINING OVERVIEW</p><p className="mt-1 text-xl font-bold">Your week, in focus</p></div><div className="rounded-xl bg-lime-300/10 p-3 text-lime-300"><Dumbbell/></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Sessions planned" value="04" note="This week"/>
            <Metric label="Training focus" value="Build" note="Strength + engine"/>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between"><span className="font-semibold">Weekly rhythm</span><span className="text-xs text-zinc-500">MON — SUN</span></div>
            <div className="grid grid-cols-7 gap-2">{["M","T","W","T","F","S","S"].map((day,i)=><div key={day+i} className="text-center"><div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${[0,1,3,5].includes(i)?"bg-lime-300 text-zinc-950":"bg-white/5 text-zinc-500"}`}>{day}</div><div className={`mx-auto h-1 w-1 rounded-full ${[0,1,3,5].includes(i)?"bg-lime-300":"bg-transparent"}`}/></div>)}</div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="rounded-xl bg-white/5 p-3 text-lime-300"><Activity/></div><div><p className="font-semibold">Built for consistency</p><p className="mt-1 text-sm text-zinc-500">Program · Perform · Progress</p></div></div>
        </div>
      </section>
      <section id="features" className="mx-auto grid max-w-6xl gap-4 pb-20 md:grid-cols-3">
        <Feature title="Program with purpose" text="Build workouts with sets, reps, loads, rest, and coaching notes."/>
        <Feature title="Log the real work" text="Record completed sets, conditioning efforts, and session notes."/>
        <Feature title="See progress clearly" text="Keep training history and performance trends in one place."/>
      </section>
    </main>
  );
}
function Metric({label,value,note}:{label:string;value:string;note:string}) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-zinc-500">{label}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-lime-300">{note}</p></div>;
}
function Feature({title,text}:{title:string;text:string}) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-3 h-1 w-10 rounded-full bg-lime-300"/><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></div>;
}