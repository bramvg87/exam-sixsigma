# Decisions log

Choices made while building, so Bram can check them. Newest at the bottom.

## Missing inputs
- **Drive files not available.** `reference/drive/` is empty: the original `formularium.md`, the ANOVA tool, the hypothesis tester and `Six_Sigma_BB_Module3_Worked_Solutions.md` were not copied in. Consequences:
  - `content/formularium.md` was written from scratch from the course scope, the addendum and the golden values, with corrections A1-A9 applied in place and sections B1-B11 inserted. Wording and section lettering are new, so the addendum's references ("Les 2.D") only roughly match. **Action for Bram:** when the original is available, compare or re-run the merge.
  - `content/voorbeeldexamen_oplossingen.md` was written from `reference/voorbeeldexamen.md` and the verified numbers. Q2 uses the example variances (s1² = 0,004, s2² = 0,015) because the Excel data is not in the docx.
  - ANOVA, two-way ANOVA and GRR-ANOVA are implemented from the textbook formulas (`src/calc/anova.ts`), not ported. The "identical to the ANOVA tool examples" check (spec 7.3) could not be run.
- No PDF export of the formularium: pandoc is not installed. Use the print button on the Formularium page (print CSS included) and "Save as PDF".

## Numerics
- Normal CDF via erfc = Q(1/2, x²) (regularised incomplete gamma, Lentz continued fraction), not Abramowitz-Stegun. Inverse normal: Acklam + 3 Halley steps. All t/χ²/F/beta inverses by bisection on the CDF (lower tail) or survival function (upper tail), so tail quantiles keep full precision. Noncentral t: Lenth's AS 243 series. Checked against scipy: relative errors 1e-14 to 1e-16 (hypergeometric 2e-12).
- **Proportion CI slide values.** The course slides ([0% ; 3,6%], [0,3% ; 7,0%], [1,1% ; 9,9%] for n = 100) match the exact **hypergeometric** interval for a lot of N = 10000, not the binomial Clopper-Pearson interval: for d = 2 binomial gives a lower bound of 0,243% (rounds to 0,2), hypergeometric gives 0,25% (rounds to 0,3). The golden binomial values are tested at 1e-6; the slide rounding is tested against the hypergeometric version. The UI shows both and explains this.
- Control-chart constants are the standard 3-decimal table (A2 = 0,577 for n = 5, etc.), because the course and the golden values use the rounded constants.
- Two-sided exact binomial p-value: 2 × the smaller tail (capped at 1).
- Adjusted R²: denominator n-k-1 (Excel, formularium); the slide's n-k-2 is noted in the UI.
- GRR ANOVA: interaction pooled into the error term when its p > 0,25 (AIAG). %GRR uses standard deviations (study variation), with % contribution (variances) also shown.

## Exam answers and wording
- Exam Q1b marked "correct (met nuance)"; Q1e "niet correct, te absoluut" (see solutions page).
- Q6: X = 1 means conform, so E[X] = 0,95.
- Model diagnosis (Q5): best test score with gap < 20 points = optimal; train accuracy < 80% = high bias; gap > 20 points = high variance.

## UI and build
- **Excel function names.** The course and spec write English names with Dutch separators (`=F.INV(0,05;9;14)`, `WAAR`). A Dutch-language Excel uses translated names (T.DIST = T.VERD, CHISQ.INV.RT = CHIKW.INV.RECHTS, ...). The top bar has a toggle "Excel: EN-namen / NL-namen"; default English as in the course. The Dutch names come from memory: verify a few in Bram's Excel.
- **Formula rendering.** Pre-rendering all ~1100 formularium formulas to KaTeX HTML made the file 2,7 MB. Formulas are now validated with KaTeX at build time (the build warns on errors) and rendered at runtime by the bundled KaTeX, with fonts embedded as base64 woff2. Still fully offline; file ~0,9 MB.
- Result-panel formulas are rendered at runtime with the same bundled KaTeX.
- Persistence: all inputs and grids are stored in localStorage (wrapped in try/catch); if storage is blocked (some file:// setups) the app still works for the session.
- Offline check: `scripts/smoke.mjs` opens the built file from file:// in headless Chrome with the network disabled, visits every module and tab, and fails on console errors, error panels or any non-file request.
- Plan designer (AQL 2%, LQL 8%, α, β ≤ 5%) returns (129, 5) with α 4,58%, β 4,91% (checked with scipy); the course plan (130, 5) is the neighbour. Double plan (90,2,7)+(90,8): P_acc(2%) 0,989, ASN 114. Both are extra regression tests in `tests/sampling.test.ts`.
- Mann-Whitney: the panel shows U = min(U1, U2) (76 for the golden data); z and p do not depend on the choice.
- Extra regression test `tests/msa.test.ts`: AIAG MSA manual Average & Range example (EV 0,2019, AV 0,2297, PV 1,1046, %GRR 26,68%, ndc 5), values recomputed with numpy.
- Grid: a column that contains only text is treated as a label column (shown grey, not as an error).
