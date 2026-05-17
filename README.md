# EduHub - Cohort-Based Learning Platform

A modern, full-stack learning management system built with Next.js 16, Supabase, and TypeScript. Designed for structured, cohort-based learning with lessons, assignments, progress tracking, and analytics.

## Features

### For Students
- **Dashboard**: Overview of enrolled cohorts and progress
- **Course Access**: Browse and access all courses in enrolled cohorts
- **Lessons**: Study lesson content with downloadable resources
- **Assignments**: Submit work for grading with detailed instructions
- **Progress Tracking**: Monitor XP earned, streaks maintained, and completion rates
- **Performance Metrics**: Track personal learning metrics across courses

### For Instructors
- **Course Management**: Create and organize courses with lessons
- **Lesson Creation**: Write lesson content with resources and file attachments
- **Assignment Design**: Create assignments with due dates and point values
- **Submission Review**: View all student submissions in one place
- **Grading**: Grade submissions and provide detailed feedback
- **Analytics**: View cohort-wide and individual student performance
- **Student Management**: Monitor enrolled students and track progress

### Platform Features
- **Authentication**: Secure email/password authentication with Supabase Auth
- **Role-Based Access**: Different interfaces for students, instructors, and admins
- **Row Level Security**: Data protection through database-level access controls
- **Progress Tracking**: Automatic tracking of lessons and assignments completed
- **Gamification**: Students earn XP points and maintain learning streaks
- **Real-Time Updates**: Live data syncing with Supabase
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eduhub
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open the app**
   Navigate to `http://localhost:3000`

### Initial Setup

1. Visit `http://localhost:3000` and sign up for an account
2. Choose your role (student or instructor)
3. For instructors: Create an organization and cohort
4. For students: Wait to be enrolled in a cohort by an administrator

## Project Structure

```
eduhub/
├── app/
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Protected dashboard routes
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn UI components
│   └── dashboard/           # Dashboard components
├── lib/
│   └── supabase/            # Supabase client configuration
├── public/                  # Static assets
└── middleware.ts            # Auth middleware
```

## Key Pages

### Public
- `/` - Landing page with feature overview
- `/auth/login` - User sign in
- `/auth/sign-up` - User registration
- `/auth/sign-up-success` - Confirmation page

### Student Routes
- `/dashboard` - Student dashboard with progress
- `/dashboard/courses` - All enrolled courses
- `/dashboard/courses/[courseId]` - Course details with lessons and assignments
- `/dashboard/lessons/[lessonId]` - Individual lesson with resources
- `/dashboard/assignments/[assignmentId]` - Assignment details and submission

### Instructor Routes
- `/dashboard/manage` - Course and student management
- `/dashboard/manage/new-course` - Create new course
- `/dashboard/manage/courses/[courseId]` - Edit course and manage content
- `/dashboard/manage/courses/[courseId]/new-lesson` - Create lesson
- `/dashboard/manage/courses/[courseId]/new-assignment` - Create assignment
- `/dashboard/manage/assignments/[assignmentId]` - View submissions
- `/dashboard/manage/cohorts/[cohortId]/analytics` - Cohort analytics

## Database Schema

### Users & Profiles
- `auth.users` - Supabase authentication
- `profiles` - User profile information with roles

### Organizations & Cohorts
- `organizations` - Learning organizations
- `cohorts` - Cohorts within organizations with start/end dates

### Courses & Content
- `courses` - Courses within cohorts
- `lessons` - Individual lessons within courses
- `lesson_resources` - Files and resources for lessons

### Learning & Assessment
- `assignments` - Assignments within courses
- `enrollments` - Student enrollment in cohorts
- `submissions` - Assignment submissions from students
- `progress` - Student progress tracking per course

## Security Features

1. **Row Level Security (RLS)**: Database-level access control
2. **Authentication**: Supabase Auth with secure sessions
3. **Authorization**: Role-based access control throughout the app
4. **Data Protection**: Encrypted sensitive data in transit
5. **Email Verification**: Required for account activation

## Deployment

### To Vercel

1. **Push to GitHub** and connect repository to Vercel
2. **Set environment variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** - Vercel automatically builds and deploys

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development

### Running Tests
```bash
# Run linting
pnpm lint

# Type checking
pnpm type-check
```

### Building for Production
```bash
pnpm build
pnpm start
```

## API Routes

The application uses primarily server components with some API routes for submissions:
- Server-side rendering for SEO and performance
- Supabase client SDK for database operations
- Server actions for mutations

## Contributing

Contributions are welcome! Please follow these steps:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Future Enhancements

- Live video class integration
- Discussion forums per course
- Peer code review system
- Certificate generation
- Mobile app
- Advanced analytics and reporting
- Third-party LMS integrations

## License

MIT

## Support

For questions or support:
- GitHub Issues: Report bugs or request features
- Email: support@eduhub.app
- Documentation: See DEPLOYMENT.md and project comments

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
# VGS-courses
