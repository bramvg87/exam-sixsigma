# ANOVA Analyzer

A single-file, dependency-free browser tool for **one-way ANOVA**, **two-way ANOVA without replication**, and **two-way ANOVA with replication** (plus an ANOVA-based **Gauge R&R / MSA**). Paste a table straight from Excel or Google Sheets, get the full ANOVA table with a plain-language reading, and copy the result back out.

## Run it

It's just `index.html` — no build, no install.

- **Quickest:** double-click `index.html` to open it in your browser.
- **On localhost** (recommended, so "Copy for Excel" uses the modern clipboard API):
  ```
  cd ugain-ANOVA
  python -m http.server 8000
  ```
  then open http://localhost:8000

## How to paste your data

Copy the cells in Excel/Sheets and paste into the box (paste keeps the tab characters, which is what the parser expects). Decimal commas (`4,8`) are handled automatically. Pick the matching tab and hit **Analyze**. Each tab has a **Load example** button showing the exact layout.

| Design | Layout |
|---|---|
| **One-way** | Each **column is a group**; first row = group labels; measurements below. Unequal group sizes are fine (leave blanks). |
| **Two-way, no replication** | Column labels in the first row, row labels in the first column, **one value per cell**. |
| **Two-way, with replication** | Column labels in the first row. Each row-factor level starts on a **labelled row**; its extra replicates go on rows with a **blank first cell** (exactly how Excel lays it out). Same replicate count in every cell. |

## Gauge R&R

On the *with replication* tab, tick **Also compute Gauge R&R**. It assumes rows = parts, columns = operators, replicates = trials (use **Swap parts/operators** if reversed) and reports EV / AV / PV / GRR, %GRR with an AIAG verdict, and the number of distinct categories (ndc).

## Notes

- Significance level α is adjustable (default 0.05).
- p-values use `F.DIST.RT` and critical F uses `F.INV.RT`, matching Excel.
- Verified to reproduce the reference DOE and MSA examples exactly.
