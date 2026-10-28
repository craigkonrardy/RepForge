"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const exerciseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(["strength", "conditioning", "mobility", "hyrox", "other"]),
  equipment: z.string().trim().max(100).optional(),
  instructions: z.string().trim().max(2000).optional(),
});

export async function addExercise(formData: FormData) {
  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    equipment: formData.get("equipment") || undefined,
    instructions: formData.get("instructions") || undefined,
  });
  if (!parsed.success) redirect("/exercises?error=validation");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");

  const { error } = await supabase.from("exercises").insert({
    ...parsed.data,
    equipment: parsed.data.equipment ?? null,
    instructions: parsed.data.instructions ?? null,
    created_by: user.id,
  });
  if (error) redirect("/exercises?error=save");
  revalidatePath("/exercises");
  revalidatePath("/dashboard");
}