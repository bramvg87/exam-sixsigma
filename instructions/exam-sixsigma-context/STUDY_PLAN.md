# Preparation strategy - Six Sigma BB Module 3

Principle: the toolkit is your safety net, not your study method. The exam rewards (1) recognising which method fits a question and (2) motivating the answer in 2-3 sentences. Build the tool in parallel, study in the meantime, and use the tool for practice so that you know it blindfolded on exam day.

## Tonight (20 min)
1. Unzip this package into the root of `exam-sixsigma`, copy the "must have" files from `COPY_FROM_DRIVE.md` into `reference/drive/`, commit.
2. Start Claude Code in the repo with the kickoff prompt from `README.md`. Let it do Task 0 (merge formularium) and Phase 1.
3. Set the Drive folder to "available offline" / download it to the laptop.

## Tomorrow
| Block | Time | What | Output |
|---|---|---|---|
| 1 | 1h30 | Sample exam as a dry run, 90 min, with Excel and the formularium only (no tool). Then compare with the worked solutions. | You see where you lose time; note it for Claude Code |
| 2 | 45 min | Read `formularium_aanvulling.md`: the corrections (A1 F-ratio bounds, A3 exact proportion CI, A5-A6 SPC) and the new test recipes | Formularium up to date in your head |
| 3 | 45 min | Test the Phase 1 build: acceptance checklist in BUILD_SPEC section 7, Wi-Fi off. Give Claude Code concrete feedback, start Phase 2 | v1 tagged |
| 4 | 2h | Topics NOT examined in 2025 (likely now): regression + ANOVA + DOE (De Vuyst Excel solutions), GRR average & range + ANOVA, acceptance sampling OC-curves. Re-do one course exercise per topic, check with the tool | Confidence on the "rotating" topics |
| 5 | 1h | SPC exercises 1-6 and capability exercises (slides 42, 75-87); conceptual true/false drills (ask Claude for 20 statements in the style of Q1) | Fast recognition |
| 6 | 30 min | Exam kit: final `release/sixsigma-toolkit.html` on desktop + USB stick, self-test page green, Drive offline, printed "Spiekbrief", charger | Ready |

## Exam day rules of thumb
- Read all questions first; start with the conceptual ones (fast points).
- For every calculation write: formula -> numbers substituted -> result -> conclusion in words. The tool's "Examenantwoord" box gives you the sentence; adapt, do not copy blindly.
- Always state assumptions (normal, independent, equal variances, n*pi >= 5, which sigma estimate, which variance in the numerator).
- If a value is ambiguous (e.g. 6-sigma criterion, E[T] in hours), give the main answer and one line on the alternative.
