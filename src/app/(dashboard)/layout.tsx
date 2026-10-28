import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ClipboardList, Dumbbell, LayoutDashboard, LogOut, Users, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/exercises", label: "Exercise library", icon: Dumbbell },
  { href: "/workouts", label: "Workouts", icon: ClipboardList },
  { href: "/programs", label: "Programs", icon: CalendarDays },
  { href: "/athletes", label: "Athletes", icon: Users },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? "athlete";

  return (
    <div className="min-h-screen bg-[#0b0e0d] text-white md:flex">
      <aside className="flex w-full flex-col border-b border-white/10 bg-[#101411] md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="flex items-center gap-2 border-b border-white/10 px-5 py-5 text-lg font-black tracking-tight"><Activity className="text-lime-300"/> REPFORGE</Link>
        <div className="px-4 py-5"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">Workspace</p><nav className="mt-3 flex gap-1 overflow-x-auto md:flex-col">{nav.filter(item => role === "coach" || ["/dashboard","/workouts"].includes(item.href)).map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"><Icon size={17}/>{item.label}</Link>; })}</nav></div>
        <div className="mt-auto hidden border-t border-white/10 p-4 md:block"><div className="mb-3 rounded-xl bg-white/[.04] p-3"><p className="truncate text-sm font-semibold">{profile?.display_name || user.email}</p><p className="mt-1 text-xs capitalize text-lime-300">{role}</p></div><form action={signOut}><button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><LogOut size={16}/> Sign out</button></form></div>
      </aside>
      <main className="min-w-0 flex-1"><div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div></main>
    </div>
  );
}