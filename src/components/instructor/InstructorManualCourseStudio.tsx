'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createManualClassroomWithContent,
  loadClassroomCourseForEditing,
  saveClassroomCourseContent,
  updateClassroomCourseMetadata,
} from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import type { Course } from '@/lib/data-provider';
import { EditableCourseForm } from '@/components/admin/EditableCourseForm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Pencil, Plus, Save, BookOpen } from 'lucide-react';

interface InstructorManualCourseStudioProps {
  courses: ClassroomCourse[];
  onCoursesChange?: () => void;
  initialEditCourseId?: string | null;
}

export function InstructorManualCourseStudio({
  courses,
  onCoursesChange,
  initialEditCourseId,
}: InstructorManualCourseStudioProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [studioTab, setStudioTab] = useState<'create' | 'edit'>(
    initialEditCourseId ? 'edit' : 'create'
  );
  const [selectedCourseId, setSelectedCourseId] = useState(initialEditCourseId || '');

  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCover, setCreateCover] = useState('/images/react-fundamentals.jpg');
  const [withStarterLesson, setWithStarterLesson] = useState(true);
  const [creating, setCreating] = useState(false);

  const [classroom, setClassroom] = useState<ClassroomCourse | null>(null);
  const [content, setContent] = useState<Course | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [metaCover, setMetaCover] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  const loadCourseForEdit = useCallback(
    async (courseId: string) => {
      if (!user || !courseId) return;
      setLoadingEdit(true);
      try {
        const data = await loadClassroomCourseForEditing(courseId, user.uid);
        if (!data) {
          toast({
            title: 'Course not found',
            description: 'You can only edit your own courses.',
            variant: 'destructive',
          });
          setClassroom(null);
          setContent(null);
          return;
        }
        setClassroom(data.classroom);
        setContent(data.content);
        setMetaTitle(data.classroom.title);
        setMetaDesc(data.classroom.description);
        setMetaCover(data.classroom.coverImage);
      } catch {
        toast({ title: 'Failed to load course', variant: 'destructive' });
      } finally {
        setLoadingEdit(false);
      }
    },
    [user, toast]
  );

  useEffect(() => {
    if (initialEditCourseId) {
      setStudioTab('edit');
      setSelectedCourseId(initialEditCourseId);
    }
  }, [initialEditCourseId]);

  useEffect(() => {
    if (studioTab === 'edit' && selectedCourseId) {
      loadCourseForEdit(selectedCourseId);
    }
  }, [studioTab, selectedCourseId, loadCourseForEdit]);

  const handleCreate = async () => {
    if (!user || !createTitle.trim()) return;
    setCreating(true);
    try {
      const course = await createManualClassroomWithContent({
        title: createTitle,
        description: createDesc,
        coverImage: createCover,
        instructorId: user.uid,
        instructorName: userProfile?.displayName || 'Instructor',
        withStarterLesson,
      });
      toast({
        title: 'Course created',
        description: `Class code: ${course.classCode}. You can edit lessons below.`,
      });
      setCreateTitle('');
      setCreateDesc('');
      onCoursesChange?.();
      setStudioTab('edit');
      setSelectedCourseId(course.id);
    } catch {
      toast({ title: 'Could not create course', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!user || !selectedCourseId) return;
    setSavingMeta(true);
    try {
      await updateClassroomCourseMetadata(selectedCourseId, user.uid, {
        title: metaTitle.trim(),
        description: metaDesc.trim(),
        coverImage: metaCover.trim(),
      });
      toast({ title: 'Classroom details saved' });
      onCoursesChange?.();
      await loadCourseForEdit(selectedCourseId);
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveContent = async () => {
    if (!user || !selectedCourseId || !content) return;
    setSavingContent(true);
    try {
      await saveClassroomCourseContent(selectedCourseId, user.uid, content);
      toast({ title: 'Course content saved', description: `${content.lessons.length} lessons updated.` });
      onCoursesChange?.();
      await loadCourseForEdit(selectedCourseId);
    } catch {
      toast({ title: 'Could not save content', variant: 'destructive' });
    } finally {
      setSavingContent(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={studioTab} onValueChange={(v) => setStudioTab(v as 'create' | 'edit')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            Create course
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit course
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6 space-y-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-lg">Create classroom manually</CardTitle>
              <CardDescription>
                Set up a new course with optional starter lesson. Edit lessons, quizzes, and projects
                in the Edit tab after creating.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Course title" id="create-title">
                <Input
                  id="create-title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Web Development 101"
                />
              </Field>
              <Field label="Description" id="create-desc">
                <Textarea
                  id="create-desc"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={3}
                  placeholder="What will students learn?"
                />
              </Field>
              <Field label="Cover image URL" id="create-cover">
                <Input
                  id="create-cover"
                  value={createCover}
                  onChange={(e) => setCreateCover(e.target.value)}
                  placeholder="/images/your-course.jpg"
                />
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="starter-lesson"
                  checked={withStarterLesson}
                  onCheckedChange={(v) => setWithStarterLesson(Boolean(v))}
                />
                <Label htmlFor="starter-lesson" className="text-sm font-normal cursor-pointer">
                  Include a starter lesson (introduction, practice, project, assessment)
                </Label>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !createTitle.trim()}
                className="brand-button"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create & continue to editor
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={courses.length === 0}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select your course to edit..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title} ({c.classCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classroom ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/classroom/${classroom.id}/stream`}>Open classroom</Link>
              </Button>
            ) : null}
          </div>

          {courses.length === 0 ? (
            <Card className="brand-card p-6 text-center text-muted-foreground">
              Create a course first using the Create tab.
            </Card>
          ) : loadingEdit ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : classroom && content ? (
            <div className="space-y-6">
              <Card className="brand-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Classroom details
                  </CardTitle>
                  <CardDescription>
                    Class code: <strong className="font-mono">{classroom.classCode}</strong> — share
                    with students to enroll.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Title" id="meta-title">
                    <Input id="meta-title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                  </Field>
                  <Field label="Description" id="meta-desc">
                    <Textarea
                      id="meta-desc"
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      rows={2}
                    />
                  </Field>
                  <Field label="Cover image URL" id="meta-cover">
                    <Input id="meta-cover" value={metaCover} onChange={(e) => setMetaCover(e.target.value)} />
                  </Field>
                  {metaCover ? (
                    <img
                      src={metaCover}
                      alt=""
                      className="h-24 w-auto rounded-md border object-cover"
                    />
                  ) : null}
                  <Button
                    onClick={handleSaveMetadata}
                    disabled={savingMeta}
                    variant="outline"
                    size="sm"
                  >
                    {savingMeta ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save classroom details
                  </Button>
                </CardContent>
              </Card>

              <Card className="brand-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Lessons & content</CardTitle>
                    <CardDescription>
                      Edit lessons, practice quizzes, projects, and assessments. Changes apply to
                      your classroom only.
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveContent} disabled={savingContent} className="brand-button shrink-0">
                    {savingContent ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save all content
                  </Button>
                </CardHeader>
                <CardContent>
                  <EditableCourseForm
                    course={content}
                    setCourse={setContent}
                    allowImageUpload={false}
                    lockCourseId
                  />
                </CardContent>
              </Card>
            </div>
          ) : selectedCourseId ? (
            <Card className="brand-card p-6 text-center text-muted-foreground">
              Could not load this course.
            </Card>
          ) : (
            <Card className="brand-card p-6 text-center text-muted-foreground">
              Select a course above to edit.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
