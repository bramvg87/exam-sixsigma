# UGAIN Black Belt – Module 3
## Worked exam solutions, explained step by step

> This walks through every question with the underlying statistics refreshed from scratch:
> what each tool *is*, why we use it here, and every intermediate calculation.
> Dutch terms from the exam are kept in brackets so the answers map back to your paper.
>
> **Note on Q2:** the exam refers to an Excel file with the actual machine measurements,
> which wasn't included. The full method is explained and worked with clearly-labelled
> *example* sample variances — replace them with the real values from your Excel.

---

## Question 1 — True or false, with justification  *[/2.5]*

The skill being tested here is reading what a statistical result actually *says* versus what people *assume* it says. Five statements, each judged **correct / not correct**.

### a) "A hypothesis test shows an expensive process change has a significant positive effect on quality, so it's obvious to invest." → **NOT correct**

The trap is the word *significant*. In statistics, **statistical significance** only means: the observed effect is unlikely to be pure chance (the *p*-value is below your threshold, e.g. 5%). It says **nothing about the size of the effect**, and nothing about money.

Two separate ideas:

- **Statistical significance** – is the effect real (not noise)?
- **Practical / economic significance** – is the effect big enough to be worth the cost?

With a large enough sample, even a microscopic improvement becomes "significant", because the test becomes very sensitive. A change that lifts quality by 0.01% can be statistically significant yet nowhere near worth an expensive retrofit. The investment decision needs an **effect size + cost–benefit analysis**, not just a *p*-value. So the conclusion doesn't follow.

### b) "A 95% confidence interval for the fraction defective is [1.4%, 2.2%]. So the process is not suitable to deliver under 1% defectives." → **Correct**

A **confidence interval (betrouwbaarheidsinterval)** is a range of plausible values for the unknown true value, built so that 95% of such intervals (over many repetitions) would contain it. Here the plausible range for the true defect rate is **entirely above 1%** — even the most optimistic end (1.4%) is above 1%.

So we have strong evidence the true rate exceeds 1%, which means the process as it stands **cannot** meet a "< 1% defective" requirement. The statement is justified precisely *because the whole interval sits above the 1% line.*

### c) "The population mean of X can in theory be estimated to any prescribed accuracy." → **Correct**

The width of a confidence interval for a mean is governed by the **standard error**:

$$\text{SE} = \frac{\sigma}{\sqrt{n}}$$

The half-width of the interval is roughly $z \cdot \dfrac{\sigma}{\sqrt{n}}$. As the sample size $n$ grows, $\sqrt{n}$ grows, so the interval **shrinks toward zero**. There's no theoretical floor: pick any target precision, and there exists an $n$ large enough to reach it. *In practice* you're limited by time and money, but the statement says "in theory", so it's correct.

### d) "Cluster sampling will never show non-response bias." → **NOT correct**

These are two unrelated things:

- **Cluster sampling** is a *selection* method: split the population into groups (clusters), randomly pick whole clusters, measure everyone inside.
- **Non-response bias** happens *after* selection: some chosen units don't respond, and the non-responders differ systematically from responders.

No sampling design immunises you against people refusing to answer or units being unmeasurable. Cluster sampling can absolutely suffer non-response bias — if, say, an entire cluster is hard to reach. The claim is false.

### e) "To test a hypothesis at 1% significance, you compute a 99% confidence interval." → **Correct**

There's a clean duality between the two: a **two-sided** test at significance level $\alpha$ corresponds exactly to a **$(1-\alpha)$ confidence interval**.

$$\alpha = 1\% = 0.01 \quad\Rightarrow\quad 1-\alpha = 0.99 = 99\%$$

The rule: if the hypothesised value falls *outside* the 99% interval, you reject at 1%. So a 1% test ↔ 99% interval. *(Small nuance: this exact match is for two-sided tests; a one-sided 1% test pairs with a one-sided 99% bound. The statement is correct in the standard framing.)*

**Summary:** a) ✗ · b) ✓ · c) ✓ · d) ✗ · e) ✓

---

## Question 2 — Comparing two machine variances (F-test)  *[/3]*

**Situation.** Two machines make parts whose critical dimension $X$ should be 10.000. Both are centred correctly, both vary *normally*. We suspect **M1 is more precise than M2** — i.e. M1 has *smaller* spread. We measure $n_1 = 10$ parts from M1 and $n_2 = 15$ from M2, and want a **one-sided 95% confidence interval for the ratio of variances** $\sigma_2^2/\sigma_1^2$, then decide if the suspicion holds.

### Step 0 — What does "more precise" mean statistically?

Precision = consistency = *small spread*. Spread is measured by the **variance** $\sigma^2$ (the average squared distance from the mean) or its square root the **standard deviation** $\sigma$. So:

> "M1 is more precise than M2" $\iff$ $\sigma_1^2 < \sigma_2^2$ $\iff$ $\dfrac{\sigma_2^2}{\sigma_1^2} > 1$.

Our whole job is to check whether $\dfrac{\sigma_2^2}{\sigma_1^2}$ is convincingly **greater than 1**.

### Step 1 — The sample variances

From the Excel data you compute each **sample variance** (Excel: `=VAR.S(range)`):

$$s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2$$

The $\frac{1}{n-1}$ (not $\frac1n$) is **Bessel's correction**: it makes $s^2$ an unbiased estimate of the true $\sigma^2$. Call them $s_1^2$ (from M1's 10 parts) and $s_2^2$ (from M2's 15 parts).

### Step 2 — Why an F-distribution

When you take the ratio of two independent sample variances drawn from normal populations, that ratio follows an **F-distribution**. The F-distribution is *the* tool for comparing two spreads. It has two "degrees of freedom" parameters — one for each variance — and degrees of freedom here are $n-1$:

$$\text{numerator df} = n_1 - 1 = 9, \qquad \text{denominator df} = n_2 - 1 = 14.$$

The exam hint gives the exact pivot quantity (a quantity whose distribution is known and free of unknowns):

$$\frac{s_1^2}{s_2^2}\cdot\frac{\sigma_2^2}{\sigma_1^2} \;\sim\; F(9,\,14)$$

### Step 3 — Turn the F-statement into a bound on the ratio

We want a *lower* bound for $\rho = \dfrac{\sigma_2^2}{\sigma_1^2}$ (we care whether $\rho > 1$). Start from the fact that 95% of the F(9,14) distribution lies *above* its 5th percentile $F_{0.05}(9,14)$:

$$P\!\left(\frac{s_1^2}{s_2^2}\cdot\rho \;\ge\; F_{0.05}(9,14)\right) = 0.95$$

Rearrange to isolate $\rho$ (multiply both sides by $s_2^2/s_1^2$):

$$P\!\left(\rho \;\ge\; \frac{s_2^2}{s_1^2}\cdot F_{0.05}(9,14)\right) = 0.95$$

So the **one-sided 95% confidence interval** is:

$$\boxed{\;\frac{\sigma_2^2}{\sigma_1^2} \;\ge\; \frac{s_2^2}{s_1^2}\cdot F_{0.05}(9,14)\;}\quad\text{i.e. } [\,L,\ \infty)\text{ with } L=\frac{s_2^2}{s_1^2}\,F_{0.05}(9,14).$$

### Step 4 — The Excel value

`=F.INV(0.05, 9, 14)` returns the value below which 5% of the F(9,14) distribution falls:

$$F_{0.05}(9,14) = 0.3305$$

*(Sanity check: `F.INV` is the left-tailed inverse, so this is the 5th percentile — a number below 1, exactly what a lower-tail F value should be.)*

### Step 5 — Worked example (replace with your Excel numbers)

Suppose the Excel gives, say, $s_1^2 = 0.0040$ and $s_2^2 = 0.0150$ (units mm²). Then:

$$L = \frac{s_2^2}{s_1^2}\cdot F_{0.05}(9,14) = \frac{0.0150}{0.0040}\times 0.3305 = 3.75 \times 0.3305 = 1.24$$

So the 95% interval would be $\dfrac{\sigma_2^2}{\sigma_1^2} \in [1.24,\ \infty)$.

### Step 6 — Decision

> **If the lower bound $L > 1$**, the entire interval lies above 1. We're 95% confident $\sigma_2^2 > \sigma_1^2$, so **M2 really is less precise than M1 — the suspicion is justified.**
>
> **If $L \le 1$** (the interval includes 1), we *cannot* conclude M1 is more precise; the observed difference could be sampling luck.

In the example above $L = 1.24 > 1$, so the suspicion would be confirmed. Plug your real $s_1^2$, $s_2^2$ into Step 5 and apply this rule.

---

## Question 3 — Process capability  *[/2]*

**Situation.** Customer wants steel-sheet width in **[1400, 1460] mm**. The process produces widths that are **normal** with mean $\mu = 1440$ mm and standard deviation $\sigma = 10$ mm. So Lower Spec Limit $\text{LSL}=1400$, Upper Spec Limit $\text{USL}=1460$.

### a) Capability of the process

Two indices. **$C_p$** asks "is the process spread narrow enough to fit inside the spec?" — it ignores centring:

$$C_p = \frac{\text{USL}-\text{LSL}}{6\sigma} = \frac{1460-1400}{6\times 10} = \frac{60}{60} = 1.0$$

(The $6\sigma$ is the natural process width: ±3σ on each side covers 99.73% of a normal distribution.)

But $C_p = 1.0$ assumes the process is *centred*. It isn't: the spec centre is $(1400+1460)/2 = 1430$, while $\mu = 1440$ — shifted 10 mm high. **$C_{pk}$** accounts for this by taking the *worst* of the two sides:

$$C_{pk} = \min\!\left(\frac{\text{USL}-\mu}{3\sigma},\ \frac{\mu-\text{LSL}}{3\sigma}\right) = \min\!\left(\frac{1460-1440}{30},\ \frac{1440-1400}{30}\right)$$

$$= \min\!\left(\frac{20}{30},\ \frac{40}{30}\right) = \min(0.667,\ 1.333) = \boxed{0.67}$$

> **Reading it:** $C_p = 1.0$ says the spread *could* just fit, but $C_{pk} = 0.67$ says the off-centre mean wrecks it. Anything below 1.33 is generally considered not capable; 0.67 is poor. The bottleneck is the **upper** side (the process runs too high).

### b) Expected % scrap (uitval)

Scrap = parts outside [1400, 1460]. We convert each spec limit to a **z-score** (how many standard deviations from the mean):

$$z = \frac{\text{value} - \mu}{\sigma}$$

**Upper tail** (above 1460): $z = \dfrac{1460-1440}{10} = +2.0$.
From the normal table, $P(Z > 2) = 1 - 0.9772 = 0.0228 = \mathbf{2.28\%}$.

**Lower tail** (below 1400): $z = \dfrac{1400-1440}{10} = -4.0$.
$P(Z < -4) \approx 0.00003 = 0.003\%$ — negligible.

$$\text{Total scrap} \approx 2.28\% + 0.003\% \approx \boxed{2.28\%}$$

Essentially all the scrap comes from exceeding the upper limit — exactly what the low $C_{pk}$ warned about.

### c) Two ways to improve capability

1. **Re-centre the process** — shift the mean from 1440 down to the spec centre 1430. This rebalances the tails. With $\mu=1430$ both limits sit at $z=\pm3$, and scrap drops from ~2.3% to ~0.27%. (Cheapest fix: just an adjustment, no new variation removed.)
2. **Reduce the variation** — lower $\sigma$ (better machine setup, more uniform raw material, tighter control). Smaller $\sigma$ raises both $C_p$ and $C_{pk}$ and shrinks both tails.

*(A third, usually unavailable, option is widening the tolerance — only if the customer allows it.)*

### d) Max % scrap tolerated to meet the 6-sigma criterion

The Six Sigma quality target, allowing for the conventional long-term **1.5σ drift**, is **3.4 defects per million opportunities (DPMO)**:

$$\frac{3.4}{1{,}000{,}000} = 0.00034\%$$

$$\boxed{\text{at most } 3.4 \text{ ppm} = 0.00034\%}$$

(For comparison, this process currently runs at ~22,800 ppm — about 6,700× too many defects, roughly a 3.5σ level.)

---

## Question 4 — Control-chart theory  *[/1.5]*

### a) Why may we assume normality and work with means / standard deviations?

Because of the **Central Limit Theorem (CLT)**. A control chart doesn't plot individual measurements — it plots **subgroup averages** $\bar{x}$. The CLT says that the distribution of an *average* tends toward a **normal distribution** as the subgroup size grows, *even if the individual measurements are not normal*. So the plotted averages are approximately normal, which justifies normal-based control limits at $\mu \pm 3\sigma$ (covering 99.73% of in-control variation).

### b) Which causes of variation can a control chart detect?

**Special / assignable causes (bijzondere / aanwijsbare oorzaken).** Every process has two kinds of variation:

- **Common cause** – the inherent, random background noise; points dance randomly *within* the limits.
- **Special cause** – something out of the ordinary (tool breaks, wrong material, setup error); it produces a *signal*: a point outside the limits, a run, or a trend.

The chart's job is to flag **special causes** so you investigate them, while leaving common-cause noise alone (over-reacting to noise is "tampering" and makes things worse).

### c) When do we use the range as the best estimator?

When **subgroups are small** (rule of thumb $n \lesssim 8$–$10$). The **range** $R = x_\text{max} - x_\text{min}$ is trivial to compute and, for small subgroups, almost as efficient an estimate of spread as the standard deviation $s$. For *larger* subgroups the range throws away information (it only uses two points), so the **s-chart** becomes the better choice.

---

## Question 5 — Bias vs variance from confusion matrices  *[/4]*

### Background: reading a confusion matrix and computing accuracy

A **confusion matrix** cross-tabulates actual class (rows) against predicted class (columns). The diagonal = correct predictions. **Accuracy** = (correct) / (total):

$$\text{Accuracy} = \frac{\text{correct predictions}}{\text{total predictions}}$$

Computing all six (training has 1000 rows, test has 600):

| Model | Training accuracy | Test accuracy | Gap (train − test) |
|-------|------------------:|--------------:|-------------------:|
| **A** | (480+485)/1000 = **96.5%** | (180+190)/600 = **61.7%** | ~35 pts |
| **B** | (380+360)/1000 = **74.0%** | (190+180)/600 = **61.7%** | ~12 pts |
| **C** | (420+430)/1000 = **85.0%** | (200+215)/600 = **69.2%** | ~16 pts |

### a) Which model is high variance, high bias, optimal?

The **bias–variance trade-off** is read from *two* numbers: how well the model fits the training data, and how big the drop-off is on unseen test data.

- **High variance (overfitting):** memorises the training set (near-perfect train score) but fails to generalise (big train→test drop). → **Model A**: 96.5% train, but collapses to 61.7% on test — a ~35-point gap. *Classic overfitting.*

- **High bias (underfitting):** too simple to capture the pattern, so it's weak *even on the training data*, and the gap to test is small. → **Model B**: lowest training score of all (74%) and only 61.7% on test. It just can't fit. *Classic underfitting.*

- **Optimal:** good training fit *and* the best generalisation. → **Model C**: 85% train, **69.2% test (the highest test accuracy)**, with a moderate, healthy gap. *Best balance.*

> **Answer:** A = high variance · B = high bias · C = optimal.
> The decisive tell: A fits training almost perfectly but generalises worst; B can't even fit training; C generalises best.

### b) High bias in a decision tree — what to change?

High bias = the tree is **too simple / underfitting**. Make it **more flexible** so it can capture more structure:

- **Increase the maximum depth** (let it grow more levels).
- **Lower the minimum samples per split / per leaf** (allow more, finer splits).
- **Reduce pruning** (less aggressive cost-complexity pruning).
- **Add or engineer more informative features** for it to split on.

All of these let the tree fit the training pattern better, lowering bias. (The opposite — limiting depth, pruning more — is what you'd do for the *high-variance* Model A.)

---

## Question 6 — Distribution families and Var[C]  *[/4]*

**Situation.** Capacitors ("elco's"), nominal 800 µF, non-conform if capacity < 720 µF. Sold in lots of 100. On average **2 in 40 are non-conform** → $p = 2/40 = 0.05$. Mean capacity is actually **820 µF** (not 800). **175.3 orders/week**, **3.6 lots/order**.

### a) Which distribution family fits each variable?

Quick refresher on each family and its mean:

- **Poisson** – counts of independent events in a fixed interval. Mean = the rate.
- **Exponential** – continuous *waiting time between* such events. Mean = 1/rate.
- **Normal** – a continuous quantity scattering symmetrically around a centre.
- **Bernoulli** – a single yes/no trial. Mean = probability of "1".
- **Binomial** – number of "successes" in $n$ independent yes/no trials. Mean = $np$.
- **Uniform** – every value in a range equally likely (a distractor here — nothing fits it).

|   | normaal | Bernoulli | exponentieel | uniform | Poisson | binomiaal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **B** (orders/week) |  |  |  |  | **E[B] = 175.3** |  |
| **T** (time between orders) |  |  | **E[T] = 1/175.3 wk ≈ 0.96 h** |  |  |  |
| **C** (capacity, µF) | **E[C] = 820** |  |  |  |  |  |
| **X** (conform yes/no) |  | **E[X] = 0.95** |  |  |  |  |
| **D** (non-conform per lot) |  |  |  |  |  | **E[D] = 5** |

Reasoning for each:
- **B** counts orders in a week (a fixed interval) → **Poisson**, mean 175.3.
- **T** is the gap between consecutive Poisson arrivals → **Exponential**, mean $1/175.3$ week ≈ 0.96 hour.
- **C** is a continuous measured quantity fluctuating around a centre → **Normal**, mean 820.
- **X** is one part's conform/not outcome → **Bernoulli**. $E[X] = P(\text{conform}) = 1-0.05 = 0.95$. *(If you instead code X as "non-conform = 1", then $E[X]=0.05$ — still Bernoulli.)*
- **D** is the count of non-conform parts among 100 independent parts → **Binomial**$(100, 0.05)$, mean $np = 100\times0.05 = 5$.

### b) For which variable is the i.i.d. assumption unrealistic, and why?

"i.i.d." = elements that are **independent** and **identically distributed**. Several variables strain this — multiple answers are accepted:

- **B (orders/week):** weeks are **not identically distributed** — seasonality, holidays, promotions, end-of-quarter pushes all shift the ordering rate. Weeks aren't interchangeable.
- **D (non-conform per lot)** *(and similarly **C**):* parts made consecutively on one line share process conditions (tool wear, drift, a bad batch of material). Defects therefore **cluster** rather than occurring independently — when the process drifts, you get a run of bad parts. So the "100 independent draws with constant $p$" assumption behind the binomial is shaky; defects are positively autocorrelated.

> Briefly: **B** because weeks differ systematically over time (not identically distributed); **D/C** because parts off the same line are not independent (common process causes correlate them).

### c) Compute Var[C]

We know two things about $C$ (Normal): its mean $\mu = 820$, and that **5% of parts fall below 720 µF** (that's what "non-conform" means, at rate 0.05). Use the second fact to back out $\sigma$.

**Step 1 — z-score of the 720 cut-off.** Standardise:

$$z = \frac{720 - 820}{\sigma} = \frac{-100}{\sigma}$$

**Step 2 — this z must be the 5th percentile.** Since $P(C < 720) = 0.05$, the standardised cut-off equals the standard-normal 5th percentile:

$$z_{0.05} = -1.645$$

**Step 3 — solve for $\sigma$.**

$$\frac{-100}{\sigma} = -1.645 \quad\Rightarrow\quad \sigma = \frac{100}{1.645} = 60.80\ \text{µF}$$

**Step 4 — variance is $\sigma^2$.**

$$\boxed{\operatorname{Var}[C] = \sigma^2 = (60.80)^2 \approx 3696\ \text{µF}^2}$$

> The whole trick: a single tail probability (5% below 720) plus the known mean pins down the standard deviation, because in a normal distribution percentile ↔ z-score ↔ (value − mean)/σ.

---

## Question 7 — Regression line and causal interventions  *[/3]*

This question separates **seeing** (observing a correlation) from **doing** (intervening) — the heart of causal inference. $T$ = annealing temperature (°C), $S$ = product strength (MPa).

### a) Sketch the regression line f(x) = E[S | T = x]

$E[S\mid T=x]$ is the **conditional mean** of strength given temperature — the *average* $S$ at each value of $T$. On the scatter plot, draw the line (or smooth curve) that threads through the **vertical centre of the point cloud** at every temperature: for each $x$, the height of the line is the mean of the $S$-values sitting above that $x$. This is the ordinary best-fit / least-squares line through the data.

### b) Causal diagram S → T, intervene do(T = 730). Sketch ~10 dots.

Here **S causes T** — strength is the *cause*, temperature is the *effect*. The observed S–T correlation exists *because S drives T*.

Now we **intervene** and force $T = 730$ (the "do" operator: $\mathrm{do}(T=730)$). Crucially, **we are fixing the effect, not the cause.** Forcing an effect tells you nothing about its cause and doesn't change it — you can't alter strength by overriding the thermometer. So:

- $S$ keeps its **original, full marginal distribution** (unchanged).
- $T$ is pinned at 730.

> **Draw:** dots in a **vertical line at T = 730**, spread across the **entire natural range of S** (the full top-to-bottom spread S shows in the original data). The original correlation is irrelevant — intervening on the effect cuts the link, so S is unconstrained.

### c) Causal diagram T → S, intervene do(T = 730). Sketch ~10 crosses (second figure).

Now **T causes S** — temperature is the *cause*, strength is the *effect*. Forcing $T = 730$ now **propagates through the causal mechanism** to S. So $S$ follows the **conditional distribution** $P(S \mid T = 730)$.

> **Draw:** crosses in a **vertical line at T = 730**, but **clustered tightly around the regression line's predicted value** $E[S\mid T=730]$, scattered only by the small residual (conditional) spread at that temperature.

### Why b) and c) look completely different — the key insight

Same data, same intervention temperature, opposite pictures:

| | b) S → T (intervene on the **effect**) | c) T → S (intervene on the **cause**) |
|---|---|---|
| Does forcing T change S? | **No** | **Yes** |
| S after intervention | full **marginal** spread of S | **conditional** spread around $E[S\mid 730]$ |
| Picture at T = 730 | dots spanning all of S | crosses hugging the regression line |

This is the difference between **conditioning** (passively observing parts that happened to be at 730°C) and **intervening** (actively setting 730°C). The same observational scatter is consistent with *either* causal direction — which is exactly why you can't read causation off a correlation, and why the causal diagram matters before you act.

---

### One-line recap of the toolkit used

- **Q1** – significance ≠ practical importance; CI ↔ test duality; $\text{SE}=\sigma/\sqrt n$.
- **Q2** – F-distribution for comparing two variances; one-sided CI via `F.INV`.
- **Q3** – $C_p$, $C_{pk}$, z-scores → tail probabilities; 3.4 DPMO.
- **Q4** – Central Limit Theorem; special vs common cause; range for small subgroups.
- **Q5** – confusion-matrix accuracy; bias–variance trade-off; tuning tree complexity.
- **Q6** – distribution families & their means; i.i.d. realism; recovering σ from a tail probability.
- **Q7** – regression as conditional mean; the do-operator; intervening on a cause vs an effect.
