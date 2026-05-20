'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getAvailableMentorshipSlots,
  getBookingsByUser,
  createMentorshipBooking,
  updateMentorshipBooking,
} from '@/lib/startup-service';
import type { MentorshipSlot, MentorshipBooking } from '@/lib/startup-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function StartupMentorshipPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<MentorshipSlot[]>([]);
  const [bookings, setBookings] = useState<MentorshipBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [s, b] = await Promise.all([
      getAvailableMentorshipSlots(),
      getBookingsByUser(user.uid),
    ]);
    setSlots(s);
    setBookings(b);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [user]);

  const book = async (slotId: string) => {
    if (!user || !topic.trim()) {
      toast({ title: 'Enter a topic for your session', variant: 'destructive' });
      setBookingSlotId(slotId);
      return;
    }
    setBusy(true);
    try {
      await createMentorshipBooking({
        userId: user.uid,
        userEmail: userProfile?.email || user.email || undefined,
        userName: userProfile?.displayName || user.displayName || undefined,
        slotId,
        topic,
      });
      toast({ title: 'Session booked' });
      setTopic('');
      setBookingSlotId(null);
      await load();
    } catch (e) {
      toast({
        title: 'Could not book',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      await updateMentorshipBooking(id, { status: 'cancelled' });
      toast({ title: 'Booking cancelled' });
      await load();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6">
        <span className="dashboard-kicker">Mentorship</span>
        <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">Book sessions</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Choose an available slot. Admins publish mentor availability from the admin portal.
        </p>
      </section>

      <section className="dashboard-panel p-6 space-y-4">
        <div className="space-y-2">
          <Label>What do you want to discuss?</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Go-to-market for my MVP"
          />
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open slots right now. Check back soon.</p>
        ) : (
          <ul className="space-y-3">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg p-4"
              >
                <div>
                  <p className="font-medium">{slot.mentorName}</p>
                  <p className="text-sm text-muted-foreground">{slot.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(slot.startsAt, 'EEE, MMM d · h:mm a')} · {slot.durationMinutes} min
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={busy && bookingSlotId === slot.id}
                  onClick={() => book(slot.id)}
                >
                  {busy && bookingSlotId === slot.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Book'
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel p-6">
        <h3 className="font-semibold">My sessions</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No bookings yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className="border border-border rounded-lg p-4 text-sm flex justify-between gap-3">
                <div>
                  <p className="font-medium">{b.topic}</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {b.status}
                  </Badge>
                </div>
                {b.status === 'scheduled' ? (
                  <Button variant="outline" size="sm" onClick={() => cancelBooking(b.id)}>
                    Cancel
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
