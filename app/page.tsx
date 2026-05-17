import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { BookOpen, Target, TrendingUp, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">100x Hub</div>
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
          Master One Course at a Time
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
          100x Hub gives every learner a focused course with guided lessons, assignments and
          feedback — no distractions, just progress.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Start Learning</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose 100x Hub?</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for focused, structured learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-card">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Structured Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Carefully curated lessons with resources, code examples and learning materials
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <Target className="w-8 h-8 text-primary mb-4" />
                <CardTitle>One Focused Course</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Each student is assigned a single course, so you always know exactly what to
                  work on next
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Track Your Work</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Follow your lessons and assignments and see your submissions and grades in
                  one place
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <Award className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Assignments &amp; Grading</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete real-world assignments and get grades and feedback from your mentors
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Create Your Account</h3>
            <p className="text-muted-foreground">
              Sign up as a student. An admin then assigns you to the course you&apos;ll be
              learning
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Learn from Lessons</h3>
            <p className="text-muted-foreground">
              Progress through curated lessons with resources and complete assignments at your
              own pace
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Get Feedback &amp; Grow</h3>
            <p className="text-muted-foreground">
              Submit your work and receive grades and feedback to keep improving
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90">
            Sign up today and start your learning journey with 100x Hub.
          </p>
          <Button asChild variant="secondary" size="lg">
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-1">
          <p>&copy; 2026 100x Hub. All rights reserved.</p>
          <p className="text-sm">Powered by Velozity Global Solutions</p>
        </div>
      </footer>
    </div>
  )
}
