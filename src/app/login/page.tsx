import Link from "next/link";
import { signIn } from "./actions";
import { Activity, ArrowLeft, LockKeyhole } from "lucide-react";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0e0d] px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Back to home</Link>
        <div className="rounded-3xl border border-white/10 bg-[#111512] p-7 shadow-2xl sm:p-9">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-zinc-950"><Activity/></div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">RepForge workspace</p>
          <h1 className="mt-2 text-3xl font-black">Welcome back.</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Sign in with the account you were invited to use.</p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error === "missing" ? "Enter your email and password." : "Sign-in failed. Check your credentials and try again."}</p>}
          <form action={signIn} className="mt-7 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">Email address<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-zinc-600 focus:border-lime-300" placeholder="you@example.com"/></label>
            <label className="block text-sm font-medium text-zinc-300">Password<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-lime-300" placeholder="Your password"/></label>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 font-bold text-zinc-950 transition hover:bg-lime-200"><LockKeyhole size={17}/> Sign in securely</button>
          </form>
          <p className="mt-5 text-xs leading-5 text-zinc-500">Invite-only app. Ask your coach or administrator for access. Public registration is disabled.</p>
        </div>
      </div>
    </main>
  );
}