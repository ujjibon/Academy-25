import { redirect } from 'next/navigation';

export default async function ClassroomIndexPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/classroom/${courseId}/stream`);
}
