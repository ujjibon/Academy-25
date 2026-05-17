import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { UserProfile } from '@/lib/firebase';
import { getCourse } from '@/lib/data-provider';

interface DashboardStatCardsProps {
  userProfile: UserProfile;
}

function getProfileStrength(userProfile: UserProfile): number {
  const skills = [...userProfile.strengths, ...userProfile.weaknesses];
  if (skills.length > 0) {
    return Math.round(skills.reduce((sum, s) => sum + s.value, 0) / skills.length);
  }
  return Math.min(100, userProfile.level * 12);
}

export function DashboardStatCards({ userProfile }: DashboardStatCardsProps) {
  const profileStrength = getProfileStrength(userProfile);
  const activeCourse = getCourse(userProfile.activeCourseId || '');
  const courseProgress = activeCourse
    ? Math.round(userProfile.courseProgress[activeCourse.id] || 0)
    : 0;
  const lessonsCompleted = Object.keys(userProfile.courseProgress).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/profile" className="stat-card stat-card-royal group">
        <span className="stat-card-link" aria-hidden>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
        <span className="stat-card-label">Profile strength</span>
        <p className="stat-card-value">{profileStrength}%</p>
        <p className="stat-card-sub">AI readiness</p>
      </Link>

      <Link href="/courses" className="stat-card stat-card-muted group">
        <span className="stat-card-link bg-foreground/5 text-foreground group-hover:bg-foreground/10">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
        <span className="stat-card-label">Course progress</span>
        <p className="stat-card-value">{courseProgress}%</p>
        <p className="stat-card-sub">
          {activeCourse ? activeCourse.title : 'Pick a course'}
        </p>
      </Link>

      <Link href="/leaderboard" className="stat-card stat-card-flare group">
        <span className="stat-card-link" aria-hidden>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
        <span className="stat-card-label">Learning streak</span>
        <p className="stat-card-value">{userProfile.dailyStreak} days</p>
        <p className="stat-card-sub">
          {lessonsCompleted} course{lessonsCompleted === 1 ? '' : 's'} in progress
        </p>
      </Link>
    </div>
  );
}
