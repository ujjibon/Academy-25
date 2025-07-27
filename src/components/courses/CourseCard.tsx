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
import type { CourseInfo } from '@/lib/courses';
import { ArrowRight } from 'lucide-react';

export function CourseCard({ course }: { course: CourseInfo }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="aspect-video overflow-hidden rounded-md -mt-2 -mx-2">
            <Image
            src={course.image}
            alt={course.title}
            width={400}
            height={225}
            className="object-cover w-full h-full"
            data-ai-hint="course cover"
            />
        </div>
        <CardTitle className="pt-4">{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>
            View Course <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
