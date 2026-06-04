import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { CourseInfo } from '@/lib/courses';
import { ArrowRight, BookOpen } from 'lucide-react';

export function CourseCard({ course }: { course: CourseInfo }) {
  return (
    <article className="brand-card hover-lift flex flex-col overflow-hidden p-0">
      <div className="aspect-video overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          width={400}
          height={225}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-[1.02]"
          data-ai-hint="course cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>Interactive course</span>
        </div>
        <h3 className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {course.description}
        </p>
        <Button asChild className="w-full mt-5 brand-button">
          <Link href={`/courses/${course.id}`}>
            View course
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
