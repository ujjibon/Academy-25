import { redirect } from 'next/navigation';

export default function LegacyCourseCreatorRedirect() {
  redirect('/admin-portal/course-creator');
}
