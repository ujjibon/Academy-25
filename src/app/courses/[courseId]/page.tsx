import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle } from 'lucide-react';

export default function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = getCourse(params.courseId);

  if (!course) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                 <Image
                    src={course.image}
                    alt={course.title}
                    width={400}
                    height={225}
                    className="rounded-lg object-cover w-full"
                    data-ai-hint="course detail"
                />
            </div>
            <div className="md:w-2/3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{course.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{course.description}</p>
                <Button asChild className="mt-4">
                    <Link href={`/courses/${course.id}/${course.lessons[0].id}`}>Start Learning</Link>
                </Button>
            </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
          <Accordion type="single" collapsible className="w-full">
            {course.lessons.map((lesson, index) => (
              <AccordionItem value={`item-${index}`} key={lesson.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4">
                     <div className="text-primary font-bold text-lg">
                        {String(index + 1).padStart(2, '0')}
                     </div>
                     <span className="text-left font-medium">{lesson.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-between items-center pl-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{lesson.duration} min</span>
                    </div>
                    <Button variant="ghost" asChild>
                      <Link href={`/courses/${course.id}/${lesson.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Lesson
                      </Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </AppLayout>
  );
}
