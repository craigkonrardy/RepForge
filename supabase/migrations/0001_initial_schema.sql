-- RepForge initial schema
-- Run in Supabase SQL Editor. Safe to run once in a new project.

create extension if not exists pgcrypto;

create type public.app_role as enum ('coach', 'athlete');
create type public.exercise_category as enum ('strength', 'conditioning', 'mobility', 'hyrox', 'other');
create type public.session_status as enum ('planned', 'in_progress', 'completed', 'skipped');
create type public.assignment_kind as enum ('workout', 'program');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'athlete',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    'athlete'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.exercise_category not null default 'strength',
  equipment text,
  instructions text,
  media_path text,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_template boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order integer not null default 0,
  target_sets integer check (target_sets is null or target_sets between 1 and 50),
  target_reps text,
  target_load_kg numeric(7,2) check (target_load_kg is null or target_load_kg >= 0),
  target_duration_seconds integer check (target_duration_seconds is null or target_duration_seconds >= 0),
  target_distance_m numeric(10,2) check (target_distance_m is null or target_distance_m >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  coaching_notes text,
  created_at timestamptz not null default now(),
  unique (workout_id, sort_order)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_weeks integer not null default 4 check (duration_weeks between 1 and 104),
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_workouts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete restrict,
  week_number integer not null check (week_number between 1 and 104),
  day_number integer not null check (day_number between 1 and 7),
  sort_order integer not null default 0,
  unique (program_id, week_number, day_number, sort_order)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  kind public.assignment_kind not null,
  workout_id uuid references public.workouts(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  starts_on date not null default current_date,
  ends_on date,
  notes text,
  created_at timestamptz not null default now(),
  check ((kind = 'workout' and workout_id is not null and program_id is null)
      or (kind = 'program' and program_id is not null and workout_id is null)),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  workout_id uuid not null references public.workouts(id) on delete restrict,
  status public.session_status not null default 'planned',
  scheduled_for date,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  session_rpe integer check (session_rpe is null or session_rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, sort_order)
);

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 100),
  reps integer check (reps is null or reps >= 0),
  load_kg numeric(7,2) check (load_kg is null or load_kg >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  distance_m numeric(10,2) check (distance_m is null or distance_m >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index idx_workout_exercises_workout on public.workout_exercises(workout_id, sort_order);
create index idx_program_workouts_program on public.program_workouts(program_id, week_number, day_number);
create index idx_assignments_athlete on public.assignments(athlete_id, starts_on);
create index idx_sessions_athlete_date on public.workout_sessions(athlete_id, scheduled_for desc);
create index idx_session_exercises_session on public.session_exercises(session_id, sort_order);
create index idx_session_sets_exercise on public.session_sets(session_exercise_id, set_number);

-- RLS helper: role is stored in a protected profile row.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'coach'::public.app_role, false)
$$;

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_workouts enable row level security;
alter table public.assignments enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_sets enable row level security;

-- Prevent users from escalating their own role or reactivating their account via the API.
create function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role' then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Role and account status can only be changed by an administrator';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger protect_profile_privileges_before_update
before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

-- Profiles: users see themselves; coaches can see profiles for management.
create policy "profiles_select_self_or_coach" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_coach());
create policy "profiles_update_self_basic" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Role changes are deliberately not authorized by this policy in the app; a future
-- trigger can prevent role edits by clients if profile editing is added.

-- Coaches manage exercise library; authenticated users can read it.
create policy "exercises_read_authenticated" on public.exercises
for select to authenticated using (true);
create policy "exercises_coach_insert" on public.exercises
for insert to authenticated with check (public.is_coach() and created_by = auth.uid());
create policy "exercises_coach_update" on public.exercises
for update to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "exercises_coach_delete" on public.exercises
for delete to authenticated using (public.is_coach());

-- Workout templates: coaches manage; athletes read templates that have been assigned to them.
create policy "workouts_coach_all" on public.workouts
for all to authenticated using (public.is_coach()) with check (public.is_coach() and created_by = auth.uid());
create policy "workouts_assigned_read" on public.workouts
for select to authenticated using (
  exists (select 1 from public.assignments a where a.athlete_id = auth.uid()
    and ((a.kind = 'workout' and a.workout_id = workouts.id)
      or (a.kind = 'program' and exists (
        select 1 from public.program_workouts pw where pw.program_id = a.program_id and pw.workout_id = workouts.id
      ))))
  or exists (select 1 from public.workout_sessions s where s.athlete_id = auth.uid() and s.workout_id = workouts.id)
);
create policy "workout_exercises_coach_all" on public.workout_exercises
for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "workout_exercises_assigned_read" on public.workout_exercises
for select to authenticated using (
  exists (
    select 1 from public.assignments a
    where a.athlete_id = auth.uid()
      and ((a.kind = 'workout' and a.workout_id = workout_exercises.workout_id)
        or (a.kind = 'program' and exists (
          select 1 from public.program_workouts pw
          where pw.program_id = a.program_id and pw.workout_id = workout_exercises.workout_id
        )))
  )
  or exists (select 1 from public.workout_sessions s where s.athlete_id = auth.uid() and s.workout_id = workout_exercises.workout_id)
);

create policy "programs_coach_all" on public.programs
for all to authenticated using (public.is_coach()) with check (public.is_coach() and created_by = auth.uid());
create policy "programs_assigned_read" on public.programs
for select to authenticated using (exists (
  select 1 from public.assignments a where a.athlete_id = auth.uid()
  and a.kind = 'program' and a.program_id = programs.id
));
create policy "program_workouts_coach_all" on public.program_workouts
for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "program_workouts_assigned_read" on public.program_workouts
for select to authenticated using (exists (
  select 1 from public.assignments a where a.athlete_id = auth.uid()
  and a.kind = 'program' and a.program_id = program_workouts.program_id
));

-- Assignments: coach controls assignment creation; athlete can read their own.
create policy "assignments_coach_all" on public.assignments
for all to authenticated using (public.is_coach()) with check (public.is_coach() and assigned_by = auth.uid());
create policy "assignments_athlete_read" on public.assignments
for select to authenticated using (athlete_id = auth.uid());

-- Session ownership is enforced through the parent athlete_id.
create policy "sessions_athlete_or_coach_read" on public.workout_sessions
for select to authenticated using (athlete_id = auth.uid() or public.is_coach());
create policy "sessions_athlete_insert" on public.workout_sessions
for insert to authenticated with check (
  athlete_id = auth.uid() and exists (
    select 1 from public.assignments a where a.athlete_id = auth.uid()
    and ((a.kind = 'workout' and a.workout_id = workout_sessions.workout_id)
      or (a.kind = 'program' and exists (
        select 1 from public.program_workouts pw
        where pw.program_id = a.program_id and pw.workout_id = workout_sessions.workout_id
      )))
  )
);
create policy "sessions_athlete_update" on public.workout_sessions
for update to authenticated using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "sessions_coach_update" on public.workout_sessions
for update to authenticated using (public.is_coach()) with check (public.is_coach());

create policy "session_exercises_read_owner_or_coach" on public.session_exercises
for select to authenticated using (exists (
  select 1 from public.workout_sessions s where s.id = session_exercises.session_id
  and (s.athlete_id = auth.uid() or public.is_coach())
));
create policy "session_exercises_insert_owner" on public.session_exercises
for insert to authenticated with check (exists (
  select 1 from public.workout_sessions s where s.id = session_exercises.session_id and s.athlete_id = auth.uid()
));
create policy "session_exercises_update_owner" on public.session_exercises
for update to authenticated using (exists (
  select 1 from public.workout_sessions s where s.id = session_exercises.session_id and s.athlete_id = auth.uid()
)) with check (exists (
  select 1 from public.workout_sessions s where s.id = session_exercises.session_id and s.athlete_id = auth.uid()
));

create policy "session_sets_read_owner_or_coach" on public.session_sets
for select to authenticated using (exists (
  select 1 from public.session_exercises se join public.workout_sessions s on s.id = se.session_id
  where se.id = session_sets.session_exercise_id and (s.athlete_id = auth.uid() or public.is_coach())
));
create policy "session_sets_insert_owner" on public.session_sets
for insert to authenticated with check (exists (
  select 1 from public.session_exercises se join public.workout_sessions s on s.id = se.session_id
  where se.id = session_sets.session_exercise_id and s.athlete_id = auth.uid()
));
create policy "session_sets_update_owner" on public.session_sets
for update to authenticated using (exists (
  select 1 from public.session_exercises se join public.workout_sessions s on s.id = se.session_id
  where se.id = session_sets.session_exercise_id and s.athlete_id = auth.uid()
)) with check (exists (
  select 1 from public.session_exercises se join public.workout_sessions s on s.id = se.session_id
  where se.id = session_sets.session_exercise_id and s.athlete_id = auth.uid()
));

-- Private storage bucket for exercise demonstrations and user attachments.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fitness-media', 'fitness-media', false, 104857600,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','application/pdf'])
on conflict (id) do nothing;

create policy "fitness_media_authenticated_read" on storage.objects
for select to authenticated using (bucket_id = 'fitness-media');
create policy "fitness_media_coach_upload" on storage.objects
for insert to authenticated with check (bucket_id = 'fitness-media' and public.is_coach());
create policy "fitness_media_coach_update" on storage.objects
for update to authenticated using (bucket_id = 'fitness-media' and public.is_coach())
with check (bucket_id = 'fitness-media' and public.is_coach());
create policy "fitness_media_coach_delete" on storage.objects
for delete to authenticated using (bucket_id = 'fitness-media' and public.is_coach());

-- Before production, test all policies with separate coach and athlete accounts.
