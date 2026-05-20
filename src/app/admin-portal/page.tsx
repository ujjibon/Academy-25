'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllUsers } from '@/lib/firebase';
import { courses } from '@/lib/courses';
import { BookOpen, Users, Sparkles, FilePlus2, ArrowRight, Trophy, GraduationCap, Rocket } from 'lucide-react';

export default function AdminPortalPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    getAllUsers()
      .then((users) => {
        setUserCount(users.length);
        setTotalXp(users.reduce((sum, u) => sum + (u.xp || 0), 0));
      })
      .catch(() => {
        setUserCount(0);
      });
  }, []);

  const quickLinks = [
    {
      href: '/admin-portal/courses',
      title: 'Manage Courses',
      description: 'View catalog and open the editor',
      icon: BookOpen,
    },
    {
      href: '/admin-portal/users',
      title: 'Manage Users',
      description: 'Roles, XP, and progress',
      icon: Users,
    },
    {
      href: '/admin-portal/startup',
      title: 'Startup program',
      description: 'Ideas, pitch reviews, mentorship',
      icon: Rocket,
    },
    {
      href: '/admin-portal/course-creator',
      title: 'AI Course Creator',
      description: 'Generate lessons with AI',
      icon: Sparkles,
    },
    {
      href: '/admin-portal/bootcamp-studio',
      title: 'Bootcamp Studio',
      description: 'AI agent or manual builder for full bootcamp execution',
      icon: GraduationCap,
    },
    {
      href: '/admin-portal/manual-editor',
      title: 'Manual Editor',
      description: 'Edit course JSON directly',
      icon: FilePlus2,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="dashboard-panel p-6 sm:p-8 border-midnight/10">
        <h1 className="font-dashboard-title text-3xl font-bold tracking-tight">Admin overview</h1>
        <p className="text-muted-foreground mt-1">
          Manage courses, users, and content for Peer Academy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Courses</CardDescription>
            <CardTitle className="text-3xl">{courses.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Published in catalog</p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Learners</CardDescription>
            <CardTitle className="text-3xl">{userCount ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              {totalXp.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all learners</p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Portal</CardDescription>
            <CardTitle className="text-lg">Learner app</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" className="w-full brand-button">
              <Link href="/dashboard">
                Open learner app
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Card
            key={link.href}
            className="dashboard-panel border-midnight/10 shadow-sm hover:border-primary/25 transition-colors"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href={link.href}>
                  Open
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
