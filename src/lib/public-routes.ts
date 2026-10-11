/**
 * Catalog course pages that guests can browse without signing in.
 * `/courses` (My courses hub) stays authenticated.
 */
export function isPublicCatalogCoursePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === '/courses') return false;
  if (!pathname.startsWith('/courses/')) return false;
  // /courses/:courseId
  // /courses/:courseId/curriculum|materials|resources
  // /courses/:courseId/:lessonId
  return true;
}
