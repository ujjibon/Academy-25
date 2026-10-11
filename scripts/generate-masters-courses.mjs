/**
 * Regenerates full-fledged Masters Class course JSON.
 * Run: node scripts/generate-masters-courses.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'src', 'data', 'courses');
fs.mkdirSync(dir, { recursive: true });

const q = (question, options, correctAnswer) => ({ question, options, correctAnswer });

function lesson(id, { title, duration, intro, practice, project, assessment }) {
  return {
    id: String(id),
    title,
    duration,
    introduction: { text: intro },
    practice: { questions: practice },
    project,
    assessment: { questions: assessment },
  };
}

function writeCourse(course) {
  const json = {
    id: course.id,
    title: course.title,
    description: course.description,
    image: `/images/${course.id}.png`,
    ...(course.category ? { category: course.category } : {}),
    lessons: course.lessons.map((L, i) => lesson(i + 1, L)),
  };
  fs.writeFileSync(path.join(dir, `${course.id}.json`), JSON.stringify(json, null, 2));
  console.log('wrote', course.id, `(${json.lessons.length} lessons)`);
}

const courses = [
  // ─── 1. CODEX ─────────────────────────────────────────────
  {
    id: 'masters-codex',
    title: 'Codex Masters Class',
    description:
      'A full Codex apprenticeship: prompt craft, refactoring, tests, debugging, architecture sketches, and shipping features with AI pair programming.',
    color: '0D9373',
    short: 'Codex',
    category: 'programming',
    lessons: [
      {
        title: 'Codex Mindset: AI as a Junior Pair',
        duration: 25,
        intro:
          'Treat Codex like a fast junior engineer who needs clear specs. You own architecture, correctness, and taste. Codex drafts code; you review diffs, demand tests, and reject vague work. This mindset prevents blind copy-paste and builds a reusable prompting habit: goal → context → constraints → acceptance checks.',
        practice: [
          q('The best mental model for Codex is:', ['An infallible senior', 'A fast junior pair you supervise', 'A compiler replacement', 'A designer only'], 'A fast junior pair you supervise'),
          q('Who is responsible for correctness?', ['Only Codex', 'You, the developer', 'The hosting provider', 'Nobody'], 'You, the developer'),
          q('A weak Codex session usually starts with:', ['A clear goal', 'Vague one-line asks', 'Acceptance criteria', 'Repo context'], 'Vague one-line asks'),
          q('Before accepting generated code you should:', ['Ship instantly', 'Review and run tests', 'Delete comments', 'Ignore edge cases'], 'Review and run tests'),
          q('Acceptance checks help Codex by:', ['Hiding requirements', 'Defining what done means', 'Removing types', 'Skipping review'], 'Defining what done means'),
        ],
        project: {
          title: 'Pair Contract',
          description:
            'Write a one-page “Codex pair contract”: your review rules, what you always ask for (tests, edge cases, complexity notes), and three prompts you refuse to send (too vague).',
        },
        assessment: [
          q('Codex output should be treated as:', ['Final truth', 'A draft under review', 'Uneditable', 'Always slower than you'], 'A draft under review'),
          q('Clear specs reduce:', ['All creativity', 'Hallucinated APIs and wrong assumptions', 'Need for git', 'Keyboard use'], 'Hallucinated APIs and wrong assumptions'),
          q('A good first prompt includes:', ['Only “fix this”', 'Goal, files, constraints, and done criteria', 'Emojis only', 'Your password'], 'Goal, files, constraints, and done criteria'),
          q('Why keep a prompt library?', ['Waste disk', 'Reuse patterns that produced clean diffs', 'Ban learning', 'Replace docs'], 'Reuse patterns that produced clean diffs'),
          q('Blind trust in AI code often causes:', ['Fewer bugs always', 'Subtle regressions and security holes', 'Instant mastery', 'Perfect architecture'], 'Subtle regressions and security holes'),
        ],
      },
      {
        title: 'Prompt Anatomy for Code Generation',
        duration: 30,
        intro:
          'High-yield Codex prompts name the language, runtime, inputs/outputs, error behavior, and style rules. Add a minimal example or signature. Ask for a short plan before code when the task spans multiple files. Prefer “edit this function” over “rewrite the app.”',
        practice: [
          q('Which detail most improves generation quality?', ['Favorite color', 'Input/output contract and constraints', 'Random slang', 'Empty prompt'], 'Input/output contract and constraints'),
          q('Asking for a plan first is useful when:', ['The task is one typo', 'Work spans multiple steps or files', 'You hate reading', 'Offline mode only'], 'Work spans multiple steps or files'),
          q('A signature or example helps Codex:', ['Guess worse', 'Match expected shape', 'Ignore types', 'Skip naming'], 'Match expected shape'),
          q('Prefer editing scope that is:', ['The entire monorepo blindly', 'The smallest clear unit of work', 'Only README', 'Only CSS forever'], 'The smallest clear unit of work'),
          q('Style rules in prompts can include:', ['Indentation, naming, no new deps', 'Bank PINs', 'Unrelated memes', 'Nothing useful'], 'Indentation, naming, no new deps'),
        ],
        project: {
          title: 'Generation Prompt Pack',
          description:
            'Create 4 Codex prompts for the same feature (email validator): (1) plan only, (2) implementation, (3) unit tests, (4) edge-case hardening. Keep them under 12 lines each.',
          code: {
            language: 'javascript',
            starterCode:
              '// Target: isValidEmail(email: string) => boolean\n// Write your four Codex prompts as comments below, then a stub implementation.\n\nexport function isValidEmail(email) {\n  // TODO: implement after Codex draft + your review\n  return false;\n}\n',
            enablePreview: false,
            enableConsole: true,
          },
        },
        assessment: [
          q('Multi-file work should usually start with:', ['Random files', 'A short plan of steps', 'Deleting tests', 'Force push'], 'A short plan of steps'),
          q('“No new dependencies” is an example of a:', ['Constraint', 'Citation', 'Deploy key', 'Theme'], 'Constraint'),
          q('Providing current code context reduces:', ['Token use only', 'Invented APIs that do not exist in your repo', 'Need for review', 'Git history'], 'Invented APIs that do not exist in your repo'),
          q('Good prompts specify error behavior because:', ['Errors never happen', 'Codex otherwise invents inconsistent handling', 'It slows typing', 'It breaks JSON'], 'Codex otherwise invents inconsistent handling'),
          q('A reusable prompt template should have placeholders for:', ['GOAL, CONTEXT, CONSTRAINTS, FORMAT', 'Only emojis', 'Secrets', 'Nothing'], 'GOAL, CONTEXT, CONSTRAINTS, FORMAT'),
        ],
      },
      {
        title: 'Explain, Navigate, and Document Codebases',
        duration: 30,
        intro:
          'Use Codex to map unfamiliar code: module purpose, call graphs, risky areas, and “how do I change X safely?” Ask for diagrams in Mermaid or bullet call chains. Demand citations as file paths and function names so you can verify.',
        practice: [
          q('When exploring a repo, ask Codex for:', ['Only jokes', 'Purpose, entry points, and risky modules', 'Deleted history', 'Passwords'], 'Purpose, entry points, and risky modules'),
          q('Path/function citations let you:', ['Skip reading', 'Verify the explanation against real code', 'Encrypt disks', 'Ignore types'], 'Verify the explanation against real code'),
          q('A call chain summary helps you:', ['See how data flows through functions', 'Bake bread', 'Tune Wi-Fi', 'Design logos'], 'See how data flows through functions'),
          q('Documentation prompts should request:', ['Audience and accuracy over fluff', 'Maximum length only', 'No structure', 'Secrets'], 'Audience and accuracy over fluff'),
          q('Unverified summaries are risky because:', ['They are always correct', 'They may invent modules', 'Git forbids them', 'They improve CI'], 'They may invent modules'),
        ],
        project: {
          title: 'Codebase Brief',
          description:
            'Pick any small open-source file or invent a 40-line module. Produce a Codex-ready brief: purpose, public API, dependencies, and 3 safe change ideas with risk notes.',
        },
        assessment: [
          q('Mermaid diagrams from Codex are best used as:', ['Final architecture law', 'Draft visuals you verify', 'Deploy scripts', 'Secrets vault'], 'Draft visuals you verify'),
          q('“Where should I add logging?” is a good:', ['Navigation question with context', 'Vague rant', 'Design-only ask', 'Illegal ask'], 'Navigation question with context'),
          q('Asking for “unknowns / assumptions” surfaces:', ['Nothing', 'Gaps you must fill before coding', 'Only CSS', 'Hosting bills'], 'Gaps you must fill before coding'),
          q('Good onboarding docs include:', ['Setup, architecture map, common tasks', 'Only memes', 'Private keys', 'Blank pages'], 'Setup, architecture map, common tasks'),
          q('You should cross-check explanations because:', ['AI never errs', 'Models can hallucinate structure', 'It wastes time always', 'Linters ban it'], 'Models can hallucinate structure'),
        ],
      },
      {
        title: 'Refactoring and Code Health with Codex',
        duration: 35,
        intro:
          'Refactor in thin slices: extract function, rename for clarity, reduce nesting, then re-run tests. Tell Codex the invariant that must not change. Ask for a before/after complexity note and a regression checklist. Never mix feature work with large refactors in one prompt.',
        practice: [
          q('Thin-slice refactors are safer because:', ['They skip tests', 'Each change is easier to review and revert', 'Git hates them', 'They delete coverage'], 'Each change is easier to review and revert'),
          q('An invariant is:', ['A random comment', 'A behavior that must stay true', 'A CSS variable', 'A deploy flag'], 'A behavior that must stay true'),
          q('Mixing features and big refactors:', ['Is ideal', 'Makes reviews and rollbacks harder', 'Is required by Codex', 'Removes bugs magically'], 'Makes reviews and rollbacks harder'),
          q('Ask Codex to preserve:', ['Public API and tests passing', 'All dead code forever', 'Typos', 'Secrets in source'], 'Public API and tests passing'),
          q('A regression checklist should cover:', ['Happy path and edge cases you care about', 'Only fonts', 'Only CI badges', 'Nothing'], 'Happy path and edge cases you care about'),
        ],
        project: {
          title: 'Nested Logic Cleanup',
          description:
            'Take a messy nested if/else (or invent one). Write a Codex refactor prompt that demands: extract helpers, early returns, same outputs, and a short complexity note.',
          code: {
            language: 'javascript',
            starterCode:
              'export function price(user, items) {\n  let total = 0;\n  if (items) {\n    for (const it of items) {\n      if (it && it.price) {\n        if (user && user.vip) {\n          if (it.price > 100) total += it.price * 0.8;\n          else total += it.price * 0.9;\n        } else {\n          if (it.onSale) total += it.price * 0.95;\n          else total += it.price;\n        }\n      }\n    }\n  }\n  return total;\n}\n\n// TODO: refactor with Codex guidance into clear helpers + early returns\n',
            enableConsole: true,
          },
        },
        assessment: [
          q('Before refactoring, ensure you have:', ['No tests', 'A way to verify behavior (tests or cases)', 'Deleted git', 'Only screenshots'], 'A way to verify behavior (tests or cases)'),
          q('Early returns often help by:', ['Increasing nesting', 'Flattening control flow', 'Breaking types always', 'Hiding errors'], 'Flattening control flow'),
          q('Asking for a diff-sized change means:', ['Rewrite everything', 'Keep the patch reviewable', 'Skip commits', 'Force push main'], 'Keep the patch reviewable'),
          q('Dead code removal should be:', ['Unverified', 'Confirmed unused then deleted', 'Done with features mixed in', 'Hidden'], 'Confirmed unused then deleted'),
          q('Complexity notes help reviewers:', ['Ignore the PR', 'Understand why the change is better', 'Deploy faster only', 'Skip QA'], 'Understand why the change is better'),
        ],
      },
      {
        title: 'Tests, Property Checks, and Fixtures',
        duration: 35,
        intro:
          'Have Codex propose test cases from the spec first, then implement. Cover happy path, boundaries, and failure modes. Prefer deterministic fixtures. Ask for table-driven tests when many inputs share structure. Use failing tests to drive fixes.',
        practice: [
          q('Generating cases before code helps you:', ['Skip thinking', 'Lock expected behavior early', 'Delete CI', 'Avoid edges'], 'Lock expected behavior early'),
          q('Boundary tests target:', ['Only happy paths', 'Limits like empty, max, zero, null', 'Only UI colors', 'DNS'], 'Limits like empty, max, zero, null'),
          q('Table-driven tests are good when:', ['One case exists', 'Many inputs share the same assertion shape', 'You dislike arrays', 'Offline forever'], 'Many inputs share the same assertion shape'),
          q('Flaky tests usually come from:', ['Deterministic fixtures', 'Time, randomness, or shared state', 'Clear names', 'Pure functions'], 'Time, randomness, or shared state'),
          q('A failing test first is useful to:', ['Confuse CI', 'Prove the bug and guide the fix', 'Delete coverage', 'Hide regressions'], 'Prove the bug and guide the fix'),
        ],
        project: {
          title: 'Spec → Cases → Tests',
          description:
            'For isValidEmail, list 8 cases (valid/invalid). Write a Codex prompt that generates table-driven tests, then implement stubs that make intentional failures obvious.',
          code: {
            language: 'javascript',
            starterCode:
              'export function isValidEmail(email) {\n  return typeof email === \"string\" && email.includes(\"@\") && email.includes(\".\");\n}\n\n// Cases Codex should cover (edit/expand):\n// 1) user@example.com -> true\n// 2) \"\" -> false\n// ...\n',
            enableConsole: true,
          },
        },
        assessment: [
          q('Fixtures should be:', ['Random each run', 'Stable and readable', 'Hidden secrets', 'Network-only'], 'Stable and readable'),
          q('Failure-mode tests assert:', ['Only success', 'Errors or rejection behavior', 'Font size', 'Deploy URLs'], 'Errors or rejection behavior'),
          q('Asking Codex for “missing cases” can reveal:', ['Nothing', 'Gaps in your mental model', 'Only CSS bugs', 'DNS issues'], 'Gaps in your mental model'),
          q('Tests that mirror implementation details too tightly:', ['Never break', 'Become brittle under refactors', 'Are ideal always', 'Replace code review'], 'Become brittle under refactors'),
          q('Coverage is a:', ['Guarantee of correctness', 'Signal, not a substitute for thoughtful cases', 'Reason to skip edges', 'Deploy key'], 'Signal, not a substitute for thoughtful cases'),
        ],
      },
      {
        title: 'Debugging Loops with Codex',
        duration: 35,
        intro:
          'Feed Codex the error, stack, relevant snippet, and what you already tried. Ask for ranked hypotheses, then a minimal experiment. Avoid dumping the whole repo. After a fix, request a regression test and a one-line root-cause summary for your notes.',
        practice: [
          q('A strong debug prompt includes:', ['Only “it broke”', 'Error, stack, snippet, attempts', 'Emojis', 'Secrets'], 'Error, stack, snippet, attempts'),
          q('Ranked hypotheses help you:', ['Try random edits forever', 'Test the most likely causes first', 'Skip logs', 'Delete stacks'], 'Test the most likely causes first'),
          q('Minimal experiments are better because:', ['They change everything', 'They isolate the cause', 'They hide evidence', 'CI forbids them'], 'They isolate the cause'),
          q('After fixing, add:', ['Nothing', 'A regression test when practical', 'More dead code', 'Force push'], 'A regression test when practical'),
          q('Root-cause notes help future you:', ['Forget', 'Recognize the pattern faster', 'Avoid git', 'Skip reading errors'], 'Recognize the pattern faster'),
        ],
        project: {
          title: 'Bug Clinic Card',
          description:
            'Invent a TypeError from a real-looking stack. Write a Codex debug prompt and a 5-step investigation plan with expected signals at each step.',
        },
        assessment: [
          q('Dumping unrelated files into the prompt often:', ['Improves focus', 'Adds noise and wrong fixes', 'Fixes flaky CI always', 'Removes need for stacks'], 'Adds noise and wrong fixes'),
          q('“What would falsify this hypothesis?” is a good:', ['Distraction', 'Scientific check on Codex advice', 'Design-only question', 'Illegal ask'], 'Scientific check on Codex advice'),
          q('Logging at boundaries helps because:', ['It always slows forever', 'You see where values go wrong', 'It replaces tests', 'It encrypts errors'], 'You see where values go wrong'),
          q('If Codex suggests an API that does not exist:', ['Trust it', 'Verify against docs/types', 'Ship it', 'Ban TypeScript'], 'Verify against docs/types'),
          q('A good fix PR description includes:', ['Root cause and test plan', 'Only “fixed”', 'Memes only', 'Secrets'], 'Root cause and test plan'),
        ],
      },
      {
        title: 'Feature Delivery: Plan → PR → Polish',
        duration: 40,
        intro:
          'Ship with Codex across a full loop: clarify user story, spike interfaces, implement behind small commits, write tests, update docs, and self-review with a checklist (security, a11y basics, performance obvious wins). Ask Codex for a PR summary from the diff.',
        practice: [
          q('A user story should capture:', ['Only fonts', 'Who, need, and why it matters', 'Server IPs', 'Git hooks only'], 'Who, need, and why it matters'),
          q('Small commits help:', ['Hide history', 'Review and revert cleanly', 'Break bisect', 'Skip tests'], 'Review and revert cleanly'),
          q('Self-review checklists catch:', ['Nothing useful', 'Common misses before human review', 'Only spelling', 'CI badges'], 'Common misses before human review'),
          q('PR summaries from diffs should emphasize:', ['Behavior change and risk', 'Only file counts', 'Emojis', 'Secrets'], 'Behavior change and risk'),
          q('Docs updates belong with:', ['A later mystery PR', 'The feature that changed behavior', 'Never', 'Only design'], 'The feature that changed behavior'),
        ],
        project: {
          title: 'Ship Pack',
          description:
            'Deliver a mini feature pack for “remember last search query”: user story, 3 Codex prompts (API, UI hook, tests), PR description outline, and rollback plan.',
        },
        assessment: [
          q('Rollback plans matter when:', ['Changes never fail', 'You need a safe undo path', 'Git is unused', 'Only for design'], 'You need a safe undo path'),
          q('Security basics in review include:', ['Ignoring inputs', 'Validating untrusted input and secrets handling', 'Hardcoding tokens', 'Disabling HTTPS'], 'Validating untrusted input and secrets handling'),
          q('Asking Codex for edge cases before merge can:', ['Only waste time', 'Reveal missed product behaviors', 'Replace QA entirely', 'Break git'], 'Reveal missed product behaviors'),
          q('Performance “obvious wins” might include:', ['N+1 calls you introduced', 'Random micro-opts everywhere', 'Deleting indexes blindly', 'Ignoring profiles'], 'N+1 calls you introduced'),
          q('A done feature includes:', ['Code, tests, and communicated change', 'Only local hacks', 'No review', 'Force push'], 'Code, tests, and communicated change'),
        ],
      },
    ],
  },

  // ─── 2. ANTIGRAVITY ───────────────────────────────────────
  {
    id: 'masters-antigravity',
    title: 'Antigravity Masters Class',
    description:
      'Full Antigravity mastery: agent briefs, workspace context, multi-step missions, review discipline, session systems, and team-ready AI development habits.',
    color: '1B4F72',
    short: 'Antigravity',
    category: 'programming',
    lessons: [
      {
        title: 'Antigravity as an Agent Workspace',
        duration: 25,
        intro:
          'Antigravity is built for agentic coding: the environment carries project context so agents can propose edits with awareness of your files and goals. Your job is to define missions, constrain blast radius, and enforce review. Chatbots answer; agents attempt work—you still approve.',
        practice: [
          q('Antigravity is best described as:', ['A spreadsheet', 'An AI-assisted agent development environment', 'A printer utility', 'A music DAW'], 'An AI-assisted agent development environment'),
          q('Agents differ from plain chat mainly by:', ['Being slower always', 'Acting on tasks in your workspace with context', 'Ignoring files', 'Only drawing'], 'Acting on tasks in your workspace with context'),
          q('Blast radius means:', ['Font size', 'How much of the system a change can affect', 'Wi-Fi range', 'Build time only'], 'How much of the system a change can affect'),
          q('Approval gates exist to:', ['Slow learning forever', 'Prevent unreviewed harmful edits', 'Ban agents', 'Delete logs'], 'Prevent unreviewed harmful edits'),
          q('Project context improves agents by:', ['Hiding goals', 'Grounding actions in real files and conventions', 'Removing types', 'Skipping git'], 'Grounding actions in real files and conventions'),
        ],
        project: {
          title: 'Environment Map',
          description:
            'Document your ideal Antigravity workspace map: key folders, forbidden paths, coding standards link, and how you want agents to open PRs or diffs.',
        },
        assessment: [
          q('You should treat agent patches as:', ['Auto-merged truth', 'Proposals under review', 'Unreadable', 'Final forever'], 'Proposals under review'),
          q('Clear missions reduce:', ['All speed', 'Wandering edits and scope creep', 'Need for tests', 'Documentation'], 'Wandering edits and scope creep'),
          q('Forbidden paths protect:', ['Nothing', 'Secrets, infra, or fragile modules', 'Only README', 'CSS'], 'Secrets, infra, or fragile modules'),
          q('Conventions files help agents:', ['Ignore style', 'Match team patterns', 'Delete lint', 'Skip naming'], 'Match team patterns'),
          q('Without review discipline, agents can:', ['Only help', 'Introduce subtle breakages at scale', 'Replace CI', 'Fix prod magically'], 'Introduce subtle breakages at scale'),
        ],
      },
      {
        title: 'Writing Agent Briefs that Ship',
        duration: 30,
        intro:
          'A strong agent brief has: objective, non-goals, acceptance tests, allowed files, reference examples, and definition of done. Include “stop and ask” conditions. Prefer checkable outcomes over vibes. Briefs are the product spec for autonomous work.',
        practice: [
          q('Non-goals help by:', ['Expanding scope', 'Preventing unwanted work', 'Hiding acceptance', 'Removing tests'], 'Preventing unwanted work'),
          q('Acceptance tests in a brief should be:', ['Vague', 'Observable and checkable', 'Secret', 'Only visual'], 'Observable and checkable'),
          q('“Stop and ask” conditions trigger when:', ['Everything is fine', 'Uncertainty or risk is high', 'Tests pass', 'Files are small'], 'Uncertainty or risk is high'),
          q('Allowed files constrain:', ['Nothing', 'Where the agent may edit', 'Only commits', 'DNS'], 'Where the agent may edit'),
          q('Reference examples show:', ['Passwords', 'The pattern of good output', 'Random noise', 'Prod keys'], 'The pattern of good output'),
        ],
        project: {
          title: 'Brief: Dark Mode Toggle',
          description:
            'Write a complete agent brief for adding a dark-mode toggle: objective, non-goals, files, acceptance checks, stop conditions, and rollback notes.',
        },
        assessment: [
          q('Definition of done should include:', ['Only “looks ok”', 'Behavior, tests, and docs touchpoints', 'Force push', 'No review'], 'Behavior, tests, and docs touchpoints'),
          q('Ambiguous briefs usually produce:', ['Perfect PRs', 'Misaligned changes', 'Faster CI always', 'No diffs'], 'Misaligned changes'),
          q('Including current UX copy helps agents:', ['Invent brand voice wrongly less often', 'Skip UI', 'Break a11y more', 'Ignore i18n always'], 'Invent brand voice wrongly less often'),
          q('Rollback notes prepare you for:', ['Success only', 'Quick undo if the change fails', 'Deleting git', 'Skipping QA'], 'Quick undo if the change fails'),
          q('Checkable outcomes beat vibes because:', ['Vibes are measurable', 'Teams can agree when it is finished', 'Agents hate clarity', 'CI bans them'], 'Teams can agree when it is finished'),
        ],
      },
      {
        title: 'Context Engineering for Agents',
        duration: 30,
        intro:
          'Feed the smallest sufficient context: interfaces, failing tests, error logs, and adjacent modules—not the whole monorepo. Maintain a living “project card” (stack, commands, conventions). Refresh context when the agent drifts.',
        practice: [
          q('Smallest sufficient context means:', ['No files', 'Only what is needed to act correctly', 'Entire git history always', 'Only images'], 'Only what is needed to act correctly'),
          q('A project card might include:', ['Stack, scripts, and conventions', 'Bank logins', 'Only jokes', 'Private keys'], 'Stack, scripts, and conventions'),
          q('Failing tests are high-signal context because:', ['They confuse agents', 'They specify broken behavior precisely', 'They hide bugs', 'They replace specs'], 'They specify broken behavior precisely'),
          q('When an agent drifts you should:', ['Ignore it', 'Re-state goal and refresh relevant context', 'Delete the repo', 'Disable review'], 'Re-state goal and refresh relevant context'),
          q('Too much unrelated context often causes:', ['Perfect focus', 'Distracted or wrong edits', 'Faster builds', 'Better security'], 'Distracted or wrong edits'),
        ],
        project: {
          title: 'Project Card v1',
          description:
            'Create a one-screen project card for a sample Next.js app: stack, run/test commands, folder map, coding rules, and top 5 agent pitfalls to avoid.',
        },
        assessment: [
          q('Adjacent modules matter when:', ['Changes touch shared contracts', 'You edit unrelated docs only', 'Offline forever', 'No APIs exist'], 'Changes touch shared contracts'),
          q('Error logs should be:', ['Stripped of secrets then shared', 'Pasted with tokens included', 'Ignored', 'Deleted first'], 'Stripped of secrets then shared'),
          q('Living docs beat stale README myths because:', ['Agents prefer lies', 'Agents act on what you maintain', 'Git bans README', 'CI deletes docs'], 'Agents act on what you maintain'),
          q('Interface snippets help agents:', ['Guess public APIs less', 'Ignore types', 'Skip tests', 'Rewrite CSS only'], 'Guess public APIs less'),
          q('Context refresh is part of:', ['Giving up', 'Session hygiene', 'Deleting history', 'Avoiding goals'], 'Session hygiene'),
        ],
      },
      {
        title: 'Multi-Step Missions and Orchestration',
        duration: 35,
        intro:
          'Break epics into missions with dependencies: spike → implement → test → polish. Run one mission at a time unless you have isolation. Require artifacts at each gate (plan.md, diff, test output). Parallelize only independent workstreams.',
        practice: [
          q('Missions with dependencies should run:', ['All at once always', 'In order of prerequisites', 'Randomly', 'Never'], 'In order of prerequisites'),
          q('Gate artifacts prove:', ['Nothing', 'A stage actually finished', 'Only design', 'Wi-Fi speed'], 'A stage actually finished'),
          q('Parallel agent work is safer when streams are:', ['Tightly coupled', 'Independent', 'Editing the same file', 'Unreviewed'], 'Independent'),
          q('A spike mission is for:', ['Final polish only', 'Learning unknowns cheaply', 'Deleting tests', 'Prod deploys'], 'Learning unknowns cheaply'),
          q('Orchestration means:', ['Random chatting', 'Sequencing agent work toward an outcome', 'Only UI animation', 'Ignoring deps'], 'Sequencing agent work toward an outcome'),
        ],
        project: {
          title: 'Mission Board',
          description:
            'Design a 4-mission board to add search to a notes app: Spike, API, UI, Hardening. List dependencies, artifacts, and owner (you vs agent) per mission.',
        },
        assessment: [
          q('Skipping the spike often causes:', ['Cheaper delivery', 'Expensive wrong implementation', 'Perfect APIs', 'No bugs'], 'Expensive wrong implementation'),
          q('Test output as a gate ensures:', ['Docs only', 'Behavior evidence before polish', 'Faster ignore', 'No CI'], 'Behavior evidence before polish'),
          q('Coupled parallel edits risk:', ['Clean merges always', 'Conflict and inconsistent design', 'Better a11y', 'Auto docs'], 'Conflict and inconsistent design'),
          q('You remain the orchestrator because:', ['Agents own product', 'You set priorities and quality bars', 'Git commits itself', 'QA is optional'], 'You set priorities and quality bars'),
          q('Polish missions should not:', ['Rewrite architecture casually', 'Fix copy and small UX', 'Add tests', 'Update changelog'], 'Rewrite architecture casually'),
        ],
      },
      {
        title: 'Review Discipline: Diffs, Risks, Rollbacks',
        duration: 35,
        intro:
          'Read every agent diff like a PR from a new teammate. Check intent vs brief, security, data handling, and test gaps. Require agents to summarize risk and rollback. Reject “drive-by” refactors. Keep an allowlist of auto-apply for trivial edits only.',
        practice: [
          q('Drive-by refactors in feature diffs are:', ['Always welcome', 'Usually harmful to review focus', 'Required', 'Safer than tests'], 'Usually harmful to review focus'),
          q('Risk summaries should call out:', ['Only file count', 'User impact and failure modes', 'Emojis', 'Font choices'], 'User impact and failure modes'),
          q('Auto-apply allowlists should cover:', ['Prod migrations', 'Trivial safe edits you define', 'Secret rotation', 'Everything'], 'Trivial safe edits you define'),
          q('Security review includes:', ['Ignoring auth', 'Authz, injection, and secret leakage', 'Only CSS', 'Deleting HTTPS'], 'Authz, injection, and secret leakage'),
          q('Rollback clarity answers:', ['How to undo safely', 'How to force push', 'How to hide logs', 'How to skip QA'], 'How to undo safely'),
        ],
        project: {
          title: 'Diff Review Scorecard',
          description:
            'Build a 10-item scorecard for agent PRs (brief match, tests, security, scope, rollback, etc.). Score a fictional messy diff and write the reject message.',
        },
        assessment: [
          q('Intent vs brief checks catch:', ['Perfect alignment only', 'Agents solving the wrong problem', 'Only typos', 'CI flakes'], 'Agents solving the wrong problem'),
          q('Test gaps mean:', ['Ship faster always', 'Unknown broken paths', 'No users', 'Better UX'], 'Unknown broken paths'),
          q('Rejecting bad diffs teaches agents/sessions to:', ['Ignore quality', 'Align to your bar next iteration', 'Delete briefs', 'Skip context'], 'Align to your bar next iteration'),
          q('Data handling review asks:', ['Where PII goes and how it is stored', 'Only button colors', 'Only latency', 'Nothing'], 'Where PII goes and how it is stored'),
          q('Trivial auto-apply still needs:', ['Zero policy', 'Boundaries and auditability', 'Prod access', 'No logs'], 'Boundaries and auditability'),
        ],
      },
      {
        title: 'Session Systems and Team Playbooks',
        duration: 40,
        intro:
          'Turn personal wins into team playbooks: brief templates, project cards, review scorecards, and “when to use an agent vs do it yourself.” Log session retros. Standardize class codes of conduct for AI edits so velocity does not erase craft.',
        practice: [
          q('Playbooks help teams by:', ['Hiding knowledge', 'Making good habits repeatable', 'Banning agents', 'Deleting docs'], 'Making good habits repeatable'),
          q('A session retro should capture:', ['Only vibes', 'What worked, failed, and next experiment', 'Secrets', 'Nothing'], 'What worked, failed, and next experiment'),
          q('DIY vs agent decision depends on:', ['Mood only', 'Risk, novelty, and review cost', 'Font size', 'Coffee'], 'Risk, novelty, and review cost'),
          q('Craft standards exist so:', ['Speed erases quality', 'Speed serves quality bars', 'Agents own product', 'Tests disappear'], 'Speed serves quality bars'),
          q('Shared templates reduce:', ['Consistency', 'Onboarding time for new teammates', 'Clarity', 'Review quality'], 'Onboarding time for new teammates'),
        ],
        project: {
          title: 'Team Antigravity Playbook',
          description:
            'Write a 1–2 page playbook: brief template link, project card outline, review scorecard, DIY/agent rubric, and a weekly retro agenda.',
        },
        assessment: [
          q('Without playbooks, AI usage becomes:', ['Uniformly excellent', 'Inconsistent and risky', 'Automatically safe', 'Self-documenting'], 'Inconsistent and risky'),
          q('Logging experiments helps:', ['Nobody', 'Compound learning across sessions', 'Delete history', 'Skip reviews'], 'Compound learning across sessions'),
          q('High-risk tasks should lean:', ['Fully autonomous always', 'Human-led with narrow agent assists', 'No tests', 'Secret sharing'], 'Human-led with narrow agent assists'),
          q('Playbooks should evolve when:', ['Never', 'Retros show repeated failures or wins', 'Only on Fridays', 'Agents demand it'], 'Retros show repeated failures or wins'),
          q('The end goal of Antigravity mastery is:', ['Zero human thought', 'Reliable leverage with strong judgment', 'Deleting code review', 'Shipping unbroken'], 'Reliable leverage with strong judgment'),
        ],
      },
    ],
  },
  // ─── 3. CLAUDE ────────────────────────────────────────────
  {
    id: 'masters-claude',
    title: 'Claude Masters Class',
    description:
      'A full Claude apprenticeship: long-context reasoning, structured prompting, research synthesis, writing systems, analysis workflows, and shipping reliable knowledge work end to end.',
    color: 'D97706',
    short: 'Claude',
    lessons: [
      {
        title: 'Claude Strengths and Working Modes',
        duration: 25,
        intro:
          'Claude excels at careful reasoning, long documents, rewriting with voice control, and turning messy notes into structured plans. Treat it as a senior analyst who still needs your judgment on facts, taste, and risk. Choose modes deliberately: brainstorm, critique, draft, or extract. This apprenticeship builds end-to-end habits for research, writing, and decision support—not one-off chat tricks.',
        practice: [
          q('Claude is especially strong at:', ['Hardware repair', 'Reasoning, writing, and long-context analysis', 'Baking bread', 'Network cabling'], 'Reasoning, writing, and long-context analysis'),
          q('Steering tone means:', ['Changing your keyboard', 'Asking for a specific style of response', 'Muting speakers', 'Closing the tab'], 'Asking for a specific style of response'),
          q('You remain responsible for:', ['Nothing once Claude replies', 'Facts, decisions, and final quality', 'Only punctuation', 'Only file names'], 'Facts, decisions, and final quality'),
          q('A deliberate working mode helps because:', ['Modes confuse models', 'It sets expectation for brainstorm vs draft vs critique', 'It deletes context', 'It bans structure'], 'It sets expectation for brainstorm vs draft vs critique'),
          q('Long context is most useful when:', ['You paste unrelated noise', 'Source material must stay coherent in one pass', 'You avoid goals', 'You skip review'], 'Source material must stay coherent in one pass'),
        ],
        project: {
          title: 'Mode Menu',
          description:
            'Build a one-page Claude “mode menu” for your work: brainstorm, outline, draft, critique, and extract. For each mode write a 4-line starter prompt plus when you should not use that mode.',
        },
        assessment: [
          q('Blindly trusting Claude summaries risks:', ['Perfect accuracy always', 'Subtle factual or framing errors', 'Faster fonts', 'Better Wi-Fi'], 'Subtle factual or framing errors'),
          q('Voice control in prompts should specify:', ['Audience, tone, and length', 'Only emojis', 'Server IPs', 'Nothing'], 'Audience, tone, and length'),
          q('Critique mode is best when:', ['You need cheerleading only', 'You want stress-tests of an existing draft', 'You have no draft', 'You ban feedback'], 'You want stress-tests of an existing draft'),
          q('Extract mode should demand:', ['Vague vibes', 'Fields, quotes, and source anchors', 'Only jokes', 'Deleted citations'], 'Fields, quotes, and source anchors'),
          q('Masters-level Claude use means:', ['One lucky prompt', 'Repeatable workflows with review gates', 'Skipping judgment', 'Chat only forever'], 'Repeatable workflows with review gates'),
        ],
      },
      {
        title: 'Structured Prompting and Output Contracts',
        duration: 30,
        intro:
          'High-yield Claude prompts declare role, goal, inputs, constraints, and an output contract (sections, bullets, JSON-like fields, or tables). Ask Claude to list assumptions before answering when stakes are high. Prefer checkable formats over free prose when the result feeds another step.',
        practice: [
          q('An output contract tells Claude:', ['To ignore structure', 'Exactly how to shape the answer', 'To invent secrets', 'To skip goals'], 'Exactly how to shape the answer'),
          q('Listing assumptions helps you:', ['Hide uncertainty', 'Surface gaps before acting on advice', 'Delete sources', 'Avoid review'], 'Surface gaps before acting on advice'),
          q('Role framing is useful when:', ['It replaces facts', 'It sets expertise and perspective', 'It bans constraints', 'It removes audience'], 'It sets expertise and perspective'),
          q('Checkable formats beat free prose when:', ['Nothing follows the answer', 'Another human or tool must reuse the result', 'You hate tables', 'Stakes are zero'], 'Another human or tool must reuse the result'),
          q('Constraints might include:', ['Length, must-cite, forbidden claims', 'Only “be creative” forever', 'Passwords', 'Random slang'], 'Length, must-cite, forbidden claims'),
        ],
        project: {
          title: 'Contract Pack',
          description:
            'Write three Claude prompts with strict output contracts: (1) meeting-notes → action table, (2) article → claim/evidence/gap list, (3) product idea → risks/assumptions/next experiments. Include stop conditions if inputs are incomplete.',
          code: {
            language: 'markdown',
            starterCode:
              '# Claude Output Contracts\n\n## 1) Meeting notes → actions\nGOAL:\nINPUT:\nCONSTRAINTS:\nOUTPUT COLUMNS: Owner | Action | Due | Blocker\n\n## 2) Article → claim/evidence/gap\n...\n\n## 3) Idea → risks/assumptions/experiments\n...\n',
            enablePreview: false,
            enableConsole: false,
          },
        },
        assessment: [
          q('Missing constraints usually produce:', ['Perfectly scoped answers', 'Overlong or off-brief outputs', 'Guaranteed citations', 'No creativity'], 'Overlong or off-brief outputs'),
          q('“If input is incomplete, ask questions first” is a:', ['Stop condition', 'Deploy key', 'Theme color', 'Font rule'], 'Stop condition'),
          q('JSON-like fields help when:', ['You need parseable structure', 'You only want poetry', 'You ban lists', 'You hide owners'], 'You need parseable structure'),
          q('Role + goal without inputs often yields:', ['Grounded work', 'Generic advice', 'Perfect quotes', 'Verified data'], 'Generic advice'),
          q('Reusable prompt templates should leave placeholders for:', ['GOAL, INPUTS, CONSTRAINTS, FORMAT', 'Only emojis', 'Secrets', 'Nothing'], 'GOAL, INPUTS, CONSTRAINTS, FORMAT'),
        ],
      },
      {
        title: 'Long-Context Research and Synthesis',
        duration: 35,
        intro:
          'Paste or attach source packs with clear labels. Ask Claude to separate facts, inferences, and open questions. Demand quote anchors and contradiction flags. Synthesis is not summary theater—it should produce decisions, options, or a brief you can defend.',
        practice: [
          q('Labeling sources helps Claude:', ['Confuse citations', 'Attribute claims to the right document', 'Delete quotes', 'Ignore dates'], 'Attribute claims to the right document'),
          q('Separating facts vs inferences prevents:', ['Clear thinking', 'Treating guesses as proven', 'Good briefs', 'Useful questions'], 'Treating guesses as proven'),
          q('Contradiction flags matter because:', ['Sources never disagree', 'Conflicts change what you can claim', 'They slow fonts', 'They ban research'], 'Conflicts change what you can claim'),
          q('A defendable brief includes:', ['Only vibes', 'Claims, evidence, and remaining unknowns', 'No sources', 'Only slogans'], 'Claims, evidence, and remaining unknowns'),
          q('Open questions should drive:', ['Ignoring gaps', 'Follow-up research or experiments', 'Deleting the pack', 'Skipping review'], 'Follow-up research or experiments'),
        ],
        project: {
          title: 'Source Pack Brief',
          description:
            'Assemble a fictional 3-source pack (product review, competitor note, user interview excerpt). Prompt Claude for a synthesis brief with facts / inferences / contradictions / recommended next step. Manually mark any invented details.',
        },
        assessment: [
          q('Quote anchors let you:', ['Skip reading forever', 'Verify Claude against the source', 'Encrypt PDFs', 'Ban research'], 'Verify Claude against the source'),
          q('Summary theater means:', ['Pretty text without decision value', 'Actionable options', 'Cited risks', 'Clear owners'], 'Pretty text without decision value'),
          q('When sources conflict you should:', ['Pick randomly', 'Surface the conflict and criteria to resolve it', 'Hide it', 'Delete dates'], 'Surface the conflict and criteria to resolve it'),
          q('Long-context dumps without a question usually produce:', ['Focused decisions', 'Diffuse summaries', 'Perfect experiments', 'No fluff'], 'Diffuse summaries'),
          q('Your review pass should hunt for:', ['Hallucinated specifics and missing caveats', 'Only typos', 'Only fonts', 'Nothing'], 'Hallucinated specifics and missing caveats'),
        ],
      },
      {
        title: 'Writing Systems: Draft, Rewrite, Edit',
        duration: 35,
        intro:
          'Build a writing pipeline: outline → ugly draft → structural edit → line edit → voice pass. Give Claude the audience, CTA, and forbidden phrases. Ask for diffs of changes (“what you tightened and why”) so you learn patterns instead of outsourcing taste forever.',
        practice: [
          q('An ugly draft is valuable because:', ['It must ship as-is', 'It unlocks structure before polish', 'It bans outlines', 'It skips audience'], 'It unlocks structure before polish'),
          q('Structural edits focus on:', ['Comma alone', 'Order, argument, and section purpose', 'Only synonyms', 'Only kerning'], 'Order, argument, and section purpose'),
          q('Forbidden phrases protect:', ['Nothing', 'Brand voice and clarity', 'Only SEO spam forever', 'Secrets in copy'], 'Brand voice and clarity'),
          q('Asking for “what changed and why” builds:', ['Dependency', 'Your editorial judgment over time', 'Longer fluff', 'Weaker CTAs'], 'Your editorial judgment over time'),
          q('Voice passes should happen:', ['Before you know the audience', 'After structure is sound', 'Instead of facts', 'Without a CTA'], 'After structure is sound'),
        ],
        project: {
          title: 'Five-Pass Editorial',
          description:
            'Take a rough 250-word announcement. Run Claude through outline, draft repair, structural edit, line edit, and voice pass. Keep a changelog of instructions you gave at each pass.',
        },
        assessment: [
          q('Polishing before structure often causes:', ['Cleaner logic', 'Shiny prose on a weak argument', 'Better CTAs always', 'Fewer revisions'], 'Shiny prose on a weak argument'),
          q('Audience + CTA in the prompt reduce:', ['Relevance', 'Generic motivational fluff', 'Clarity', 'Usefulness'], 'Generic motivational fluff'),
          q('Line edits primarily fix:', ['Macro outline', 'Clarity, rhythm, and precision at sentence level', 'Product strategy', 'Research plans'], 'Clarity, rhythm, and precision at sentence level'),
          q('You should reject Claude rewrites that:', ['Improve clarity', 'Change meaning without flagging it', 'Shorten fluff', 'Match voice'], 'Change meaning without flagging it'),
          q('A writing system is masters-level when:', ['Each chat is unique chaos', 'Stages and prompts are reusable', 'You never edit', 'You skip review'], 'Stages and prompts are reusable'),
        ],
      },
      {
        title: 'Analysis Workflows and Decision Memos',
        duration: 35,
        intro:
          'Use Claude to pressure-test options: criteria, tradeoffs, second-order effects, and kill criteria. Demand a decision memo format stakeholders can skim. Separate recommendation from confidence and from what would change your mind.',
        practice: [
          q('Kill criteria tell you:', ['When to celebrate only', 'When an option should be abandoned', 'Only brand colors', 'DNS settings'], 'When an option should be abandoned'),
          q('Second-order effects are:', ['Immediate outputs only', 'Knock-on consequences after the first change', 'Font metrics', 'Quiz scores'], 'Knock-on consequences after the first change'),
          q('Confidence should be:', ['Hidden', 'Stated separately from the recommendation', 'Always 100%', 'Only a vibe'], 'Stated separately from the recommendation'),
          q('“What would change your mind?” improves:', ['Stubbornness', 'Falsifiability of the advice', 'Slogan length', 'Emoji count'], 'Falsifiability of the advice'),
          q('Tradeoff tables beat paragraphs when:', ['Comparing options on shared criteria', 'Writing poetry', 'Hiding risks', 'Skipping owners'], 'Comparing options on shared criteria'),
        ],
        project: {
          title: 'Decision Memo Drill',
          description:
            'Prompt Claude to compare three launch channel options for a course promo. Require criteria weights, tradeoff table, recommendation, confidence, kill criteria, and a 7-day experiment plan.',
        },
        assessment: [
          q('Stakeholders skim best when memos lead with:', ['Raw chat logs', 'Recommendation and why it matters', 'Only appendices', 'Secret links'], 'Recommendation and why it matters'),
          q('Unweighted criteria lists often:', ['Clarify priorities', 'Hide that not all factors matter equally', 'Guarantee consensus', 'Replace data'], 'Hide that not all factors matter equally'),
          q('Analysis without next actions is:', ['Complete', 'Incomplete for operators', 'Ideal forever', 'A deploy plan'], 'Incomplete for operators'),
          q('Claude’s role in decisions is to:', ['Own the call alone', 'Structure reasoning you still own', 'Replace accountability', 'Hide uncertainty'], 'Structure reasoning you still own'),
          q('Good kill criteria are:', ['Vague feelings', 'Observable thresholds', 'Secret forever', 'Only aesthetic'], 'Observable thresholds'),
        ],
      },
      {
        title: 'Projects, Artifacts, and Team Reuse',
        duration: 40,
        intro:
          'Turn winning Claude chats into team artifacts: prompt libraries, checklists, memo templates, and review rubrics. Version them. Teach teammates when Claude is leverage vs when human research is required. Masters craft is institutional, not personal folklore.',
        practice: [
          q('Prompt libraries help teams:', ['Forget wins', 'Reuse patterns that worked', 'Ban structure', 'Hide templates'], 'Reuse patterns that worked'),
          q('Versioning artifacts matters because:', ['Prompts never improve', 'Tools and norms change over time', 'Git forbids docs', 'Nobody reads'], 'Tools and norms change over time'),
          q('Human research is required when:', ['Stakes and novelty are high or sources are thin', 'Always never', 'Only for fonts', 'Claude feels confident'], 'Stakes and novelty are high or sources are thin'),
          q('Review rubrics catch:', ['Only praise', 'Common failure modes before shipping', 'Only typos', 'Wi-Fi issues'], 'Common failure modes before shipping'),
          q('Institutional craft means:', ['One hero user', 'Shared standards others can run', 'Secret prompts only', 'No retros'], 'Shared standards others can run'),
        ],
        project: {
          title: 'Claude Team Kit',
          description:
            'Ship a mini kit: 5 annotated prompts, one decision-memo template, one synthesis checklist, and a short “use Claude / don’t use Claude” rubric for your team.',
        },
        assessment: [
          q('Personal folklore fails teams because:', ['It scales perfectly', 'Knowledge dies in private chats', 'It is always documented', 'It replaces onboarding'], 'Knowledge dies in private chats'),
          q('Annotated prompts should explain:', ['Only the text', 'When to use them and failure modes', 'Bank PINs', 'Nothing'], 'When to use them and failure modes'),
          q('A checklist before sending Claude output should include:', ['Source check and claim intensity', 'Only spellcheck', 'Force publish', 'Skip owners'], 'Source check and claim intensity'),
          q('Retros on AI workflows should capture:', ['Only vibes', 'What saved time and what created risk', 'Secrets', 'Nothing'], 'What saved time and what created risk'),
          q('End-to-end Claude mastery looks like:', ['Random chats', 'Reliable pipelines from intake to reviewed artifact', 'No templates', 'Zero judgment'], 'Reliable pipelines from intake to reviewed artifact'),
        ],
      },
    ],
  },

  // ─── 4. PERPLEXITY ────────────────────────────────────────
  {
    id: 'masters-perplexity',
    title: 'Perplexity Masters Class',
    description:
      'A full Perplexity apprenticeship: cited research loops, source triage, claim verification, note systems, brief writing, and turning web answers into trustworthy decisions end to end.',
    color: '20808D',
    short: 'Perplexity',
    lessons: [
      {
        title: 'Perplexity as a Research Copilot',
        duration: 25,
        intro:
          'Perplexity shines when you need answers grounded in current web sources with citations you can open. It is not a substitute for reading primary material on high-stakes claims. Your apprenticeship goal is a repeatable research loop: question → sources → triage → notes → brief—not screenshotting the first answer.',
        practice: [
          q('Perplexity’s main advantage is:', ['Offline CAD', 'Cited answers from web sources you can inspect', 'Hardware drivers', 'Music mixing'], 'Cited answers from web sources you can inspect'),
          q('High-stakes claims require:', ['Blind trust', 'Opening and evaluating primary sources', 'Only AI summaries', 'Ignoring dates'], 'Opening and evaluating primary sources'),
          q('A research loop should end in:', ['A random tab', 'Notes or a brief you can defend', 'Only a chat screenshot', 'Deleted citations'], 'Notes or a brief you can defend'),
          q('First-answer screenshots are weak because:', ['They always cite perfectly', 'They skip triage and verification', 'They are archival gold', 'They replace reading'], 'They skip triage and verification'),
          q('You use Perplexity best as:', ['An oracle', 'A copilot that accelerates sourcing', 'A lawyer replacement', 'A bank'], 'A copilot that accelerates sourcing'),
        ],
        project: {
          title: 'Research Loop Card',
          description:
            'Write a one-page research loop card for your domain: question types Perplexity is great for, red-flag topics that need primary docs, and your mandatory verification steps before sharing answers.',
        },
        assessment: [
          q('Citations matter because they let you:', ['Skip URLs', 'Audit where claims came from', 'Hide bias', 'Ban dates'], 'Audit where claims came from'),
          q('Copilot framing emphasizes:', ['Zero responsibility', 'Human judgment over AI speed', 'Auto-publish', 'No notes'], 'Human judgment over AI speed'),
          q('Current web grounding helps most for:', ['Timely facts and landscape scans', 'Timeless pure math proofs only', 'Local files only', 'Passwords'], 'Timely facts and landscape scans'),
          q('Sharing unverified AI answers risks:', ['Nothing', 'Spreading errors with false confidence', 'Better ethics', 'Stronger trust'], 'Spreading errors with false confidence'),
          q('Masters research habit #1 is:', ['Stop at answer one', 'Inspect sources before trusting', 'Delete questions', 'Ignore conflicts'], 'Inspect sources before trusting'),
        ],
      },
      {
        title: 'Query Design for Better Sources',
        duration: 30,
        intro:
          'Sharp queries name the entity, timeframe, geography, and desired evidence type (stats, docs, reviews, papers). Use follow-ups to narrow. Ask for contrasting viewpoints when the topic is contested. Bad queries get SEO sludge; good queries invite primary-ish sources.',
        practice: [
          q('Timeframe in queries reduces:', ['Relevance', 'Outdated hits dominating the answer', 'All results', 'Citations'], 'Outdated hits dominating the answer'),
          q('Evidence-type cues help Perplexity:', ['Ignore sources', 'Prefer the kind of material you need', 'Only invent stats', 'Skip entities'], 'Prefer the kind of material you need'),
          q('Contested topics need:', ['One blog only', 'Contrasting viewpoints on purpose', 'No dates', 'No follow-ups'], 'Contrasting viewpoints on purpose'),
          q('Entity naming improves:', ['Vague celebrity gossip only', 'Disambiguation of who/what you mean', 'Random SEO', 'Hidden URLs'], 'Disambiguation of who/what you mean'),
          q('Follow-ups are for:', ['Starting over always', 'Narrowing scope with what you learned', 'Deleting citations', 'Avoiding sources'], 'Narrowing scope with what you learned'),
        ],
        project: {
          title: 'Query Ladder',
          description:
            'Pick a product or policy question. Write a 5-step query ladder from broad landscape to specific verification asks. Note which step should produce primary sources vs secondary commentary.',
        },
        assessment: [
          q('SEO sludge often appears when queries are:', ['Precise and constrained', 'Vague and hype-heavy', 'Dated carefully', 'Entity-specific'], 'Vague and hype-heavy'),
          q('Geography matters when:', ['Laws, markets, or availability differ by place', 'Physics constants change by city', 'Never', 'Only for fonts'], 'Laws, markets, or availability differ by place'),
          q('Asking “according to official docs” biases toward:', ['Memes', 'Primary documentation when available', 'Rumors only', 'No links'], 'Primary documentation when available'),
          q('A weak follow-up looks like:', ['“Compare the two sources’ methods”', '“Tell me more” with no target', '“Extract numbers into a table”', '“Flag conflicts”'], '“Tell me more” with no target'),
          q('Query design is part of:', ['Luck', 'Research craft you can teach', 'Only coding', 'Design tools only'], 'Research craft you can teach'),
        ],
      },
      {
        title: 'Source Triage and Credibility',
        duration: 30,
        intro:
          'Not all citations are equal. Triage by primary vs secondary, date, author incentives, and methodological clarity. Prefer official docs, papers, and reputable reporting for hard claims. Use Perplexity to gather candidates—then you rank them.',
        practice: [
          q('Primary sources are generally:', ['Always wrong', 'Closer to original evidence or documentation', 'Only tweets', 'Never useful'], 'Closer to original evidence or documentation'),
          q('Author incentives matter because:', ['Nobody has bias', 'Motivation can skew framing and selection', 'Dates fix bias', 'URLs remove bias'], 'Motivation can skew framing and selection'),
          q('Old citations on fast-moving topics are:', ['Always best', 'Suspect until confirmed current', 'Required', 'Equal to new'], 'Suspect until confirmed current'),
          q('Method clarity helps you judge:', ['Font choice', 'Whether a statistic is trustworthy', 'Only headlines', 'Ad color'], 'Whether a statistic is trustworthy'),
          q('Your ranking job exists because:', ['AI already ranked perfectly forever', 'Relevance ≠ credibility', 'Citations are fake always', 'Triage is optional'], 'Relevance ≠ credibility'),
        ],
        project: {
          title: 'Triage Scorecard',
          description:
            'Build a 8-criteria source scorecard (primary/secondary, date, incentive, method, corroboration, etc.). Score three fictional citations for a claim and write a keep/kill note for each.',
        },
        assessment: [
          q('Corroboration means:', ['One blog said it', 'Independent sources agree on the substance', 'The AI sounded sure', 'The title is long'], 'Independent sources agree on the substance'),
          q('Secondary commentary is useful for:', ['Replacing data', 'Context and interpretation after facts are checked', 'Hard numbers alone', 'Ignoring primaries'], 'Context and interpretation after facts are checked'),
          q('A press release should be treated as:', ['Neutral science', 'Interested-party communication', 'Peer review', 'Law'], 'Interested-party communication'),
          q('Paywalled or incomplete access means:', ['Claim is proven', 'You may lack full method—note the limit', 'Skip triage', 'Auto-accept'], 'You may lack full method—note the limit'),
          q('Masters triage ends with:', ['A pile of tabs', 'A short ranked source list with reasons', 'No notes', 'Only screenshots'], 'A short ranked source list with reasons'),
        ],
      },
      {
        title: 'Claim Extraction and Verification',
        duration: 35,
        intro:
          'Break answers into atomic claims. For each claim, record source, quote/paraphrase, and verification status (confirmed / contested / unsupported). This turns chat into an audit trail. Escalate contested claims to primary documents or subject experts.',
        practice: [
          q('Atomic claims are:', ['Whole essays', 'Single checkable statements', 'Only titles', 'Feelings'], 'Single checkable statements'),
          q('Unsupported means:', ['Confirmed twice', 'No adequate source backs the claim', 'Contested equally', 'Primary proven'], 'No adequate source backs the claim'),
          q('An audit trail helps when:', ['Nobody asks later', 'Someone challenges your brief', 'You delete notes', 'You ship vibes'], 'Someone challenges your brief'),
          q('Escalation is for:', ['Typos only', 'Contested or high-impact claims', 'All adjectives', 'Font size'], 'Contested or high-impact claims'),
          q('Paraphrase carefully because:', ['Meaning never shifts', 'Sloppy paraphrase invents precision', 'Quotes are illegal', 'Sources hate accuracy'], 'Sloppy paraphrase invents precision'),
        ],
        project: {
          title: 'Claim Ledger',
          description:
            'Take a Perplexity answer on a topic you know. Build a claim ledger with ≥8 rows: claim, source, status, notes. Fix or drop anything unsupported before writing a 150-word verified summary.',
        },
        assessment: [
          q('Contested status should trigger:', ['Auto-publish', 'More evidence gathering or hedging', 'Deleting the topic', 'Ignoring incentives'], 'More evidence gathering or hedging'),
          q('High-impact claims deserve:', ['Less checking', 'Stricter verification', 'Only AI confidence', 'No dates'], 'Stricter verification'),
          q('Mixing multiple claims in one sentence makes:', ['Verification easier', 'Verification harder', 'Better SEO always', 'Stronger methods'], 'Verification harder'),
          q('A verified summary may only include:', ['Confirmed or carefully hedged claims', 'Anything confident-sounding', 'Rumors', 'Unsourced numbers'], 'Confirmed or carefully hedged claims'),
          q('Claim ledgers are masters practice because they:', ['Slow thinking forever', 'Make research accountable', 'Replace curiosity', 'Ban Perplexity'], 'Make research accountable'),
        ],
      },
      {
        title: 'Notes, Briefs, and Knowledge Capture',
        duration: 35,
        intro:
          'Convert verified findings into durable notes: question, answer, sources, confidence, and next actions. Briefs for stakeholders should lead with the decision-relevant point, then evidence. Capture “what I still don’t know” so future you continues the thread.',
        practice: [
          q('Durable notes should include:', ['Only the chat UI', 'Question, answer, sources, confidence', 'Passwords', 'Only emojis'], 'Question, answer, sources, confidence'),
          q('Decision-relevant leads help readers:', ['Hunt for the point', 'Act without drowning in tabs', 'Ignore evidence', 'Skip owners'], 'Act without drowning in tabs'),
          q('“Still don’t know” sections prevent:', ['Curiosity', 'False closure', 'Good briefs', 'Follow-ups'], 'False closure'),
          q('Next actions turn research into:', ['Archive dust', 'Operational progress', 'Longer chats only', 'Deleted sources'], 'Operational progress'),
          q('Confidence labels communicate:', ['Certainty theater', 'How hard to lean on the finding', 'Font weight', 'Ad spend'], 'How hard to lean on the finding'),
        ],
        project: {
          title: 'Brief Template + Sample',
          description:
            'Design a one-page research brief template. Fill it using a real Perplexity session on a tool or market question, including ranked sources and open questions.',
        },
        assessment: [
          q('Stakeholder briefs should avoid:', ['Front-loading the answer', 'Dumping raw chat transcripts as the deliverable', 'Clear sources', 'Next steps'], 'Dumping raw chat transcripts as the deliverable'),
          q('Knowledge capture fails when notes are:', ['Searchable and sourced', 'Trapped in ephemeral chats', 'Versioned', 'Linked to actions'], 'Trapped in ephemeral chats'),
          q('Open questions belong in briefs because:', ['They look weak', 'They set honest scope for decisions', 'They ban research', 'They hide gaps'], 'They set honest scope for decisions'),
          q('Linking sources in notes enables:', ['Future audit and refresh', 'Nothing useful', 'Automatic truth', 'No rereading'], 'Future audit and refresh'),
          q('Masters capture habit is:', ['Save once, never revisit', 'Refresh notes when sources age', 'Delete confidence', 'Skip actions'], 'Refresh notes when sources age'),
        ],
      },
      {
        title: 'Research Ops for Teams',
        duration: 40,
        intro:
          'Standardize how your team asks, verifies, and files Perplexity work: query patterns, triage scorecards, claim ledgers, and brief templates. Define SLAs for “good enough” vs “publishable.” Teach juniors the difference between speed and rigor.',
        practice: [
          q('Research Ops means:', ['Random heroics', 'Shared process for asking and verifying', 'Banning tools', 'Only design'], 'Shared process for asking and verifying'),
          q('SLAs for rigor help by:', ['Forcing one speed always', 'Matching depth to decision stakes', 'Removing judgment', 'Hiding sources'], 'Matching depth to decision stakes'),
          q('Juniors need:', ['Blind copy-paste', 'Explicit verification checklists', 'No templates', 'Secret prompts only'], 'Explicit verification checklists'),
          q('Publishable bar is higher than:', ['Good-enough exploration notes', 'Peer review always', 'Primary law', 'Nothing'], 'Good-enough exploration notes'),
          q('Shared query patterns reduce:', ['Consistency', 'Repeated weak questions', 'Onboarding', 'Quality'], 'Repeated weak questions'),
        ],
        project: {
          title: 'Team Research Playbook',
          description:
            'Write a short playbook: when to use Perplexity, query ladder examples, triage scorecard link, claim-ledger rule, brief template, and a two-tier quality bar (explore vs publish).',
        },
        assessment: [
          q('Without Research Ops, teams tend to:', ['Share consistent quality', 'Produce uneven, unverifiable answers', 'Always cite primaries', 'Never ship'], 'Produce uneven, unverifiable answers'),
          q('Explore-tier work can be faster because:', ['Truth does not matter ever', 'It is explicitly labeled incomplete', 'Citations are banned', 'Stakeholders decide blindly'], 'It is explicitly labeled incomplete'),
          q('Publish-tier work must include:', ['Verification evidence', 'Only confidence theater', 'No sources', 'Hidden methods'], 'Verification evidence'),
          q('Playbooks should update when:', ['Never', 'Retros show repeated miss-ranks or outdated sources', 'Only yearly parties', 'AI demands it'], 'Retros show repeated miss-ranks or outdated sources'),
          q('End-to-end Perplexity mastery is:', ['One lucky citation', 'Trusted research throughput with auditability', 'Chat addiction', 'Skipping triage'], 'Trusted research throughput with auditability'),
        ],
      },
    ],
  },

  // ─── 5. FIGMA ─────────────────────────────────────────────
  {
    id: 'masters-figma',
    title: 'Figma Masters Class',
    description:
      'A full Figma apprenticeship: frames, layout systems, components, variants, prototyping, and handoff-ready UI craft from blank canvas to developer-ready specs.',
    color: 'A259FF',
    short: 'Figma',
    lessons: [
      {
        title: 'Figma Mindset: Structure Before Decoration',
        duration: 25,
        intro:
          'Great Figma files are systems, not artboards of one-offs. Start with frames, spacing rhythm, and hierarchy before shadows and flourishes. Name layers. Think in reusable parts. This apprenticeship trains end-to-end product UI craft—from wire to polished, handoff-ready screens.',
        practice: [
          q('You should prioritize early:', ['Random effects', 'Structure, spacing, and hierarchy', 'Only gradients', 'Export chaos'], 'Structure, spacing, and hierarchy'),
          q('Named layers help:', ['Nobody', 'You and teammates navigate the file', 'Only printers', 'Hide components'], 'You and teammates navigate the file'),
          q('One-off art without systems causes:', ['Easy handoff', 'Inconsistent UI and painful edits', 'Perfect tokens', 'Faster variants'], 'Inconsistent UI and painful edits'),
          q('Frames are for:', ['Doodles only', 'Containing layout and screen structure', 'Deleting Auto Layout', 'Hiding text'], 'Containing layout and screen structure'),
          q('Masters Figma work aims for:', ['Pretty chaos', 'Reusable, handoff-ready structure', 'No naming', 'No spacing rules'], 'Reusable, handoff-ready structure'),
        ],
        project: {
          title: 'File Hygiene Starter',
          description:
            'Create a starter file structure: Cover page, Foundations (type/color/spacing), Components, Screens, and Archive. Document naming rules for frames and layers in a sticky note on the cover.',
        },
        assessment: [
          q('Hierarchy in UI means:', ['Everything same size', 'Clear primary vs secondary content', 'Only color noise', 'No CTAs'], 'Clear primary vs secondary content'),
          q('Spacing rhythm means:', ['Random gaps', 'Consistent spacing scale across the UI', 'Only 1px everywhere', 'Ignoring alignment'], 'Consistent spacing scale across the UI'),
          q('Decorations should come:', ['Before wire structure', 'After structure reads clearly', 'Instead of type', 'Without frames'], 'After structure reads clearly'),
          q('Reusable parts mindset prepares you for:', ['More duplicate boxes', 'Components and variants', 'Deleting libraries', 'No handoff'], 'Components and variants'),
          q('Archive pages exist to:', ['Confuse developers', 'Park old explorations without cluttering active screens', 'Delete history', 'Break links'], 'Park old explorations without cluttering active screens'),
        ],
      },
      {
        title: 'Frames, Grids, and Auto Layout',
        duration: 35,
        intro:
          'Auto Layout is how modern Figma UI survives content changes. Learn direction, gap, padding, and hugging vs filling. Combine with layout grids for page rhythm. Resize like a product, not a poster: components must flex without manual nudging.',
        practice: [
          q('Auto Layout primarily controls:', ['Video codecs', 'Direction, gap, padding, and resizing behavior', 'Only shadows', 'Font licensing'], 'Direction, gap, padding, and resizing behavior'),
          q('Hugging content means:', ['Fixed forever width', 'Sizing to the content', 'Ignoring padding', 'Breaking grids'], 'Sizing to the content'),
          q('Fill container is useful when:', ['Items should expand into available space', 'Everything must be absolute', 'You ban gaps', 'Text never wraps'], 'Items should expand into available space'),
          q('Layout grids help with:', ['Random alignment', 'Consistent page columns and margins', 'Only effects', 'Export bitrate'], 'Consistent page columns and margins'),
          q('Manual nudging everywhere is a sign:', ['Of mastery', 'The layout system is missing', 'Of perfect Auto Layout', 'Of token maturity'], 'The layout system is missing'),
        ],
        project: {
          title: 'Responsive Card Row',
          description:
            'Design a card row with Auto Layout: image, title, meta, and CTA. Demonstrate hugging vs filling. Show desktop and a narrower breakpoint frame that still holds together without broken overlaps.',
        },
        assessment: [
          q('Gap vs padding:', ['Are identical', 'Gap spaces children; padding spaces inside the parent edge', 'Padding spaces children only', 'Neither matter'], 'Gap spaces children; padding spaces inside the parent edge'),
          q('Nested Auto Layout is common because:', ['UI is hierarchical', 'Figma forbids nesting', 'Grids ban it', 'Text cannot wrap'], 'UI is hierarchical'),
          q('Absolute positioning should be:', ['Default for everything', 'Used sparingly for overlays', 'Required for text', 'Used instead of frames'], 'Used sparingly for overlays'),
          q('Content changes breaking layout indicate:', ['Need for more fixed sizes only', 'Weak Auto Layout setup', 'Perfect systems', 'No grids needed'], 'Weak Auto Layout setup'),
          q('Breakpoint frames communicate:', ['Only print sizes', 'How UI adapts at key widths', 'Video length', 'API routes'], 'How UI adapts at key widths'),
        ],
      },
      {
        title: 'Typography, Color, and Foundations',
        duration: 30,
        intro:
          'Foundations are the tokens of your file: type styles, color styles, and spacing habits. Limit the palette. Define text styles for roles (display, title, body, caption). Accessibility starts here—contrast and readable sizes are not optional polish.',
        practice: [
          q('Text styles should map to:', ['Random whims', 'Roles like title/body/caption', 'Only one size ever', 'Export presets'], 'Roles like title/body/caption'),
          q('Limiting palette helps:', ['More chaos', 'Consistency and faster decisions', 'Worse brand', 'No contrast'], 'Consistency and faster decisions'),
          q('Contrast matters because:', ['Decoration only', 'People need to read the UI', 'Developers hate color', 'Grids forbid it'], 'People need to read the UI'),
          q('Foundations belong:', ['Scattered per screen', 'In a shared Foundations area/library', 'Only in Archive', 'In filenames only'], 'In a shared Foundations area/library'),
          q('Spacing habits beat:', ['Ad-hoc 7px and 13px everywhere', 'A clear scale', 'Auto Layout gaps', 'Alignment'], 'Ad-hoc 7px and 13px everywhere'),
        ],
        project: {
          title: 'Mini Design Tokens',
          description:
            'Create a foundations page: 1 color ramp (primary/neutral/danger), 4 text styles, and a spacing scale (4/8/12/16/24). Apply them to a sample settings screen without one-off overrides.',
        },
        assessment: [
          q('One-off overrides of text styles cause:', ['Easy global updates', 'Drift and hard maintenance', 'Better a11y', 'Cleaner libraries'], 'Drift and hard maintenance'),
          q('Danger color should be reserved for:', ['Decoration gradients', 'Destructive or critical states', 'All buttons', 'Backgrounds only'], 'Destructive or critical states'),
          q('Caption styles are for:', ['Hero headlines', 'Secondary supporting text', 'Only logos', 'Video titles only'], 'Secondary supporting text'),
          q('Readable body size on mobile is generally:', ['6px', 'Not tiny decorative type', 'Unrelated to a11y', 'Only for print'], 'Not tiny decorative type'),
          q('Tokenized foundations enable:', ['Faster, consistent screen building', 'More unique snowflake screens', 'No handoff', 'Broken Auto Layout'], 'Faster, consistent screen building'),
        ],
      },
      {
        title: 'Components, Variants, and Instances',
        duration: 35,
        intro:
          'Components encode reusable UI. Variants express states (default/hover/disabled) and types (primary/secondary) without duplicating frames. Prefer properties over sprawling variant matrices when possible. Instances should be nudged via properties, not detached chaos.',
        practice: [
          q('Variants commonly represent:', ['Git branches only', 'States and types of one component', 'Entire apps', 'Only colors outside UI'], 'States and types of one component'),
          q('Detaching instances casually causes:', ['Clean libraries', 'Lost updates when the main changes', 'Better tokens', 'Auto a11y'], 'Lost updates when the main changes'),
          q('Component properties help by:', ['Forcing more duplicates', 'Swapping content/icons without new variants', 'Deleting Auto Layout', 'Hiding names'], 'Swapping content/icons without new variants'),
          q('A button set should include:', ['Only one mystery state', 'Key states like default and disabled', 'Only hover art', 'No labels'], 'Key states like default and disabled'),
          q('Sprawling variant matrices become:', ['Always ideal', 'Hard to maintain when overgrown', 'Required by Figma', 'Better than properties always'], 'Hard to maintain when overgrown'),
        ],
        project: {
          title: 'Button + Input Library',
          description:
            'Build a small library: Button (primary/secondary × default/disabled) and Input (default/focus/error). Use Auto Layout. Document instance rules on the library page (when not to detach).',
        },
        assessment: [
          q('Main component updates should:', ['Never propagate', 'Flow to instances that were not detached', 'Break all screens', 'Delete variants'], 'Flow to instances that were not detached'),
          q('Error input state should show:', ['Nothing different', 'Clear error affordance and helper text pattern', 'Only a red page', 'Disabled forever'], 'Clear error affordance and helper text pattern'),
          q('Icons in buttons are best handled via:', ['Redrawing each time', 'Component properties or nested instances', 'Detaching always', 'Raster screenshots'], 'Component properties or nested instances'),
          q('Library pages communicate:', ['Secret shortcuts only', 'How to use the system', 'Only Archive junk', 'Export settings'], 'How to use the system'),
          q('Masters component craft means:', ['Pretty orphans', 'Consistent UI that scales across screens', 'No variants', 'Manual copies'], 'Consistent UI that scales across screens'),
        ],
      },
      {
        title: 'Flows, Prototypes, and Critique',
        duration: 35,
        intro:
          'Screens without flows hide UX problems. Prototype key paths: happy path and one failure path. Use critique prompts focused on clarity, hierarchy, and next action—not taste wars. Record decisions so the file remains a product artifact.',
        practice: [
          q('Prototyping happy + failure paths reveals:', ['Only animations', 'Whether recovery UX exists', 'Export size', 'Token names'], 'Whether recovery UX exists'),
          q('Critique should prioritize:', ['Personal font feuds', 'Clarity, hierarchy, and next action', 'Only shadows', 'Layer count'], 'Clarity, hierarchy, and next action'),
          q('Decision notes in-file help:', ['Future you and teammates', 'Nobody', 'Only exporters', 'Deleting history'], 'Future you and teammates'),
          q('A flow is:', ['One isolated artboard', 'A connected user journey across screens', 'Only a color style', 'A plugin'], 'A connected user journey across screens'),
          q('Taste-only feedback is weak because:', ['It always ships better UX', 'It lacks actionable product criteria', 'It fixes hierarchy', 'It replaces research'], 'It lacks actionable product criteria'),
        ],
        project: {
          title: 'Onboarding Flow Prototype',
          description:
            'Design a 4-screen onboarding flow (welcome → value → permissions/setup → success) with prototype links. Include one error/empty state. Add a critique sticky with three severity-ranked issues you would fix next.',
        },
        assessment: [
          q('Empty states should:', ['Be blank forever', 'Explain what to do next', 'Only show errors', 'Hide CTAs'], 'Explain what to do next'),
          q('Severity-ranked issues help teams:', ['Argue endlessly', 'Fix the highest impact problems first', 'Ignore UX', 'Ship random polish'], 'Fix the highest impact problems first'),
          q('Prototype friction often indicates:', ['Need for more purple', 'Unclear next action or labeling', 'Perfect IA', 'No research needed'], 'Unclear next action or labeling'),
          q('Success screens should confirm:', ['Nothing happened', 'Outcome and next step', 'Only branding', 'Only legal text'], 'Outcome and next step'),
          q('Product artifacts include:', ['Only PNGs emailed', 'Flows, decisions, and living components', 'No notes', 'Detached chaos'], 'Flows, decisions, and living components'),
        ],
      },
      {
        title: 'Handoff: Specs, Assets, and Dev Collaboration',
        duration: 40,
        intro:
          'Handoff is a conversation with evidence: spacing, type, states, and assets. Use inspect-friendly structure, export rules, and a short handoff note covering behavior not visible in static frames. Reduce “design intent” guesswork—masters deliver clarity developers can build.',
        practice: [
          q('Inspect-friendly structure means:', ['Mystery groups', 'Clean hierarchy developers can measure', 'Flattened chaos', 'No components'], 'Clean hierarchy developers can measure'),
          q('Behavior notes cover:', ['Only hex codes', 'Interactions and edge cases not obvious in stills', 'Only logos', 'Bitrate'], 'Interactions and edge cases not obvious in stills'),
          q('Export rules should specify:', ['Random crops', 'Formats, sizes, and naming', 'Only vibes', 'No assets'], 'Formats, sizes, and naming'),
          q('Guesswork in handoff causes:', ['Faster builds always', 'Rework and mismatched UI', 'Perfect a11y', 'Better tokens'], 'Rework and mismatched UI'),
          q('States in handoff must include:', ['Default only', 'Key interactive and error states', 'Archive only', 'Cover page only'], 'Key interactive and error states'),
        ],
        project: {
          title: 'Handoff Packet',
          description:
            'Prepare a handoff packet for a settings screen: annotated spacing, component list, exportable icons, and a one-page behavior note (toggles, validation, empty). Write three questions you would ask engineering in kickoff.',
        },
        assessment: [
          q('Kickoff questions prevent:', ['Alignment', 'Late surprises about constraints', 'Good specs', 'Asset naming'], 'Late surprises about constraints'),
          q('Mismatched UI after build often traces to:', ['Clear variants', 'Missing states or unclear specs', 'Too many notes', 'Clean Auto Layout'], 'Missing states or unclear specs'),
          q('Icon naming conventions help:', ['Designers only', 'Design and eng share the same asset language', 'Break CI', 'Hide exports'], 'Design and eng share the same asset language'),
          q('A living file beats:', ['Final frozen mystery PNGs only', 'Updated sources of truth', 'Component libraries', 'Decision notes'], 'Final frozen mystery PNGs only'),
          q('End-to-end Figma mastery ships:', ['Pretty orphans', 'Buildable UI systems and flows', 'No handoff', 'Detached copies'], 'Buildable UI systems and flows'),
        ],
      },
    ],
  },

  // ─── 6. CANVA ─────────────────────────────────────────────
  {
    id: 'masters-canva',
    title: 'Canva Masters Class',
    description:
      'A full Canva apprenticeship: brand kits, layout craft, social systems, presentations, campaign kits, and shipping polished marketing visuals end to end without design-tool chaos.',
    color: '00C4CC',
    short: 'Canva',
    lessons: [
      {
        title: 'Canva for Fast, On-Brand Visuals',
        duration: 25,
        intro:
          'Canva is a production studio for non-designers and lean teams: templates, brand kits, and rapid export. Speed without a brand system creates clutter. This apprenticeship builds end-to-end visual ops—from brief to consistent assets across channels.',
        practice: [
          q('Canva’s strength is:', ['Kernel drivers', 'Fast branded visual production', 'Database indexing', 'Compiler design'], 'Fast branded visual production'),
          q('Without a brand system, speed creates:', ['Perfect consistency', 'Visual clutter and drift', 'Better accessibility always', 'Automatic grids'], 'Visual clutter and drift'),
          q('A creative brief should include:', ['Only “make it pop”', 'Audience, message, channel, and constraints', 'Passwords', 'No size'], 'Audience, message, channel, and constraints'),
          q('Templates are best used as:', ['Final law never edited', 'Starting structures you adapt to brand', 'Random scrapbooks', 'Only for print forever'], 'Starting structures you adapt to brand'),
          q('Masters Canva work aims to:', ['Ship one-off chaos', 'Build repeatable on-brand asset systems', 'Avoid exports', 'Ignore channels'], 'Build repeatable on-brand asset systems'),
        ],
        project: {
          title: 'Brief → Asset Spec',
          description:
            'Write a one-page brief for a course launch graphic: audience, single message, CTA, do/don’t, and sizes needed for Instagram post + story. Note which brand elements are mandatory.',
        },
        assessment: [
          q('Channel constraints matter because:', ['All sizes are identical', 'Crops and safe zones differ', 'Fonts never change', 'CTAs are optional'], 'Crops and safe zones differ'),
          q('Single-message discipline prevents:', ['Clarity', 'Overloaded posters nobody reads', 'Strong CTAs', 'Brand use'], 'Overloaded posters nobody reads'),
          q('Mandatory brand elements typically include:', ['Random stock only', 'Logo, colors, and type rules', 'Only memes', 'No margins'], 'Logo, colors, and type rules'),
          q('Visual ops means:', ['One hero designer forever', 'Process from brief to export at quality', 'Skipping review', 'No templates'], 'Process from brief to export at quality'),
          q('Adapting templates poorly often causes:', ['Better hierarchy', 'Broken alignment and off-brand fonts', 'Perfect spacing', 'Clearer CTAs'], 'Broken alignment and off-brand fonts'),
        ],
      },
      {
        title: 'Brand Kits and Consistency Rules',
        duration: 30,
        intro:
          'Lock colors, fonts, and logos into a Brand Kit. Define photo style and forbidden patterns. Consistency is a product feature for marketing. Teach the team how to apply the kit so every intern does not invent a new look.',
        practice: [
          q('Brand Kits store:', ['Server keys', 'Colors, fonts, and logos for reuse', 'Only videos', 'Chat logs'], 'Colors, fonts, and logos for reuse'),
          q('Forbidden patterns help by:', ['Encouraging chaos', 'Preventing off-brand experiments from shipping', 'Banning all creativity', 'Deleting templates'], 'Preventing off-brand experiments from shipping'),
          q('Photo style guides cover:', ['Only file size', 'Lighting, crop, and subject treatment', 'DNS', 'Code lint'], 'Lighting, crop, and subject treatment'),
          q('Team application rules reduce:', ['Onboarding time waste and drift', 'Consistency', 'Speed with quality', 'Clear CTAs'], 'Onboarding time waste and drift'),
          q('Consistency as a feature means:', ['Customers recognize you across touchpoints', 'Every post looks unrelated', 'No logo ever', 'Random palettes'], 'Customers recognize you across touchpoints'),
        ],
        project: {
          title: 'Brand Kit One-Pager',
          description:
            'Create (or fictively specify) a Brand Kit one-pager: primary/secondary colors, two fonts, logo clear-space, photo dos/don’ts, and three off-brand examples to reject.',
        },
        assessment: [
          q('Clear-space around logos prevents:', ['Breathing room', 'Crowding and illegible marks', 'Better exports', 'Grid use'], 'Crowding and illegible marks'),
          q('Secondary colors should:', ['Replace primaries everywhere', 'Support accents without fighting hierarchy', 'Be neon only', 'Ignore contrast'], 'Support accents without fighting hierarchy'),
          q('Reject examples teach faster than:', ['Abstract rules alone', 'No examples', 'Secret taste', 'Random Pinterest'], 'Abstract rules alone'),
          q('Interns without kit rules will:', ['Always match brand', 'Invent conflicting styles', 'Never export', 'Only use one font magically'], 'Invent conflicting styles'),
          q('Masters brand ops includes:', ['Living rules people actually use', 'A forgotten PDF', 'No kit', 'Weekly total redesigns'], 'Living rules people actually use'),
        ],
      },
      {
        title: 'Layout Craft: Hierarchy and Whitespace',
        duration: 30,
        intro:
          'Even with templates, you must control hierarchy: one dominant headline, supporting line, CTA. Use whitespace as structure. Align edges. Limit type sizes. If everything shouts, nothing converts.',
        practice: [
          q('One dominant headline creates:', ['Noise', 'Clear entry point for the eye', 'Equal weight everywhere', 'No CTA room'], 'Clear entry point for the eye'),
          q('Whitespace is:', ['Wasted space always', 'A structural tool for grouping and focus', 'Only for print novels', 'A bug'], 'A structural tool for grouping and focus'),
          q('Too many type sizes cause:', ['Calm hierarchy', 'Visual noise', 'Better scanning', 'Stronger brand'], 'Visual noise'),
          q('Alignment issues make designs feel:', ['Intentional', 'Amateur and restless', 'More premium always', 'More accessible automatically'], 'Amateur and restless'),
          q('If everything shouts:', ['Conversion rises always', 'Hierarchy collapses', 'Whitespace increases', 'CTAs clarify'], 'Hierarchy collapses'),
        ],
        project: {
          title: 'Hierarchy Remake',
          description:
            'Take a cluttered promo layout (or invent one). Remake it with one headline, one support line, one CTA, and generous whitespace. Deliver before/after and a 5-bullet critique of the original.',
        },
        assessment: [
          q('Supporting lines should:', ['Compete with the headline', 'Clarify without overpowering', 'Use larger type than the headline', 'Include five CTAs'], 'Clarify without overpowering'),
          q('Grouping related items with space helps:', ['Scanning', 'Random scattering', 'More borders always', 'Lower contrast'], 'Scanning'),
          q('CTA buttons need:', ['Tiny low-contrast labels', 'Clear affordance and short labels', 'No margins', 'Five actions'], 'Clear affordance and short labels'),
          q('Before/after critiques train:', ['Taste without criteria', 'Eye for hierarchy rules', 'Only filter use', 'Stock photo search'], 'Eye for hierarchy rules'),
          q('Layout craft in Canva is still:', ['Optional decoration', 'Core to readable marketing', 'Solved by AI alone', 'Only for Figma users'], 'Core to readable marketing'),
        ],
      },
      {
        title: 'Social Systems and Resize Workflows',
        duration: 35,
        intro:
          'Social marketing is a system of sizes. Design the master composition, then resize with intentional reflow—not blind stretch. Keep safe zones for stories. Maintain a naming scheme so campaigns stay findable.',
        practice: [
          q('Blind stretching across sizes often:', ['Preserves hierarchy', 'Breaks composition and crops poorly', 'Improves CTAs', 'Fixes safe zones'], 'Breaks composition and crops poorly'),
          q('Safe zones matter on stories because:', ['UI chrome can cover edges', 'Edges never matter', 'Fonts auto-fix', 'Logos vanish helpfully'], 'UI chrome can cover edges'),
          q('A master composition is:', ['Every size designed from scratch always', 'The primary layout you adapt', 'Only a color', 'An export bug'], 'The primary layout you adapt'),
          q('Naming schemes help teams:', ['Lose files', 'Find campaign assets quickly', 'Ignore versions', 'Duplicate chaos'], 'Find campaign assets quickly'),
          q('Intentional reflow means:', ['Moving and resizing elements for the new frame', 'Only scaling uniformly always', 'Deleting the CTA', 'Ignoring margins'], 'Moving and resizing elements for the new frame'),
        ],
        project: {
          title: 'Campaign Size Set',
          description:
            'Produce one campaign message across three sizes (feed square, story, and landscape). Keep brand kit consistency. Document what you changed in each reflow in three bullets per size.',
        },
        assessment: [
          q('Landscape vs story often needs:', ['Identical layouts', 'Different focal crops and type scale', 'No CTA', 'Same safe zones'], 'Different focal crops and type scale'),
          q('Campaign findability fails when files are:', ['Named consistently', 'Called Final2_reallyFINAL', 'Brand-kitted', 'Versioned lightly'], 'Called Final2_reallyFINAL'),
          q('Reflow notes teach:', ['Nothing', 'What breaks when sizes change', 'Only filters', 'Stock search'], 'What breaks when sizes change'),
          q('Feed square compositions should protect:', ['Tiny edge logos only', 'Central focus and readable type', 'Maximum clutter', 'No margins'], 'Central focus and readable type'),
          q('Social systems mastery is:', ['One pretty PNG', 'Repeatable multi-size shipping', 'Random crops', 'No brand kit'], 'Repeatable multi-size shipping'),
        ],
      },
      {
        title: 'Presentations and Narrative Slides',
        duration: 35,
        intro:
          'Slides fail when they are documents. One idea per slide, strong titles, and visuals that support the point. Build a reusable deck system: title, section, content, and closing templates aligned to brand.',
        practice: [
          q('One idea per slide improves:', ['Wall-of-text density', 'Audience comprehension', 'Font count', 'Hidden CTAs'], 'Audience comprehension'),
          q('Slide titles should:', ['Be vague', 'State the point of the slide', 'Only show dates', 'Be decorative only'], 'State the point of the slide'),
          q('Document-like slides usually:', ['Engage better', 'Lose the room', 'Need no visuals', 'Replace talks'], 'Lose the room'),
          q('A deck system includes:', ['Only random layouts', 'Reusable slide types for narrative structure', 'No brand colors', 'Only GIFs'], 'Reusable slide types for narrative structure'),
          q('Visuals on slides should:', ['Distract from the point', 'Support the stated point', 'Replace the speaker always', 'Be unreadably small always'], 'Support the stated point'),
        ],
        project: {
          title: 'Six-Slide Pitch System',
          description:
            'Build a 6-slide pitch: title, problem, approach, proof, offer, close. Use Brand Kit. Keep ≤20 words of body text per content slide; put detail in speaker notes instead.',
        },
        assessment: [
          q('Speaker notes are for:', ['Crowding the slide', 'Detail the audience need not read on-screen', 'Hiding the brand', 'Replacing rehearsal'], 'Detail the audience need not read on-screen'),
          q('Section slides help by:', ['Confusing order', 'Signaling narrative turns', 'Adding more text walls', 'Removing hierarchy'], 'Signaling narrative turns'),
          q('Proof slides should show:', ['Vague claims only', 'Concrete evidence or examples', 'Only stock smiles', 'No source of credibility'], 'Concrete evidence or examples'),
          q('Closing slides need:', ['A clear ask or next step', 'More bullet soup', 'No contact path', 'Five competing CTAs'], 'A clear ask or next step'),
          q('Masters presentation craft in Canva is:', ['Decorating bullet hell', 'Narrative clarity with brand-consistent templates', 'Max animations always', 'No system'], 'Narrative clarity with brand-consistent templates'),
        ],
      },
      {
        title: 'Campaign Kits and Production QA',
        duration: 40,
        intro:
          'Ship campaigns as kits: masters, resized set, copy variants, and export checklist. QA for contrast, typos, logo clear-space, and wrong-size exports. Retros improve the next sprint. End-to-end Canva mastery is reliable marketing production.',
        practice: [
          q('A campaign kit typically includes:', ['One mystery JPEG', 'Masters, sizes, copy variants, exports', 'Only fonts', 'Server logs'], 'Masters, sizes, copy variants, exports'),
          q('Export QA should catch:', ['Only taste debates', 'Wrong sizes, typos, contrast, logo issues', 'Nothing measurable', 'Only animations'], 'Wrong sizes, typos, contrast, logo issues'),
          q('Copy variants help:', ['A/B tests and channel tone', 'Breaking brand', 'Ignoring CTA', 'Deleting masters'], 'A/B tests and channel tone'),
          q('Retros after campaigns improve:', ['Amnesia', 'Next production speed and quality', 'Random drift', 'No checklists'], 'Next production speed and quality'),
          q('Reliable production means:', ['Heroic last-minute panic', 'Checklists and reusable kits', 'No Brand Kit', 'Blind stretch forever'], 'Checklists and reusable kits'),
        ],
        project: {
          title: 'Launch Kit + QA Checklist',
          description:
            'Assemble a mini launch kit for a fictional workshop: 1 master, 2 resized posts, 2 copy variants, export list, and a 10-item QA checklist you actually tick off.',
        },
        assessment: [
          q('Wrong-size exports waste:', ['Nothing', 'Media buy and credibility', 'Only ink', 'Brand kits'], 'Media buy and credibility'),
          q('Contrast failures hurt:', ['Only printers', 'Readability and accessibility', 'File names', 'Folder order'], 'Readability and accessibility'),
          q('Tick-off checklists beat memory because:', ['Memory is perfect under deadline', 'Deadlines create tunnel vision', 'QA is optional', 'Exports auto-fix'], 'Deadlines create tunnel vision'),
          q('Copy variants should keep:', ['The same core offer clarity', 'Contradictory promises', 'No CTA', 'Hidden sizes'], 'The same core offer clarity'),
          q('End-to-end Canva mastery looks like:', ['Random pretty files', 'Brief → brand → system → QA → ship', 'No resize notes', 'Template worship without craft'], 'Brief → brand → system → QA → ship'),
        ],
      },
    ],
  },

  // ─── 7. HIGGSFIELD ────────────────────────────────────────
  {
    id: 'masters-higgsfield',
    title: 'Higgsfield Masters Class',
    description:
      'A full Higgsfield apprenticeship: motion briefs, prompt craft for AI video, style locking, iteration loops, export discipline, and shipping short-form motion pieces end to end.',
    color: '7C3AED',
    short: 'Higgsfield',
    lessons: [
      {
        title: 'Higgsfield in the Creative Pipeline',
        duration: 25,
        intro:
          'Higgsfield sits in the AI motion layer: turn briefs into clips you can iterate and export. Treat generations as footage options, not final films. Your apprenticeship builds end-to-end motion craft—brief, generate, select, refine, and package for CapCut or social.',
        practice: [
          q('AI video outputs should be treated as:', ['Untouchable finals', 'Footage options under creative direction', 'Legal documents', 'Database dumps'], 'Footage options under creative direction'),
          q('Higgsfield’s role in a pipeline is often:', ['Replacing all editing forever', 'Generating motion candidates fast', 'Printing posters only', 'Writing SQL'], 'Generating motion candidates fast'),
          q('Creative direction remains:', ['Optional', 'Your responsibility', 'The model’s legal duty', 'A filter preset'], 'Your responsibility'),
          q('Packaging for CapCut/social means:', ['Ignoring aspect ratio', 'Exporting usable clips for assembly', 'Skipping selection', 'No brief'], 'Exporting usable clips for assembly'),
          q('Masters motion work needs:', ['One lucky generate', 'Brief → iterate → select → ship loops', 'No style notes', 'Random prompts only'], 'Brief → iterate → select → ship loops'),
        ],
        project: {
          title: 'Pipeline Map',
          description:
            'Draw (or outline) your Higgsfield pipeline: brief inputs, generation settings you care about, selection criteria, refine steps, and where CapCut/Figma/Canva enter. Mark failure points where people usually waste credits.',
        },
        assessment: [
          q('Wasted credits often come from:', ['Clear briefs', 'Vague prompts and no selection criteria', 'Style locks', 'Export checklists'], 'Vague prompts and no selection criteria'),
          q('Selection criteria might include:', ['Only “cool”', 'Brief match, continuity, and usability', 'File name length', 'Random seed worship'], 'Brief match, continuity, and usability'),
          q('Treating AI clips as finals risks:', ['Better taste', 'Shipping incoherent or off-brief motion', 'Stronger pipelines', 'Clearer QA'], 'Shipping incoherent or off-brief motion'),
          q('Downstream editors need:', ['Mystery aspect ratios', 'Clean labeled exports', 'Unsorted dumps', 'No duration notes'], 'Clean labeled exports'),
          q('End-to-end thinking prevents:', ['Siloed generate-and-pray workflows', 'Collaboration', 'Iteration', 'Briefs'], 'Siloed generate-and-pray workflows'),
        ],
      },
      {
        title: 'Motion Briefs that Constrain Chaos',
        duration: 30,
        intro:
          'A motion brief specifies subject, action, camera, mood, duration intent, and do-nots. Ambiguity burns generations. Include reference stills or adjectives that lock style. Write acceptance checks: what must be true to keep a take.',
        practice: [
          q('Camera notes in briefs help:', ['Ignore framing', 'Guide shot language (push, orbit, static)', 'Delete subjects', 'Ban mood'], 'Guide shot language (push, orbit, static)'),
          q('Do-nots prevent:', ['Useful constraints', 'Common unwanted artifacts or themes', 'All creativity', 'Exports'], 'Common unwanted artifacts or themes'),
          q('Acceptance checks are:', ['Vague vibes', 'Observable keep/kill rules', 'Only seeds', 'Hidden forever'], 'Observable keep/kill rules'),
          q('Duration intent matters because:', ['All clips are identical length needs', 'Edit plans depend on usable beat length', 'Social ignores timing', 'Prompts ban time'], 'Edit plans depend on usable beat length'),
          q('Ambiguous briefs usually produce:', ['On-target first takes', 'Wide miss variance', 'Perfect continuity', 'No artifacts'], 'Wide miss variance'),
        ],
        project: {
          title: 'Motion Brief Sheet',
          description:
            'Write a complete brief for a 6–8s product hero clip: subject, action, camera, mood, style refs, do-nots, and 5 acceptance checks. Add a backup brief if the first look fails.',
        },
        assessment: [
          q('Style references reduce:', ['Direction', 'Random style drift across takes', 'Need for mood words', 'Camera notes'], 'Random style drift across takes'),
          q('Subject clarity avoids:', ['Clean focus', 'Model inventing the wrong hero', 'Better framing', 'Usable exports'], 'Model inventing the wrong hero'),
          q('Backup briefs are useful when:', ['First look always wins', 'Exploration needs a controlled pivot', 'You ban iteration', 'Credits are infinite and unguided'], 'Exploration needs a controlled pivot'),
          q('Action verbs in briefs beat:', ['Static noun lists only', 'Clear motion targets', 'Camera language', 'Do-nots'], 'Static noun lists only'),
          q('Keep/kill rules should be applied:', ['After emotional attachment', 'Before you sink more generations', 'Never', 'Only at publish'], 'Before you sink more generations'),
        ],
      },
      {
        title: 'Prompt Craft for Coherent Motion',
        duration: 35,
        intro:
          'Prompt for coherent motion: stable subject, clear verb, lighting, lens feel, and fewer conflicting styles. Iterate one variable at a time. Save prompt versions that worked. Negative constraints matter as much as positives.',
        practice: [
          q('Changing many variables at once makes learning:', ['Clear', 'Harder—you cannot attribute results', 'Faster forever', 'Unnecessary'], 'Harder—you cannot attribute results'),
          q('Conflicting styles in one prompt often yield:', ['Clean identity', 'Muddy or unstable looks', 'Perfect continuity', 'Better audio'], 'Muddy or unstable looks'),
          q('Negative constraints help by:', ['Encouraging banned artifacts', 'Steering away from known failure modes', 'Removing all detail', 'Hiding the subject'], 'Steering away from known failure modes'),
          q('Lens/lighting language influences:', ['Only file size', 'Mood and perceived production value', 'SQL joins', 'Brand PDFs only'], 'Mood and perceived production value'),
          q('Prompt versioning lets you:', ['Forget wins', 'Return to known-good recipes', 'Ban iteration', 'Delete briefs'], 'Return to known-good recipes'),
        ],
        project: {
          title: 'Prompt Lab Log',
          description:
            'Run (or simulate) a 6-row prompt lab: baseline + five single-variable changes (camera, lighting, action intensity, style, negative). Log outcome notes and crown a winner with reasons.',
        },
        assessment: [
          q('Stable subject wording reduces:', ['Identity flicker across takes', 'All motion', 'Need for verbs', 'Lighting'], 'Identity flicker across takes'),
          q('A good lab log captures:', ['Only final MP4', 'Prompt, change, and observed result', 'Secrets', 'No criteria'], 'Prompt, change, and observed result'),
          q('Overstuffed prompts tend to:', ['Clarify priorities', 'Compete with themselves', 'Guarantee coherence', 'Remove artifacts'], 'Compete with themselves'),
          q('Intensity of action should match:', ['Brief and edit needs', 'Maximum chaos always', 'No camera', 'Random nouns'], 'Brief and edit needs'),
          q('Masters prompt craft is:', ['Magic words once', 'Controlled experimentation with memory', 'Copying strangers blindly', 'No negatives'], 'Controlled experimentation with memory'),
        ],
      },
      {
        title: 'Style Locking and Continuity',
        duration: 35,
        intro:
          'Campaigns need continuity across clips: palette, lens, subject identity, and motion energy. Lock style early. Build a look bible. When continuity breaks, fix with constrained regenerations rather than random new aesthetics.',
        practice: [
          q('A look bible documents:', ['Server passwords', 'Visual rules for continuity', 'Only budgets', 'Chat logs'], 'Visual rules for continuity'),
          q('Locking style early helps:', ['Endless aesthetic thrash', 'Cohesive multi-clip sets', 'More conflicting prompts', 'Weaker brands'], 'Cohesive multi-clip sets'),
          q('Identity drift is:', ['Always good', 'Subject looking inconsistently across takes', 'Only audio', 'An export preset'], 'Subject looking inconsistently across takes'),
          q('Constrained regenerations mean:', ['New brand every take', 'Changing few variables to repair continuity', 'Deleting the bible', 'Ignoring palette'], 'Changing few variables to repair continuity'),
          q('Motion energy should be:', ['Random per clip', 'Matched to campaign tone', 'Always maximal', 'Never discussed'], 'Matched to campaign tone'),
        ],
        project: {
          title: 'Look Bible + Pair Test',
          description:
            'Create a one-page look bible (palette, lighting, lens, motion energy, do-nots). Generate or describe two clips that must feel like the same campaign; write a continuity score and repair plan for mismatches.',
        },
        assessment: [
          q('Continuity scores should judge:', ['Only file names', 'Identity, palette, lens, energy', 'Only duration', 'Only seed numbers'], 'Identity, palette, lens, energy'),
          q('Repair plans beat:', ['Throwing away the campaign look casually', 'Documented fixes', 'Look bibles', 'Constrained prompts'], 'Throwing away the campaign look casually'),
          q('Palette locking supports:', ['Brand recognition in motion', 'More rainbow noise', 'Unrelated stills only', 'No Canva link'], 'Brand recognition in motion'),
          q('Multi-clip sets fail when:', ['Energy matches', 'Each take invents a new genre', 'Look bible exists', 'Acceptance checks run'], 'Each take invents a new genre'),
          q('Masters continuity is:', ['Accidental', 'Designed and enforced', 'Impossible', 'Only for live film'], 'Designed and enforced'),
        ],
      },
      {
        title: 'Selection, Iteration, and Cost Control',
        duration: 30,
        intro:
          'Selection is a creative skill: pick for editability, not just wow frames. Kill early. Batch similar experiments. Track what burned credits without learning. Iteration is scheduled, not infinite scroll.',
        practice: [
          q('Editability means:', ['Pretty but unusable morphs', 'Clips that cut into a sequence cleanly', 'Longest possible always', 'No subject'], 'Clips that cut into a sequence cleanly'),
          q('Killing early saves:', ['Learning', 'Credits and time', 'Taste', 'Briefs'], 'Credits and time'),
          q('Batching similar experiments helps:', ['Attribute outcomes and compare fairly', 'Maximize chaos', 'Hide logs', 'Skip criteria'], 'Attribute outcomes and compare fairly'),
          q('Infinite scroll iteration often yields:', ['Clear learning', 'Diminishing returns and fatigue', 'Better briefs automatically', 'Perfect continuity'], 'Diminishing returns and fatigue'),
          q('Credit burn without learning indicates:', ['Good labs', 'Missing hypotheses and logs', 'Strong selection', 'Clear acceptance checks'], 'Missing hypotheses and logs'),
        ],
        project: {
          title: 'Selection Board',
          description:
            'Build a selection board template: Keep / Maybe / Kill with reasons tied to the brief. Fill it for 9 fictional takes. Write a next-iteration hypothesis for the top Maybe.',
        },
        assessment: [
          q('Maybe piles should be:', ['Infinite forever', 'Time-boxed and re-reviewed', 'Treated as Keep always', 'Deleted unread'], 'Time-boxed and re-reviewed'),
          q('Hypotheses for next iteration state:', ['“Try stuff”', 'What you will change and why', 'Only seeds', 'No link to failures'], 'What you will change and why'),
          q('Wow frames that fail continuity are usually:', ['Auto-Keep', 'Kill or heavy repair', 'Look bible replacements', 'Export masters'], 'Kill or heavy repair'),
          q('Scheduled iteration means:', ['No limits', 'Bounded rounds with goals', 'Scrolling until dawn', 'No selection'], 'Bounded rounds with goals'),
          q('Cost control is part of:', ['Producing like a studio', 'Ignoring craft', 'Only enterprise legal', 'Skipping briefs'], 'Producing like a studio'),
        ],
      },
      {
        title: 'Export, Handoff, and Short-Form Packaging',
        duration: 35,
        intro:
          'Export with naming, aspect ratio, and duration notes editors need. Package selects with brief + look bible. Plan how clips enter CapCut timelines. Masters Higgsfield work ends when another teammate can assemble without guessing.',
        practice: [
          q('Handoff packages should include:', ['Only raw mystery files', 'Selects, brief, look notes, and naming', 'Passwords', 'No ratios'], 'Selects, brief, look notes, and naming'),
          q('Aspect ratio mistakes cause:', ['Clean social crops', 'Painful rework downstream', 'Better audio', 'Stronger briefs'], 'Painful rework downstream'),
          q('Duration notes help editors:', ['Guess cuts', 'Plan pacing and music hits', 'Ignore selects', 'Delete looks'], 'Plan pacing and music hits'),
          q('Guess-free assembly means:', ['Missing labels', 'Clear metadata and intent', 'Random folder dumps', 'No CapCut plan'], 'Clear metadata and intent'),
          q('Short-form packaging often targets:', ['Feature films only', 'Platform-ready clip sets', 'Print posters', 'SQL exports'], 'Platform-ready clip sets'),
        ],
        project: {
          title: 'Editor Handoff Kit',
          description:
            'Create a handoff kit outline for a 20s social spot: clip list with roles (open/hook/demo/close), aspect ratios, look bible link, and CapCut assembly notes for order and music energy.',
        },
        assessment: [
          q('Clip roles in a list prevent:', ['Purposeful sequencing', 'Editors not knowing why a take exists', 'Good pacing', 'Clear hooks'], 'Editors not knowing why a take exists'),
          q('Music energy notes align:', ['Motion intensity with soundtrack', 'Random cuts only', 'Look bible fonts', 'Brand PDFs'], 'Motion intensity with soundtrack'),
          q('Naming conventions should encode:', ['Nothing useful', 'Scene role and version', 'Only timestamps forever', 'Secrets'], 'Scene role and version'),
          q('Downstream rework often starts at:', ['Clear handoffs', 'Sloppy exports and missing intent', 'Acceptance checks', 'Selection boards'], 'Sloppy exports and missing intent'),
          q('End-to-end Higgsfield mastery ships:', ['Orphan MP4s', 'Directed, continuous, editable motion sets', 'Infinite Maybes', 'No briefs'], 'Directed, continuous, editable motion sets'),
        ],
      },
    ],
  },

  // ─── 8. CAPCUT ────────────────────────────────────────────
  {
    id: 'masters-capcut',
    title: 'CapCut Masters Class',
    description:
      'A full CapCut apprenticeship: timeline craft, pacing, captions, sound design, effects discipline, and exporting short-form video that holds attention end to end on social platforms.',
    color: '111827',
    short: 'CapCut',
    lessons: [
      {
        title: 'CapCut as a Short-Form Edit Bay',
        duration: 25,
        intro:
          'CapCut is built for fast social editing: timeline cuts, captions, effects, and platform exports. Speed without an edit plan creates noisy videos. This apprenticeship trains end-to-end short-form craft—from rough cut to captioned, mixed, export-ready stories.',
        practice: [
          q('CapCut is primarily used for:', ['Database admin', 'Short-form video editing and export', '3D CAD kernels', 'Compiler design'], 'Short-form video editing and export'),
          q('An edit plan prevents:', ['Pacing intentionality', 'Random clip soup', 'Good captions', 'Clean exports'], 'Random clip soup'),
          q('Rough cut first means:', ['Effects before story', 'Story and order before polish', 'Export first', 'Captions only'], 'Story and order before polish'),
          q('Platform exports require attention to:', ['Only filters', 'Aspect ratio, length, and specs', 'SQL', 'Brand PDFs only'], 'Aspect ratio, length, and specs'),
          q('Masters CapCut work aims for:', ['Effect spam', 'Clear stories that hold attention', 'No sound', 'No captions'], 'Clear stories that hold attention'),
        ],
        project: {
          title: 'Edit Plan Card',
          description:
            'Write a 20–30s edit plan: hook (0–3s), problem, demo/proof, CTA. List shot types needed and what you will refuse to add (effect clutter list).',
        },
        assessment: [
          q('Hooks must earn:', ['A slow logo 10s in', 'Continued watch in the first seconds', 'Only end cards', 'Silent openings always'], 'Continued watch in the first seconds'),
          q('Effect clutter usually:', ['Clarifies story', 'Distracts from the message', 'Fixes pacing', 'Replaces CTAs'], 'Distracts from the message'),
          q('Shot lists help when filming/generating:', ['Random coverage', 'Coverage that matches the plan', 'No B-roll', 'Only text posts'], 'Coverage that matches the plan'),
          q('CTA placement is often best:', ['Buried mid-ramble only', 'After value is shown, still early enough to act', 'Never', 'Only in filename'], 'After value is shown, still early enough to act'),
          q('Edit bays succeed with:', ['Discipline + tool fluency', 'Filters alone', 'No plan', 'Max transitions'], 'Discipline + tool fluency'),
        ],
      },
      {
        title: 'Timeline Craft: Cuts, Pacing, and Structure',
        duration: 35,
        intro:
          'Pacing is meaning. Cut on intention: remove air, keep breaths that sell emotion. Alternate wide/detail when it helps comprehension. Use J/L patterns conceptually—let sound lead picture when useful. Structure beats: hook, develop, payoff.',
        practice: [
          q('Removing air means:', ['Deleting all silence including emotional beats', 'Trimming dead time that adds nothing', 'Cutting all B-roll', 'Muting music'], 'Trimming dead time that adds nothing'),
          q('Hook → develop → payoff is a:', ['Random order', 'Simple short-form narrative spine', 'Color preset', 'Export codec'], 'Simple short-form narrative spine'),
          q('Detail shots help when:', ['Viewers need to understand a small action', 'You want more confusion', 'Wide is always enough', 'Text replaces all visuals'], 'Viewers need to understand a small action'),
          q('Cutting on intention means:', ['Cutting every 0.2s always', 'Each cut advances story or energy', 'Never cutting', 'Only using jump cuts for errors'], 'Each cut advances story or energy'),
          q('Emotional breaths can be kept when:', ['They serve feeling or emphasis', 'They are always mistakes', 'Pacing must be flat', 'Hooks forbid them'], 'They serve feeling or emphasis'),
        ],
        project: {
          title: 'Pacing Rebuild',
          description:
            'Take a rambling 45s script (or invent one). Rebuild a 25s cut list with timestamps for hook/develop/payoff. Mark three places you will cut air and one intentional pause you will keep.',
        },
        assessment: [
          q('Jump cuts are useful for:', ['Hiding all meaning', 'Energy and removing filler', 'Replacing story', 'Breaking all continuity always'], 'Energy and removing filler'),
          q('Payoff failure usually means:', ['Strong hooks alone suffice', 'The video promised something it did not deliver', 'Too many detail shots', 'Good CTAs'], 'The video promised something it did not deliver'),
          q('Timestamped cut lists communicate:', ['Only vibes', 'Edit intent to collaborators', 'Codec choice', 'Font licensing'], 'Edit intent to collaborators'),
          q('Alternating shot scale can:', ['Guide attention', 'Always confuse', 'Replace sound', 'Fix exports'], 'Guide attention'),
          q('Masters pacing feels:', ['Accidental', 'Designed for attention and clarity', 'Maximally long', 'Effect-led'], 'Designed for attention and clarity'),
        ],
      },
      {
        title: 'Captions, On-Screen Text, and Accessibility',
        duration: 30,
        intro:
          'Most social video is watched without sound at first. Captions are product, not garnish. Keep lines short, high-contrast, and timed to speech. Avoid covering faces and key actions. Style captions to brand without sacrificing readability.',
        practice: [
          q('Captions matter because:', ['Nobody mutes videos', 'Many viewers start without sound', 'Platforms ban audio', 'Text is decorative only'], 'Many viewers start without sound'),
          q('Short caption lines help:', ['Walls of text', 'Reading speed on mobile', 'Lower contrast', 'Covering faces more'], 'Reading speed on mobile'),
          q('High contrast captions improve:', ['Mystery', 'Legibility', 'Only aesthetics in dark rooms never', 'Export speed'], 'Legibility'),
          q('Covering faces with captions often:', ['Helps emotion', 'Hurts connection and clarity', 'Fixes timing', 'Is required'], 'Hurts connection and clarity'),
          q('Brand-styled captions should still:', ['Remain readable', 'Use unreadable scripts', 'Blink violently always', 'Ignore safe zones'], 'Remain readable'),
        ],
        project: {
          title: 'Caption Style Guide',
          description:
            'Create a caption style guide: font, size, position, max characters per line, highlight rules for keywords, and do-nots. Apply it to a 15s sample transcript with proper line breaks.',
        },
        assessment: [
          q('Keyword highlights should:', ['Color every word', 'Emphasize sparse key phrases', 'Replace timing', 'Hide CTAs'], 'Emphasize sparse key phrases'),
          q('Timing captions to speech prevents:', ['Comprehension', 'Reading ahead/behind confusion', 'Accessibility', 'Brand use'], 'Reading ahead/behind confusion'),
          q('Safe zones keep captions:', ['Under UI chrome', 'In the crushed corners always', 'Off-screen', 'Behind stickers only'], 'Under UI chrome'),
          q('Accessibility is:', ['Optional flair', 'Part of professional short-form craft', 'Only for long docs', 'Solved by music'], 'Part of professional short-form craft'),
          q('Masters captioning looks like:', ['Afterthought burned-in mess', 'Designed, timed, readable text', 'All-caps walls', 'No style guide'], 'Designed, timed, readable text'),
        ],
      },
      {
        title: 'Sound: Music, VO, and Mix Basics',
        duration: 30,
        intro:
          'Sound carries emotion and clarity. Balance VO against music; duck beds under speech. Avoid copyright traps for client work. Use silence as a tool. A clean mix often outperforms another effect pack.',
        practice: [
          q('Ducking music means:', ['Deleting VO', 'Lowering bed under speech', 'Maximizing both forever', 'Muting captions'], 'Lowering bed under speech'),
          q('Copyright awareness matters for:', ['Personal meme drafts only', 'Client and monetized publishing', 'Offline private tests never', 'Filename length'], 'Client and monetized publishing'),
          q('Silence can:', ['Only bore', 'Create emphasis and breathing room', 'Break all videos', 'Replace VO always'], 'Create emphasis and breathing room'),
          q('A clean mix vs more effects:', ['Effects always win', 'Clarity often wins attention', 'Mix never matters', 'VO should be quiet'], 'Clarity often wins attention'),
          q('VO clarity requires:', ['Music louder than speech', 'Intelligibility first', 'No ducking ever', 'Only reverb'], 'Intelligibility first'),
        ],
        project: {
          title: 'Mix Checklist Spot',
          description:
            'Design a mix checklist for a 20s promo (VO + music + optional SFX). Define target priorities, ducking rule, and three failure sounds you will reject (mud, clipping, competing leads).',
        },
        assessment: [
          q('Competing leads means:', ['VO and music fighting for attention', 'Perfect ducking', 'Clean SFX', 'Good silence'], 'VO and music fighting for attention'),
          q('Clipping audio sounds:', ['Smooth', 'Harsh/distorted from levels too hot', 'Always cinematic', 'Like silence'], 'Harsh/distorted from levels too hot'),
          q('SFX should:', ['Arrive every frame', 'Support moments without clutter', 'Replace story', 'Drown VO'], 'Support moments without clutter'),
          q('Client-safe music choices reduce:', ['Legal and platform risk', 'Emotion always', 'Need for mix', 'Captions'], 'Legal and platform risk'),
          q('Masters sound craft is:', ['Afterthought loudness wars', 'Intentional balance serving story', 'Stock noise', 'No checklist'], 'Intentional balance serving story'),
        ],
      },
      {
        title: 'Effects and Transitions with Restraint',
        duration: 30,
        intro:
          'Effects should motivate: emphasize a beat, hide a jump, or match brand motion language. Unmotivated transitions scream amateur template. Build a small approved effect set. If you remove an effect and the story holds, you probably did not need it.',
        practice: [
          q('Motivated effects:', ['Exist for their own spectacle', 'Serve a story or emphasis reason', 'Must appear every cut', 'Replace captions'], 'Serve a story or emphasis reason'),
          q('The removal test asks:', ['Whether story still holds without the effect', 'Whether more glow helps', 'Whether to ban all cuts', 'Whether to mute VO'], 'Whether story still holds without the effect'),
          q('Approved effect sets help teams:', ['Invent new chaos per editor', 'Stay on-brand and consistent', 'Ignore pacing', 'Skip hooks'], 'Stay on-brand and consistent'),
          q('Unmotivated transitions often:', ['Feel premium', 'Feel template-y and distracting', 'Clarify CTAs', 'Fix mix'], 'Feel template-y and distracting'),
          q('Brand motion language means:', ['Random trends weekly', 'Recognizable motion habits matching brand', 'No transitions ever', 'Only shake'], 'Recognizable motion habits matching brand'),
        ],
        project: {
          title: 'Effect Budget',
          description:
            'Create an effect budget for a brand: 3 allowed transitions, 2 emphasis effects, and a ban list. Apply the budget to a 20s cut description—justify each allowed effect in one line.',
        },
        assessment: [
          q('Emphasis effects work best:', ['On every word', 'On sparse key moments', 'Instead of hooks', 'Under all captions'], 'On sparse key moments'),
          q('Ban lists exist because:', ['Trends never hurt clarity', 'Some effects damage trust/readability', 'Editors lack taste forever', 'Platforms require them'], 'Some effects damage trust/readability'),
          q('Template-y feel comes from:', ['Motivated, sparse motion', 'Overused default packs without story link', 'Clean cuts', 'Good mix'], 'Overused default packs without story link'),
          q('Justification lines force:', ['Accountability for each effect', 'More spam', 'No brand rules', 'Silent videos'], 'Accountability for each effect'),
          q('Restraint is a:', ['Lack of skill', 'Mark of editorial control', 'Ban on creativity', 'Codec setting'], 'Mark of editorial control'),
        ],
      },
      {
        title: 'Export, Platforms, and Delivery QA',
        duration: 35,
        intro:
          'Delivery is part of craft: correct aspect ratio, length, loudness sanity, caption burn-in decisions, and thumbnail frame. QA on device. Keep a version log. Masters CapCut editors ship reliably across Instagram, TikTok, and YouTube Shorts without rework surprises.',
        practice: [
          q('Device QA catches:', ['Only desktop perfection', 'Crop, caption, and loudness issues on phones', 'Nothing useful', 'Only filename typos'], 'Crop, caption, and loudness issues on phones'),
          q('Thumbnail frames should:', ['Be random', 'Read clearly at small size', 'Ignore faces/subjects', 'Be the blurriest frame'], 'Read clearly at small size'),
          q('Version logs help when:', ['Clients request tweaks', 'You never iterate', 'Exports are perfect once', 'Platforms vanish'], 'Clients request tweaks'),
          q('Burn-in vs soft captions depends on:', ['Platform and workflow needs', 'Only taste', 'Ignoring accessibility', 'Music genre'], 'Platform and workflow needs'),
          q('Rework surprises often come from:', ['Checklists', 'Wrong specs discovered after publish', 'Device QA', 'Clear ratios'], 'Wrong specs discovered after publish'),
        ],
        project: {
          title: 'Multi-Platform Delivery Pack',
          description:
            'Produce a delivery pack plan for one video: 9:16 master specs, caption decision, thumbnail still description, 8-item QA checklist, and naming for v1/v2. Note one platform-specific tweak you would make.',
        },
        assessment: [
          q('Platform-specific tweaks might include:', ['Safe-zone or length adjustments', 'Changing the entire offer randomly', 'Deleting CTA always', 'Removing captions forever'], 'Safe-zone or length adjustments'),
          q('Loudness sanity means:', ['Painfully quiet or clipped peaks are fixed', 'Music always maxed', 'VO whispered', 'No ducking'], 'Painfully quiet or clipped peaks are fixed'),
          q('9:16 masters are common because:', ['Desktop only viewing', 'Vertical social is dominant for short-form', 'Print needs', 'Cinema only'], 'Vertical social is dominant for short-form'),
          q('Publish checklists reduce:', ['Consistency', 'Avoidable errors under deadline', 'QA', 'Versioning'], 'Avoidable errors under deadline'),
          q('End-to-end CapCut mastery ships:', ['Draft timelines forever', 'Platform-ready stories with disciplined polish', 'Effect demos only', 'No plans'], 'Platform-ready stories with disciplined polish'),
        ],
      },
    ],
  },

  // ─── 9. PROMPT ENGINEERING ────────────────────────────────
  {
    id: 'masters-prompt-engineering',
    title: 'Prompt Engineering Masters Class',
    description:
      'A full prompt-engineering apprenticeship: patterns that transfer across Codex, Claude, Perplexity, and creative AI—specs, evaluation, libraries, failure diagnosis, and team standards end to end.',
    color: '2563EB',
    short: 'Prompts',
    lessons: [
      {
        title: 'Universal Prompt Anatomy',
        duration: 25,
        intro:
          'Across tools, strong prompts share anatomy: goal, context, constraints, examples, and output format. Tool differences matter, but structure travels. This apprenticeship builds a cross-tool prompting system you can teach—not trivia for one chatbot.',
        practice: [
          q('Universal anatomy usually includes:', ['Only emojis', 'Goal, context, constraints, format', 'Passwords', 'No examples ever'], 'Goal, context, constraints, format'),
          q('Examples help models:', ['Ignore patterns', 'Match desired shape and style', 'Delete constraints', 'Skip goals'], 'Match desired shape and style'),
          q('Constraints reduce:', ['All creativity forever', 'Off-brief and unsafe output', 'Need for goals', 'Context use'], 'Off-brief and unsafe output'),
          q('Format instructions matter when:', ['Nothing consumes the output', 'Humans/tools must reuse the result', 'You ban structure', 'Stakes are zero always'], 'Humans/tools must reuse the result'),
          q('Cross-tool mastery means:', ['Memorizing one UI', 'Patterns that transfer with local adaptation', 'No evaluation', 'Secret personal slang'], 'Patterns that transfer with local adaptation'),
        ],
        project: {
          title: 'Anatomy Cheatsheet',
          description:
            'Design a one-page cheatsheet with the universal prompt blocks and 2 example prompts (coding + writing) showing each block labeled in comments or brackets.',
        },
        assessment: [
          q('Context without a goal tends to produce:', ['Focused action', 'Wandering answers', 'Perfect formats', 'Strong constraints'], 'Wandering answers'),
          q('Local adaptation means:', ['Ignoring tool strengths', 'Tuning the same pattern to Claude vs Codex vs Perplexity', 'Copy-pasting blindly', 'No format'], 'Tuning the same pattern to Claude vs Codex vs Perplexity'),
          q('Teaching prompts requires:', ['Hidden folklore', 'Explicit reusable structure', 'One-off chats only', 'No examples'], 'Explicit reusable structure'),
          q('Unsafe output risk is lowered by:', ['Clear constraints and refusal boundaries', 'More vagueness', 'No review', 'Hidden goals'], 'Clear constraints and refusal boundaries'),
          q('Masters prompting starts with:', ['Tool worship', 'Clear intent and structure', 'Longest prompt wins', 'No cheatsheets'], 'Clear intent and structure'),
        ],
      },
      {
        title: 'Patterns: Plan, Critique, Extract, Transform',
        duration: 30,
        intro:
          'Reusable patterns beat clever one-liners: plan-then-act, red-team critique, extract-to-schema, and transform-with-invariants. Name your patterns. Combine them into pipelines. Pattern literacy is how teams scale prompting skill.',
        practice: [
          q('Plan-then-act reduces:', ['Thoughtfulness', 'Blind jumping into wrong solutions', 'Need for goals', 'All speed'], 'Blind jumping into wrong solutions'),
          q('Red-team critique asks the model to:', ['Only praise', 'Attack weaknesses of a draft', 'Delete evidence', 'Ignore risks'], 'Attack weaknesses of a draft'),
          q('Extract-to-schema is for:', ['Poetry only', 'Pulling fields into a consistent structure', 'Hiding data', 'Random prose'], 'Pulling fields into a consistent structure'),
          q('Transform-with-invariants means:', ['Change anything freely', 'Rewrite while preserving must-keep facts/behavior', 'No constraints', 'Drop the audience'], 'Rewrite while preserving must-keep facts/behavior'),
          q('Naming patterns helps teams:', ['Forget them', 'Call for the right move quickly', 'Hide pipelines', 'Avoid reuse'], 'Call for the right move quickly'),
        ],
        project: {
          title: 'Pattern Cards',
          description:
            'Create four pattern cards (Plan, Critique, Extract, Transform). Each card: when to use, template prompt, failure mode, and one mini example in your domain.',
        },
        assessment: [
          q('Pipelines combine patterns when:', ['Tasks are multi-stage', 'One emoji suffices', 'No output is needed', 'Tools are offline forever'], 'Tasks are multi-stage'),
          q('Critique before final draft helps catch:', ['Only typos later', 'Structural and logical holes early', 'Perfect praise', 'No risks'], 'Structural and logical holes early'),
          q('Schema extraction fails when schemas are:', ['Clear', 'Ambiguous or overloaded', 'Documented', 'Tested'], 'Ambiguous or overloaded'),
          q('Invariants should be:', ['Listed explicitly', 'Assumed telepathically', 'Optional always', 'Secret'], 'Listed explicitly'),
          q('Pattern literacy scales skill because:', ['Everyone reinvents prompting', 'Shared moves compound', 'Tools ban templates', 'Evaluation dies'], 'Shared moves compound'),
        ],
      },
      {
        title: 'Tool-Specific Adaptation',
        duration: 30,
        intro:
          'Same anatomy, different accents: Codex wants interfaces and tests; Claude wants long-context contracts; Perplexity wants query precision and citations; creative tools want visual constraints. Learn adapters, not entirely new religions per app.',
        practice: [
          q('Codex prompts should emphasize:', ['Only mood boards', 'Interfaces, constraints, and verification', 'Citations only', 'Lens flares'], 'Interfaces, constraints, and verification'),
          q('Perplexity prompts should emphasize:', ['Secret APIs', 'Query precision and source needs', 'Unit tests', 'Auto Layout'], 'Query precision and source needs'),
          q('Creative AI prompts should emphasize:', ['SQL indexes', 'Subject, style, camera/composition constraints', 'Jest configs', 'Citation ledgers'], 'Subject, style, camera/composition constraints'),
          q('Adapters are:', ['Whole new frameworks per button', 'Small modifications of a shared core', 'Useless', 'Only for Claude'], 'Small modifications of a shared core'),
          q('Claude often benefits from:', ['No structure', 'Long-context packs and output contracts', 'Ignoring assumptions', 'No critique'], 'Long-context packs and output contracts'),
        ],
        project: {
          title: 'Four-Adapter Pack',
          description:
            'Take one task (launch a workshop). Write four adapted prompts: Codex (landing page component), Claude (email + FAQ), Perplexity (competitor scan), Higgsfield/Canva-style (visual motion brief). Keep shared goal language consistent.',
        },
        assessment: [
          q('Shared goal language across adapters ensures:', ['Drift of intent', 'Comparable outcomes toward one objective', 'Random metrics', 'No evaluation'], 'Comparable outcomes toward one objective'),
          q('Wrong accent (e.g., citation asks to Codex) wastes:', ['Nothing', 'Tokens and attention on mismatched strengths', 'Only fonts', 'Only seeds'], 'Tokens and attention on mismatched strengths'),
          q('Tool religions fail because:', ['Tools never change', 'They block transfer learning', 'Adapters are illegal', 'Patterns do not exist'], 'They block transfer learning'),
          q('Visual briefs still need:', ['Anatomy: goal/constraints/format', 'No constraints', 'Only “make pretty”', 'Unit tests'], 'Anatomy: goal/constraints/format'),
          q('Masters adapters feel:', ['Incoherent', 'Same spine, local dialect', 'Copy-identical always', 'Anti-pattern'], 'Same spine, local dialect'),
        ],
      },
      {
        title: 'Evaluation: Rubrics, Tests, and Blind Spots',
        duration: 35,
        intro:
          'If you cannot evaluate, you cannot improve prompts. Build rubrics: correctness, completeness, format compliance, and risk. Use golden examples. Watch for sycophancy and confident wrongness. Evaluation is the difference between tinkering and engineering.',
        practice: [
          q('Rubrics make quality:', ['Subjective only forever', 'Discussable and comparable', 'Impossible', 'Hidden'], 'Discussable and comparable'),
          q('Golden examples are:', ['Random chats', 'Known-good input/output pairs for regression', 'Secrets', 'Only failures'], 'Known-good input/output pairs for regression'),
          q('Sycophancy means:', ['Critical pushback', 'Agreeableness that hides hard truths', 'Perfect citation', 'Format compliance'], 'Agreeableness that hides hard truths'),
          q('Format compliance checks whether:', ['Facts are true', 'The shape matches the contract', 'Tone is funny', 'Sources exist'], 'The shape matches the contract'),
          q('Confident wrongness is dangerous because:', ['It is easy to spot always', 'Fluency masks errors', 'Rubrics ban it', 'Tests love it'], 'Fluency masks errors'),
        ],
        project: {
          title: 'Rubric + Golden Set',
          description:
            'Write a 4-criterion rubric for a research brief prompt. Create 2 golden examples (good/bad). Score a third sample answer and list prompt changes suggested by the scores.',
        },
        assessment: [
          q('Regression in prompting means:', ['Never retesting', 'Re-checking golden cases after edits', 'Deleting rubrics', 'Only vibes'], 'Re-checking golden cases after edits'),
          q('Completeness differs from correctness by asking:', ['Whether required parts are present', 'Only spelling', 'Only tone', 'Only speed'], 'Whether required parts are present'),
          q('Risk criteria might include:', ['Overclaiming and missing caveats', 'Font size', 'Emoji count', 'Seed values'], 'Overclaiming and missing caveats'),
          q('Prompt changes should be driven by:', ['Scored failures', 'Random rewrites', 'Longer text always', 'More adjectives'], 'Scored failures'),
          q('Engineering mindset treats prompts as:', ['Unmeasurable spells', 'Artifacts under test', 'One-off jokes', 'UI themes'], 'Artifacts under test'),
        ],
      },
      {
        title: 'Failure Diagnosis and Repair Loops',
        duration: 35,
        intro:
          'Diagnose failures by class: missing context, conflicting instructions, underspecified format, wrong tool, or evaluation mismatch. Repair with the smallest change. Keep a failure diary. Pros debug prompts; amateurs just rephrase forever.',
        practice: [
          q('Conflicting instructions often cause:', ['Perfect obedience', 'Unstable or compromised outputs', 'Better citations', 'Cleaner schemas'], 'Unstable or compromised outputs'),
          q('Smallest change repairs help you:', ['Learn what fixed it', 'Obscure causality', 'Maximize tokens always', 'Skip diagnosis'], 'Learn what fixed it'),
          q('Wrong-tool failures need:', ['Louder prompts to the same tool', 'Switching or adapting to a better-fit tool', 'No brief', 'Deleting goals'], 'Switching or adapting to a better-fit tool'),
          q('Failure diaries capture:', ['Only successes', 'Class of failure and fix', 'Passwords', 'Nothing actionable'], 'Class of failure and fix'),
          q('Rephrasing forever without diagnosis is:', ['Engineering', 'Amateur thrash', 'Rubric-driven', 'Golden testing'], 'Amateur thrash'),
        ],
        project: {
          title: 'Failure Diary Starter',
          description:
            'Log five realistic prompt failures (invented OK): class, evidence, smallest fix, and a prevention rule for your template library.',
        },
        assessment: [
          q('Missing context symptoms include:', ['Generic advice and invented details', 'Perfect citations always', 'Exact file diffs', 'Strict schema fit'], 'Generic advice and invented details'),
          q('Underspecified format yields:', ['Reliable tables', 'Inconsistent shapes', 'Guaranteed JSON', 'No prose'], 'Inconsistent shapes'),
          q('Prevention rules belong in:', ['Folklore only', 'Templates and checklists', 'Deleted diaries', 'Secret chats'], 'Templates and checklists'),
          q('Evidence in a failure log might be:', ['The bad output excerpt and what was asked', 'Only “it failed”', 'A vibe', 'A seed alone'], 'The bad output excerpt and what was asked'),
          q('Masters repair loops are:', ['Random', 'Classified, minimal, and recorded', 'Maximal rewrites always', 'Tool-blaming only'], 'Classified, minimal, and recorded'),
        ],
      },
      {
        title: 'Libraries, Governance, and Team Standards',
        duration: 40,
        intro:
          'Ship a prompt library with owners, versioning, and allowed tools. Define review rules for high-risk prompts. Teach onboarding with pattern cards. Governance keeps speed from becoming unmanaged risk—masters prompt engineering is organizational.',
        practice: [
          q('Owners of prompts ensure:', ['Nobody maintains them', 'Someone updates when tools change', 'Secrets in prompts', 'No versions'], 'Someone updates when tools change'),
          q('High-risk prompts need:', ['Zero review', 'Extra evaluation and approval', 'Public passwords', 'No rubrics'], 'Extra evaluation and approval'),
          q('Versioning libraries prevents:', ['Traceability', 'Silent drift and broken dependents', 'Onboarding', 'Pattern reuse'], 'Silent drift and broken dependents'),
          q('Onboarding with pattern cards speeds:', ['Confusion', 'Shared vocabulary for new teammates', 'Private folklore', 'Tool lock-in only'], 'Shared vocabulary for new teammates'),
          q('Governance exists to:', ['Ban all AI', 'Balance leverage with risk control', 'Delete evaluation', 'Hide failures'], 'Balance leverage with risk control'),
        ],
        project: {
          title: 'Team Prompt Standard',
          description:
            'Write a 1–2 page standard: library structure, naming, version policy, risk tiers, required rubric for publish-tier prompts, and a monthly review agenda.',
        },
        assessment: [
          q('Risk tiers might separate:', ['Explore vs customer-facing outputs', 'Only font choices', 'All prompts identical', 'No tools'], 'Explore vs customer-facing outputs'),
          q('Silent drift hurts when:', ['Dependents still assume old behavior', 'Nobody uses prompts', 'Versions are explicit', 'Owners exist'], 'Dependents still assume old behavior'),
          q('Monthly reviews should look for:', ['Stale prompts and repeated failures', 'Only new emojis', 'Deleting diaries', 'No metrics'], 'Stale prompts and repeated failures'),
          q('Organizational mastery means:', ['One genius prompter', 'Shared standards others can run', 'Hidden libraries', 'No adapters'], 'Shared standards others can run'),
          q('End-to-end prompt engineering ships:', ['Chat folklore', 'Evaluated, versioned, governed prompt systems', 'One-liners', 'Tool wars'], 'Evaluated, versioned, governed prompt systems'),
        ],
      },
      {
        title: 'Capstone Patterns: Multi-Tool Playbooks',
        duration: 40,
        intro:
          'Combine patterns into playbooks that span research → brief → assets → motion → edit. Assign each stage a tool and a prompt pattern. Define handoff artifacts. This lesson bridges into the Creative AI Capstone with portable prompting discipline.',
        practice: [
          q('Playbooks span tools by:', ['Ignoring handoffs', 'Defining stages, tools, and artifacts', 'Using one chat only', 'Skipping evaluation'], 'Defining stages, tools, and artifacts'),
          q('Handoff artifacts prevent:', ['Guesswork between stages', 'Clear ownership', 'Rubrics', 'Versioning'], 'Guesswork between stages'),
          q('Research → brief → assets is an example of:', ['Random order', 'A staged creative pipeline', 'A single prompt', 'A codec'], 'A staged creative pipeline'),
          q('Portable discipline means:', ['Prompts only work once', 'Patterns survive tool changes', 'No libraries', 'No adapters'], 'Patterns survive tool changes'),
          q('Assigning tools per stage reduces:', ['Fit', 'Using the wrong strength for the job', 'Clarity', 'Speed with quality'], 'Using the wrong strength for the job'),
        ],
        project: {
          title: 'Multi-Tool Playbook v1',
          description:
            'Draft a playbook for launching a 30s course promo: stages, tool per stage, prompt pattern, artifact out, and rubric checkpoint. Keep it to one page if possible.',
        },
        assessment: [
          q('Rubric checkpoints between stages catch:', ['Errors before they cascade', 'Only final publish issues', 'Nothing', 'Only color'], 'Errors before they cascade'),
          q('Wrong-strength tool use looks like:', ['Perplexity for unit tests; Codex for web citations', 'Matched strengths', 'Clear adapters', 'Good handoffs'], 'Perplexity for unit tests; Codex for web citations'),
          q('One-page playbooks help because:', ['They stay usable under deadline', 'Longer is always better', 'They hide stages', 'They ban artifacts'], 'They stay usable under deadline'),
          q('This lesson prepares Capstone by:', ['Isolating tools forever', 'Practicing integrated prompting ops', 'Skipping motion', 'Removing rubrics'], 'Practicing integrated prompting ops'),
          q('Masters prompting at pipeline scale is:', ['Single-chat heroics', 'Orchestrated patterns with artifacts', 'No stages', 'Anti-governance'], 'Orchestrated patterns with artifacts'),
        ],
      },
    ],
  },

  // ─── 10. CREATIVE AI CAPSTONE ──────────────────────────────
  {
    id: 'masters-creative-ai-capstone',
    title: 'Creative AI Capstone Masters',
    description:
      'A full Creative AI Capstone apprenticeship: integrate Claude, Perplexity, Figma/Canva, Higgsfield, and CapCut into one end-to-end campaign—from research brief to shipped multi-asset launch.',
    color: 'DC2626',
    short: 'Capstone',
    lessons: [
      {
        title: 'Capstone Mission and Success Criteria',
        duration: 25,
        intro:
          'The capstone is an integrated studio project: pick a real-enough product or course launch and ship a coherent campaign across research, copy, design, motion, and edit. Define success criteria and non-goals up front. Masters work is judged by the system you ran, not a single pretty frame.',
        practice: [
          q('Capstone success should be defined by:', ['One filter', 'Criteria across research, assets, and coherence', 'Only likes', 'Tool count alone'], 'Criteria across research, assets, and coherence'),
          q('Non-goals prevent:', ['Scope focus', 'Endless expansion', 'Clear CTAs', 'Handoffs'], 'Endless expansion'),
          q('Coherence means:', ['Random styles per asset', 'Unified message and look across pieces', 'No captions', 'No brief'], 'Unified message and look across pieces'),
          q('Judging the system means valuing:', ['Only final polish luck', 'Process artifacts and decisions', 'Hidden prompts', 'No retros'], 'Process artifacts and decisions'),
          q('Real-enough projects beat toys because:', ['Stakes teach tradeoffs', 'Toys teach more governance', 'Criteria do not matter', 'Tools ban realism'], 'Stakes teach tradeoffs'),
        ],
        project: {
          title: 'Capstone Charter',
          description:
            'Write a charter: product/offer, audience, success criteria (5), non-goals, channels, and a one-sentence campaign promise. Get a peer (or yourself in critic mode) to stress-test scope.',
        },
        assessment: [
          q('A campaign promise should be:', ['Vague inspiration', 'A clear audience-facing value line', 'A tool list', 'A secret'], 'A clear audience-facing value line'),
          q('Five criteria help because:', ['One metric hides tradeoffs', 'You can score the integrated outcome', 'Rubrics are illegal', 'Scope must be infinite'], 'You can score the integrated outcome'),
          q('Channels chosen early constrain:', ['Sizes, length, and CTA patterns', 'Nothing', 'Only research', 'Only code'], 'Sizes, length, and CTA patterns'),
          q('Critic-mode stress tests catch:', ['Comfortable scope lies', 'Perfect charters always', 'No risks', 'Only typos'], 'Comfortable scope lies'),
          q('Capstone mindset is:', ['Tool tourism', 'Integrated shipping under constraints', 'Single-app drills only', 'No criteria'], 'Integrated shipping under constraints'),
        ],
      },
      {
        title: 'Research Spine with Perplexity + Claude',
        duration: 35,
        intro:
          'Start with Perplexity for sourced landscape and Claude for synthesis into a decision brief. Build a claim ledger. Your campaign message must survive contact with evidence. Capstone research is the spine everything else hangs on.',
        practice: [
          q('Perplexity’s job in capstone research is:', ['Final copy tone only', 'Sourced landscape and candidates', 'Auto Layout', 'Color grades'], 'Sourced landscape and candidates'),
          q('Claude’s job often is:', ['Raw web crawl only', 'Synthesis into a defendable brief', 'Export MP4s', 'Caption burn-in'], 'Synthesis into a defendable brief'),
          q('Claim ledgers protect campaigns from:', ['Evidence', 'Overclaiming', 'Good CTAs', 'Brand kits'], 'Overclaiming'),
          q('Message vs evidence conflict should trigger:', ['Louder ads', 'Message revision', 'Ignoring sources', 'More effects'], 'Message revision'),
          q('Research spine means:', ['Optional appendix', 'Foundational brief driving creative', 'Only moodboards', 'Only seeds'], 'Foundational brief driving creative'),
        ],
        project: {
          title: 'Evidence Brief',
          description:
            'Deliver a 1-page evidence brief: audience insight, 5 verified claims with sources, 3 open questions, and a recommended campaign angle with kill criteria if evidence is weak.',
        },
        assessment: [
          q('Kill criteria on angles prevent:', ['Sunk-cost creative', 'Honest pivots', 'Source use', 'Briefs'], 'Sunk-cost creative'),
          q('Open questions should influence:', ['What you refuse to claim in ads', 'Nothing downstream', 'Only fonts', 'Only transitions'], 'What you refuse to claim in ads'),
          q('Audience insight is stronger when:', ['It is stereotype-only', 'Tied to evidence and jobs-to-be-done', 'Copied from unrelated niches', 'Tool-generated without review'], 'Tied to evidence and jobs-to-be-done'),
          q('Defendable briefs enable:', ['Designers/editors to align', 'Random freelancing styles', 'Hidden claims', 'No CTAs'], 'Designers/editors to align'),
          q('Skipping research in capstone usually yields:', ['Coherent truth-based campaigns', 'Pretty but brittle messaging', 'Stronger ledgers', 'Better governance'], 'Pretty but brittle messaging'),
        ],
      },
      {
        title: 'Message System and Copy Pipeline',
        duration: 30,
        intro:
          'Turn the brief into a message system: promise, proof points, objections, CTA. Use Claude for draft/critique passes. Lock voice. Every asset should map to the system—no orphan slogans.',
        practice: [
          q('A message system includes:', ['Only a logo', 'Promise, proof, objections, CTA', 'Only hex codes', 'Only LUTs'], 'Promise, proof, objections, CTA'),
          q('Objection handling in copy:', ['Is optional fluff', 'Pre-empts reasons not to act', 'Replaces proof', 'Bans CTAs'], 'Pre-empts reasons not to act'),
          q('Orphan slogans are:', ['Mapped to proof', 'Lines that do not connect to the system', 'Always on-brand', 'Evidence-based'], 'Lines that do not connect to the system'),
          q('Voice lock means:', ['New persona per asset', 'Consistent tone rules across pieces', 'No critique', 'Only slang'], 'Consistent tone rules across pieces'),
          q('Critique passes should check:', ['Only adjective count', 'Claim safety and clarity vs brief', 'Only emoji', 'Export size'], 'Claim safety and clarity vs brief'),
        ],
        project: {
          title: 'Message House',
          description:
            'Build a message house one-pager and three derivative copies: feed caption, story text, and 15s VO script—all mapped to the same promise/proof/CTA with voice notes.',
        },
        assessment: [
          q('Derivative copies should:', ['Contradict the promise', 'Adapt length/channel while keeping core truth', 'Invent new offers each time', 'Drop CTA always'], 'Adapt length/channel while keeping core truth'),
          q('Proof points must be:', ['Vague superlatives only', 'Specific and evidence-aligned', 'Hidden', 'Unrelated jokes'], 'Specific and evidence-aligned'),
          q('VO scripts need:', ['Unreadable density', 'Speakable rhythm and caption compatibility', 'No beats', 'Five promises'], 'Speakable rhythm and caption compatibility'),
          q('Claim safety review asks:', ['Can we defend this publicly?', 'Is it louder?', 'Is it trendier?', 'Is it longer?'], 'Can we defend this publicly?'),
          q('Message systems make teams:', ['Faster and more coherent', 'More chaotic', 'Tool-dependent only', 'Research-averse'], 'Faster and more coherent'),
        ],
      },
      {
        title: 'Static Design System: Figma or Canva',
        duration: 35,
        intro:
          'Choose Figma for UI-ish systems or Canva for marketing production speed—or use both with clear roles. Build a mini brand/layout system and produce the static set (feed + story at minimum). Design must express the message house, not decorate around it.',
        practice: [
          q('Tool choice should follow:', ['Habit only', 'Artifact type and team constraints', 'Whatever is trendiest', 'Avoiding Brand Kits'], 'Artifact type and team constraints'),
          q('Static sets at minimum often need:', ['One mystery size', 'Feed and story (or channel equivalents)', 'Only print billboards', 'No CTA'], 'Feed and story (or channel equivalents)'),
          q('Design expressing message means:', ['Pretty unrelated art', 'Hierarchy that sells the promise/CTA', 'Max effects', 'Tiny logos only'], 'Hierarchy that sells the promise/CTA'),
          q('Clear roles for Figma vs Canva prevent:', ['Duplicated conflicting systems', 'Useful specialization', 'Handoffs', 'Brand kits'], 'Duplicated conflicting systems'),
          q('Mini systems beat one-offs because:', ['Campaigns need consistent resizing', 'One-offs scale perfectly', 'QA is unnecessary', 'Messages change per pixel randomly'], 'Campaigns need consistent resizing'),
        ],
        project: {
          title: 'Static Campaign Set',
          description:
            'Produce feed + story statics from your message house. Include a tiny foundations note (colors/type) and a 5-item design QA list you run before motion.',
        },
        assessment: [
          q('Design QA before motion saves:', ['Regenerating mismatched looks later', 'Nothing', 'Only captions', 'Only research'], 'Regenerating mismatched looks later'),
          q('Foundations notes help Higgsfield/CapCut by:', ['Providing look constraints', 'Confusing editors', 'Banning exports', 'Removing CTAs'], 'Providing look constraints'),
          q('CTA visibility is a:', ['Decoration choice', 'Conversion-critical design requirement', 'Optional flourish', 'Research-only concern'], 'Conversion-critical design requirement'),
          q('Conflicting Figma/Canva systems cause:', ['Brand drift', 'Cleaner handoffs', 'Faster QA', 'Stronger promises'], 'Brand drift'),
          q('Masters static work in capstone is:', ['Isolated Dribbble shots', 'Message-driven, resizable campaign assets', 'No QA', 'Tool flexing'], 'Message-driven, resizable campaign assets'),
        ],
      },
      {
        title: 'Motion with Higgsfield + Edit in CapCut',
        duration: 40,
        intro:
          'Generate motion under the look bible derived from statics. Select for editability. Assemble in CapCut with captions and mix. The capstone proves you can move from still system to timed story without losing the promise.',
        practice: [
          q('Look bible from statics ensures:', ['Motion ignores brand', 'Continuity into video', 'Random new palettes', 'No selection'], 'Continuity into video'),
          q('Editability-focused selection prefers:', ['Unusable morphs', 'Clips that cut into narrative beats', 'Longest only', 'No hooks'], 'Clips that cut into narrative beats'),
          q('Captions in capstone must reflect:', ['Random jokes', 'Message house language', 'Only trends', 'No CTA ever'], 'Message house language'),
          q('Losing the promise in edit means:', ['Success', 'Failure of integration', 'Good pacing optional', 'Strong research'], 'Failure of integration'),
          q('Timed story craft includes:', ['Hook pacing and payoff', 'Only filters', 'No mix', 'No exports'], 'Hook pacing and payoff'),
        ],
        project: {
          title: '20–30s Integrated Spot',
          description:
            'Ship a 20–30s captioned spot: Higgsfield selects (or detailed shot plan if simulating), CapCut assembly notes, music energy, and a continuity check against statics. Include before/after if you revised the message after seeing motion.',
        },
        assessment: [
          q('Continuity checks compare:', ['Video vs static palette/identity/CTA', 'Only file sizes', 'Only seeds', 'Only fonts in docs'], 'Video vs static palette/identity/CTA'),
          q('Revising message after motion can be:', ['Honest iteration when visuals reveal weakness', 'Always forbidden', 'Proof research was useless', 'A caption bug'], 'Honest iteration when visuals reveal weakness'),
          q('Assembly notes help when:', ['You solo forever with perfect memory', 'Collaborators or future you rebuild the cut', 'No versions exist', 'QA is skipped'], 'Collaborators or future you rebuild the cut'),
          q('Music energy should support:', ['The emotional arc of the promise', 'Random genre flex', 'Clipping VO', 'Hiding CTA'], 'The emotional arc of the promise'),
          q('Integrated spot success is:', ['Effects density', 'Coherent story from research to export', 'Longest runtime', 'Most tools opened'], 'Coherent story from research to export'),
        ],
      },
      {
        title: 'QA, Packaging, and Launch Retro',
        duration: 40,
        intro:
          'Package the campaign: brief, message house, statics, motion, edit master, and claims appendix. Run a cross-asset QA. Launch (or simulated launch) with a retro: what the system learned. Capstone mastery is a repeatable studio loop, not a one-off miracle.',
        practice: [
          q('Cross-asset QA looks for:', ['Isolated perfection only', 'Coherence breaks across pieces', 'Only typos in one file', 'Tool logos'], 'Coherence breaks across pieces'),
          q('Claims appendix supports:', ['Legal/trust review of public lines', 'Hiding sources', 'More slogans', 'No CTAs'], 'Legal/trust review of public lines'),
          q('Packaging for stakeholders should be:', ['A dump of raw chats', 'A navigable kit with owners', 'Secret only', 'Untitled exports'], 'A navigable kit with owners'),
          q('Retros convert projects into:', ['Amnesia', 'Improved playbooks', 'Deleted criteria', 'Tool bans'], 'Improved playbooks'),
          q('Repeatable studio loops mean:', ['You can run the system again with less chaos', 'Every campaign reinvents process', 'No QA', 'No charter'], 'You can run the system again with less chaos'),
        ],
        project: {
          title: 'Launch Kit + Retro',
          description:
            'Submit a launch kit index (links/titles for each artifact), a 10-item cross-asset QA checklist with pass/fail, and a one-page retro: wins, failures by stage, and three playbook updates for next time.',
        },
        assessment: [
          q('Pass/fail QA forces:', ['Honest readiness calls', 'Infinite polish debates only', 'Skipping claims', 'No owners'], 'Honest readiness calls'),
          q('Failures by stage in retros help:', ['Blame individuals only', 'Target process fixes', 'Hide tool issues', 'Delete research'], 'Target process fixes'),
          q('Playbook updates are the:', ['Real lasting output of capstone', 'Optional fluff', 'Enemy of craft', 'Replacement for shipping'], 'Real lasting output of capstone'),
          q('Navigable kits reduce:', ['Onboarding cost for reviewers', 'Clarity', 'QA', 'Version sense'], 'Onboarding cost for reviewers'),
          q('End-to-end Creative AI mastery is:', ['Touring every app once', 'Shipping coherent campaigns with governed process', 'One viral edit', 'Prompt folklore'], 'Shipping coherent campaigns with governed process'),
        ],
      },
    ],
  },
];

for (const c of courses) writeCourse(c);
console.log('done:', courses.length, 'courses');
