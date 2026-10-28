# RepForge — fitness programming & logging MVP

A local-first starter for a private coach/athlete workout platform using Next.js App Router, Tailwind CSS, Supabase Auth/PostgreSQL/Storage, and Vercel.

## MVP included
- Private sign-in; no public sign-up page
- Role-aware dashboard shell (coach / athlete)
- Coach exercise library and workout template creation
- Database schema for programs, assignments, workout sessions, and per-set logs
- RLS policies for private profiles and athlete-owned workout data
- Private Storage bucket and scoped file policies
- Server-side Supabase client and protected dashboard routes

## 1. Run locally
Install Node.js LTS and Git. From this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the URL and publishable key from Supabase → Project Settings → API. Never commit `.env.local`.

## 2. Set up Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/migrations/0001_initial_schema.sql`.
3. In Authentication → Providers, enable Email.
4. In Authentication → URL Configuration, set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
5. In Authentication → Users, invite your own email. The login page is invite-only; there is no public signup.
6. To make your first user a coach, run this SQL after accepting the invite and signing in once (replace the email):
   ```sql
   update public.profiles p
   set role = 'coach'
   from auth.users u
   where p.id = u.id and lower(u.email) = lower('you@example.com');
   ```
   Do this only for your own trusted account. Never expose service-role credentials in the browser.

## 3. Test the app
- Visit `/login`, sign in with the invited account.
- `/dashboard` is protected and redirects unauthenticated visitors to `/login`.
- Coach users can visit `/exercises` and `/workouts`.
- The first UI is a working foundation. Create/edit forms are scaffolded, and the SQL supports the full program/assignment/logging workflow; remaining CRUD and workout logging interactions are the next implementation phase.

## 4. Deploy to Vercel
1. Push this folder to a private GitHub repository.
2. Import the repo in Vercel.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment variables to Preview and Production.
4. Set the Supabase Site URL and redirect URLs to your production domain, e.g. `https://your-app.vercel.app/auth/callback`.
5. Redeploy after changing environment variables.

## Security notes
- RLS is enabled on all app tables.
- Profiles are self-readable; coaches can read profiles, but role changes are not exposed through the app.
- A user's role must only be changed by a trusted admin/operator through Supabase SQL or a future server-side admin workflow.
- The Storage bucket is private. Signed URLs or authenticated downloads should be used for private exercise media.
- Review and test RLS using separate coach and athlete accounts before adding real user data.

## Architecture
- `src/app`: routes and pages
- `src/lib/supabase`: browser/server clients and session refresh
- `supabase/migrations`: versioned schema and security policies
