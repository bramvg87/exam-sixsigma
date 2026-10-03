# Six Sigma Black Belt Exam Toolkit - Build Spec for Claude Code

Repo: `github.com/bramvg87/exam-sixsigma` (private)
Purpose: one offline web app to run during the UGAIN Black Belt Module 3 exam (open book, PC, NO internet, 3 hours, 20 points).
Deadline: Phase 1 must be usable within the first build session. The exam is close; prioritise working and correct over pretty.

---

## 1. Hard requirements (non-negotiable)

1. **Fully offline.** Output is ONE self-contained file `dist/index.html` (all JS, CSS, fonts, math rendering inlined). It must work by double-clicking it from the desktop (`file://`) in Edge and Chrome on Windows, with Wi-Fi switched off. No CDN, no Google Fonts, no fetch/XHR, no web workers loaded from separate files. Add a CSP meta tag that blocks network: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:`.
2. **Correct numbers.** Every statistical result must match Excel / scipy to at least 6 significant digits. Use `testdata/golden_values.json` as the automated acceptance test (see section 7). A result that is wrong is worse than a missing feature.
3. **Excel-like data entry.** Wherever raw data is entered, use the shared grid component (section 4): paste straight from Excel (TSV), decimal comma or point, arrow keys, Enter goes down, Tab goes right, multi-cell paste, add/remove rows and columns, editable column headers.
4. **Every result is exam-ready.** Each calculation panel shows, in this order:
   - the hypotheses or the question being answered,
   - the formula, then the same formula with the numbers substituted,
   - the result (and decision where relevant: reject / do not reject H0, capable / not capable, ...),
   - the equivalent **Dutch Excel formula** (semicolons, `WAAR`/`ONWAAR`), e.g. `=F.INV(0,05;9;14)`,
   - an **"Examenantwoord"** box: 2 to 4 sentences in Dutch that motivate the conclusion, with a Copy button.
5. **Dutch UI** (the exam is in Dutch), with the English term in brackets where the course uses English (e.g. "Betrouwbaarheidsinterval (confidence interval)").
6. **Robust under stress:** no crash on empty cells, text in numeric columns, n < 2, etc. Show a clear Dutch error instead.
7. **Writing style in all generated text:** do not use em-dashes; use a normal hyphen.

## 2. Tech stack

- Vite + vanilla TypeScript (or plain JS modules) + `vite-plugin-singlefile` to inline everything into `dist/index.html`. No React needed; if you prefer a framework, Preact or Svelte are fine as long as the output stays one file under ~3 MB.
- Charts: hand-rolled SVG (control charts, scatter + regression line, normal curve with shaded tails, OC curve, effects plot). No chart library unless it is bundled and inlined.
- Math rendering for the formula page: pre-render LaTeX to HTML at build time with KaTeX (`katex.renderToString`), and inline the KaTeX CSS with its fonts as base64. Alternative: MathJax with SVG output, bundled. Verify formulas render with the network off.
- Persistence: `localStorage` wrapped in try/catch (file:// may block it; app must still work).
- Tests: `node --test` (or vitest) running the stats engine against `testdata/golden_values.json`.
- Also commit the built file as `release/sixsigma-toolkit.html` on every milestone so the student can download it directly from GitHub without building.

## 3. Existing assets to reuse (the student copies them into `reference/drive/`)

- `ANOVA Tool/index.html` + `README.md`: verified one-way ANOVA, two-way ANOVA with and without replication, ANOVA-based Gauge R&R (EV/AV/PV/GRR/%GRR/ndc). README states it reproduces the course DOE and MSA examples exactly. **Port its parsing and computation logic** into the new module rather than rewriting from scratch, and keep its "Load example" datasets as regression tests.
- `Hypothesis tester/index2.html`: summary-statistics tests (t, Z, chi2, F, Z-proportion) and the CI method. Good explanation texts and decision logic; reuse the structure. Known weaknesses to fix: (a) no raw-data input, (b) normal CDF uses the Abramowitz-Stegun erf (abs. error ~1e-7, too coarse for ppm-level tails like 3.4 DPMO), (c) no two-sample, paired, exact-proportion or sample-size tests.
- `formularium.md` (+ `reference/formularium_aanvulling.md` in this package): source content for the formula page. **Task 0: merge the addendum into formularium.md** (apply corrections in place, insert new sections at the indicated locations), save as `content/formularium.md`, and also export a PDF copy if pandoc is available.
- `Six_Sigma_BB_Module3_Worked_Solutions.md` and `reference/voorbeeldexamen.md`: the sample exam and worked solutions (used for the exam page and as test cases).
- Course Excel files listed in `COPY_FROM_DRIVE.md` contain more example datasets; use them for extra tests where useful.

## 4. Shared components

### 4.1 Data grid (`<DataGrid>`)
- Rows x columns of cells, default 30 x 6, grows automatically when pasting larger blocks.
- First row = editable column headers (toggle "eerste rij is kop").
- Paste: parse TSV from clipboard; handle `\r\n`; decimal comma (`4,8`) and point; thousands separators; ignore trailing empty lines; blank cells = missing.
- Keyboard: arrows, Enter (down), Shift+Enter (up), Tab / Shift+Tab, Delete clears selection, Ctrl+A select all, Ctrl+C copies selection as TSV, Ctrl+Z undo (at least 20 steps).
- Range selection with mouse drag and Shift+arrows.
- Buttons: Voorbeeld laden, Wissen, Rij +/-, Kolom +/-, Transponeren.
- Live summary strip under the grid for the selected column: n, gemiddelde, s, min, max, R.
- API: `getColumns(): {name, values:number[]}[]`, `getMatrix()`, `setData()`.

### 4.2 Stats engine (`src/stats/`)
Implement with high precision (relative error < 1e-10 in the body, accurate tails down to 1e-12):
- `normCdf`, `normSf`, `normInv` (use erfc via Cody's rational approximations or a continued fraction; inverse = Acklam + 1-2 Halley refinement steps).
- Regularised incomplete gamma P/Q and beta I (Lentz continued fraction, as in Numerical Recipes); `lnGamma` (Lanczos).
- t, chi2, F: cdf, sf, inverse (both tails), with Excel-name aliases: `T.DIST`, `T.DIST.RT`, `T.DIST.2T`, `T.INV`, `T.INV.2T`, `CHISQ.DIST(.RT)`, `CHISQ.INV(.RT)`, `F.DIST(.RT)`, `F.INV(.RT)`.
- Binomial, Poisson, hypergeometric: pmf, cdf (exact summation in log space), inverse.
- Beta inverse (for Clopper-Pearson), exponential, uniform.
- Noncentral t cdf/inverse (only for the variables sampling plan k; acceptable to implement by numerical integration; if it is too much work use the Natrella approximation and label it "benadering").
- Descriptives: mean, median, var.s/var.p, stdev, range, quartiles, DEVSQ.
- Linear algebra for multiple regression (normal equations with QR or Cholesky, k <= 8).

### 4.3 Result panel (`<ResultPanel>`)
Renders the 5 blocks from requirement 4. "Kopieer" on each block. Number format: 4 significant digits by default, toggle 6; toggle output decimal separator `,` / `.`.

### 4.4 Navigation
- Left sidebar with modules; top search box (Ctrl+K) that searches module names, test names, formula titles and Dutch keywords (e.g. "uitval", "verhouding varianties", "kaart", "aanvaardingssteekproef", "OC-curve", "regelkaart").
- "Welke toets?" wizard: 3-5 questions (wat wil je weten: gemiddelde / spreiding / fractie / verband / verschil tussen groepen; 1 of 2 steekproeven; gepaard?; sigma bekend?; ruwe data of samenvatting?) leading to the right calculator, prefilled direction.

## 5. Modules, in priority order

### PHASE 1 (must be done first)

**M0 Shell + grid + stats engine + self-test page.** Self-test page runs all golden tests in the browser and shows a green/red table (the student opens it on exam morning as a confidence check).

**M1 Verdelingen (distribution calculator)**
- Normal, standard normal Z, t, chi2, F, binomial, Poisson, exponential, uniform, hypergeometric, Bernoulli.
- For each: P(X <= x), P(X >= x), P(a <= X <= b), inverse for a given probability (left tail, right tail, central), mean and variance, SVG plot with shaded area, Excel formula.
- Helper "sigma uit staartkans": given mean, a cut-off value and the tail probability, return sigma and variance (exam Q6: mean 820, P(C<720)=5% -> sigma 60.80, Var 3696).
- Card "Welke verdeling?" (tellen vs meten decision table from the formularium) with the E[X] and Var[X] formulas.

**M2 Hypothesetoetsen & betrouwbaarheidsintervallen**
Input mode per test: summary statistics OR raw data via grid (one column, or two columns for two-sample/paired).
Tests (all with left / right / two-sided, alpha free, p-value, critical value, CI, CI-based decision):
1. Z-toets gemiddelde (sigma bekend)
2. t-toets gemiddelde
3. chi2-toets variantie / standaardafwijking (+ CI for sigma^2 and sigma)
4. F-toets twee varianties + **CI voor de verhouding** in both orientations (sigma1^2/sigma2^2 and sigma2^2/sigma1^2), one-sided lower, one-sided upper and two-sided. Must reproduce exam Q2: `F.INV(0,05;9;14) = 0,3305`, bound `L = (s2^2/s1^2) * F.INV(alpha; n1-1; n2-1)`, decision "L > 1 => M1 nauwkeuriger". Show a sentence that explains which variance is in the numerator.
5. Z-toets proportie (option: continuity correction +/- 1/(2n), as in the Ottoy test recipes) + exact binomial test.
6. **BI voor proportie: show Clopper-Pearson (exact), Wilson and Wald (normal) side by side** with a note that the course slides use the exact method (n=100, d=4 -> [1,1%; 9,9%]) and that Wald is only acceptable with at least ~5 defects. Option: finite population (hypergeometric, N given).
7. Twee onafhankelijke steekproeven: pooled t (course recipe, assumes equal variances, df = n1+n2-2) and Welch t; automatically show the F-test for equal variances as a pre-check, with the warning from the course that the F-test is not robust.
8. Gepaarde t-toets (differences column computed and shown).
9. Steekproefgrootte (sample size): mean (sigma, margin E or shift delta with alpha and beta/power), proportion (p, E; worst case p = 0,5), plus "power / beta for a given n".
10. Duality explainer: a (1-alpha) CI and a test at significance alpha contain the same information; one-sided test pairs with one-sided bound.

**M3 Capabiliteit (process capability)**
- Inputs: mean and sigma directly, or from data (grid: one column of individuals, or subgroups in rows) with a choice of sigma estimate: overall s (long term, Pp/Ppk), R-bar/d2, s-bar/c4 (short term, Cp/Cpk). LSL and/or USL (one-sided specs allowed: only Cpk/Ppk then).
- Outputs: Cp, Cpk (which side is limiting), Pp, Ppk, % and ppm below LSL, above USL, total; "wat als gecentreerd" (Cpk, % out); required sigma for a target Cpk; sigma level short-term (Z to nearest limit) and long-term with 1,5 sigma shift; DPMO; judgement table (Cp < 1, 1-1,33, 1,33-1,67, >= 1,67, 2).
- Discrete capability: D, N, O -> DPU, DPO, DPMO, yield, sigma level.
- DPMO <-> sigma level converter with the 1,5 sigma shift explained; table 1-6 sigma.
- Must reproduce exam Q3: Cp 1,00, Cpk 0,67, 2,28% scrap (2,275% above + 0,003% below), and give the "6 sigma criterion" answer: max 3,4 ppm (0,00034%) long-term with 1,5 sigma shift; also mention short-term centred 6 sigma = 0,002 ppm.
- Normal curve SVG with LSL/USL, mean, shaded scrap.

**M4 Formularium page**
- Rendered merged `content/formularium.md`, table of contents, anchor links, search highlight, print CSS.
- Each formula block that has a calculator gets a small "Open in tool" link.
- A compact "Spiekbrief" view: one-page decision tables (which test, which chart, which distribution, which CI) suitable for printing.

**M5 Voorbeeldexamen page**
- The 7 questions of the sample exam (reference/voorbeeldexamen.md), each with: worked solution (collapsible), and a "Laad in tool" button that opens the right module prefilled (Q2 F-ratio with the example variances, Q3 capability, Q5 confusion matrices, Q6 distributions and sigma helper).

### PHASE 2

**M6 SPC - regelkaarten**
- Xbar-R and Xbar-s charts from a grid (subgroups in rows) or from a list of subgroup means and ranges (exercise 3 style).
- Constants table A2, A3, d2, D3, D4, B3, B4, c4 for n = 2..25 (computed or tabulated; show the table).
- Western Electric rules 1-4, flag points, explain which rule fired.
- "Herzie grenzen": exclude flagged subgroups and recompute (exercise 3).
- "Andere subgroepgrootte": new limits for n' from sigma-hat (exercise 4) and the detection probability of a k-sigma shift: `beta = Phi(3 - k*sqrt(n)) - Phi(-3 - k*sqrt(n))`, ARL = 1/(1-beta).
- Capability straight from the chart (hand off to M3).
- Optional: I-MR chart, p/np/c/u charts (not in the course slides, low priority).
- Must reproduce `spc_ex2` and `spc_ex3` golden values. Note: the class spreadsheet for exercise 2 shows UCL 16,9 / LCL 15,7 which are not Xbar-chart limits; the correct limits are UCL 16,543 / LCL 15,989.

**M7 ANOVA, DOE-ANOVA en Gauge R&R / MSA**
- Port the existing ANOVA tool (one-way, two-way without replication, two-way with replication, GRR via ANOVA).
- Add GRR Average & Range method (AIAG): K1 (trials 2: 0,8862; 3: 0,5908), K2 (operators 2: 0,7071; 3: 0,5231), K3 (parts 2..10: 0,7071; 0,5231; 0,4467; 0,4030; 0,3742; 0,3534; 0,3375; 0,3249; 0,3146). EV, AV, PV, GRR, TV, %EV, %AV, %GRR (vs TV and vs tolerance), %PV, ndc = floor(1,41*PV/GRR), verdict (<=10%, 10-30%, >30%). Verify K values against `20260619_ottoy_tabel MSA.pdf` if present.
- Observed vs actual Cp: `1/Cp_o^2 = 1/Cp_a^2 + %GRR^2` (tolerance-based %GRR).
- Bias study (t-test on bias), linearity (regress bias on reference value, test slope = 0; data file `20260619_ottoy_linearity.txt`).
- Measurement uncertainty helper: U = k*u_c, propagation for sums/differences (quadrature) and products/quotients (relative quadrature), u(f(x)) ~ |f'(x)| u(x).

**M8 Regressie**
- Simple and multiple linear regression from the grid (choose Y column and X columns).
- Coefficients, SE, t, p, CI; ANOVA table (SS_R, SS_E, SS_T, df, MS, F, p); R^2, adjusted R^2 with denominator n-k-1 (the slide says n-k-2; Excel and the formularium use n-k-1); s = sqrt(MSE); correlation r.
- For simple regression: CI for the mean response and PI for a new observation at x0; scatter plot with line, CI and PI bands; residual plot.
- Reproduce `regression_simple` and `regression_multiple` golden values.

**M9 DOE 2^k**
- k = 2..5, n replicates, responses entered in standard (Yates) order in the grid; the tool generates the sign table (-1/+1 incl. interaction columns).
- Contrasts, effects = contrast / (n 2^(k-1)), SS = contrast^2 / (n 2^k), ANOVA with F and p when n > 1, se(effect) = sqrt(MSE / (n 2^(k-2))), approx 95% CI effect +/- 2 se, Pareto/normal plot of effects (n = 1), pooling of higher-order interactions option.
- Half fraction 2^(k-1) with generator (e.g. I = ABC) and alias list.
- Reproduce `doe_2x2` golden values.

**M10 Aanvaardingssteekproeven (acceptance sampling) en steekproefmethoden**
- Single plan (n, c): OC curve (binomial, option hypergeometric with N, option Poisson), alpha at AQL, beta at LQL, table of P_acc vs pi. Must give (100,4): P_acc(2%) = 0,949, P_acc(8%) = 0,090; (130,5): alpha 4,7%, beta 4,7%.
- Plan designer: smallest n and c such that alpha <= target at AQL and beta <= target at LQL.
- Double plan (n1, c1, c2) + (n2, c3): OC and ASN, compare with a single plan (course example (175,8) vs (90,2,7)+(90,8)).
- Variables plan (n, k): Q = (xbar - xi)/s >= k; k exact (noncentral t) and Natrella approximation (golden: n=20, p0=2%, alpha=5% -> k = 2,933 exact, 2,914 approx).
- Lot defects when Cpk is known: binomial distribution of defects in a lot of N (Cpk 1 -> pi 0,27%, E = 27 per 10 000).
- Stratification calculator: proportional vs SRS vs Neyman allocation (golden `stratification`).

**M11 ML, kansen en causaliteit**
- Confusion matrix calculator: two matrices side by side (train / test) per model, up to 4 models: accuracy, precision, recall, specificity, F1, train-test gap, and a hint "hoge bias / hoge variantie / goede balans" with the reasoning. Reproduce exam Q5.
- Contingency table tool: joint, marginal, conditional probabilities, independence check (compare P(Y|X) with P(Y)) and chi2 test of independence (with Yates for 2x2). Golden `chi2_contingency`: chi2 11,80, df 2, p 0,0027.
- Static explainer cards: bias-variance, train/test/validation, k-fold CV, seeing vs doing (do-operator), drawing guide for exam Q7 (regression line, intervention on cause vs effect) with a small SVG demo.

### PHASE 3 (only if time remains)

**M12 Non-parametric and goodness of fit:** chi2 goodness of fit (normal, Poisson, exponential, uniform; df = classes - estimated parameters - 1; merge classes with e < 5), Wilcoxon-Mann-Whitney, Wilcoxon signed ranks, runs test (normal approximations with formulas from the Ottoy test recipes).

**M13 Simulatie & wachtrijen:** M/M/1 and M/M/1/K (pi_j, E[L], E[W] via Little with loss correction), Poisson process probabilities (superposition, thinning), Monte Carlo CI from mean, sd and n, Little's law and flow efficiency calculator.

## 6. UX details that matter in an exam

- Every module has "Voorbeeld laden" with a course example, so the student can check that they enter data in the right layout.
- Inputs keep their values when switching modules (state in memory + localStorage).
- Big, readable numbers; one-click copy of the "Examenantwoord".
- Show assumptions and when they are violated (normality, equal variances, n*pi >= 5, expected counts >= 5, subgroup size for R vs s).
- Light and dark mode; print stylesheet for the formula page.
- Footer: build date and git commit hash, so the student knows which version they have.

## 7. Testing and acceptance

1. `testdata/golden_values.json` (generated by `testdata/make_golden.py` with scipy) holds 25 cases with inputs and expected outputs. Write tests that feed the inputs to the engine/modules and compare (relative tolerance 1e-6; for values printed in the course slides use the slide rounding).
2. The same tests run in the browser on the Self-test page.
3. Extra checks: existing ANOVA tool examples give identical tables; hypothesis tester examples give identical results.
4. Manual acceptance checklist (the student runs this):
   - Wi-Fi off, double-click `release/sixsigma-toolkit.html`, every module opens, formulas render.
   - Paste a block from Excel with decimal commas into the grid.
   - Exam Q2, Q3, Q5, Q6 reproduce the worked solutions.
   - Self-test page is all green.

## 8. Work plan for Claude Code

1. Read this spec, `CLAUDE.md`, `reference/` and `testdata/`. Ask the student nothing unless blocked; make reasonable choices and log them in `DECISIONS.md`.
2. Task 0: merge the formularium addendum (section 3).
3. Scaffold Vite single-file build; confirm `dist/index.html` works from `file://` with the network blocked.
4. Stats engine + golden tests (all green before building UI on top).
5. Grid component, result panel, navigation, search.
6. M1, M2, M3, M4, M5. Build, commit `release/sixsigma-toolkit.html`, tag `v1-exam-ready`.
7. Phase 2 modules in the listed order, each followed by build + tests + commit.
8. Keep `README.md` updated with: how to open, module list, known limitations.
