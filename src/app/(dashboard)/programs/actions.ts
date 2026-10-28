"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const programSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  duration_weeks: z.coerce.number().int().min(1).max(104),
});

export async function addProgram(formData: FormData) {
  const parsed = programSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    duration_weeks: formData.get("duration_weeks"),
  });
  if (!parsed.success) redirect("/programs?error=validation");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");
  const { error } = await supabase.from("programs").insert({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    duration_weeks: parsed.data.duration_weeks,
    created_by: user.id,
  });
  if (error) redirect("/programs?error=save");
  revalidatePath("/programs");
}