# Course scope and source map (UGAIN Black Belt Module 3, 2026)

What each lesson covers, which Drive files hold it, and what the toolkit must support. "Exam weight" is an estimate from the 2025 sample exam (20 points).

| Les | Datum | Docent | Onderwerpen | Bronbestanden (Drive) | Toolkit | Examengewicht (2025) |
|---|---|---|---|---|---|---|
| 1 | 20-22/05 | Van Volsem, Naert | DMAIC, Y = f(X), Little's law, flow efficiency; data, meetschalen, kansverdelingen, marginaal/voorwaardelijk, onafhankelijkheid, E[Y\|X], causaliteit (do-operator, DAG, confounder, RCT/A-B) | `les 2005 - intro/20260521_van volsem.pdf`, `20260522_naert_big data.pdf` (38 MB) | M1, M11, M13 | Q6 (4) + Q7 (3) |
| 1b | 29/05 | Naert | ML: supervised/unsupervised, loss (MSE/MAE), train/test/CV, bias-variance, confusion matrix, neurale netten, bomen, Bayes | `les 2905 - T-test/20260529_naert.pdf` (28 MB) | M11 | Q5 (4) |
| 2 | 29/05 | Ottoy | Hypothesetoetsen (recept 7 stappen, alpha/beta, p-waarde, OC-curve), betrouwbaarheidsintervallen (exact voor fractie, t, chi2), acceptance sampling (SRS, stratificatie, cluster, systematisch, (n,c), dubbel, sequentieel, variabelen (n,k)), testrecepten (2 steekproeven, chi2 GOF/contingentie, Wilcoxon, runs) | `les 2905 - T-test/*.pdf`, `Testing of Hypotheses.xlsx`, `Confidence Intervals.xlsx`, `Acceptance Sampling.xlsm`, `t_test_tutorial.html` | M2, M10, M12 | Q1 (2,5) + Q2 (3) |
| 3 | 05/06 | De Vuyst | Regressie (enkelvoudig, meervoudig, inferentie, CI/PI, residuen), one-way ANOVA, DOE (blocking, randomisatie, 2^k, fractioneel) | `les0506 - regression/*.pdf`, `Regression_demo.xlsx`, `DOE_demo.xlsx`, `Regression_DOE_oplossingen.xlsx`, `2k_Factorial_Design_Explained.pdf` | M7, M8, M9 | (niet in 2025, wel cursusstof) |
| 4 | 12/06 | Grymonprez | Capabiliteit (Cp, Cpk, Pp, Ppk, DPMO, 1,5 sigma shift), stabiliteit, SPC (Xbar-R, Xbar-s, Western Electric, tampering), 6 oefeningen | `les1206 - SPC/*.pptx`, `Gegevens oefeningen.xlsx`, `Xbar R kaart ... oefening 2/3/5.xlsx`, `Control charts - constants.docx`, `tabellen SPC.pdf`, `Ztable.pdf` | M3, M6 | Q3 (2) + Q4 (1,5) |
| 5 | 19/06 | Ottoy, De Vuyst | MSA (SWIPE, bias, linearity, stability, GRR average & range + ANOVA, meetonzekerheid, PE, GPC), simulatie (M/M/1/K, Poisson-proces, Monte Carlo, DES, Erlang A) | `les1906 - GRR/*.pdf`, `GRR - ANOVA - average and range - 2.xlsx`, `GRR_ANOVA_explained.xlsx`, `Rheostat Knob Data.xls`, `linearity.txt`, `BB_SIM_demo.xlsx`, `BB_SIM_ErlangA.py.txt` | M7, M13 | (niet in 2025, wel cursusstof) |

## Observations from the 2025 exam
- Conceptual interpretation (Q1, Q4, Q5b, Q7) is about 40% of the points: the formularium and explainer cards matter as much as calculators.
- Calculations are short (one formula + one Excel function), but the data can come as an Excel file (Q2): raw-data paste into the grid is essential.
- Expect the 2026 exam to rotate topics: regression/ANOVA/DOE, MSA/GRR and acceptance sampling/OC were not examined in 2025, so they are likely candidates now.

## Ottoy test recipe list (complete scope for hypothesis tests)
t-test mu; t-test mu1-mu2 (paired and unpaired, pooled variance); Z-test pi (with continuity correction); chi2-test sigma; F-test sigma1/sigma2; chi2 goodness of fit; chi2 contingency tables (Yates for 2x2); Wilcoxon-Mann-Whitney; Wilcoxon signed ranks; runs test (Wald-Wolfowitz).
