"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const workoutSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
});

export async function addWorkout(formData: FormData) {
  const parsed = workoutSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) redirect("/workouts?error=validation");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");

  const { error } = await supabase.from("workouts").insert({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    created_by: user.id,
  });
  if (error) redirect("/workouts?error=save");
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}