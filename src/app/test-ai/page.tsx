import Link from 'next/link';

export default function TestAIPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
      <h1 className="text-2xl font-bold">Learning tools preview</h1>
      <p className="text-muted-foreground">Explore course games, lesson presentations, training materials, and the 3D learning world in the quest studio.</p>
      <Link href="/learn/adventure" className="inline-flex rounded-full bg-teal-700 px-5 py-3 font-semibold text-white">Open the learning studio</Link>
    </main>
  );
}
