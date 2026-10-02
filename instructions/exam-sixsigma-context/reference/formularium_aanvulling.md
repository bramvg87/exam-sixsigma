# Formularium - revisie oktober 2026 (aanvulling op formularium.md van 28/06)

> Review van `formularium.md` tegen de cursusslides (Ottoy: Testing of Hypotheses, Confidence Intervals, Acceptance Sampling, Test Recipes; Grymonprez: Capabiliteit-SPC; SPC-oefeningen), het voorbeeldexamen en de worked solutions. Alle getallen hieronder zijn herrekend (scipy, gelijk aan Excel).
>
> Gebruik: deel A = correcties die in de bestaande tekst moeten worden aangepast. Deel B = nieuwe secties, met de plaats waar ze horen. Claude Code voegt dit samen tot `content/formularium.md`.
>
> Oordeel: het formularium is inhoudelijk sterk en dekt les 1-5 en het voorbeeldexamen goed. De belangrijkste gaten: (1) de cursus gebruikt een **exact** betrouwbaarheidsinterval voor een fractie, niet de normale benadering; (2) de toetsrecepten voor **twee steekproeven** (gepaard en niet-gepaard), chi-kwadraat-aanpassing en contingentietabellen ontbreken; (3) de rekenkant van **OC-curves** en SPC-oefening 4 (andere subgroepgrootte, detectiekans) ontbreekt.

---

## A. Correcties in de bestaande tekst

**A1. Les 2.D - CI voor de verhouding van twee varianties, tweezijdig (FOUT).**
Er staat "deel ook door $F_{1-\alpha/2}$ voor de bovengrens". Correct is **vermenigvuldigen**. Uit de pivot $\frac{s_1^2}{s_2^2}\cdot\rho\sim F(n_1-1,n_2-1)$ met $\rho=\sigma_2^2/\sigma_1^2$:
$$\frac{s_2^2}{s_1^2}\,F_{\alpha/2}(n_1{-}1;n_2{-}1)\ \le\ \frac{\sigma_2^2}{\sigma_1^2}\ \le\ \frac{s_2^2}{s_1^2}\,F_{1-\alpha/2}(n_1{-}1;n_2{-}1)$$
Excel: ondergrens `=(s2²/s1²)*F.INV(α/2;n1-1;n2-1)`, bovengrens `=(s2²/s1²)*F.INV(1-α/2;n1-1;n2-1)`. Handig: $F_{\alpha}(a;b)=1/F_{1-\alpha}(b;a)$, dus `F.INV(0,05;9;14)` = `1/F.INV.RT(0,05;14;9)` = 0,3305.
Wil je de verhouding andersom ($\sigma_1^2/\sigma_2^2$), keer dan teller en noemer én de vrijheidsgraden om. Schrijf op het examen altijd expliciet welke variantie in de teller staat.

**A2. Les 2.B - t-toets voorbeeld.** Met de 20 ruwe meetwaarden is $s=0{,}1079$ en $t=-2{,}98$ (p = 0,38%). De slide rekent met afgeronde $s=0{,}109$ en vindt $t=-2{,}95$. Conclusie identiek (verwerp $H_0$ bij $\alpha=2\%$). Bovengrens eenzijdig 98%-CI: $\mu<9{,}981$, dus 10 valt erbuiten.

**A3. Les 2.D - CI voor een fractie: de cursus gebruikt de EXACTE methode.**
Het formularium geeft enkel de normale benadering $p\pm1{,}96\sqrt{p(1-p)/n}$. De slides (Ottoy, Confidence Intervals) rekenen voor $n=100$, $d=4$: **[1,1% ; 9,9%]**. Dat is het exacte (binomiale/hypergeometrische) interval. De normale benadering geeft hier [0,16% ; 7,84%], duidelijk anders. Zie nieuwe sectie B2.

**A4. Les 5.D - GRR-voorbeeld.** Bij $\%GRR=60\%$ en werkelijke $C_p=2$: $1/C_{p,o}^2=0{,}25+0{,}36=0{,}61\Rightarrow C_{p,o}=1{,}28$ (niet "$\approx1{,}2$"). Conclusie blijft: onaanvaardbaar meetsysteem.

**A5. Les 4 - SPC-oefening 2 (Excel-bestand).** In het oefenblad staan UCL 16,9 / LCL 15,7: dat zijn **geen** $\bar{X}$-kaartgrenzen. Correct ($n=5$, 20 subgroepen):
- $\bar{\bar{X}}=16{,}266$, $\bar{R}=0{,}480$ -> $\bar{X}$-kaart: UCL $=16{,}543$, LCL $=15{,}989$; R-kaart: UCL $=D_4\bar{R}=1{,}015$, LCL $=0$.
- Alternatief $\bar{X}$-s: $\bar{s}=0{,}1958$ -> UCL/LCL $=16{,}545/15{,}987$; s-kaart UCL $=0{,}409$.
- Geen enkel punt buiten de grenzen -> proces statistisch onder controle.
- Capabiliteit (specs $16{,}2\pm0{,}5$): $\hat\sigma=\bar{R}/d_2=0{,}206$ -> $C_p=0{,}81$, $C_{pk}=0{,}70$ (bovenzijde beperkend), verwachte uitval $\approx2{,}1\%$. Onder controle maar **niet capabel**.

**A6. Les 4 - capabiliteitsoefening "as" (slide 42).** Slide: $C_p=1{,}17$, $C_{pk}=0{,}67$, "uitval 5% of 2,5% eenzijdig". De juiste uitval is $P(Z<-2)=$ **2,28%** (bovenzijde $z=+5$ verwaarloosbaar). Gecentreerd ($\mu=72{,}1$): $z=\pm3{,}5$ -> 2 x 233 ppm = **465 ppm** (slide: 400 ppm). Strikt genomen is $\hat\sigma=\bar{s}/c_4=0{,}2/0{,}940=0{,}213$ (dan $C_p=1{,}10$, $C_{pk}=0{,}63$); de slide gebruikt $\bar{s}$ rechtstreeks. Op het examen: vermeld welke $\sigma$ je gebruikt.

**A7. Voorbeeldexamen vraag 3d - "6 sigma-criterium".** Primair antwoord blijft **3,4 ppm = 0,00034%** (lange termijn, met 1,5σ-shift; slide "Technical definition": $C_p=2$, $C_{pk}=1{,}5$). Vermeld in één zin dat een perfect gecentreerd 6σ-proces op korte termijn ~0,002 ppm (2 per miljard) geeft (slide "Cp = 2: 2 defects per billion, short term"). Zo dek je beide lezingen af.

**A8. Les 1 - notatie pdf.** $f(x)=P(X=x)$ geldt enkel voor discrete verdelingen (kansmassa). Voor continue verdelingen is $f$ een **dichtheid**: $P(X=x)=0$ en $P(a\le X\le b)=\int_a^b f(x)\,dx$.

**A9. Voorbeeldexamen vraag 6 - $E[T]$.** $E[T]=1/175{,}3$ week $=0{,}0057$ week. In uren hangt het af van de definitie van een week: 168 h -> 0,96 h; 40 werkuren -> 0,23 h. Schrijf je aanname op.

---

## B. Nieuwe secties

### B1. Toetsrecepten - volledig overzicht (Ottoy, "Test Recipes - Further Reading")
*Invoegen in Les 2, na sectie C.*

| Toets | $H_0$ | Teststatistiek | Referentie | Voorwaarden | Excel |
|---|---|---|---|---|---|
| t-toets $\mu$ | $\mu=\mu_0$ | $t=\dfrac{\bar{x}-\mu_0}{s/\sqrt{n}}$ | $t(n-1)$ | X normaal (robuust bij grote n) | `T.DIST`, `T.INV` |
| t-toets $\mu_1-\mu_2$ niet gepaard | $\mu_1-\mu_2=d$ | $t=\dfrac{\bar{x}_1-\bar{x}_2-d}{s_p\sqrt{\frac1{n_1}+\frac1{n_2}}}$, $\ s_p^2=\dfrac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2}$ | $t(n_1+n_2-2)$ | normaal, **$\sigma_1=\sigma_2$**, onafhankelijke steekproeven | `T.TEST(r1;r2;zijden;2)` |
| idem, ongelijke varianties (Welch) | idem | $t=\dfrac{\bar{x}_1-\bar{x}_2}{\sqrt{s_1^2/n_1+s_2^2/n_2}}$ | $t(\nu)$, $\nu$ via Welch-Satterthwaite | normaal | `T.TEST(r1;r2;zijden;3)` |
| t-toets gepaard | $\mu_v=d$ | $v_i=x_{1i}-x_{2i}$, $\ t=\dfrac{\bar{v}-d}{s_v/\sqrt{n}}$ | $t(n-1)$ | verschillen normaal; **geen** voorwaarde $\sigma_1=\sigma_2$ | `T.TEST(r1;r2;zijden;1)` |
| Z-toets $\pi$ | $\pi=\pi_0$ | $z=\dfrac{p-\pi_0}{\sqrt{\pi_0(1-\pi_0)/n}}$; continuïteitscorrectie: $p\pm\frac{1}{2n}$ (+ links, - rechts) | $N(0,1)$ | $n\pi_0>5$, anders exact (binomiaal) | `NORM.S.DIST` |
| $\chi^2$-toets $\sigma$ | $\sigma=\sigma_0$ | $\chi^2=\dfrac{(n-1)s^2}{\sigma_0^2}$ | $\chi^2(n-1)$ | X normaal, **niet robuust** | `CHISQ.DIST.RT` |
| F-toets $\sigma_1/\sigma_2$ | $\sigma_1=\sigma_2$ | $F=s_1^2/s_2^2$ | $F(n_1-1,n_2-1)$ | normaal, onafh.; **niet robuust** (dus voorzichtig als voortoets voor de pooled t-toets) | `F.DIST.RT`, `F.TEST` |
| $\chi^2$ goodness of fit | X heeft opgegeven verdeling | $\chi^2=\sum_k\dfrac{(n_k-e_k)^2}{e_k}$, $e_k=n\pi_k$ | $\chi^2(r-g-1)$, $g$ = geschatte parameters | $e_k>5$ (anders klassen samenvoegen); altijd rechtszijdig | `CHISQ.DIST.RT` |
| $\chi^2$ contingentietabel | X en Y onafhankelijk | $\chi^2=\sum_{k,l}\dfrac{(n_{kl}-e_{kl})^2}{e_{kl}}$, $e_{kl}=\dfrac{n_{k\cdot}\,n_{\cdot l}}{n}$ | $\chi^2((r-1)(s-1))$ | $e_{kl}>5$; 2x2: Yates $\lvert n-e\rvert-\frac12$ | `CHISQ.TEST(obs;exp)` geeft p |
| Wilcoxon-Mann-Whitney | mediaan$_1$ = mediaan$_2$ | $W$ = som rangen groep 1 (alle waarden samen gerangschikt, ties: gemiddelde rang) | groot: $E[W]=\frac{n_1(N+1)}{2}$, $Var[W]=\frac{n_1n_2(N+1)}{12}$, Z-toets | zelfde vorm van verdeling; niet-parametrisch alternatief voor niet-gepaarde t | - |
| Wilcoxon signed ranks | mediaan verschil = 0 | $T^+$ = som rangen van positieve verschillen (rangschik $\lvert v_i\rvert$; $v_i=0$ weglaten) | $n>15$: $E=\frac{n(n+1)}{4}$, $Var=\frac{n(n+1)(2n+1)}{24}$, Z-toets | alternatief voor gepaarde t | - |
| Runs-toets (Wald-Wolfowitz) | steekproef is random (iid) | $R$ = aantal runs boven/onder de mediaan | $E[R]\approx\frac{n}{2}+1$, $Var[R]\approx\frac{n-1}{4}$, Z-toets | test de basisaanname "random steekproef" | - |

*Rekenvoorbeeld contingentietabel (Les 1, lijn x kwaliteit, 500 stuks):* $\chi^2=11{,}80$, df $=(2-1)(3-1)=2$, p $=0{,}0027$ -> verwerp onafhankelijkheid: lijn en kwaliteit hangen samen (bevestigt de conclusie uit de voorwaardelijke kansen).

### B2. Betrouwbaarheidsinterval voor een fractie: exact, Wilson en normaal
*Invoegen in Les 2.D, direct na "CI voor een fractie/proportie".*

**Exact (Clopper-Pearson) - de methode van de slides.** Het interval bevat alle $\pi$ waarvoor de waargenomen $d$ niet in de $\alpha/2$-staarten van de binomiale verdeling valt:
$$\pi_L=\texttt{BETA.INV}\big(\tfrac{\alpha}{2};\,d;\,n-d+1\big),\qquad \pi_U=\texttt{BETA.INV}\big(1-\tfrac{\alpha}{2};\,d+1;\,n-d\big)$$
($d=0\Rightarrow\pi_L=0$; $d=n\Rightarrow\pi_U=1$.) Eenzijdig: vervang $\alpha/2$ door $\alpha$.

| $n=100$, 95% | exact (cursus) | Wilson | normaal (Wald) |
|---|---|---|---|
| $d=0$ | [0% ; 3,6%] | [0% ; 3,7%] | onbruikbaar |
| $d=2$ | [0,3% ; 7,0%] | [0,6% ; 7,0%] | [-0,7% ; 4,7%] |
| $d=4$ | **[1,1% ; 9,9%]** | [1,6% ; 9,8%] | [0,2% ; 7,8%] |

**Wilson (score-interval)** - beste benadering als je geen BETA.INV wil gebruiken:
$$\pi=\frac{p+\frac{z^2}{2n}\pm z\sqrt{\frac{p(1-p)}{n}+\frac{z^2}{4n^2}}}{1+\frac{z^2}{n}}$$
**Normaal (Wald)** $p\pm z\sqrt{p(1-p)/n}$: enkel als er minstens ~5 defecten in de steekproef zitten (slide: bij 1% defecten dus $n\ge500$).
*Eindige populatie:* exact via de hypergeometrische verdeling (`HYPGEOM.DIST`); bij $N=10000$, $n=100$ nauwelijks verschil met binomiaal.
*Les uit de slides:* betrouwbaarheid en nauwkeurigheid zijn een trade-off bij vaste $n$ (4/100: 70% -> [2,1;7,1], 95% -> [1,1;9,9], 99% -> [0,7;12,0]); de breedte halveren vraagt $n\times4$.

### B3. Steekproefgrootte met $\alpha$ én $\beta$ (onderscheidingsvermogen)
*Invoegen in Les 2.D, na "Steekproefgrootte".*

Gemiddelde, eenzijdige toets, verschuiving $\delta$ detecteren met risico's $\alpha$ en $\beta$ (power $1-\beta$):
$$n=\left(\frac{(z_{1-\alpha}+z_{1-\beta})\,\sigma}{\delta}\right)^2\qquad(\text{tweezijdig: }z_{1-\alpha/2})$$
Omgekeerd, $\beta$ bij gegeven $n$ (eenzijdig rechts): $\beta=\Phi\!\left(z_{1-\alpha}-\dfrac{\delta\sqrt{n}}{\sigma}\right)$.
Fractie (normale benadering): $n=\left(\dfrac{z_{1-\alpha}\sqrt{\pi_0(1-\pi_0)}+z_{1-\beta}\sqrt{\pi_1(1-\pi_1)}}{\pi_1-\pi_0}\right)^2$.
Kernboodschap uit de slides: $\alpha$ kies je; $\beta$ volgt uit $\alpha$, $n$ en de werkelijke toestand. $\beta$ verkleinen bij vaste $\alpha$ kan enkel met een grotere steekproef. $\alpha\approx0$ kiezen maakt $\beta$ enorm ("de rechter die nooit een onschuldige veroordeelt, laat iedereen vrij").

### B4. OC-curve en ontwerp van een aanvaardingsplan (rekenkant)
*Invoegen in Les 2.E, na "Plannen voor attributen".*

Enkelvoudig plan $(n,c)$, lotfractie $\pi$:
$$P_{acc}(\pi)=P[d\le c]=\sum_{i=0}^{c}\binom{n}{i}\pi^i(1-\pi)^{n-i}=\texttt{BINOM.DIST}(c;n;\pi;\text{WAAR})$$
$$\alpha=1-P_{acc}(AQL)\ (\text{producer's risk}),\qquad \beta=P_{acc}(LQL)\ (\text{consumer's risk})$$

| Plan | $P_{acc}(2\%)$ | $\alpha$ | $P_{acc}(8\%)=\beta$ |
|---|---|---|---|
| (100, 4) | 0,949 | 5,1% | 9,0% |
| (130, 5) | 0,953 | 4,7% | 4,7% |

(Hypergeometrisch met $N=10000$, $D=200$: $P_{acc}=0{,}950$.) **Ontwerp:** zoek de kleinste $n$ (met bijhorende $c$) zodat $P_{acc}(AQL)\ge1-\alpha$ én $P_{acc}(LQL)\le\beta$. Hogere $c$ bij vaste $n$: kleinere $\alpha$, grotere $\beta$.
**Dubbel plan** $(n_1,c_1,c_2)+(n_2,c_3)$: $P_{acc}=P[d_1\le c_1]+\sum_{d_1=c_1+1}^{c_2-1}P[d_1]\cdot P[d_2\le c_3-d_1]$; gemiddelde steekproefgrootte $ASN=n_1+n_2\cdot P[c_1<d_1<c_2]$. Equivalente plannen = zelfde OC-curve; dubbel/sequentieel is efficiënter (kleinere ASN).
**p-waarde bij acceptance sampling:** $P[d\ge d_{obs}\mid\pi=AQL]$.

### B5. Defecten per lot bij gekende capabiliteit
*Invoegen in Les 2.F, na "Lotdefecten bij gekend Cpk".*
Defecten onafhankelijk -> aantal defecten $i$ in een lot van $N$ is binomiaal: $P(i)=\binom{N}{i}\pi^i(1-\pi)^{N-i}$. $C_{pk}=1$ (gecentreerd): $\pi=0{,}27\%$, $N=10000$ -> $E[i]=27$, praktisch tussen ~12 en ~44. $C_{pk}=1{,}33$: $\pi=0{,}0063\%$ -> $E[i]=0{,}6$, nooit meer dan ~3. Een lot met 100 defecten bij $C_{pk}=1$ is zo onwaarschijnlijk dat het proces veranderd moet zijn.

### B6. Variabelenplan $(n,k)$: hoe $k$ berekenen
*Invoegen in Les 2.E, bij "Plan voor variabelen".*
Exact: $k=\dfrac{t'_{1-\alpha}\big(n-1;\ z_{1-p_0}\sqrt{n}\big)}{\sqrt{n}}$ (niet-centrale t). Benadering (Natrella):
$$k\approx\frac{z_{1-p_0}+\sqrt{z_{1-p_0}^2-ab}}{a},\quad a=1-\frac{z_{1-\alpha}^2}{2(n-1)},\quad b=z_{1-p_0}^2-\frac{z_{1-\alpha}^2}{n}$$
Voorbeeld $n=20$, $p_0=AQL=2\%$, $\alpha=5\%$: $k=2{,}93$ (exact), 2,91 (benadering). Aanvaard als $Q=(\bar{x}-\xi)/s\ge k$. Variabelenplannen zijn efficiënter dan attribuutplannen (meer informatie per stuk).

### B7. SPC: andere subgroepgrootte, detectiekans en ARL (oefening 4)
*Invoegen in Les 4.E, na de controlekaart-constanten.*
1. Schat $\hat\sigma=\bar{R}/d_2(n_{oud})$ (of $\bar{s}/c_4$).
2. Nieuwe grenzen voor $n'$: $\ \bar{\bar{X}}\pm3\hat\sigma/\sqrt{n'}$ (= $\bar{\bar{X}}\pm A_2(n')\bar{R}'$ met $\bar{R}'=d_2(n')\hat\sigma$); R-kaart: $CL=d_2(n')\hat\sigma$, UCL $=D_4(n')\bar{R}'$, LCL $=D_3(n')\bar{R}'$.
3. Kans dat een verschuiving van $k\sigma$ **niet** gedetecteerd wordt op de eerstvolgende subgroep:
$$\beta=\Phi(3-k\sqrt{n})-\Phi(-3-k\sqrt{n}),\qquad P(\text{detectie})=1-\beta,\qquad ARL_1=\frac{1}{1-\beta}$$

| $n$ | detectiekans 2σ-shift | ARL |
|---|---|---|
| 3 | 67,9% | 1,47 |
| 5 | 93,0% | 1,08 |
| 8 | 99,6% | 1,004 |

Conclusie oefening 4c: kleinere subgroep = bredere grenzen voor $\bar{X}$ = tragere detectie; grotere subgroep detecteert sneller maar kost meer metingen. In-control: $\alpha=0{,}27\%$ per punt, $ARL_0=370$.
*Variabele subgroepgrootte ($\bar{X}$-s):* grenzen per subgroep: $\bar{\bar{X}}\pm A_3(n_i)\bar{s}$, $B_3(n_i)\bar{s}$, $B_4(n_i)\bar{s}$, met $\bar{s}$ gewogen.

### B8. MSA-constanten Average & Range (AIAG)
*Invoegen in Les 5.E.*

| $K_1$ (trials) | 2: 0,8862 | 3: 0,5908 |
|---|---|---|
| $K_2$ (operatoren) | 2: 0,7071 | 3: 0,5231 |

$K_3$ (aantal stukken): 2: 0,7071 · 3: 0,5231 · 4: 0,4467 · 5: 0,4030 · 6: 0,3742 · 7: 0,3534 · 8: 0,3375 · 9: 0,3249 · 10: 0,3146.
$\%EV=100\,EV/TV$, $\%AV=100\,AV/TV$, $\%PV=100\,PV/TV$; tolerantie-basis: $\%GRR_{tol}=100\cdot6\,GRR/TOL$. (Controleer tegen `tabel MSA.pdf`.)

### B9. Classificatie: extra maten
*Invoegen in de ML-sectie bij de confusion matrix.*
Specificiteit $=TN/(TN+FP)$. Voorbeeldexamen vraag 5 (Goed = positief):

| Model | train acc | test acc | kloof | diagnose |
|---|---|---|---|---|
| A | 96,5% | 61,7% | 34,8 | hoge variantie (overfit) |
| B | 74,0% | 61,7% | 12,3 | hoge bias (underfit) |
| C | 85,0% | 69,2% | 15,8 | optimaal (beste test) |

Beslisregel: **train laag** -> bias; **train hoog en test veel lager** -> variantie; **beste test-score** -> optimaal.

### B10. Excel-functies aanvulling
*Toevoegen aan het Excel-formularium.*

| Doel | Functie |
|---|---|
| Exact CI fractie (Clopper-Pearson) | `=BETA.INV(α/2;d;n-d+1)` ; `=BETA.INV(1-α/2;d+1;n-d)` |
| Kritieke c bij acceptance sampling | `=BINOM.INV(n;π;1-α)` (kleinste c met cumulatieve kans ≥ 1-α) |
| t-toets twee reeksen | `=T.TEST(r1;r2;zijden;type)` type 1 = gepaard, 2 = gelijke varianties, 3 = ongelijke |
| $\chi^2$-toets onafhankelijkheid | `=CHISQ.TEST(waargenomen;verwacht)` (geeft p-waarde) |
| Exponentieel | `=EXPON.DIST(x;λ;WAAR)` |
| Gamma / lnGamma | `=GAMMA.DIST(...)`, `=GAMMALN(x)` |
| Wisselen staarten F | `=F.INV(α;a;b)` = `=1/F.INV.RT(α;b;a)` |

### B11. Examenstrategie: vraagtype -> formule -> tool
*Nieuwe eindsectie.*

| Als de vraag gaat over... | Formule / methode | Toolkit-module |
|---|---|---|
| "Klopt deze uitspraak?" (significant, CI, steekproef) | significantie ≠ relevantie; CI <-> toets; $SE=\sigma/\sqrt n$; non-response na selectie | Formularium, M2 duality |
| "M1 nauwkeuriger dan M2?" | F-verdeling, eenzijdige CI voor variantieverhouding | M2 F-toets / CI ratio |
| "Is het gemiddelde verschoven?" | t-toets (1 steekproef), gepaard of 2 steekproeven | M2 |
| "Is de spreiding toegenomen?" | $\chi^2$-toets / CI voor $\sigma$ | M2 |
| Fractie defecten, lot aanvaarden | exact CI, OC-curve, $(n,c)$ | M2, M10 |
| Capabiliteit, % uitval, verbeteren | $C_p$, $C_{pk}$, z-scores, DPMO | M3 |
| Regelkaart opstellen / interpreteren | $\bar{X}$-R, $\bar{X}$-s, Western Electric | M6 |
| Meetsysteem goed genoeg? | GRR, %GRR, ndc | M7 |
| Welke factoren beïnvloeden y? | ANOVA, $2^k$ effecten, regressie | M7, M8, M9 |
| Welke verdeling, E en Var, σ uit staartkans | familie-tabel, $z=(x-\mu)/\sigma$ | M1 |
| Bias/variantie, confusion matrix | accuracy train vs test | M11 |
| Regressielijn schetsen, interventie | $E[S\mid T]$, do-operator | M11 uitleg |
