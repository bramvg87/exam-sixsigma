### Wat is capabiliteit?

Capabiliteit (process capability) beantwoordt één vraag: **past de natuurlijke spreiding van het proces binnen de specificaties van de klant?** Je vergelijkt twee dingen:

- **De stem van de klant:** de specificatiegrenzen LSL en USL (lower/upper specification limit). De tolerantie is $USL-LSL$.
- **De stem van het proces:** de natuurlijke spreiding van het proces, $6\sigma$ breed ($\mu\pm3\sigma$ bevat 99,73% van de stuks bij een normale verdeling).

**Voorwaarden.** (1) Het proces is **stabiel** (regelkaart onder controle, enkel gewone oorzaken), anders is er geen vaste $\mu$ en $\sigma$ om mee te rekenen. (2) Het kenmerk is (ongeveer) **normaal** verdeeld, want de omrekening naar % uitval gebruikt de normale verdeling. Stabiel betekent niet capabel: een stabiel proces kan perfect voorspelbaar slechte stuks maken.

**Niet verwarren:** specificatiegrenzen (LSL/USL) komen van de klant; controlegrenzen (LCL/UCL) van een regelkaart komen uit het proces zelf ($\mu\pm3\sigma/\sqrt n$ voor gemiddelden). Capabiliteit gebruikt de specificatiegrenzen.

### $C_p$: past de spreiding? (potentieel)

$$C_p=\frac{USL-LSL}{6\sigma}=\frac{\text{toegelaten breedte}}{\text{natuurlijke breedte van het proces}}$$

$C_p$ zegt **hoeveel keer de procesbreedte $6\sigma$ in de tolerantie past**, los van waar het proces ligt. $C_p=1$: het proces vult de tolerantie precies ($6\sigma=USL-LSL$). $C_p=2$: de tolerantie is twee keer zo breed als het proces. Het is de **beste** capabiliteit die je kan halen, als het proces perfect gecentreerd zou staan: daarom "potentieel". $C_p$ bestaat enkel bij tweezijdige specificaties.

### $C_{pk}$: ligt het proces goed? (werkelijk)

$$C_{pu}=\frac{USL-\mu}{3\sigma},\qquad C_{pl}=\frac{\mu-LSL}{3\sigma},\qquad C_{pk}=\min(C_{pu},\,C_{pl})$$

$C_{pk}$ meet de afstand van het gemiddelde tot de **dichtstbijzijnde** grens, uitgedrukt in halve procesbreedtes ($3\sigma$). Zo houdt hij ook rekening met de **ligging** (centrering). De grens met de kleinste waarde is **beperkend**: daar komt de meeste uitval. Altijd $C_{pk}\le C_p$, gelijk enkel als het proces perfect gecentreerd is. Bij een eenzijdige specificatie (enkel USL of enkel LSL) bestaat enkel $C_{pk}$.

**Verband met de z-waarde:** de afstand tot de grens in standaardafwijkingen is $z=3\,C_{pk}$. Bv. $C_{pk}=0{,}67\Rightarrow z=2\Rightarrow P(Z>2)=2{,}28\%$ uitval aan die kant.

### $C_p$ en $C_{pk}$ samen lezen

| $C_p$ | $C_{pk}$ | Betekenis | Actie |
|---|---|---|---|
| hoog | hoog (≈ $C_p$) | smal en goed gecentreerd | in orde, bewaken |
| hoog | laag | smal genoeg, maar **verschoven** | **centreren** (instellen, kalibreren): meestal eenvoudig |
| laag | laag | te **brede spreiding** | **variatie verkleinen** (bronnen van spreiding aanpakken): moeilijker; centreren alleen volstaat niet |
| laag | hoger dan $C_p$ | onmogelijk | rekenfout: $C_{pk}\le C_p$ |

Vuistregel: kijk eerst naar $C_p$. Is die al te laag, dan helpt centreren niet genoeg.

### Van $C_{pk}$ naar % uitval

Met de z-waarden tot beide grenzen:
$$P(\text{uitval})=\Phi\!\left(\frac{LSL-\mu}{\sigma}\right)+1-\Phi\!\left(\frac{USL-\mu}{\sigma}\right)$$
In ppm (parts per million): fractie $\times10^6$; % naar ppm: $\times10\,000$.

### Korte termijn ($C_p$, $C_{pk}$) en lange termijn ($P_p$, $P_{pk}$)

Dezelfde formules, maar met een andere $\sigma$:

| | $\sigma$ | Hoe schatten | Betekenis |
|---|---|---|---|
| $C_p$, $C_{pk}$ | binnen subgroepen (korte termijn, "white noise") | $\bar R/d_2$ of $\bar s/c_4$ uit de regelkaart | wat het proces **kan** als het stabiel loopt |
| $P_p$, $P_{pk}$ | overall (lange termijn, alles mee) | $s$ van alle individuele waarden | wat de klant **krijgt**, inclusief verschuivingen tussen subgroepen |

Is $P_{pk}$ duidelijk lager dan $C_{pk}$, dan schuift het proces over de tijd (variatie tussen subgroepen): eerst stabiliseren. Met één kolom losse metingen ken je enkel de overall $s$.

### Beoordeling

| $C_p$ / $C_{pk}$ | Oordeel | Uitval bij gecentreerd proces |
|---|---|---|
| $<1$ | niet capabel: spreiding groter dan tolerantie | $>2700$ ppm (0,27%) |
| $1$ | net capabel, geen marge ($6\sigma$ = tolerantie) | 2700 ppm |
| $1{,}33$ | capabel: gangbare minimumeis ($8\sigma$ = tolerantie) | ca. 63 ppm |
| $1{,}67$ | zeer capabel, vaak eis voor nieuwe processen ($10\sigma$) | ca. 0,6 ppm |
| $2$ | zes sigma ($12\sigma$ = tolerantie) | 0,002 ppm (2 per miljard) |

### Sigma-niveau, 1,5$\sigma$-shift en DPMO

Het **sigma-niveau** is het aantal standaardafwijkingen tussen het gemiddelde en de dichtstbijzijnde grens op korte termijn: $Z=3\,C_{pk}$. Uit ervaring (Motorola) verschuift een procesgemiddelde op lange termijn tot **1,5$\sigma$**; daarom reken je de uitval op lange termijn met $Z-1{,}5$:

$$DPMO=10^6\cdot\big(1-\Phi(Z-1{,}5)\big)$$

| Sigma-niveau | DPMO (lange termijn) | Yield |
|---|---|---|
| 2 | 308 538 | 69,15% |
| 3 | 66 807 | 93,32% |
| 4 | 6 210 | 99,38% |
| 5 | 233 | 99,977% |
| 6 | 3,4 | 99,99966% |

**Zes sigma** technisch: $C_p=2$ en (na de shift) $C_{pk}=1{,}5$, dus $Z=4{,}5$ tot de grens: **3,4 ppm = 0,00034%** uitval op lange termijn. Zonder shift en perfect gecentreerd: $2\cdot P(Z>6)=0{,}002$ ppm.

**Discrete capabiliteit** (tellingen, geen meetwaarden): $DPU=D/N$ (defecten per eenheid), $DPO=D/(N\cdot O)$ (per kans op een defect), $DPMO=10^6\cdot DPO$; het sigma-niveau volgt uit $Z=\Phi^{-1}(1-DPO)+1{,}5$.

### Hoe verbeter je de capabiliteit?

1. **Centreren:** het gemiddelde naar het midden van de tolerantie brengen. Dan wordt $C_{pk}=C_p$. Meestal eenvoudig (instelling, kalibratie, operator).
2. **Spreiding verkleinen:** oorzaken van variatie aanpakken (machine, materiaal, methode, meting). Dit verhoogt $C_p$ en $C_{pk}$ samen; moeilijker, vaak een verbeterproject.
3. **Toleranties herbekijken** met de klant (enkel als de functionele eis het toelaat).
4. Controleer ook het **meetsysteem** (MSA): meetfout blaast de waargenomen $\sigma$ op en verlaagt de waargenomen $C_p$.

### Uitgewerkte voorbeelden

- **Examen vraag 3:** $LSL=1400$, $USL=1460$, $\mu=1440$, $\sigma=10$. $C_p=60/60=1{,}00$ (spreiding past net). $C_{pu}=20/30=0{,}67$, $C_{pl}=40/30=1{,}33$, dus $C_{pk}=0{,}67$ (USL beperkend). Uitval: boven $z=2$: 2,275%; onder $z=-4$: 0,003%; totaal **2,28%**. Gecentreerd op 1430 zou het 0,27% zijn. Zes sigma-criterium: hoogstens 3,4 ppm.
- **Freesstuk:** specs $100\pm10$, $\bar{\bar X}=104$, $\bar R=9{,}30$ ($n=5$): $\hat\sigma=9{,}30/2{,}326=4$. $C_p=20/24=0{,}83$ en $C_{pk}=\min(6/12;\,14/12)=0{,}50$. Uitval ongeveer 6,7% (vooral boven USL). Centreren brengt $C_{pk}$ naar 0,83, maar het proces blijft niet capabel ($3\sigma=12>10$): de **spreiding** moet omlaag.
