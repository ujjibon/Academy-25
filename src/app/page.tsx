'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BrainCircuit,
  Award,
  BookOpenCheck,
  LayoutDashboard,
  Users,
  Languages,
  Loader2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LessonContent } from '@/components/courses/LessonContent';
import { getCourse } from '@/lib/data-provider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Use a sample course and lesson for the live demo
  const sampleCourse = getCourse('react-fundamentals');
  const sampleLesson = sampleCourse?.lessons[0];

  const features = [
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'AI Personal Coach',
      description:
        'Your AI guide suggests tasks, answers questions, and provides feedback to keep you on track.',
    },
    {
      icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
      title: 'Structured Learning',
      description:
        'Follow a clear path with video tutorials, text explanations, and practical projects.',
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: 'Gamified Experience',
      description:
        'Earn XP, level up, and unlock badges. Compete with friends on the leaderboard.',
    },
    {
      icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
      title: 'Progress Dashboard',
      description:
        'Visualize your journey, track goals, and see your strengths and weaknesses at a glance.',
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Teach & Learn',
      description:
        'Solidify your knowledge by creating micro-courses for the community and earn rewards.',
    },
    {
      icon: <Languages className="h-8 w-8 text-primary" />,
      title: 'Multilingual & Inclusive',
      description:
        'Learn in your preferred language with AI-powered translations and accessibility features.',
    },
  ];

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);


  if (loading || user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-16 text-center md:py-24 lg:py-32">
          <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl">
            Unleash Your Potential with an AI Coach
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
            Peer Academy is your personalized learning companion. Master new
            skills faster with AI-guided lessons, real-world projects, and smart
            feedback.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start Learning for Free</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="container py-16 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-muted-foreground">
              Peer Academy combines cutting-edge AI with proven learning methods
              to create the ultimate educational experience.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Live Demo Section */}
        <section className="container py-16 md:py-24 bg-white/80 rounded-xl shadow-lg my-12">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-orange">
              Try a Live Learning Demo
            </h2>
            <p className="mt-4 text-muted-foreground">
              Experience interactive learning! Try a real lesson preview below—answer a quiz, get instant feedback, and see how Peer Academy makes learning engaging.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            {sampleCourse && sampleLesson ? (
              <LessonContent course={sampleCourse} lesson={sampleLesson} />
            ) : (
              <div className="text-center text-muted-foreground">Demo unavailable. Please check back later.</div>
            )}
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="Personalized Learning Path"
                className="rounded-lg shadow-xl"
                data-ai-hint="learning path"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Your Unique Skill Journey
              </h2>
              <p className="text-muted-foreground">
                Start with a plan tailored to your goals and current skill level.
                Our AI adapts to your pace, ensuring you're always challenged but
                never overwhelmed. See your progress on a beautiful, interactive
                map of your skills.
              </p>
              <Button asChild>
                <Link href="/signup">Discover Your Path</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Peer Academy. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
