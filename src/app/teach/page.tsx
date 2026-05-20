import { redirect } from 'next/navigation';

/** Teach Mode lives in the instructor portal only. */
export default function TeachPage() {
  redirect('/instructor/teach');
}
