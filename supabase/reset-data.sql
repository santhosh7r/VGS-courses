-- ============================================================================
-- RESET DATA — wipe everything, KEEP ONLY the admin account
-- ----------------------------------------------------------------------------
-- Run in: Supabase Dashboard → SQL Editor → paste this file → Run.
--
-- KEEPS
--   • The admin login — admin@eduhub.com — its auth.users row, password and
--     public.admins row are all left untouched.
--   • The achievements catalogue (the 5 fixed badges) — app reference data,
--     not user data.
--
-- DELETES (start-from-scratch)
--   • Every student and their auth user (identities/sessions cascade away).
--   • The signup allowlist (allowed_students).
--   • All courses and their content — modules, lessons, resources,
--     assignments, quizzes.
--   • All activity: submissions, quiz attempts, lesson progress, activity log,
--     student achievements, notifications, calendar events.
--
-- ⚠️  DESTRUCTIVE and NOT reversible. This is meant for a fresh start.
-- ============================================================================
do $$
declare
  v_admin uuid;
begin
  -- Locate the admin. Abort if missing, so we never wipe with nothing kept.
  select id into v_admin from auth.users where email = 'admin@eduhub.com';
  if v_admin is null then
    raise exception
      'Admin account (admin@eduhub.com) not found — aborting so nothing is deleted.';
  end if;

  -- Empty every data table. CASCADE also clears anything not listed that
  -- still references these tables. public.admins and public.achievements are
  -- intentionally NOT listed, so they survive.
  truncate table
    public.activity_log,
    public.lesson_progress,
    public.student_achievements,
    public.quiz_attempts,
    public.submissions,
    public.notifications,
    public.calendar_events,
    public.quizzes,
    public.assignments,
    public.lesson_resources,
    public.lessons,
    public.modules,
    public.courses,
    public.allowed_students,
    public.students
  cascade;

  -- Remove every auth user except the admin (cascades their identities,
  -- sessions and refresh tokens).
  delete from auth.users where id <> v_admin;

  raise notice 'Reset complete. Kept admin % and the achievements catalogue.', v_admin;
end;
$$;
