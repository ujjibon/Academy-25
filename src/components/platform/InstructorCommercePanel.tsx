'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Copy,
  ExternalLink,
  LayoutDashboard,
  Package,
  Search,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { formatPrice } from '@/lib/marketplace-data';
import { getInstructorCourses, updateClassroomCourseSettings } from '@/lib/classroom-service';

type DraftPrices = Record<string, string>;

function useInstructorCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCourses(await getInstructorCourses(user.uid));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { courses, loading, reload: load, userId: user?.uid };
}

export function InstructorCommercePanel() {
  const { courses, loading, reload, userId } = useInstructorCourses();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draftPrices, setDraftPrices] = useState<DraftPrices>({});
  const [bulkPrice, setBulkPrice] = useState('29.99');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [focusCourseId, setFocusCourseId] = useState<string | null>(null);

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
        c.classCode.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const forSaleCourses = useMemo(() => courses.filter((c) => c.isForSale), [courses]);
  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + (c.enrolledStudentIds?.length ?? 0), 0),
    [courses]
  );
  const listedRevenuePotential = useMemo(
    () =>
      forSaleCourses.reduce((sum, c) => sum + (c.priceCents ?? 0) / 100, 0),
    [forSaleCourses]
  );

  const focusCourse = courses.find((c) => c.id === focusCourseId) ?? null;

  async function updateCourse(
    courseId: string,
    updates: { priceCents?: number; isForSale?: boolean }
  ) {
    if (!userId) return;
    setSavingId(courseId);
    try {
      await updateClassroomCourseSettings(courseId, userId, updates);
      await reload();
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
    if (!userId || targetIds.length === 0) return;
    const cents = Math.round(parseFloat(bulkPrice || '0') * 100);
    if (Number.isNaN(cents) || cents < 0) {
      toast({ title: 'Enter a valid bulk price', variant: 'destructive' });
      return;
    }
    setBulkBusy(true);
    try {
      await Promise.all(
        targetIds.map((id) => updateClassroomCourseSettings(id, userId, { priceCents: cents }))
      );
      toast({ title: `Updated price for ${targetIds.length} course(s)` });
      await reload();
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
    if (!userId || targetIds.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        targetIds.map((id) =>
          updateClassroomCourseSettings(id, userId, { isForSale: listed })
        )
      );
      toast({
        title: listed
          ? `${targetIds.length} course(s) listed on marketplace`
          : `${targetIds.length} course(s) removed from marketplace`,
      });
      await reload();
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

  if (courses.length === 0) {
    return (
      <Card className="brand-card max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            No courses to sell yet
          </CardTitle>
          <CardDescription>
            Create a classroom course first, then set pricing and publish it to the public
            marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild className="brand-button">
            <Link href="/instructor/course-builder">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Open Course Builder
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/marketplace" target="_blank">
              <Store className="mr-2 h-4 w-4" />
              Preview marketplace
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Manage pricing and marketplace visibility for each classroom. Learners discover listed
          courses on the{' '}
          <Link href="/marketplace" className="text-primary hover:underline" target="_blank">
            public marketplace
          </Link>{' '}
          and join with class codes after purchase.
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace" target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View store
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/instructor/bundles">
              <Package className="mr-2 h-3.5 w-3.5" />
              Bundles
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Your courses', value: String(courses.length), icon: LayoutDashboard },
          { label: 'Listed for sale', value: String(forSaleCourses.length), icon: Store },
          { label: 'Total enrollments', value: String(totalStudents), icon: Users },
          {
            label: 'Listed catalog value',
            value: `$${listedRevenuePotential.toFixed(0)}`,
            icon: ShoppingBag,
          },
        ].map((stat) => (
          <Card key={stat.label} className="brand-card">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="brand-card overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Course catalog</CardTitle>
                <CardDescription className="mt-1">
                  Toggle marketplace listing and set prices per course.
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses or codes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                Select visible
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={!selectedList.length}>
                Clear ({selectedList.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Course</TableHead>
                    <TableHead>Class code</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Listed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No courses match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((course) => {
                      const isSaving = savingId === course.id;
                      const isListed = Boolean(course.isForSale);
                      return (
                        <TableRow
                          key={course.id}
                          className={
                            focusCourseId === course.id ? 'bg-primary/5' : undefined
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(course.id)}
                              onCheckedChange={() => toggleSelect(course.id)}
                              aria-label={`Select ${course.title}`}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="flex items-center gap-3 text-left hover:opacity-80"
                              onClick={() => setFocusCourseId(course.id)}
                            >
                              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={course.coverImage}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[180px] sm:max-w-none">
                                  {course.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {isListed ? (
                                    <Badge variant="default" className="mr-1 py-0 text-[10px]">
                                      Live
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="mr-1 py-0 text-[10px]">
                                      Draft
                                    </Badge>
                                  )}
                                  {formatPrice(course.priceCents ?? 0)}
                                </p>
                              </div>
                            </button>
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
                              disabled={isSaving}
                              onCheckedChange={(v) => toggleListed(course, Boolean(v))}
                              aria-label={`List ${course.title} for sale`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSaving}
                                onClick={() => savePrice(course.id)}
                              >
                                {isSaving ? '…' : 'Save'}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(course.classCode);
                                  toast({ title: 'Class code copied' });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base">Bulk actions</CardTitle>
              <CardDescription>
                {selectedList.length > 0
                  ? `${selectedList.length} course(s) selected`
                  : 'Select rows in the table, or apply to all courses'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default price (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button
                className="w-full brand-button"
                variant="outline"
                disabled={bulkBusy}
                onClick={() =>
                  applyBulkPrice(selectedList.length ? selectedList : courses.map((c) => c.id))
                }
              >
                Apply price to {selectedList.length ? 'selected' : 'all'}
              </Button>
              <Button
                className="w-full"
                disabled={bulkBusy}
                onClick={() =>
                  setListedForIds(
                    selectedList.length ? selectedList : courses.map((c) => c.id),
                    true
                  )
                }
              >
                Publish {selectedList.length ? 'selected' : 'all'} to marketplace
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                disabled={bulkBusy}
                onClick={() =>
                  setListedForIds(
                    selectedList.length ? selectedList : courses.map((c) => c.id),
                    false
                  )
                }
              >
                Unlist {selectedList.length ? 'selected' : 'all'}
              </Button>
            </CardContent>
          </Card>

          {focusCourse ? (
            <Card className="brand-card">
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">{focusCourse.title}</CardTitle>
                <CardDescription>Quick edit & preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={focusCourse.coverImage}
                    alt={focusCourse.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {focusCourse.description}
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="font-semibold">
                      {formatPrice(focusCourse.priceCents ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      {focusCourse.isForSale ? (
                        <Badge>On marketplace</Badge>
                      ) : (
                        <Badge variant="secondary">Not listed</Badge>
                      )}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Class code</dt>
                    <dd className="font-mono text-xs mt-0.5">{focusCourse.classCode}</dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-2">
                  <Button
                    className="brand-button w-full"
                    disabled={savingId === focusCourse.id}
                    onClick={() => savePrice(focusCourse.id)}
                  >
                    Save price
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/classroom/${focusCourse.id}/stream`}>Open classroom</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="brand-card border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Select a course row to see details and quick actions.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
