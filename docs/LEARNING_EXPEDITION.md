# Academy play and learn

Open **Play & learn** from the learning navigation, `/learn/adventure`, or a
course's Play & learn tab. Every published lesson starts on **Play**. The design
uses quiet white surfaces, charcoal type, blue controls, and small freestanding
Blender objects. The island map is no longer part of the learning interface.

Each of the 84 lessons has three changing rounds grounded in its authored
objectives, takeaway, and project. Six subject families have different mechanics:

- **Signal path:** rotate circuit pieces, process real sample values, reject
  invalid inputs, and deliver a result through the required operations.
- **Brief builder:** arrange instruction blocks, remove conflicts, constrain
  scope, and add a review check.
- **Cut & rhythm:** order clips, trim their duration, and add captions to a
  complete teaching sequence.
- **Evidence links:** connect claims to the actual lesson objectives, project
  brief, or takeaway; unsupported claims must stay outside the brief.
- **Layout move:** move heading, explanation, and action elements onto a
  readable grid and try different screen compositions.
- **Frame finder:** move and resize the focal subject, protect message space,
  and inspect the final crop's safe area.

Moves change the visible board and 3D state. Each round has a goal, retry, hint,
and specific feedback. Pointer controls have keyboard alternatives. All three
rounds must be solved before Play completion is awarded; replays do not duplicate
practice XP. Animation pauses when the activity or browser tab is inactive.

Four supplemental activities remain available:

- **Watch:** a captioned animated sketch film with worked examples, replay,
  chapter controls, and read-aloud. Optional reading and slide decks offer 8,
  14, or 22 slides.
- **Practice:** choose a skill sprint, deep practice, or portfolio program,
  customize a practice plan, record evidence, and review its criteria.
- **Notes:** flashcards, a field guide, and reflection prompts.
- **Check:** finish the four activities, then reach 80% on the authored lesson
  assessment. Courses without authored questions use labeled recall questions
  drawn from their actual material.

Practice XP and activity completion are saved in browser storage, scoped by
account, course, and lesson. These rewards do not change cloud XP, rank, or
certificate eligibility. Lesson completion retains the existing course progress
workflow. Project evidence stays in the session; use **Save materials** to keep it.

Optional generated practice plans and slide material use the server-side
`OPENAI_API_KEY`. The services validate canonical course/lesson IDs and bounded
inputs. Authored materials remain available when generation fails. Provider names
and technical errors stay out of learner screens.

The current Blender assets and rebuild instructions are in
`assets/academy/README.md`. The browser loads `minimal-play-kit.glb`; its editable
source has named moving parts for all six families. A matching SVG scene keeps
the game available when WebGL or model loading is unavailable.

Verification:

```sh
npm run typecheck
npm run check:learning
npm run check:visual-learning
npm run check:minimal-play
npm run build
```

`check:minimal-play` exercises all lesson rounds, failure conditions, real action
transitions, and the current model's geometry and size budget. The curriculum
checks require no API credentials.
