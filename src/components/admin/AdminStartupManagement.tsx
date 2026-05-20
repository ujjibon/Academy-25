'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  getAllStartupIdeas,
  getAllPitchDecks,
  getAllMentorshipSlots,
  getAllMentorshipBookings,
  updateStartupIdea,
  deleteStartupIdea,
  updatePitchDeck,
  deletePitchDeck,
  createMentorshipSlot,
  deleteMentorshipSlot,
  updateMentorshipBooking,
} from '@/lib/startup-service';
import type {
  StartupIdea,
  StartupPitchDeck,
  MentorshipSlot,
  MentorshipBooking,
  IdeaStatus,
  PitchDeckStatus,
} from '@/lib/startup-types';
import { IDEA_STATUS_LABELS, PITCH_STATUS_LABELS } from '@/lib/startup-types';
import { Loader2, Plus, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'in_review' || status === 'submitted') return 'secondary';
  return 'outline';
}

export function AdminStartupManagement() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [decks, setDecks] = useState<StartupPitchDeck[]>([]);
  const [slots, setSlots] = useState<MentorshipSlot[]>([]);
  const [bookings, setBookings] = useState<MentorshipBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDeck, setReviewDeck] = useState<StartupPitchDeck | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<PitchDeckStatus>('in_review');
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    mentorName: '',
    topic: '',
    startsAt: '',
    durationMinutes: '30',
    capacity: '1',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [i, d, s, b] = await Promise.all([
        getAllStartupIdeas(),
        getAllPitchDecks(),
        getAllMentorshipSlots(),
        getAllMentorshipBookings(),
      ]);
      setIdeas(i);
      setDecks(d);
      setSlots(s);
      setBookings(b);
    } catch {
      toast({ title: 'Error', description: 'Failed to load startup data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleIdeaStatus = async (idea: StartupIdea, status: IdeaStatus) => {
    try {
      await updateStartupIdea(idea.id, { status });
      toast({ title: 'Idea updated', description: `Status set to ${IDEA_STATUS_LABELS[status]}.` });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not update idea.', variant: 'destructive' });
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteStartupIdea(id);
      toast({ title: 'Idea deleted' });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not delete idea.', variant: 'destructive' });
    }
  };

  const openDeckReview = (deck: StartupPitchDeck) => {
    setReviewDeck(deck);
    setReviewNotes(deck.reviewerNotes);
    setReviewStatus(deck.status === 'draft' ? 'in_review' : deck.status);
  };

  const saveDeckReview = async () => {
    if (!reviewDeck) return;
    try {
      await updatePitchDeck(reviewDeck.id, { status: reviewStatus, reviewerNotes: reviewNotes });
      toast({ title: 'Pitch deck reviewed' });
      setReviewDeck(null);
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not save review.', variant: 'destructive' });
    }
  };

  const handleDeleteDeck = async (id: string) => {
    try {
      await deletePitchDeck(id);
      toast({ title: 'Deck removed' });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not delete deck.', variant: 'destructive' });
    }
  };

  const handleCreateSlot = async () => {
    if (!slotForm.mentorName || !slotForm.topic || !slotForm.startsAt) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    try {
      await createMentorshipSlot({
        mentorName: slotForm.mentorName,
        topic: slotForm.topic,
        startsAt: new Date(slotForm.startsAt),
        durationMinutes: parseInt(slotForm.durationMinutes, 10) || 30,
        capacity: parseInt(slotForm.capacity, 10) || 1,
      });
      toast({ title: 'Slot created' });
      setSlotDialogOpen(false);
      setSlotForm({ mentorName: '', topic: '', startsAt: '', durationMinutes: '30', capacity: '1' });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not create slot.', variant: 'destructive' });
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await deleteMentorshipSlot(id);
      toast({ title: 'Slot deleted' });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not delete slot.', variant: 'destructive' });
    }
  };

  const handleBookingStatus = async (b: MentorshipBooking, status: MentorshipBooking['status']) => {
    try {
      await updateMentorshipBooking(b.id, { status });
      toast({ title: 'Booking updated' });
      await loadAll();
    } catch {
      toast({ title: 'Error', description: 'Could not update booking.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Startup program</h1>
          <p className="text-muted-foreground mt-1">
            Manage founder ideas, pitch deck reviews, mentorship slots, and bookings.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ideas</CardDescription>
            <CardTitle className="text-2xl">{ideas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pitch decks</CardDescription>
            <CardTitle className="text-2xl">{decks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mentor slots</CardDescription>
            <CardTitle className="text-2xl">{slots.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookings</CardDescription>
            <CardTitle className="text-2xl">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="pitch">Pitch decks</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <Card>
            <CardHeader>
              <CardTitle>All ideas</CardTitle>
              <CardDescription>Review submissions and update pipeline status.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {ideas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No ideas yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Founder</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ideas.map((idea) => (
                      <TableRow key={idea.id}>
                        <TableCell className="font-medium max-w-[12rem] truncate">{idea.title}</TableCell>
                        <TableCell className="text-sm">
                          {idea.ownerName || idea.ownerEmail || idea.ownerId.slice(0, 8)}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{idea.stage}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(idea.status)}>
                            {IDEA_STATUS_LABELS[idea.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(idea.updatedAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Select
                            value={idea.status}
                            onValueChange={(v) => handleIdeaStatus(idea, v as IdeaStatus)}
                          >
                            <SelectTrigger className="w-[9rem] h-8 inline-flex">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(IDEA_STATUS_LABELS) as IdeaStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {IDEA_STATUS_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete idea?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes &quot;{idea.title}&quot;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteIdea(idea.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pitch">
          <Card>
            <CardHeader>
              <CardTitle>Pitch deck submissions</CardTitle>
              <CardDescription>Review decks and leave feedback for founders.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {decks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No submissions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Idea</TableHead>
                      <TableHead>Founder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decks.map((deck) => (
                      <TableRow key={deck.id}>
                        <TableCell className="font-medium">{deck.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deck.ideaTitle || deck.ideaId.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {deck.ownerName || deck.ownerEmail || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(deck.status)}>
                            {PITCH_STATUS_LABELS[deck.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {deck.deckUrl ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={deck.deckUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => openDeckReview(deck)}>
                            Review
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Removes this pitch deck record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDeck(deck.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentorship" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mentorship slots</CardTitle>
                <CardDescription>Create bookable sessions for founders.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setSlotDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add slot
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No slots. Add one above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Booked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.mentorName}</TableCell>
                        <TableCell>{slot.topic}</TableCell>
                        <TableCell className="text-sm">
                          {format(slot.startsAt, 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          {slot.bookedCount}/{slot.capacity}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete slot?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Existing bookings may reference this slot.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSlot(slot.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>All founder mentorship reservations.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Founder</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.userName || b.userEmail || b.userId.slice(0, 8)}</TableCell>
                        <TableCell className="max-w-[14rem] truncate">{b.topic}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(b.createdAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={b.status}
                            onValueChange={(v) =>
                              handleBookingStatus(b, v as MentorshipBooking['status'])
                            }
                          >
                            <SelectTrigger className="w-[8rem] h-8 inline-flex">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewDeck} onOpenChange={(o) => !o && setReviewDeck(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review pitch deck</DialogTitle>
          </DialogHeader>
          {reviewDeck ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">{reviewDeck.title}</p>
              {reviewDeck.deckUrl ? (
                <a
                  href={reviewDeck.deckUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open deck <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as PitchDeckStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PITCH_STATUS_LABELS) as PitchDeckStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {PITCH_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reviewer notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Feedback for the founder…"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDeck(null)}>
              Cancel
            </Button>
            <Button onClick={saveDeckReview}>Save review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New mentorship slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mentor name</Label>
              <Input
                value={slotForm.mentorName}
                onChange={(e) => setSlotForm((f) => ({ ...f, mentorName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Session topic</Label>
              <Input
                value={slotForm.topic}
                onChange={(e) => setSlotForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Start (local)</Label>
              <Input
                type="datetime-local"
                value={slotForm.startsAt}
                onChange={(e) => setSlotForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={slotForm.durationMinutes}
                  onChange={(e) => setSlotForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={slotForm.capacity}
                  onChange={(e) => setSlotForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSlot}>Create slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
