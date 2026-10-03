### Het beslissingskader

Een hypothesetoets is een **beslisregel onder onzekerheid**, geen bewijs. $H_0$ (nulhypothese) is de saaie standaardsituatie ("het proces is in orde", "er is geen verschil"); $H_A$ (alternatieve hypothese) is wat je vermoedt en wil aantonen. Zoals in een rechtbank: je houdt $H_0$ aan ("onschuldig") tot de data te onwaarschijnlijk worden onder $H_0$. Niet verwerpen betekent "onvoldoende bewijs", niet "bewezen".

| | Werkelijkheid: $H_0$ waar | Werkelijkheid: $H_A$ waar |
|---|---|---|
| **Beslissing: $H_0$ behouden** | juist | **fout van de 2e soort**, kans $\beta$ (gemist effect) |
| **Beslissing: $H_0$ verwerpen** | **fout van de 1e soort**, kans $\alpha$ (vals alarm) | juist, kans $1-\beta$ = **power** |

- $\alpha$ = **significantieniveau** = kans op vals alarm die je aanvaardt (meestal 5%). Je kiest $\alpha$ **vooraf**.
- $\beta$ = kans dat je een echt effect mist; **power** $1-\beta$ = kans dat je het ziet. $\beta$ hangt af van $\alpha$, $n$, de spreiding en hoe groot het echte effect is. Beide verkleinen kan enkel met een grotere steekproef.
- Denk aan een rookmelder: $\alpha$ = hij gaat af zonder brand, $\beta$ = hij zwijgt bij echte brand.

### De toetsprocedure in 7 stappen

1. **Hypothesen:** formuleer $H_0$ (met "=") en $H_A$ ($<$, $>$ of $\ne$). De richting volgt uit de vraag, niet uit de data.
2. **Significantie:** kies $\alpha$ (bv. 5%, of 1-2% als een vals alarm duur is).
3. **Toetsgrootheid:** kies de juiste formule en haar verdeling onder $H_0$ (zie "Welke toets?" hieronder).
4. **Steekproefgrootte:** bepaal $n$ uit $\alpha$, $\beta$, de spreiding $\sigma$ en het kleinste relevante effect $\delta$ (tab Steekproefgrootte).
5. **Kritieke waarde:** zoek de grens van het verwerpingsgebied in de verdeling onder $H_0$.
6. **Meten en rekenen:** trek de steekproef, bereken de toetsgrootheid (en de p-waarde).
7. **Besluit:** vergelijk met de kritieke waarde (of p met $\alpha$, of $\theta_0$ met het BI) en formuleer de conclusie **in de taal van het probleem**.

### Variabelen: wat ze betekenen en hoe je ze berekent

| Symbool | Betekenis | Berekening | Excel |
|---|---|---|---|
| $n$ | steekproefgrootte: aantal metingen | tellen | `=COUNT(bereik)` |
| $\bar{x}$ | steekproefgemiddelde, schatting van $\mu$ | $\bar{x}=\frac{1}{n}\sum x_i$ | `=AVERAGE(bereik)` |
| $s$ | steekproef-standaardafwijking, schatting van $\sigma$ | $s=\sqrt{\frac{\sum(x_i-\bar{x})^2}{n-1}}$ | `=STDEV.S(bereik)` |
| $s^2$ | steekproefvariantie | $s^2$ (delen door $n-1$) | `=VAR.S(bereik)` |
| $\mu$, $\sigma$ | ware (onbekende) populatiewaarden van het proces | niet berekenbaar, enkel schatten | - |
| $\mu_0$, $\sigma_0$, $\pi_0$ | waarde volgens $H_0$ (norm, nominale waarde) | gegeven in de vraag | - |
| $\sigma$ "gekend" | spreiding die vastligt uit historische data (bv. SPC) | gegeven | - |
| $p=d/n$ | waargenomen fractie (bv. defecten $d$ in $n$ stuks) | $d/n$ | `=d/n` |
| $SE$ | standaardfout: typische toevalsschommeling van de schatting | $\sigma/\sqrt{n}$, $s/\sqrt{n}$ of $\sqrt{\pi_0(1-\pi_0)/n}$ | `=STDEV.S(...)/SQRT(n)` |
| df | vrijheidsgraden: aantal vrije gegevens na het schatten | $n-1$ (1 steekproef), $n_1+n_2-2$ (pooled), $(n_1-1;n_2-1)$ (F) | - |
| toetsgrootheid | signaal/ruis: hoe ver de schatting van $H_0$ ligt, in standaardfouten | $\frac{\text{schatting}-\text{waarde onder }H_0}{SE}$ (bij spreiding een verhouding) | zie per toets |
| kritieke waarde | grens van het verwerpingsgebied: onder $H_0$ wordt ze met kans $\alpha$ overschreden | kwantiel van de verdeling | `=T.INV`, `=CHISQ.INV.RT`, `=F.INV` |
| p-waarde | kans op een toetsgrootheid minstens zo extreem als waargenomen, **als $H_0$ waar is** | staartoppervlakte voorbij de toetsgrootheid | `=T.DIST`, `=CHISQ.DIST.RT`, ... |
| BI | betrouwbaarheidsinterval: plausibele waarden voor de parameter | schatting $\pm$ kritieke waarde $\times SE$ | - |

### Eenzijdig of tweezijdig?

- **Tweezijdig** ($H_A:\ \ne$): "is veranderd", "verschilt". $\alpha$ wordt verdeeld: $\alpha/2$ in elke staart.
- **Linkszijdig** ($H_A:\ <$): "is kleiner geworden", "is nauwkeuriger" (kleinere $\sigma$). Heel $\alpha$ in de linkerstaart.
- **Rechtszijdig** ($H_A:\ >$): "is gestegen", "meer defecten". Heel $\alpha$ in de rechterstaart.

Een eenzijdige toets is gevoeliger in die ene richting, maar de richting moet uit de vraagstelling komen, **vooraf**.

### Drie gelijkwaardige beslisregels

Bij dezelfde $\alpha$ en zijdigheid geven ze altijd dezelfde conclusie:
1. p-waarde $<\alpha$ $\Rightarrow$ verwerp $H_0$;
2. toetsgrootheid voorbij de kritieke waarde $\Rightarrow$ verwerp $H_0$;
3. de hypothesewaarde ligt buiten het $(1-\alpha)$-BI $\Rightarrow$ verwerp $H_0$ (eenzijdige toets $\leftrightarrow$ eenzijdige grens).

**Valkuilen:** p is niet de kans dat $H_0$ waar is. Significant is niet hetzelfde als praktisch belangrijk (bij grote $n$ is elk klein verschil significant). Niet significant bewijst $H_0$ niet.

### Welk betrouwbaarheidsinterval?

| Parameter | Interval | Excel |
|---|---|---|
| $\mu$, $\sigma$ gekend | $\bar x\pm z_{1-\alpha/2}\,\sigma/\sqrt n$ | `NORM.S.INV` |
| $\mu$, $\sigma$ onbekend | $\bar x\pm t_{1-\alpha/2;\,n-1}\,s/\sqrt n$ | `T.INV` |
| $\sigma^2$ | $\left[\frac{(n-1)s^2}{\chi^2_{1-\alpha/2}};\ \frac{(n-1)s^2}{\chi^2_{\alpha/2}}\right]$ | `CHISQ.INV` |
| $\sigma_2^2/\sigma_1^2$ | $\frac{s_2^2}{s_1^2}\left[F_{\alpha/2};\ F_{1-\alpha/2}\right](n_1-1;n_2-1)$ | `F.INV` |
| $\pi$ (fractie) | exact: `BETA.INV`; Wald $p\pm z\sqrt{p(1-p)/n}$ enkel bij $\ge5$ defecten | `BETA.INV` |
| $\mu_1-\mu_2$ | $\bar x_1-\bar x_2\pm t\,s_p\sqrt{1/n_1+1/n_2}$ | `T.INV` |
