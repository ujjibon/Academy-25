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
import { getCourse } from '@/lib/data-provider';
import { UserProfile } from '@/lib/firebase';
import { ArrowRight, BookOpen } from 'lucide-react';

interface ActiveCourseProps {
  userProfile: UserProfile;
}

export function ActiveCourse({ userProfile }: ActiveCourseProps) {
  const activeCourse = getCourse(userProfile.activeCourseId || '');
  
  if (!activeCourse) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Start Learning</CardTitle>
          <CardDescription>
            Choose a course to begin your learning journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No active course selected</p>
            <p className="text-sm">Browse courses to get started</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/courses">
              Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const nextLesson = activeCourse.lessons.find(l => l.id === userProfile.activeLessonId);
  const progress = userProfile.courseProgress[activeCourse.id] || 0;

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
            <div className="mt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
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
          <Link href={`/courses/${activeCourse.id}/${userProfile.activeLessonId || '1'}`}>
            Go to Lesson <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
