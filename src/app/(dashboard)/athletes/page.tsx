import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
  if (profile?.role !== "coach") return <div><h1 className="text-3xl font-black">Athletes</h1><p className="mt-3 text-zinc-400">This section is available to coaches.</p></div>;
  const { data: athletes, error } = await supabase.from("profiles").select("id,display_name,created_at,is_active").eq("role", "athlete").order("created_at", { ascending: false });
  return <div><p className="text-sm text-zinc-500">TEAM MANAGEMENT</p><h1 className="mt-2 text-3xl font-black">Athletes</h1><p className="mt-2 text-zinc-400">People with an athlete profile in your private workspace.</p>
    {error ? <p className="mt-5 text-sm text-amber-200">Could not load athlete profiles.</p> : athletes?.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[.04] text-zinc-400"><tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Joined</th></tr></thead><tbody>{athletes.map(a=><tr key={a.id} className="border-t border-white/10"><td className="p-4 font-semibold">{a.display_name || "Athlete"}</td><td className="p-4"><span className={a.is_active?"text-lime-300":"text-zinc-500"}>{a.is_active?"Active":"Inactive"}</span></td><td className="p-4 text-zinc-400">{new Date(a.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center"><Users className="mx-auto text-zinc-500"/><h3 className="mt-4 font-bold">No athletes yet</h3><p className="mt-2 text-sm text-zinc-500">Invite athlete accounts from Supabase Authentication → Users.</p></div>}
  </div>;
}