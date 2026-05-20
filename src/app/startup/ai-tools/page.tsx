export default function StartupAiToolsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6">
        <span className="dashboard-kicker">Founder AI</span>
        <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">AI tools</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          OpenAI-backed flows for pitch prep, exec summaries, and Q&A practice will live here, using your
          server-side <code className="rounded bg-muted px-1 py-0.5 text-xs">OPENAI_API_KEY</code>.
        </p>
      </section>
    </div>
  );
}
