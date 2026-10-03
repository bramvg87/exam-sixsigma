# Six Sigma Black Belt exam toolkit (offline)

One self-contained HTML file for the UGAIN Lean Six Sigma Black Belt Module 3 exam (open book, no internet).

## Download
Latest version (one file, works offline): **[release/sixsigma-toolkit.html](https://github.com/bramvg87/exam-sixsigma/raw/main/release/sixsigma-toolkit.html)** (source: https://github.com/bramvg87/exam-sixsigma).
Download it before the exam (there is no internet during the exam), save it locally and double-click it.

## How to open
1. Download `release/sixsigma-toolkit.html` (no build needed).
2. Double-click it. It works from the desktop (`file://`) in Edge and Chrome with Wi-Fi off: all JavaScript, CSS, fonts and formula rendering are inside the file, and a Content-Security-Policy blocks every network request.
3. On exam morning open **Zelftest**: it recomputes all reference cases (scipy = Excel) and must show "ALLES GROEN".

The footer shows the build date and git commit.

## Modules
| Module | Contents |
|---|---|
| Start | overview, download link, exam tips |
| Zelftest | 25 golden cases (185 checks) at relative tolerance 1e-6, plus environment checks |
| Verdelingen | normal, Z, t, χ², F, binomial, Poisson, hypergeometric, Bernoulli, exponential, uniform: P(X ≤ x), P(X ≥ x), P(a ≤ X ≤ b), inverses, E/Var, plot; σ from a tail probability; "which distribution" table |
| Welke toets? + Toetsen & BI | one page in three sections: (1) theory: decision framework, 7-step procedure, table of all variables with meaning, calculation and Excel; (2) test selector that opens the right test below with the direction prefilled; (3) the tests: Z, t, χ², F (+ CI for the variance ratio, both orientations), Z for a proportion + exact binomial, CI for a proportion (exact / Wilson / Wald / hypergeometric), two samples (pooled and Welch + F pre-check), paired t, sample size and power, duality |
| Capabiliteit | Cp, Cpk, Pp, Ppk from μ/σ or data (individuals or subgroups; R̄/d₂, s̄/c₄, overall s), % and ppm out, centred what-if, σ for a target Cpk, sigma level, DPMO, discrete capability, DPMO ↔ sigma table |
| Formularium | The student's formularium merged with the October 2026 addendum (corrections A1-A9, sections B1-B11; see `content/MERGE_LOG.md`) (search with highlighting, table of contents, print), "Open in tool" links, one-page spiekbrief |
| Voorbeeldexamen | the 7 questions with worked solutions and "Laad in tool" buttons |
| SPC | X̄-R / X̄-s charts, Western Electric rules, revise limits, other subgroup size and shift detection (β, ARL), constants table, I-MR |
| ANOVA | one-way, two-way with and without replication |
| MSA / Gauge R&R | Average & Range (AIAG K-values), ANOVA method, observed vs actual Cp, bias and linearity, measurement uncertainty |
| Regressie | simple and multiple regression, ANOVA table, CI/PI, plots |
| DOE 2^k | k = 2..5 with replicates, effects, ANOVA, pooling, Pareto/normal plot, half fractions with aliases |
| Aanvaardingssteekproeven | single plan + OC curve (binomial/hypergeometric/Poisson), plan designer, double plan + ASN, variables plan (n, k), lot defects from Cpk, stratification |
| Onafhankelijkheid | contingency table (counts or raw category pairs): chi-square test, Yates, Fisher exact (2x2), Cramer's V, standardized residuals, joint/marginal/conditional probabilities (formularium example line x quality); independence of two events; correlation (Pearson t-test, Spearman) |
| ML, kansen & causaliteit | confusion matrices (bias vs variance), contingency tables + χ², bias-variance, seeing vs doing |
| Niet-parametrisch & GOF | χ² goodness of fit, Mann-Whitney, Wilcoxon signed ranks, runs test |
| Simulatie & wachtrijen | M/M/1, M/M/1/K, Poisson process, Monte Carlo CI, Little's law |

Every calculation shows: hypotheses or question, formula, formula with numbers, result and decision, Dutch Excel formula, and a Dutch "Examenantwoord" with a copy button. Top bar: 4 or 6 significant digits, decimal comma or point, Excel function names in English (as in the course) or Dutch, light/dark theme. Ctrl+K searches modules, tests and formularium sections.

The data grid accepts a paste straight from Excel (decimal comma or point, header row detected), arrow keys, Enter/Tab, Shift+arrows, Ctrl+C/Ctrl+Z, row/column buttons and transpose. Inputs are kept when switching modules and (when the browser allows it) after a reload.

## Development
```
npm install
npm test            # golden values + ANOVA tool / hypothesis tester / AIAG / sampling regression tests
npm run build       # dist/index.html + release/sixsigma-toolkit.html
node scripts/smoke.mjs   # open the release file offline in headless Chrome, visit every module and tab
node scripts/e2e.mjs     # exam "Laad in tool" buttons + Excel paste
```
Layout: `src/stats/` (special functions, distributions, descriptives), `src/calc/` (tests, capability, SPC, regression, DOE, ANOVA, sampling, misc), `src/components/` (grid, result panel, SVG charts), `src/modules/` (one file per module), `content/` (formularium, spiekbrief, exam solutions), `testdata/` (golden values).

## Known limitations
- The Q2 machine data of the sample exam is not in the docx; Q2 uses the example variances (as in the worked solutions).
- Dutch Excel function names (toggle) are from memory; verify them in your Excel.
- No PDF of the formularium (pandoc not installed); print the Formularium page to PDF instead.
