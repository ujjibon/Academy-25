
'use client';
import { type Course, type Lesson } from '@/lib/data-provider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { EditableLessonForm } from './EditableLessonForm';
import { Button } from '../ui/button';
import { FilePlus2, Trash2 } from 'lucide-react';

interface EditableCourseFormProps {
    course: Course;
    setCourse: React.Dispatch<React.SetStateAction<Course | null>>;
}

const BLANK_LESSON: Lesson = {
    id: 'new-lesson',
    title: 'New Lesson Title',
    duration: 10,
    introduction: {
        text: 'New lesson introduction.',
        videoUrl: 'https://www.youtube.com/embed/9wK4gHo1c1A',
    },
    practice: { questions: [] },
    project: { title: 'New Project', description: 'Project description.' },
    assessment: { questions: [] },
};

export function EditableCourseForm({ course, setCourse }: EditableCourseFormProps) {

    const handleCourseChange = (field: keyof Course, value: any) => {
        setCourse(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleLessonChange = (lessonIndex: number, updatedLesson: Lesson) => {
        setCourse(prev => {
            if (!prev) return null;
            const newLessons = [...prev.lessons];
            newLessons[lessonIndex] = updatedLesson;
            return { ...prev, lessons: newLessons };
        });
    };

    const addLesson = () => {
        setCourse(prev => {
            if (!prev) return null;
            const newLesson = { ...BLANK_LESSON, id: (prev.lessons.length + 1).toString() };
            return { ...prev, lessons: [...prev.lessons, newLesson] };
        });
    };

    const removeLesson = (lessonIndex: number) => {
        setCourse(prev => {
            if (!prev) return null;
            const newLessons = [...prev.lessons];
            newLessons.splice(lessonIndex, 1);
            return { ...prev, lessons: newLessons };
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input id="course-title" value={course.title} onChange={e => handleCourseChange('title', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="course-id">Course ID (slug)</Label>
                <Input id="course-id" value={course.id} onChange={e => handleCourseChange('id', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="course-desc">Course Description</Label>
                <Textarea id="course-desc" value={course.description} onChange={e => handleCourseChange('description', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="course-image">Course Image URL</Label>
                <Input id="course-image" value={course.image} onChange={e => handleCourseChange('image', e.target.value)} />
            </div>
            
            <Accordion type="multiple" className="w-full">
                {course.lessons.map((lesson, index) => (
                    <AccordionItem value={`lesson-${index}`} key={index}>
                        <div className="flex items-center w-full">
                           <AccordionTrigger className="flex-1">
                               <span>Lesson {index + 1}: {lesson.title}</span>
                           </AccordionTrigger>
                           <Button variant="ghost" size="icon" className="h-7 w-7 mr-2" onClick={(e) => { e.stopPropagation(); removeLesson(index); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        </div>
                        <AccordionContent className="pt-4 border-t">
                            <EditableLessonForm 
                                lesson={lesson}
                                onLessonChange={handleLessonChange}
                                lessonIndex={index}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            
            <Button variant="outline" onClick={addLesson}>
               <FilePlus2 className="mr-2" />
               Add New Lesson
            </Button>
        </div>
    );
}
