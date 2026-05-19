'use client';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  getStreamPosts,
  createStreamPost,
  getPostComments,
  addPostComment,
} from '@/lib/classroom-service';
import type { StreamPost, PostComment } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function StreamPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [posting, setPosting] = useState(false);
  const canPost = isInstructorOrAdmin(userProfile, user?.email);

  const load = () => {
    getStreamPosts(courseId)
      .then(setPosts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseId]);

  const handlePost = async () => {
    if (!user || !announcement.trim()) return;
    setPosting(true);
    try {
      await createStreamPost(courseId, {
        authorId: user.uid,
        authorName: userProfile?.displayName || 'Instructor',
        authorPhoto: userProfile?.photoURL,
        type: 'announcement',
        title: 'Announcement',
        content: announcement.trim(),
      });
      setAnnouncement('');
      load();
      toast({ title: 'Posted to stream' });
    } catch {
      toast({ title: 'Failed to post', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {canPost && (
        <Card className="brand-card">
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Share an announcement</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Share something with your class..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
            />
            <Button onClick={handlePost} disabled={posting || !announcement.trim()} className="brand-button">
              {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Post
            </Button>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="brand-card p-8 text-center text-muted-foreground">
          No posts yet. {canPost ? 'Create the first announcement above.' : 'Check back for updates from your instructor.'}
        </Card>
      ) : (
        posts.map((post) => (
          <StreamPostCard key={post.id} post={post} courseId={courseId} onCommentAdded={load} />
        ))
      )}
    </div>
  );
}

function StreamPostCard({
  post,
  courseId,
  onCommentAdded,
}: {
  post: StreamPost;
  courseId: string;
  onCommentAdded: () => void;
}) {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    const c = await getPostComments(courseId, post.id);
    setComments(c);
    setLoadingComments(false);
  };

  const toggleComments = async () => {
    if (!showComments) await loadComments();
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    await addPostComment(courseId, post.id, {
      authorId: user.uid,
      authorName: userProfile?.displayName || 'Student',
      content: commentText.trim(),
    });
    setCommentText('');
    await loadComments();
    onCommentAdded();
  };

  return (
    <Card className="brand-card">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.authorPhoto} />
          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.authorName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title !== 'Announcement' && <h3 className="font-medium">{post.title}</h3>}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        <Button variant="ghost" size="sm" onClick={toggleComments}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {post.commentCount} comments
        </Button>
        {showComments && (
          <div className="border-t pt-3 space-y-3">
            {loadingComments ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm pl-2 border-l-2 border-muted">
                  <span className="font-medium">{c.authorName}</span>
                  <p className="text-muted-foreground">{c.content}</p>
                </div>
              ))
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button size="sm" onClick={submitComment} disabled={!commentText.trim()}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
