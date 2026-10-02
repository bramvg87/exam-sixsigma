# Decisions log

Choices made while building, so Bram can check them. Newest at the bottom.

## Drive files (added 2026-10-03)
The Drive export is now in `reference/drive/` (also kept in `instructions/drive export/`). What was done with each file:
- **formularium.md:** Task 0 redone properly. `content/formularium.md` = Bram's original with A1-A9 applied in place and B1-B11 inserted (see `content/MERGE_LOG.md`). This replaces the stand-in written earlier. Extra fixes: DPMO at 2σ 308.537 -> 308.538; three formulas with a stray `\ ` that did not compile; `=NORM.S.INV(yield)` now notes the +1,5 shift; "λ ≥ 1" -> "λ ≥ μ" in the discrete-time queue remark; note under B2 on the slide values (hypergeometric N = 10000).
- **ANOVA Tool:** its four examples (cotton one-way, machines two-way, plant two-way with replication, Gauge R&R) are load buttons in the ANOVA and MSA modules and regression tests (`tests/drive.test.ts`, references in `testdata/drive_examples.json`). Running the tool itself in Chrome gives the same numbers as scipy and as this toolkit.
  - **Gauge R&R method.** The tool (and therefore the course) uses EV² = MS_E, AV² = (MS_O - MS_E)/(p·r), PV² = (MS_P - MS_E)/(o·r), all F against MS_E, interaction not a separate component. This is now the **default** ("cursusmethode") in MSA > ANOVA; the AIAG variant (interaction in reproducibility, pooling if p > 0,25) stays available. Example: %GRR 48,21%, ndc 2.
  - The Excel block layout (labelled row + replicate rows with an empty first cell) is accepted for two-way ANOVA with replication and for both GRR tabs; two-way without replication accepts a text row-label column.
- **Hypothesis tester:** its examples are load buttons in the Z, t, χ², F and proportion tabs and regression tests. Its variance-ratio example is exactly the exam Q2 data. Its normal CDF (A-S erf, ~1e-7) is not used here.
- **Worked solutions:** shown per question on the Voorbeeldexamen page ("Originele uitwerking", English). The Dutch solutions were aligned with them: **Q1e is now "correct"** (standard two-sided reading, with the one-sided nuance); before it said "niet correct". Everything else already agreed.
- **Voorbeeldexamen docx:** contains the Q7 scatterplot (embedded on the exam page and in ML > Zien vs doen). The figure has a **decreasing** trend (about 450 MPa at 550 °C to 425 MPa at 740 °C); the causal demo was redrawn to match. Still no Q2 Excel data in the docx.
- **BB_SIM_demo.xlsx:** the "Pi" Monte Carlo and "3 Lightbulbs" (min of exponentials, MTTF = m/k, max bulbs for a promised MTTF) examples are in Simulatie & wachtrijen > "Lampen in serie / π".
- **Six-probability-distributions-handout.pdf:** consistent with the "Welke verdeling?" table; its quick discriminators were added there.
- **link naert training info.docx:** only a URL (https://ugain.naert.net/), nothing to build.
- PDF export of the formularium: still no pandoc; Bram's own `formularium.pdf` is the unmerged original. Print the Formularium page to PDF for the merged version.

## Numerics
- Normal CDF via erfc = Q(1/2, x²) (regularised incomplete gamma, Lentz continued fraction), not Abramowitz-Stegun. Inverse normal: Acklam + 3 Halley steps. All t/χ²/F/beta inverses by bisection on the CDF (lower tail) or survival function (upper tail), so tail quantiles keep full precision. Noncentral t: Lenth's AS 243 series. Checked against scipy: relative errors 1e-14 to 1e-16 (hypergeometric 2e-12).
- **Proportion CI slide values** (confirmed: the slide's 70% interval [2,1 ; 7,1] for 4/100 is also the hypergeometric N = 10000 interval). The course slides ([0% ; 3,6%], [0,3% ; 7,0%], [1,1% ; 9,9%] for n = 100) match the exact **hypergeometric** interval for a lot of N = 10000, not the binomial Clopper-Pearson interval: for d = 2 binomial gives a lower bound of 0,243% (rounds to 0,2), hypergeometric gives 0,25% (rounds to 0,3). The golden binomial values are tested at 1e-6; the slide rounding is tested against the hypergeometric version. The UI shows both and explains this.
- Control-chart constants are the standard 3-decimal table (A2 = 0,577 for n = 5, etc.), because the course and the golden values use the rounded constants.
- Two-sided exact binomial p-value: 2 × the smaller tail (capped at 1).
- Adjusted R²: denominator n-k-1 (Excel, formularium); the slide's n-k-2 is noted in the UI.
- GRR ANOVA: default = course method (see Drive files). AIAG option: interaction pooled into the error term when its p > 0,25. %GRR uses standard deviations (study variation), with % contribution (variances) also shown.

## Exam answers and wording
- Exam Q1b correct (met nuance); Q1e correct in the standard two-sided reading (aligned with Bram's worked solutions).
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
