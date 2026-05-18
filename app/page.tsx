import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import ThemeToggle from '@/components/theme-toggle'
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Code2,
  Compass,
  GraduationCap,
  Layers,
  MessageSquare,
  Palette,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'

/* ============================================================================
   Landing page for the 100x Hub learning platform by Velozity Global Solutions.
   Public marketing page only. No admin entry points are surfaced here.
   ========================================================================== */

const courses = [
  {
    icon: Code2,
    title: 'Web Development',
    description:
      'Build modern, responsive websites and full-stack web applications from the ground up.',
  },
  {
    icon: BrainCircuit,
    title: 'Data Science & AI',
    description:
      'Work with data, statistics and machine learning to turn raw information into insight.',
  },
  {
    icon: Cloud,
    title: 'Cloud & DevOps',
    description:
      'Deploy, automate and scale applications with modern cloud and DevOps practices.',
  },
  {
    icon: Target,
    title: 'Programming & DSA',
    description:
      'Strengthen core programming, data structures and algorithms for real-world problem solving.',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description:
      'Design intuitive, user-friendly digital products with research-driven design thinking.',
  },
  {
    icon: ShieldCheck,
    title: 'Cybersecurity',
    description:
      'Learn the fundamentals of securing systems, networks and applications.',
  },
]

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students',
    description:
      'Build real, job-ready skills alongside your studies and graduate already ahead of the curve.',
  },
  {
    icon: Rocket,
    title: 'Working professionals',
    description:
      'Sharpen your current skill set or move into a new role with flexible, practical learning.',
  },
  {
    icon: Compass,
    title: 'Career switchers & beginners',
    description:
      'Start from zero with a clear, structured path that takes you all the way to hired.',
  },
]

const features = [
  {
    icon: Rocket,
    title: 'Execution-first curriculum',
    description:
      'Every module is built around doing the work, not just watching. You learn by building things that matter.',
  },
  {
    icon: Layers,
    title: 'Structured, focused tracks',
    description:
      'One course at a time, organised into clear modules and lessons so you always know what comes next.',
  },
  {
    icon: MessageSquare,
    title: 'Real mentor feedback',
    description:
      'Submit assignments and get graded reviews from mentors, with actionable feedback on every project.',
  },
  {
    icon: Trophy,
    title: 'XP, streaks & leaderboards',
    description:
      'Stay motivated with points, daily streaks, achievement badges and a course-wide leaderboard.',
  },
  {
    icon: CalendarDays,
    title: 'A weekly learning rhythm',
    description:
      'A built-in calendar and schedule keeps your sessions, deadlines and milestones on track.',
  },
  {
    icon: GraduationCap,
    title: 'Industry-ready outcomes',
    description:
      'Quizzes, capstone projects and a portfolio of real work that proves your skills to employers.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description:
      'Sign up in seconds and complete a quick onboarding so we understand your goals and experience.',
  },
  {
    number: '02',
    title: 'Get your course track',
    description:
      'You are matched to a focused course track with curated modules, lessons and projects.',
  },
  {
    number: '03',
    title: 'Learn, build & submit',
    description:
      'Work through lessons, take quizzes and submit real assignments at a pace that fits your week.',
  },
  {
    number: '04',
    title: 'Get feedback & level up',
    description:
      'Receive mentor-graded feedback, earn XP, climb the leaderboard and grow into a job-ready professional.',
  },
]

const outcomes = [
  'Curated, mentor-designed course modules',
  'Hands-on assignments graded with real feedback',
  'Interactive quizzes that reinforce every lesson',
  'Downloadable resources, code and reference material',
  'Progress tracking with XP, streaks and badges',
  'A personal calendar for sessions and deadlines',
]

const stats = [
  { value: 'All levels', label: 'From beginner to pro' },
  { value: '1:1', label: 'Mentor feedback & grading' },
  { value: 'Hands-on', label: 'Real-world projects' },
  { value: 'Self-paced', label: 'Learn on your schedule' },
]

const testimonials = [
  {
    quote:
      'The execution-first approach changed everything. I was building real projects from week one and the mentor feedback made every submission better than the last.',
    name: 'Aarav Sharma',
    role: 'Full-Stack Developer',
  },
  {
    quote:
      'Having one focused course instead of a hundred scattered tutorials kept me consistent. The streaks and leaderboard genuinely kept me coming back daily.',
    name: 'Priya Nair',
    role: 'Data Analyst',
  },
  {
    quote:
      'Velozity Global Solutions gave me structure, accountability and a portfolio. I went from unsure to confident in my interviews.',
    name: 'Rahul Verma',
    role: 'Cloud Engineer',
  },
]

const faqs = [
  {
    question: 'Do I need prior experience to join?',
    answer:
      'No. Our tracks are built to take you from the fundamentals all the way to advanced, job-ready skills. Each course clearly indicates its starting level so you can pick what fits you.',
  },
  {
    question: 'How are the courses structured?',
    answer:
      'Every course is organised into modules and lessons with resources, quizzes and assignments. You progress through one focused course at a time so you always know exactly what to work on next.',
  },
  {
    question: 'How does mentor feedback work?',
    answer:
      'You submit assignments directly on the platform. Mentors review your work, grade it and leave detailed written feedback so you can improve with every submission.',
  },
  {
    question: 'How much time should I commit each week?',
    answer:
      'Most learners dedicate a few focused hours each week. During onboarding you set a daily goal and weekly commitment, and the built-in calendar helps you stay on track.',
  },
  {
    question: 'Will I have something to show at the end?',
    answer:
      'Yes. You finish with completed projects, quiz results and a track record of graded work: a portfolio that demonstrates real, applied skills to employers.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Create a free account, complete the short onboarding and you will be set up with your course track. You can begin learning right away.',
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-premium">
        <Zap className="h-5 w-5 fill-current" />
      </div>
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        100x Hub
      </span>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===================== Navigation ===================== */}
      <header className="sticky top-0 z-50 border-b border-border/70 glass">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="100x Hub home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#courses"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </a>
            <a
              href="#why"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Why 100x Hub
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* ===================== Hero ===================== */}
      <section className="relative overflow-hidden">
        {/* Ambient glow + grid backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-12%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]" />
          <div
            className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
              backgroundSize: '38px 38px',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 lg:px-8 lg:pt-28">
          <div className="animate-fade-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-premium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              The learning platform by Velozity Global Solutions
            </span>

            <h1 className="mx-auto mt-7 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
              Become job-ready with{' '}
              <span className="relative whitespace-nowrap text-primary">
                execution-first
                <svg
                  aria-hidden="true"
                  viewBox="0 0 320 16"
                  className="absolute -bottom-1.5 left-0 h-3 w-full text-primary/40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 12 C 80 4, 240 4, 318 12"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              tech courses.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              100x Hub is the learning platform from Velozity Global Solutions. Whether you are
              a student, a working professional or switching careers, you get structured
              courses, real projects and genuine mentor feedback that move your career forward.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/auth/sign-up">
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <a href="#courses">
                  <Compass className="h-4 w-4" />
                  Explore Courses
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Mentor-graded projects
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Learn at your own pace
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-premium md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card px-6 py-7 text-center">
                <div className="font-display text-3xl font-semibold text-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Courses ===================== */}
      <section id="courses" className="scroll-mt-24 border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What we teach
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Career-focused tracks, built to be finished
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We cover the in-demand domains that get people hired. Pick your path and go deep
              with a structured, mentor-guided course.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const Icon = course.icon
              return (
                <div
                  key={course.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-premium shadow-premium-hover"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {course.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================== Who it's for ===================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Who it&apos;s for
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built for everyone, not just students
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whoever you are and wherever you are starting from, there is a path here for you.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon
              return (
                <div
                  key={audience.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-premium"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {audience.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {audience.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================== Why 100x Hub ===================== */}
      <section id="why" className="scroll-mt-24 border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why 100x Hub
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A platform designed around real progress
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most courses leave you with notes and good intentions. 100x Hub is engineered to
              get you to the finish line.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-premium"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================== How it works ===================== */}
      <section id="how" className="scroll-mt-24 border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              From sign-up to job-ready in four steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-premium"
              >
                <div className="font-display text-4xl font-semibold text-primary/25">
                  {step.number}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== What you get ===================== */}
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Everything included
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              One focused course. Everything you need to master it.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No scattered tutorials, no decision fatigue. Your course track bundles lessons,
              practice and feedback into one clear path.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {outcome}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-9">
              <Link href="/auth/sign-up">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
            <div className="rounded-3xl border border-border bg-card p-8 shadow-premium">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Your progress</div>
                    <div className="text-xs text-muted-foreground">Full-Stack Web Dev</div>
                  </div>
                </div>
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                  Level 4
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Course completion</span>
                    <span>68%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[68%] rounded-full bg-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-border bg-background p-3 text-center">
                    <div className="font-display text-xl font-semibold text-foreground">
                      1,240
                    </div>
                    <div className="text-[11px] text-muted-foreground">XP earned</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-center">
                    <div className="font-display text-xl font-semibold text-foreground">
                      24
                    </div>
                    <div className="text-[11px] text-muted-foreground">Day streak</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-center">
                    <div className="font-display text-xl font-semibold text-foreground">
                      #3
                    </div>
                    <div className="text-[11px] text-muted-foreground">Leaderboard</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">Badge unlocked</div>
                    <div className="text-muted-foreground">Committed Learner · 350 XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== About Velozity ===================== */}
      <section
        id="about"
        className="scroll-mt-24 border-y border-border bg-muted/30 py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              About the company
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Velozity Global Solutions
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Velozity Global Solutions is a technology and talent company on a mission to make
              world-class, practical tech education accessible to everyone. We believe skills
              are built by doing, so we built 100x Hub, a learning platform where every learner
              gets a focused course, real projects and genuine mentor feedback.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Students, working professionals and career switchers all learn here. Whoever you
              are, we help you build the skills that get you hired and the confidence to use
              them.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-premium">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Our mission</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Turn ambition into employable, real-world skill for everyone who learns here.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-premium">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Our approach</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Focused courses, hands-on projects and mentors who actually review your work.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-premium">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Our promise</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A clear path, real accountability and a portfolio you can be proud of.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Testimonials ===================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Learner stories
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Loved by learners who actually finished
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-premium"
              >
                <Quote className="h-7 w-7 text-primary/30" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  “{testimonial.quote}”
                </blockquote>
                <div className="mt-5 flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <figcaption className="mt-3 flex items-center gap-3 border-t border-border pt-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="scroll-mt-24 border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              FAQ
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Questions, answered
            </h2>
          </div>

          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className="rounded-xl border border-border bg-card mb-3 px-5 last:border-b"
              >
                <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===================== Final CTA ===================== */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 -z-0">
              <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-primary/30 blur-[100px]" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-background text-balance sm:text-4xl">
                Ready to build skills that actually get you hired?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-background/70">
                Start your journey with 100x Hub. Your first course is waiting.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background sm:w-auto"
                >
                  <Link href="/auth/login">I already have an account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Footer ===================== */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                The execution-first learning platform by Velozity Global Solutions.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Courses</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#courses" className="transition-colors hover:text-foreground">
                    Web Development
                  </a>
                </li>
                <li>
                  <a href="#courses" className="transition-colors hover:text-foreground">
                    Data Science
                  </a>
                </li>
                <li>
                  <a href="#courses" className="transition-colors hover:text-foreground">
                    Cloud & DevOps
                  </a>
                </li>
                <li>
                  <a href="#courses" className="transition-colors hover:text-foreground">
                    Interview Prep
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Platform</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#why" className="transition-colors hover:text-foreground">
                    Why 100x Hub
                  </a>
                </li>
                <li>
                  <a href="#how" className="transition-colors hover:text-foreground">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-foreground">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#about" className="transition-colors hover:text-foreground">
                    About us
                  </a>
                </li>
                <li>
                  <Link href="/auth/login" className="transition-colors hover:text-foreground">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Velozity Global Solutions. All rights reserved.</p>
            <p>Built for learners who finish what they start.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
