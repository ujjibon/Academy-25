
'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Course } from '@/lib/data-provider';
import { courses as courseList } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditableCourseForm } from '@/components/admin/EditableCourseForm';
import { Download } from 'lucide-react';

const BLANK_COURSE: Course = {
    id: 'new-course',
    title: 'New Course Title',
    description: 'A description for the new course.',
    image: 'https://placehold.co/600x400.png',
    lessons: [],
};

export default function ManualEditorPage() {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    const handleCourseSelect = (courseId: string) => {
        if (courseId === 'new') {
            setActiveCourse(BLANK_COURSE);
        } else {
            const courseData = getCourse(courseId);
            if(courseData) {
                setActiveCourse(courseData);
            }
        }
        setSelectedCourseId(courseId);
    };
    
    const handleDownload = () => {
        if (!activeCourse) return;
        const jsonString = JSON.stringify(activeCourse, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeCourse.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Manual Course Editor</CardTitle>
                    <CardDescription>
                        Select a course to edit its content, or choose "New Course" to start from scratch.
                        Once you're done, copy or download the generated JSON to save your changes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <Select onValueChange={handleCourseSelect} value={selectedCourseId || ''}>
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Create New Course</SelectItem>
                                {courseList.map(course => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {activeCourse && (
                         <Tabs defaultValue="editor">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="editor">Editor</TabsTrigger>
                                <TabsTrigger value="export">Export JSON</TabsTrigger>
                            </TabsList>
                            <TabsContent value="editor" className="mt-4">
                               <EditableCourseForm course={activeCourse} setCourse={setActiveCourse} />
                            </TabsContent>
                            <TabsContent value="export" className="mt-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">Copy or download the course JSON. New courses should be saved as a new file in `src/data/courses/`.</p>
                                        <Button onClick={handleDownload} variant="outline">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download JSON
                                        </Button>
                                    </div>
                                   <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto h-[70vh]">
                                      {JSON.stringify(activeCourse, null, 2)}
                                  </pre>
                                </div>
                            </TabsContent>
                         </Tabs>
                    )}

                </CardContent>
            </Card>
        </AppLayout>
    );
}
