### Wat doet ANOVA?

**Variantieanalyse (ANOVA, analysis of variance)** toetst of de **gemiddelden** van meerdere groepen verschillen, bv. de opbrengst bij 3 temperaturen of de sterkte bij 5 katoenpercentages. Ondanks de naam vergelijkt ANOVA gemiddelden, maar het doet dat door **varianties** te vergelijken.

- Een **factor** is de variabele die je verandert (temperatuur, machine, operator). De **niveaus** (levels) zijn de waarden ervan (bv. 3 temperaturen).
- De **respons** $Y$ is wat je meet. Elke groep = alle metingen bij één niveau.
- $H_0:\ \mu_1=\mu_2=\dots=\mu_a$ (de factor heeft geen effect) tegen $H_A$: minstens één gemiddelde verschilt. ANOVA zegt **niet welk**.

**Waarom niet gewoon t-toetsen per paar?** Met 3 groepen zijn er 3 paren, met 5 groepen al 10. Elke t-toets op 5% heeft 5% kans op vals alarm, dus de kans op minstens één vals alarm loopt op ($1-0{,}95^3=14\%$ bij 3 paren, $1-0{,}95^{10}=40\%$ bij 10). ANOVA toetst alles in één keer op niveau $\alpha$.

### Het kernidee: spreiding opsplitsen

Model: $Y_{ij}=\mu+\tau_i+\varepsilon_{ij}$: elke meting = algemeen gemiddelde + effect van groep $i$ + toevallige fout ($\varepsilon\sim N(0,\sigma^2)$). Splits de totale spreiding in twee delen:

$$\underbrace{\sum_{i,j}(y_{ij}-\bar y)^2}_{SS_T\ \text{totaal}}=\underbrace{\sum_i n_i(\bar y_i-\bar y)^2}_{SS_B\ \text{tussen groepen}}+\underbrace{\sum_{i,j}(y_{ij}-\bar y_i)^2}_{SS_W\ \text{binnen groepen}}$$

| Begrip | Betekenis | Berekening |
|---|---|---|
| $\bar y_i$ | groepsgemiddelde | `=AVERAGE(groep)` |
| $\bar y$ | grootgemiddelde (alle metingen) | `=AVERAGE(alle data)` |
| $SS_B$ (between, treatment) | hoe ver de groepsgemiddelden uit elkaar liggen: **effect + ruis** | $\sum n_i(\bar y_i-\bar y)^2$ |
| $SS_W$ (within, error) | spreiding rond elk groepsgemiddelde: **enkel ruis** | $\sum$ `DEVSQ(groep)` |
| $SS_T$ | totale spreiding | `=DEVSQ(alle data)` |
| df | vrijheidsgraden | tussen: $a-1$; binnen: $N-a$; totaal: $N-1$ |
| $MS=SS/df$ | mean square: een **variantieschatting** | $MS_B=SS_B/(a-1)$, $MS_W=SS_W/(N-a)$ |
| $F$ | verhouding van de twee variantieschattingen | $MS_B/MS_W$ |

**Waarom delen door df?** Een som van kwadraten groeit met het aantal termen; delen door de vrijheidsgraden maakt er een gemiddelde kwadratische afwijking van, dus een variantie. $a-1$: van de $a$ groepsgemiddelden ligt er één vast door het grootgemiddelde. $N-a$: $N$ metingen min de $a$ geschatte groepsgemiddelden.

**De F-logica (signaal/ruis).** $MS_W$ schat altijd $\sigma^2$ (de ruis). $MS_B$ schat ook $\sigma^2$ **als $H_0$ waar is**, maar wordt groter als de groepen echt verschillen. Onder $H_0$ is $F\approx1$; een echt effect geeft $F\gg1$. De toets is daarom altijd **rechtszijdig**: verwerp $H_0$ als $F>F_{krit}=F_{1-\alpha}(a-1;N-a)$, of als p $<\alpha$.

### De ANOVA-tabel lezen (voorbeeld)

Drie groepen van 4 metingen; groepsgemiddelden 12,10 / 13,05 / 12,30, grootgemiddelde 12,48.

| Bron | SS | df | MS | F | p |
|---|---|---|---|---|---|
| Tussen groepen | 2,007 | 2 | 1,003 | 12,72 | 0,0024 |
| Binnen groepen | 0,710 | 9 | 0,0789 | | |
| Totaal | 2,717 | 11 | | | |

$MS_W=0{,}0789$ is de schatting van $\sigma^2$ (dus $\hat\sigma=0{,}28$). $MS_B$ is 12,7 keer zo groot: veel meer dan toeval verklaart ($F_{krit}=F_{0{,}95}(2;9)=4{,}26$, `=F.INV.RT(0,05;2;9)`; p $=0{,}0024$, `=F.DIST.RT(12,72;2;9)`). **Besluit:** verwerp $H_0$; minstens één gemiddelde verschilt (vooral groep 2). $R^2=SS_B/SS_T=0{,}74$: 74% van de variatie komt van de factor.

### Na een significante F: welke groepen verschillen?

Een **post-hoc** vergelijking: paarsgewijze t-toetsen met $s_p=\sqrt{MS_W}$ en Bonferroni-correctie ($\alpha/m$ voor $m$ paren), Fisher's LSD (Least Significant Difference: $t_{1-\alpha/2;\,N-a}\sqrt{MS_W(1/n_i+1/n_j)}$), of Tukey. Kijk ook naar het gemiddeldenplot.

### Aannames

1. **Onafhankelijke** metingen (randomiseer de volgorde van de proeven).
2. **Normale** residuen per groep (residu = meting - groepsgemiddelde).
3. **Gelijke varianties** per groep (vuistregel: grootste/kleinste $s$ hoogstens ongeveer 2). Bij gelijke groepsgroottes is ANOVA vrij robuust.

### Tweeweg-ANOVA: twee factoren tegelijk

Twee factoren A (rijen, $a$ niveaus) en B (kolommen, $b$ niveaus), bv. machine en operator. Model met $r$ herhalingen per cel:
$$Y_{ijk}=\mu+\alpha_i+\beta_j+(\alpha\beta)_{ij}+\varepsilon_{ijk}$$

| Bron | SS | df | F |
|---|---|---|---|
| A (rijen) | $br\sum_i(\bar y_{i\cdot}-\bar y)^2$ | $a-1$ | $MS_A/MS_E$ |
| B (kolommen) | $ar\sum_j(\bar y_{\cdot j}-\bar y)^2$ | $b-1$ | $MS_B/MS_E$ |
| Interactie AB | $r\sum_{i,j}(\bar y_{ij}-\bar y_{i\cdot}-\bar y_{\cdot j}+\bar y)^2$ | $(a-1)(b-1)$ | $MS_{AB}/MS_E$ |
| Fout (binnen cellen) | $\sum(y_{ijk}-\bar y_{ij})^2$ | $ab(r-1)$ | |
| Totaal | $\sum(y_{ijk}-\bar y)^2$ | $abr-1$ | |

- **Hoofdeffect** A: verschillen tussen de rijgemiddelden, uitgemiddeld over B. Idem voor B.
- **Interactie** AB: het effect van A **hangt af** van het niveau van B. In het interactieplot (één lijn per niveau van A): evenwijdige lijnen = geen interactie, niet-evenwijdige of kruisende lijnen = interactie.
- **Leesvolgorde:** eerst de interactie. Is die significant, dan zijn de hoofdeffecten niet los te interpreteren ("het hangt ervan af"): bekijk de celgemiddelden. Is ze niet significant, interpreteer dan A en B apart.
- **Voordeel boven twee eenweg-ANOVA's:** de variatie door de andere factor gaat uit de foutterm, dus de toets wordt gevoeliger (zelfde idee als blokken in DOE).

**Zonder herhaling** ($r=1$, één meting per cel): er is geen zuivere fout. Wat overblijft na A en B ($SS_E=SS_T-SS_A-SS_B$, df $(a-1)(b-1)$) bevat de interactie **en** de ruis samen; je moet veronderstellen dat er geen interactie is.

**Voorbeelden (ANOVA-tool):**
- *Machines x operatoren, zonder herhaling* (5 operatoren, 4 machines): $SS_{\text{oper}}=24$ (df 4), $SS_{\text{mach}}=150$ (df 3), $SS_E=156$ (df 12, $MS_E=13$). $F_{\text{mach}}=50/13=3{,}85$, p $=0{,}039$: de machine heeft een significant effect; $F_{\text{oper}}=0{,}46$, p $=0{,}76$: de operator niet.
- *Plantengroei: water x zon, met 5 herhalingen:* zon $F=23{,}05$ (p $<0{,}001$, significant), water $F=0{,}001$ (p $=0{,}98$), interactie $F=1{,}24$ (p $=0{,}31$, niet significant): de zon bepaalt de groei, en dat effect is hetzelfde bij dagelijks of wekelijks water geven.

### Verband met andere technieken

- **t-toets:** eenweg-ANOVA met 2 groepen geeft dezelfde p als de pooled t-toets ($F=t^2$).
- **Regressie:** ANOVA is regressie met dummy-variabelen; dezelfde ontbinding $SS_T=SS_R+SS_E$.
- **DOE ($2^k$):** de effecten van een factorieel proefopzet worden met dezelfde ANOVA-tabel getoetst.
- **Gauge R&R:** de ANOVA-methode splitst de meetvariatie in stukken, operatoren en herhaalbaarheid (module MSA).

**Excel:** Gegevens > Gegevensanalyse > *Anova: één factor* / *twee factoren zonder herhaling* / *twee factoren met herhaling* (blokformaat met $r$ rijen per niveau). p-waarde `=F.DIST.RT(F;df1;df2)`, kritieke waarde `=F.INV.RT(α;df1;df2)`.
