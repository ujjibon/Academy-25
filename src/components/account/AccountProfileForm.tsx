'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Camera, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { uploadAvatar } from '@/lib/account-api';
import type { UserProfile } from '@/lib/firebase';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio is too long').optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(100).optional(),
  website: z
    .string()
    .max(200)
    .optional()
    .refine(
      (v) => !v || v === '' || /^https?:\/\/.+/i.test(v) || /^[\w.-]+\.[a-z]{2,}/i.test(v),
      'Enter a valid URL (e.g. https://yoursite.com)'
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type Props = {
  userProfile: UserProfile;
};

export function AccountProfileForm({ userProfile }: Props) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile.displayName,
      bio: userProfile.bio ?? '',
      phone: userProfile.phone ?? '',
      location: userProfile.location ?? '',
      website: userProfile.website ?? '',
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(file);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${origin}${path}`;
      setPhotoURL(fullUrl);
      await updateProfile(user, { photoURL: fullUrl });
      await updateUserProfile(user.uid, { photoURL: fullUrl });
      await refreshProfile();
      toast({ title: 'Photo updated', description: 'Your profile picture was saved.' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setSaving(true);
    try {
      const website =
        values.website?.trim() &&
        !values.website.startsWith('http')
          ? `https://${values.website.trim()}`
          : values.website?.trim() || undefined;

      await updateProfile(user, { displayName: values.displayName });
      await updateUserProfile(user.uid, {
        displayName: values.displayName,
        bio: values.bio?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        location: values.location?.trim() || undefined,
        website,
      });
      await refreshProfile();
      toast({ title: 'Profile saved', description: 'Your account details were updated.' });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Could not save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>
          Update your photo, name, and contact information. Email is managed by your sign-in
          provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar className="h-28 w-28 border-2 border-border">
              <AvatarImage src={photoURL} alt={userProfile.displayName} />
              <AvatarFallback className="text-2xl">
                {userProfile.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow-md"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <p className="text-sm text-muted-foreground">Profile photo</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · max 5 MB</p>
            <p className="text-sm font-medium pt-2">{userProfile.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell others about your learning goals..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>Up to 500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 555 000 0000" type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City, Country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://yourportfolio.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
