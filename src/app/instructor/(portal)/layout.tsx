import InstructorLayout from '@/components/layout/InstructorLayout';

export default function InstructorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InstructorLayout>{children}</InstructorLayout>;
}
