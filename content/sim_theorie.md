### Waarom simuleren en modelleren?

Veel processen bestaan uit **wachtrijen**: orders die op een machine wachten, klanten aan een loket, tickets bij een helpdesk. Wachten is verspilling (doorlooptijd zonder toegevoegde waarde). Met een **model** voorspel je wachttijden en bezetting zonder het echte proces te verstoren:

- **Analytisch** (formules): snel en exact, maar enkel voor eenvoudige systemen (M/M/1, M/M/1/K).
- **Simulatie** (Monte Carlo, discrete-event simulation): werkt voor elk systeem, maar het resultaat is een **schatting** met toevalsfout. Je hebt dus een betrouwbaarheidsinterval nodig.

### Het Poisson-proces: aankomsten "volledig toevallig"

Klanten komen onafhankelijk van elkaar binnen, met gemiddeld $\lambda$ per tijdseenheid (de **aankomstintensiteit**, arrival rate).

| Grootheid | Verdeling | Gemiddelde | Excel |
|---|---|---|---|
| aantal aankomsten in een interval $t$: $N(t)$ | Poisson($\lambda t$) | $\lambda t$ | `=POISSON.DIST(k;λt;ONWAAR)` |
| tijd tussen twee aankomsten $T$ | exponentieel($\lambda$) | $1/\lambda$ | `=EXPON.DIST(t;λ;WAAR)` |

- Poisson **telt** de gebeurtenissen, exponentieel **meet** de tijd ertussen: twee kanten van hetzelfde proces.
- **Geheugenloos:** hoe lang je al wacht, verandert de resterende wachttijd niet.
- **Superpositie:** twee onafhankelijke Poisson-stromen samen zijn Poisson met $\lambda_1+\lambda_2$.
- **Thinning (uitdunnen):** telt elke gebeurtenis met kans $p$ mee, dan is de overblijvende stroom Poisson met $\lambda p$.

Voorbeeld (examen vraag 6): 175,3 bestellingen per week, dus $B\sim$ Poisson(175,3) per week en de tijd tussen bestellingen is exponentieel met gemiddelde $1/175{,}3$ week $\approx0{,}96$ uur (bij een week van 168 uur).

### Notatie van wachtrijen (Kendall): A/B/c/K

A = aankomstproces, B = bedieningstijden, c = aantal bedienden, K = maximale capaciteit van het systeem. **M** = Markov (Poisson-aankomsten of exponentiële bedieningstijden, geheugenloos). M/M/1: Poisson-aankomsten, exponentiële bediening, één bediende, onbeperkte rij.

| Symbool | Betekenis |
|---|---|
| $\lambda$ | aankomstintensiteit (klanten per tijdseenheid) |
| $\mu$ | bedieningsintensiteit van één bediende (gemiddelde bedieningstijd $1/\mu$) |
| $\rho=\lambda/\mu$ | **bezettingsgraad** (utilization): fractie van de tijd dat de bediende bezig is |
| $L$, $L_q$ | gemiddeld aantal klanten in het systeem, in de rij |
| $W$, $W_q$ | gemiddelde tijd in het systeem (doorlooptijd), in de rij (wachttijd) |
| $\pi_j$ of $P_j$ | kans dat er $j$ klanten in het systeem zijn (steady state) |

### M/M/1: één bediende, onbeperkte rij

Enkel stabiel als $\rho<1$ (er komen gemiddeld minder klanten binnen dan er bediend kunnen worden); anders groeit de rij onbeperkt.
$$P_j=(1-\rho)\rho^j,\qquad L=\frac{\rho}{1-\rho},\qquad L_q=\frac{\rho^2}{1-\rho},\qquad W=\frac{1}{\mu-\lambda},\qquad W_q=\frac{\rho}{\mu-\lambda}$$

**Voorbeeld:** $\lambda=4$, $\mu=5$ per uur: $\rho=0{,}8$ (80% bezet, 20% van de tijd leeg). $L=0{,}8/0{,}2=4$ klanten, $L_q=3{,}2$, $W=1/(5-4)=1$ uur, $W_q=0{,}8$ uur. Een gemiddelde bedieningstijd van 12 minuten levert dus 48 minuten wachten op.

**Het belangrijkste inzicht:** wachttijden **exploderen** als $\rho$ naar 1 gaat. $L=\rho/(1-\rho)$: bij $\rho=0{,}5$ is $L=1$, bij $0{,}8$ is $L=4$, bij $0{,}9$ is $L=9$, bij $0{,}95$ is $L=19$. Een machine "100% bezet" plannen betekent eindeloze rijen; variatie in aankomsten en bedieningstijden heeft buffercapaciteit nodig.

### M/M/1/K: beperkte capaciteit, klanten gaan verloren

Er passen hoogstens $K$ klanten in het systeem (inclusief degene in bediening). Een klant die aankomt als het systeem vol is, gaat verloren (blocking, verlies). Daardoor is het systeem altijd stabiel, ook als $\rho\ge1$.
$$\pi_j=\frac{\rho^j(1-\rho)}{1-\rho^{K+1}}\quad(j=0..K),\qquad L=\sum_j j\,\pi_j,\qquad \lambda_{\text{eff}}=\lambda(1-\pi_K),\qquad W=\frac{L}{\lambda_{\text{eff}}}$$
$\pi_K$ is de **verlieskans** (blocking probability). Let op: in Little gebruik je de **effectieve** doorvoer $\lambda_{\text{eff}}$, want verloren klanten komen nooit in het systeem.

**Voorbeeld:** $\lambda=4$, $\mu=5$, $K=6$: $\pi_0=0{,}253$, $\pi_6=0{,}066$ (6,6% van de klanten gaat verloren), $L=2{,}142$, $\lambda_{\text{eff}}=4\cdot(1-0{,}066)=3{,}735$, $W=2{,}142/3{,}735=0{,}574$ uur.

### Wet van Little: $L=\lambda W$

Voor **elk** stabiel systeem op lange termijn, ongeacht de verdelingen:
$$\text{gemiddeld aantal in het systeem (WIP)}=\text{doorvoer}\times\text{gemiddelde doorlooptijd}$$
Ook voor de rij alleen: $L_q=\lambda W_q$. **Voorbeeld:** 120 orders onderhanden (WIP) bij een doorvoer van 40 per dag geeft een doorlooptijd van $120/40=3$ dagen. Minder WIP bij dezelfde doorvoer verkort de doorlooptijd rechtstreeks: de basis van Lean (pull, WIP-limieten).

**Flow efficiency** $=\dfrac{\text{waarde toevoegende tijd}}{\text{doorlooptijd}}$: vaak maar enkele procenten; de rest is wachten.

### Monte Carlo-simulatie en haar betrouwbaarheid

Simuleer het systeem $n$ keer (runs, replicaties) met toevalsgetallen en neem het gemiddelde van de uitkomst. Elke run is een toevallige waarneming, dus het gemiddelde is een **schatting** met standaardfout $s/\sqrt n$:
$$\bar x\pm z_{1-\alpha/2}\,\frac{s}{\sqrt n},\qquad n\ge\left(\frac{z_{1-\alpha/2}\,s}{E}\right)^2\ \text{voor een foutenmarge }E$$
Vier keer zoveel runs halveert de foutenmarge. Bij een kans (bv. $\pi/4$ via treffers in een cirkel) is $s^2=\hat p(1-\hat p)$ per run.

**In Excel:** `=RAND()` geeft een uniform getal in [0,1]; met de inverse-methode maak je elke verdeling: exponentieel $=-\frac{1}{\lambda}\ln(\text{RAND()})$, normaal `=NORM.INV(RAND();μ;σ)`. **Voorbeeld (lampen in serie):** drie lampen met exponentiële levensduur (gemiddeld 10 000 uur); de keten valt uit bij de eerste defecte lamp: $\min$ van exponentiëlen is weer exponentieel met rate $3/10\,000$, dus MTTF $=10\,000/3=3333$ uur.

**Discrete-event simulation (DES):** het systeem springt van gebeurtenis naar gebeurtenis (aankomst, start bediening, vertrek). Gooi een **opwarmperiode** (warm-up) weg zodat je enkel het stationaire gedrag (steady state) meet, en gebruik meerdere onafhankelijke replicaties voor een betrouwbaarheidsinterval.
