'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { formatPrice } from '@/lib/marketplace-data';
import {
  adminDeleteClassroomCourse,
  adminUpdateClassroomCourseSettings,
  getAllClassroomCourses,
  seedBuiltInClassroomCourses,
} from '@/lib/classroom-service';

type DraftPrices = Record<string, string>;

export function AdminLiveCoursesManagement() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draftPrices, setDraftPrices] = useState<DraftPrices>({});
  const [bulkPrice, setBulkPrice] = useState('29.99');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllClassroomCourses();
      all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setCourses(all);
    } catch (e) {
      toast({
        title: 'Failed to load live courses',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const next: DraftPrices = {};
    for (const c of courses) {
      next[c.id] = String((c.priceCents ?? 0) / 100);
    }
    setDraftPrices(next);
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.classCode.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const forSaleCourses = useMemo(() => courses.filter((c) => c.isForSale), [courses]);
  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + (c.enrolledStudentIds?.length ?? 0), 0),
    [courses]
  );

  async function updateCourse(
    courseId: string,
    updates: { priceCents?: number; isForSale?: boolean }
  ) {
    setSavingId(courseId);
    try {
      await adminUpdateClassroomCourseSettings(courseId, updates);
      await load();
      toast({ title: 'Saved' });
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  async function savePrice(courseId: string) {
    const raw = draftPrices[courseId] ?? '0';
    const cents = Math.round(parseFloat(raw || '0') * 100);
    if (Number.isNaN(cents) || cents < 0) {
      toast({ title: 'Enter a valid price', variant: 'destructive' });
      return;
    }
    await updateCourse(courseId, { priceCents: cents });
  }

  async function toggleListed(course: ClassroomCourse, listed: boolean) {
    await updateCourse(course.id, {
      isForSale: listed,
      priceCents: course.priceCents ?? 0,
    });
  }

  async function applyBulkPrice(targetIds: string[]) {
    if (targetIds.length === 0) return;
    const cents = Math.round(parseFloat(bulkPrice || '0') * 100);
    if (Number.isNaN(cents) || cents < 0) {
      toast({ title: 'Enter a valid bulk price', variant: 'destructive' });
      return;
    }
    setBulkBusy(true);
    try {
      await Promise.all(
        targetIds.map((id) => adminUpdateClassroomCourseSettings(id, { priceCents: cents }))
      );
      toast({ title: `Updated price for ${targetIds.length} course(s)` });
      await load();
    } catch (e) {
      toast({
        title: 'Bulk update failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function setListedForIds(targetIds: string[], listed: boolean) {
    if (targetIds.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        targetIds.map((id) => adminUpdateClassroomCourseSettings(id, { isForSale: listed }))
      );
      toast({
        title: listed
          ? `${targetIds.length} course(s) published to marketplace`
          : `${targetIds.length} course(s) unpublished`,
      });
      await load();
    } catch (e) {
      toast({
        title: 'Bulk update failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function deleteCourse(courseId: string) {
    setSavingId(courseId);
    try {
      await adminDeleteClassroomCourse(courseId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
      toast({ title: 'Course deleted' });
      await load();
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  async function seedCatalog() {
    if (!user) return;
    setSeeding(true);
    try {
      const name =
        userProfile?.displayName || user.displayName || user.email || 'Admin';
      const seeded = await seedBuiltInClassroomCourses(user.uid, name);
      toast({
        title: seeded > 0 ? `Seeded ${seeded} course(s)` : 'Catalog already live',
        description:
          seeded > 0
            ? 'Built-in catalog courses were added as classroom courses.'
            : 'Every catalog course already has a live classroom entry.',
      });
      await load();
    } catch (e) {
      toast({
        title: 'Seed failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedList = [...selectedIds];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius)]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Publish, price, and manage every live classroom course. Listed courses appear on the{' '}
          <Link href="/marketplace" className="text-primary hover:underline" target="_blank">
            marketplace
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={bulkBusy}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={seedCatalog} disabled={seeding || !user}>
            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
            {seeding ? 'Seeding…' : 'Seed catalog live'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace" target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View store
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Live courses', value: String(courses.length), icon: LayoutDashboard },
          { label: 'Published', value: String(forSaleCourses.length), icon: Store },
          { label: 'Unpublished', value: String(courses.length - forSaleCourses.length), icon: ShoppingBag },
          { label: 'Total enrollments', value: String(totalStudents), icon: Users },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All live courses</CardTitle>
              <CardDescription className="mt-1">
                Toggle publish status and set prices for any instructor&apos;s course.
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, code, instructor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={!filtered.length}>
              Select visible
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={!selectedList.length}
            >
              Clear ({selectedList.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedList.length || bulkBusy}
              onClick={() => setListedForIds(selectedList, true)}
            >
              Publish selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedList.length || bulkBusy}
              onClick={() => setListedForIds(selectedList, false)}
            >
              Unpublish selected
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="h-8 w-24"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedList.length || bulkBusy}
                onClick={() => applyBulkPrice(selectedList)}
              >
                Set price
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-muted-foreground">
                No live classroom courses yet. Seed the built-in catalog or create courses via
                Bootcamp Studio / AI Course Creator.
              </p>
              <Button onClick={seedCatalog} disabled={seeding || !user}>
                {seeding ? 'Seeding…' : 'Seed catalog live'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Course</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Class code</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No courses match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((course) => {
                      const isSaving = savingId === course.id;
                      const isListed = Boolean(course.isForSale);
                      return (
                        <TableRow key={course.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(course.id)}
                              onCheckedChange={() => toggleSelect(course.id)}
                              aria-label={`Select ${course.title}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={course.coverImage}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]">{course.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                  {isListed ? (
                                    <Badge variant="default" className="py-0 text-[10px]">
                                      Live
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="py-0 text-[10px]">
                                      Draft
                                    </Badge>
                                  )}
                                  {course.isBuiltIn ? (
                                    <Badge variant="outline" className="py-0 text-[10px]">
                                      Built-in
                                    </Badge>
                                  ) : null}
                                  <span className="font-mono">{course.id}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                            {course.instructorName}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {course.classCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 max-w-[120px]">
                              <span className="text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="h-8"
                                value={draftPrices[course.id] ?? '0'}
                                onChange={(e) =>
                                  setDraftPrices((p) => ({
                                    ...p,
                                    [course.id]: e.target.value,
                                  }))
                                }
                                disabled={isSaving}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {course.enrolledStudentIds?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isListed}
                              disabled={isSaving || bulkBusy}
                              onCheckedChange={(v) => toggleListed(course, Boolean(v))}
                              aria-label={`Publish ${course.title}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSaving}
                                onClick={() => savePrice(course.id)}
                              >
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/classroom/${course.id}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">Open classroom</span>
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete “{course.title}”?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This removes the live classroom course ({formatPrice(course.priceCents ?? 0)}
                                      , {course.enrolledStudentIds?.length ?? 0} enrolled). This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteCourse(course.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
