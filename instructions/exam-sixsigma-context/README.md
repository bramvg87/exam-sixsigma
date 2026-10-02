# exam-sixsigma - context package

Context for building an offline Six Sigma Black Belt exam toolkit with Claude Code, plus a revised formularium.

## Contents
| File | Purpose |
|---|---|
| `CLAUDE.md` | Repo instructions Claude Code reads automatically |
| `BUILD_SPEC.md` | Full spec: requirements, modules (priority order), tests, work plan |
| `STUDY_PLAN.md` | Preparation strategy and schedule |
| `COPY_FROM_DRIVE.md` | Which Drive files to add to `reference/drive/` before starting |
| `reference/formularium_aanvulling.md` | Formularium revision: 9 corrections + 11 new sections (Dutch) |
| `reference/voorbeeldexamen.md` | Sample exam 2025 as text |
| `reference/course_scope.md` | Lesson-by-lesson scope, source map, exam weights |
| `testdata/golden_values.json` | 25 verified test cases (scipy = Excel) |
| `testdata/make_golden.py` | Regenerates the golden values |
| `testdata/*.csv` | Course datasets (SPC ex. 2 and 3, Ottoy t-test and chi2 data), Dutch decimal commas |

## Kickoff prompt for Claude Code
> Read CLAUDE.md and BUILD_SPEC.md. Start with Task 0 (merge reference/formularium_aanvulling.md into reference/drive/Tools and formularia/formularium.md -> content/formularium.md). Then scaffold the single-file Vite build, implement the stats engine and make all tests in testdata/golden_values.json pass before building UI. Then deliver Phase 1 (M0-M5), build, commit release/sixsigma-toolkit.html and tag v1-exam-ready. Log decisions in DECISIONS.md. Continue with Phase 2 in the listed order.
