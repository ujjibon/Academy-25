# Academy learning expedition

Open **Quest World** from the learning sidebar, `/learn/adventure`, or the course's
Quest world tab. Every published lesson also includes the expedition experience.
The learning navigation connects the quest world, adaptive path, recall lab,
training programs, and field notes across learner pages.
The island map opens automatically. Learner controls use game language such as
**Create a new briefing**, **Customize my quests**, and **Create a remix**;
provider names and technical generation errors stay out of the learning screens.

Each lesson has five stations:

- **Discover:** the existing guided lesson and a slide studio with 8, 14, or 22
  slides. Choose visual storytelling, a workshop, or challenge-and-reveal.
- **Play:** six curriculum-backed games available immediately, plus OpenAI remixes
  grounded in the selected course and lesson. Every answer has feedback.
- **Create:** a skill sprint, deep expedition, or portfolio project. Customize
  your quests, record evidence, and self-review the success criteria.
- **Remember:** flip flashcards, review a field guide, and use reflection prompts.
- **Master:** complete the four practice stations, then reach 80% on the lesson's
  assessment. Courses without authored questions use clearly labeled recall
  questions drawn from their actual material.

Expedition XP and station completion are saved in browser storage, scoped by
account, course, and lesson. Each game format/difficulty pays its reward once at
70% mastery; repeated attempts can improve the stored best score. These practice
rewards do not modify cloud XP, leaderboard rank, or certificate eligibility.
Lesson assessment completion still uses the course's existing progress workflow.
Project evidence is session-only; use **Save materials** to retain your own notes.

OpenAI calls run on the server with `OPENAI_API_KEY`. Training and slide services
return explicitly labeled course material if generation fails. Game remixes keep
the ready curriculum game available. API inputs are bounded and canonical lesson
IDs are checked before generation. Generated answer sets are validated before play.
Optional image/diagram enrichment uses the classroom's **Visuals** button.

The floating island is original Blender geometry. Its editable source is
`assets/academy/quest-isles.blend`; the optimized browser model is
`public/models/academy/quest-isles.glb`. See `assets/academy/README.md` for the
reproducible Blender MCP pipeline. The viewer renders on demand and supports
orbit, keyboard controls, selectable stations, and a fallback image/control view.

Verification commands:

```sh
npm run typecheck
npm run check:learning
npm run check:world
npm run build
```

For an authorized live OpenAI smoke test, run
`node --env-file=.env.local scripts/live-learning-smoke.cjs`. It prints only
sanitized result metadata. The curriculum checks require no API credentials.
