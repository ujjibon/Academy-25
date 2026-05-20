'use client';

interface InstructorDashboardHeroProps {
  displayName: string;
  courseCount: number;
  studentCount: number;
}

export function InstructorDashboardHero({
  displayName,
  courseCount,
  studentCount,
}: InstructorDashboardHeroProps) {
  const firstName = displayName.split(' ')[0] || 'there';

  return (
    <section className="dashboard-hero border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background p-6 md:p-8">
      <span className="dashboard-kicker text-primary">Instructor workspace</span>
      <h1 className="font-dashboard-title mt-3 text-2xl font-bold sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Your teaching hub for classrooms, AI course generation, and bootcamps. Use the tools below to
        create content, then manage live classes in your course list.
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">
        {courseCount} {courseCount === 1 ? 'course' : 'courses'} · {studentCount}{' '}
        {studentCount === 1 ? 'student' : 'students'} enrolled
      </p>
    </section>
  );
}
