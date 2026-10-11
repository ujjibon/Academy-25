# Learning playgrounds

Lessons open with Watch, followed by Try and Play. The Play tab uses `learning-game-catalog.ts` and the distinct game boards.
It gives each authored lesson three different activities tied to its project.
The older `learning-play-games.ts` remains available for compatibility checks.

## Explanations and demonstrations

`lesson-demonstrations.ts` explicitly authors the goal, concept, causal steps,
misconception, prediction, prompt comparison, contrasting cases and transfer
exercise for each of the 84 catalog lessons. Programming examples include code,
state, output and a zero-based line trace. They are authored illustrations;
the learner's arbitrary code is never executed by this component.

The Watch film uses the same teaching content. Maya explains, Leo asks and
predicts, and Pip demonstrates. Every caption carries its speaker and optional
step, trace or experiment index. Those indices survive measured speech retiming,
so a spoken code explanation points to the corresponding line and state.
Changing the lesson text changes the narration cache identity automatically.

The Try tab provides step controls, predictions with explanations, code tracing,
contrasting examples and an editable prompt. The initial output is labelled an
illustration. Only pressing Try prompt calls `/api/learning/try`; a validated live
response contains an artifact, a causal explanation, three draft checks and a
suggested next change. Results are text, not executed code or rendered media.
Editing the prompt, changing lessons or hiding the activity cancels pending work.
The optional Try activity does not gate existing XP or assessments.

The server resolves lesson context from the catalog, bounds requests and response
bodies, enforces concurrency and request windows, uses a server-side credential,
and disables provider response storage. It returns sanitized errors without
claiming that an authored fallback was generated. Limits are per server process;
multi-instance deployments should move these counters to a shared rate limiter.

## Curriculum coverage

The `curriculum` object in `src/lib/learning-game-catalog.ts` is the authoritative,
explicit lesson map. Each course array follows the order of `course.lessons`;
each entry is the three `GameKind` values used for that lesson.
The shipped map covers 84 lessons and 252 challenges:

| Course ID | Lessons |
| --- | ---: |
| `Python-SP-101` | 9 |
| `react-fundamentals` | 2 |
| `advanced-css` | 1 |
| `masters-codex` | 7 |
| `masters-antigravity` | 6 |
| `masters-claude` | 6 |
| `masters-perplexity` | 6 |
| `masters-prompt-engineering` | 7 |
| `masters-figma` | 6 |
| `masters-canva` | 6 |
| `masters-capcut` | 6 |
| `masters-higgsfield` | 6 |
| `masters-creative-ai-capstone` | 6 |
| `digital-productivity-mastery` | 10 |

## Mechanics and controls

`DistinctGameBoardsA.tsx` owns expression, branch, loop, sort, lookup, grid,
layout, contrast and chart boards. `DistinctGameBoardsB.tsx` owns timeline, mix,
caption, camera, evidence, claim, query, budget and sequence boards.

The catalog defines the brief, source items, settings and failing initial state.
Boards visualize state and emit `GameAction`; `applyGameAction` updates a copy.
`evaluateGame` decides completion from actual calculated outputs and constraints.
The parent session owns progression, feedback and completion; boards do not award XP.
Three cleared challenges complete the lesson game. Replay should not award the
caller another completion for the same completed activity.

Keep board previews and evaluator mathematics consistent. In particular:

- Branch `mode: 'checks'` uses review/test flags and AND/OR; other gates compare numbers.
- Lookup `collection` controls string, tuple, dictionary, props, token and cell previews.
- Tuple sorting constructs a new collection while showing the unchanged original.
- Charts preserve source values; a spreadsheet repair must correct the actual cell.
- Mix previews model track balance and headroom; they do not play an audio recording.
- Search/source cards are authored examples, rather than live search results.
- Timeline preview uses the learner's selected clip order and durations.

## Adding or changing a lesson

1. Author the lesson and project in `src/data/courses`, with concrete learning goals.
   Add its explicit teaching demonstration in `lesson-demonstrations.ts`, with
   an accurate worked artifact, misconception, prediction and contrasting cases.
2. Add or update its entry in `curriculum`, keeping the array aligned with lesson order.
3. Choose three different mechanics that teach those goals. Avoid repeating an
   adjacent lesson's trio; multi-lesson courses should use at least four kinds.
4. Add topic-specific source items and settings in `createChallenge` when necessary.
   Write instructions, a useful hint and a connection explaining the lesson principle.
5. Keep the initial state incomplete and ensure success is reachable through UI controls.
   Use ranges and multiple valid solutions where the concept permits them.

Instructor material outside the explicit map falls back to three mechanics chosen
by `getLessonLabFamily`. Add an explicit mapping when preparing new authored courses.
`solveGame` is a test reference helper; learner boards never reveal it.

## Validation and integration

Run `node scripts/check-distinct-learning-games.cjs`. It checks authored coverage,
reachable actions, untouched-state rejection, meaningful failures and independent
domain fixtures. Update its expected lesson count when intentionally expanding the catalog.
Root integration also needs browser checks for controls, responsive layouts and XP.

The Play session feeds learner state to the existing minimal Blender scene.
Preserve its inactive/hidden behavior when adding mechanics. The Watch tab and
server-side voice narration are separate learning activities and remain available.
