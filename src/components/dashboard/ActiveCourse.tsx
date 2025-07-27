import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUser, getCourse } from '@/lib/data-provider';
import { ArrowRight } from 'lucide-react';

export function ActiveCourse() {
  const user = getUser();
  const activeCourse = getCourse(user.activeCourseId);
  if (!activeCourse) return null;

  const nextLesson = activeCourse.lessons.find(l => l.id === user.activeLessonId);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Continue Learning</CardTitle>
        <CardDescription>
          Pick up where you left off in your learning journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-col sm:flex-row gap-4">
          <Image
            src={activeCourse.image}
            alt={activeCourse.title}
            width={150}
            height={100}
            className="rounded-lg object-cover"
            data-ai-hint="learning course"
          />
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Course</p>
            <h3 className="text-lg font-semibold">{activeCourse.title}</h3>
            {nextLesson && (
                <>
                <p className="text-sm text-muted-foreground mt-2">Next up</p>
                <h4 className="text-md font-medium">{nextLesson.title}</h4>
                </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/courses/${activeCourse.id}/${user.activeLessonId}`}>
            Go to Lesson <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
