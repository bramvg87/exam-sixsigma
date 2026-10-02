# MERGE_LOG - formularium.md (revisie oktober 2026)

Basis: `reference/drive/formularium.md` (826 regels). Aanvulling: `reference/formularium_aanvulling.md`. Getallen gecontroleerd tegen `testdata/golden_values.json`. Resultaat: `content/formularium.md` (1017 regels).

## Wijzigingen

| id | locatie (sectie) | wat |
|---|---|---|
| Inhoud | Inhoud | Subitems toegevoegd voor de nieuwe secties (B1-B9) en item 8 "Examenstrategie" (anker `#strategie`). |
| A1 | Les 2 / D. Betrouwbaarheidsintervallen, CI verhouding twee varianties | Foute zin "Tweezijdig: deel ook door $F_{1-\alpha/2}$" vervangen door het correcte tweezijdige interval (vermenigvuldigen met $F_{\alpha/2}$ en $F_{1-\alpha/2}$), Excel-formules, regel $F_\alpha(a;b)=1/F_{1-\alpha}(b;a)$ en de waarschuwing over teller/noemer. |
| A2 | Les 2 / B. Toetsprocedure, voorbeeld t-toets | $s=0{,}109$ -> $0{,}1079$ (ruwe data), $t=-2{,}95$ -> $-2{,}98$, p 0,4% -> 0,38%, Excel-voorbeeld aangepast; slidewaarden vermeld; eenzijdige 98%-bovengrens $\mu<9{,}981$ toegevoegd. |
| A3 | Les 2 / D, CI voor een fractie | Tekst herschreven: cursus gebruikt het exacte interval ([1,1% ; 9,9%] voor 4/100), normale benadering geeft [0,16% ; 7,84%]; verwijzing naar het exacte interval eronder. |
| A4 | Les 5 / D. Waargenomen vs. werkelijke procesvariatie | "$C_p\approx1{,}2$" -> $1/C_{p,o}^2=0{,}25+0{,}36=0{,}61\Rightarrow C_{p,o}=1{,}28$. |
| A5 | Les 4 / E. SPC - regelkaarten (na de Western Electric-regels) | Niet in de basis: nieuwe alinea "SPC-oefening 2 (Excel-bestand)" met correcte $\bar{X}$-R-, $\bar{X}$-s-grenzen en capabiliteit. |
| A6 | Les 4 / C. Proces-capabiliteit (na het uitgewerkte voorbeeld) | Niet in de basis: nieuwe alinea "Capabiliteitsoefening as (slide 42)" met 2,28%, 465 ppm en $\bar{s}/c_4$-opmerking. |
| A7 | Root / Vraag 3 | 6$\sigma$-criterium: 3,4 ppm lange termijn ($C_p=2$, $C_{pk}=1{,}5$) + zin over ~0,002 ppm korte termijn gecentreerd. |
| A8 | Les 1 / Kansverdelingen: pdf/cdf | "$f(x)=P(X=x)$ (pdf)" gecorrigeerd: geldt enkel discreet (pmf); continu is $f$ een dichtheid met $P(X=x)=0$ en $P(a\le X\le b)=\int_a^b f$. |
| A9 | Root / Vraag 6 | Tabel: $E[T]=1/175{,}3$ week $=0{,}0057$ week; zin over uren (168 h -> 0,96 h; 40 werkuren -> 0,23 h). |
| B1 | Les 2, nieuwe `###` sectie "Toetsrecepten - volledig overzicht" tussen C en D | Tabel + rekenvoorbeeld contingentietabel letterlijk overgenomen. |
| B2 | Les 2 / D, direct na "CI voor een fractie" | Exact (Clopper-Pearson), Wilson, Wald: formules en tabel letterlijk (als vetgedrukte subtitel, zodat sectie D niet opgesplitst wordt). |
| B3 | Les 2 / D, na "Steekproefgrootte" | Steekproefgrootte met $\alpha$ en $\beta$ letterlijk. |
| B4 | Les 2 / E, na "Plannen voor attributen" | OC-curve, ontwerp, dubbel plan, ASN, p-waarde letterlijk. |
| B5 | Les 2 / F, na "Lotdefecten bij gekend $C_{pk}$" | Defecten per lot (binomiaal) letterlijk. |
| B6 | Les 2 / E, bij "Plan voor variabelen" | Berekening $k$ (exact + Natrella) letterlijk. |
| B7 | Les 4 / E, na de controlekaart-constanten | Andere subgroepgrootte, $\beta$, ARL-tabel letterlijk. |
| B8 | Les 5 / E. Average & range method | MSA-constanten $K_1$, $K_2$, $K_3$ letterlijk, vóór de aanvaardingscriteria. |
| B9 | ML / Confusion matrix | Specificiteit + tabel modellen A/B/C letterlijk. |
| B10 | Volledig Excel-formularium | Nieuwe `###` subsectie "Aanvulling: exacte CI, acceptance sampling, toetsen" vóór de Tip-regel. |
| B11 | Nieuwe eindsectie `##` "Examenstrategie" (anker `strategie`) | Tabel letterlijk. |
| Root Q1 | Root / Vraag 1 (e) | Nuance eenzijdig toegevoegd (conform worked solutions). |
| Root Q2 | Root / Vraag 2 | Rekenvoorbeeld $L=3{,}75\cdot0{,}3305=1{,}24>1$ toegevoegd (conform worked solutions). |
| X1 | Les 4 / A, sigma-capability tabel | DPMO sigma 2: 308.537 -> **308.538** (golden 308537,54; consistent met tabel Les 2.F). |
| X2 | Les 3 / B (CI helling), Les 3 / G ($2^k$ effect), Les 4 / C ($\hat\sigma$) | KaTeX-fout: afsluitende `\ ` vlak voor `$` verwijderd (3 formules compileerden niet). |
| Markers | 40 `###`-secties | `<!-- tool: ID -->` direct onder de kop (verdelingen, hypothese, nonparam, steekproeven, capabiliteit, regressie, anova, doe, spc, msa, ml, wachtrij). |

Alle overige numerieke voorbeelden gecontroleerd en correct bevonden: Poisson $\lambda=2{,}96$ ($P(X>7)=1{,}1\%<2\%$), contingentietabel, stratificatie (0,000195 / 0,000196, Neyman 78), DPMO-tabel Les 2.F, 6σ/8σ-conform, controlekaart-constanten $n=2..10$, freesvoorbeeld ($C_p=0{,}83$, $C_{pk}=0{,}5$), GRR 10%/30% ($1{,}96$/$1{,}71$), $se(\text{effect})$ $2^k$, voorbeeldexamen Q2 ($F=0{,}3305$, $L=1{,}24$), Q3 ($C_p=1$, $C_{pk}=0{,}67$, 2,28%), Q5, Q6 ($\sigma=60{,}8$, Var 3696, Var[D] 4,75). KaTeX: 960 formules, 0 fouten; `scripts/prebuild.mjs`: `texErrors: 0`. Geen em/en-dashes.

## Twijfelachtig, niet gewijzigd

1. **B2, $d=2$ exact ondergrens 0,3%**: Clopper-Pearson geeft 0,24% (golden 0,00243). Slidewaarde behouden.
2. **B2, 4/100 bij 70%: [2,1 ; 7,1]**: Clopper-Pearson geeft [2,0 ; 7,1] (0,0205). Mogelijk andere methode/afronding in de slides.
3. **Les 3 / C, $R^2_{adj}=0{,}9599$** (15 obs, $k=2$): niet te verifiëren; de golden dataset (afgeronde data) geeft $R^2=0{,}9590$, $R^2_{adj}=0{,}9522$. De formule met $n-k-1$ is wel correct.
4. **Les 2 / C, "$\chi^2(n)\to N(n,2n)$"** en **D, "$\bar X\sim N(\mu,\sigma^2/n)$"**: notatie $N(\text{gem},\text{variantie})$, terwijl elders $N(\mu,\sigma)$ gebruikt wordt (bv. Les 2.C). Inhoudelijk juist, notatie inconsistent.
5. **Les 5 Deel II / F, "bij $\lambda\ge1$ bestaat $E[Q]$ niet"**: in de discrete-tijd-queue met $B_n\sim\text{Bern}(q)$ is de stabiliteitsvoorwaarde $E[A]<q$; "$\lambda\ge1$" klopt enkel als $q=1$. Navragen in de slides.
6. **Les 4 / F en Excel-formularium, "Sigma-niveau uit yield `=NORM.S.INV(yield)`"**: geeft de lange-termijn Z zonder +1,5-shift, terwijl "Sigma-niveau (KT) uit DPMO" wel +1,5 optelt. Beide conventies bestaan; vermeld welke je gebruikt.
7. **Les 5 / E, $K_1=1/d_2$**: $1/1{,}128=0{,}8865$ vs AIAG-tabel 0,8862 (B8, gebaseerd op $d_2^*$). Verwaarloosbaar.
8. **Les 2 / E, "$k\approx t(1-\alpha,p_0,n)$"**: vage notatie; B6 geeft nu de exacte niet-centrale-t-formule ernaast.
9. **B11, modulenummers M1-M11**: niet gecontroleerd tegen de app (de app gebruikt tool-ID's, geen M-nummers).
