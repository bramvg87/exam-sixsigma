# CLAUDE.md - exam-sixsigma

Read `BUILD_SPEC.md` first; it is the source of truth for scope, priorities and acceptance tests.

## Context
- Bram studies for the UGAIN Lean Six Sigma Black Belt, Module 3 exam (open book, own PC, no internet).
- This repo builds ONE offline HTML toolkit (`dist/index.html`, copied to `release/sixsigma-toolkit.html`).
- Course language is Dutch: UI and exam-answer texts in Dutch; code, comments and commit messages in English.

## Rules
- Correctness first: all stats must pass `testdata/golden_values.json`. Never "fix" a test by changing expected values; if you believe a golden value is wrong, write it in `DECISIONS.md` and ask.
- No network dependencies at runtime. Everything inlined. Verify by opening the built file with networking disabled.
- Do not use em-dashes in any user-facing text or documentation; use a normal hyphen.
- Reuse logic from `reference/drive/ANOVA Tool/index.html` and `reference/drive/Hypothesis tester/index2.html` where it is verified; replace their low-precision erf.
- Commit after each module with a working build. Tag `v1-exam-ready` once Phase 1 (M0-M5) passes.

## Layout
- `src/stats/` engine, `src/components/` grid and result panel, `src/modules/` one folder per module.
- `content/formularium.md` merged formula sheet (Task 0).
- `reference/` course context (exam, scope, addendum, copied Drive files).
- `testdata/` golden values and example datasets.
