## ex:cotton

**De situatie.** Een textielbedrijf maakt een synthetische vezel en mengt er katoen door. De vraag: **heeft het katoengehalte invloed op de treksterkte** van de vezel? Men test 5 katoengehaltes (15%, 20%, 25%, 30% en 35% katoen) en maakt bij elk gehalte 5 proefstukken, in willekeurige volgorde. Gemeten wordt de treksterkte (in psi, pond per vierkante inch: hoe hoger, hoe sterker). Dit is het klassieke voorbeeld uit Montgomery (Design and Analysis of Experiments).

- **Factor:** katoengehalte. **Niveaus:** 5 (15 tot 35%). **Respons:** treksterkte. **Herhalingen:** 5 per niveau, dus $N=25$ metingen.

**Hoe staan de getallen in het grid?** Elke **kolom** is één groep (één katoengehalte); de kolomkop is het gehalte. De 5 getallen in een kolom zijn de 5 proefstukken bij dat gehalte. Bv. kolom "15": 7, 7, 15, 11, 9 betekent dat de vijf proefstukken met 15% katoen een sterkte van 7, 7, 15, 11 en 9 hadden.

**Eerst zelf kijken.**

| Katoen | 15% | 20% | 25% | 30% | 35% |
|---|---|---|---|---|---|
| gemiddelde sterkte | 9,8 | 15,4 | 17,6 | 21,6 | 10,8 |
| standaardafwijking | 3,3 | 3,1 | 2,1 | 2,6 | 2,9 |

De sterkte stijgt van 15% naar 30% en zakt dan sterk bij 35%. Binnen een groep schommelen de metingen ongeveer 2 tot 3 eenheden (toeval tussen proefstukken). De vraag van ANOVA: zijn de verschillen **tussen** de gemiddelden (van 9,8 tot 21,6) groot vergeleken met die schommeling **binnen** de groepen?

**De ANOVA-tabel gelezen.**

| Bron | SS | df | MS | F | p |
|---|---|---|---|---|---|
| Tussen groepen | 475,76 | 4 | 118,94 | 14,76 | 0,000009 |
| Binnen groepen | 161,20 | 20 | 8,06 | | |
| Totaal | 636,96 | 24 | | | |

- **$SS_{\text{tussen}}=475{,}76$:** hoe ver de 5 groepsgemiddelden van het algemene gemiddelde 15,04 liggen (gekwadrateerd, maal 5 stukken per groep). Dit is de variatie die het katoengehalte (plus wat toeval) veroorzaakt.
- **$SS_{\text{binnen}}=161{,}20$:** de spreiding van de proefstukken rond hun eigen groepsgemiddelde: puur toeval (materiaal, meting).
- **df:** 5 groepen geven $5-1=4$; 25 metingen min 5 groepsgemiddelden geven 20.
- **$MS_{\text{binnen}}=8{,}06$:** de schatting van de ruisvariantie $\sigma^2$, dus $\sigma\approx\sqrt{8{,}06}=2{,}84$ psi.
- **$MS_{\text{tussen}}=118{,}94$:** zou ook ongeveer 8 zijn als het katoengehalte geen effect had.
- **$F=118{,}94/8{,}06=14{,}76$:** de variatie tussen de groepen is bijna 15 keer zo groot als je door toeval zou verwachten. De kritieke waarde $F_{0{,}95}(4;20)=2{,}87$ wordt ruim overschreden; $p=0{,}000009$.
- **$R^2=475{,}76/636{,}96=0{,}75$:** 75% van alle variatie in sterkte wordt verklaard door het katoengehalte.

**Conclusie in gewone taal.** Het katoengehalte heeft een **zeer significante invloed** op de treksterkte: de verschillen tussen de gehaltes zijn veel te groot om toeval te zijn.

**Wat nu? Welke gehaltes verschillen?** ANOVA zegt enkel dat er verschillen zijn. Met Fisher's LSD (Least Significant Difference) $=t_{0{,}975;20}\sqrt{2\,MS_W/5}=2{,}086\cdot1{,}80=3{,}75$: twee gemiddelden verschillen significant als ze meer dan 3,75 uit elkaar liggen. Dan blijkt: 15% en 35% verschillen niet van elkaar (9,8 vs 10,8), 20% en 25% evenmin (15,4 vs 17,6), en **30% is significant beter dan alle andere** (21,6; minstens 4,0 hoger). Advies: werk met ongeveer 30% katoen.

## ex:three

**De situatie (fictief voorbeeld).** Drie leveranciers leveren dezelfde as; per leverancier meet je de diameter (in mm) van 4 willekeurige stuks. De vraag: **leveren de drie leveranciers gemiddeld dezelfde diameter?**

- **Factor:** leverancier. **Niveaus:** 3 (groep 1, 2, 3). **Respons:** diameter. **Herhalingen:** 4 per leverancier, $N=12$.

**Hoe staan de getallen in het grid?** Elke kolom is één leverancier, elke cel één gemeten as. Kolom 1 bevat de 4 diameters van leverancier 1: 12,1 - 11,8 - 12,5 - 12,0 mm.

**Eerst zelf kijken.** Gemiddelden 12,10 / 13,05 / 12,30 mm, telkens met een standaardafwijking van ongeveer 0,28 mm. Leverancier 2 valt op: bijna 1 mm hoger, terwijl de stuks binnen een leverancier maar ongeveer 0,3 mm verschillen.

**De ANOVA-tabel gelezen.** $SS_{\text{tussen}}=2{,}007$ (df 2), $SS_{\text{binnen}}=0{,}710$ (df 9). $MS_W=0{,}0789$, dus de ruis is $\sigma\approx0{,}28$ mm. $MS_B=1{,}003$ is 12,7 keer zo groot: $F=12{,}72$ tegen een kritieke waarde $F_{0{,}95}(2;9)=4{,}26$; $p=0{,}0024$. $R^2=0{,}74$.

**Conclusie in gewone taal.** De leveranciers verschillen significant in gemiddelde diameter. LSD $=t_{0{,}975;9}\sqrt{2\cdot0{,}0789/4}=0{,}45$ mm: leverancier 2 wijkt af van 1 en 3 (verschillen 0,95 en 0,75 mm), leveranciers 1 en 3 verschillen niet (0,20 mm). Actie: leverancier 2 aanspreken of zijn stuks apart behandelen.

## ex:machines

**De situatie.** Vijf operatoren (Peter, Paul, Mary, Donald, Hillary) werken elk één keer op vier soorten bewerkingen/machines (Milling = frezen, Turning = draaien, Painting = schilderen, Cutting = snijden). Per combinatie is er één score (in het voorbeeld van de ANOVA-tool zonder eenheid; denk aan een productiviteits- of kwaliteitsscore, hoger = beter). De vragen: **hangt de score af van de machine? En van de operator?**

- **Factor A (rijen):** operator, 5 niveaus. **Factor B (kolommen):** machine, 4 niveaus. **Respons:** score. **Zonder herhaling:** precies één meting per combinatie, $5\times4=20$ metingen.

**Hoe staan de getallen in het grid?** Elke rij is een operator, elke kolom een machine; de cel is de score van die operator op die machine. Bv. Peter haalt 46 op Milling en 56 op Turning.

**Eerst zelf kijken.**

| | Milling | Turning | Painting | Cutting | rijgemiddelde |
|---|---|---|---|---|---|
| Peter | 46 | 56 | 55 | 47 | 51 |
| Paul | 54 | 55 | 51 | 56 | 54 |
| Mary | 48 | 56 | 50 | 58 | 53 |
| Donald | 46 | 60 | 51 | 59 | 54 |
| Hillary | 51 | 53 | 53 | 55 | 53 |
| kolomgemiddelde | 49 | 56 | 52 | 55 | 53 |

De operatoren liggen dicht bij elkaar (51 tot 54). De machines verschillen meer: Milling scoort laag (49), Turning hoog (56).

**De ANOVA-tabel gelezen.**

| Bron | SS | df | MS | F | p |
|---|---|---|---|---|---|
| Operator (rijen) | 24 | 4 | 6 | 0,46 | 0,76 |
| Machine (kolommen) | 150 | 3 | 50 | 3,85 | 0,039 |
| Fout (rest) | 156 | 12 | 13 | | |
| Totaal | 330 | 19 | | | |

- **$SS_{\text{operator}}=24$:** de rijgemiddelden liggen dicht bij 53 (5 operatoren, elk over 4 machines).
- **$SS_{\text{machine}}=150$:** de kolomgemiddelden liggen verder uit elkaar.
- **$SS_E=156$ met df $(5-1)(4-1)=12$:** alles wat overblijft. Omdat er per cel maar één meting is, zit hier de toevalsruis **en** een eventuele interactie in (bv. dat Peter slecht is op Cutting maar goed op Painting). $MS_E=13$, dus $\sigma\approx3{,}6$.
- **Operator:** $F=6/13=0{,}46<F_{krit}=3{,}26$, $p=0{,}76$: de verschillen tussen operatoren zijn kleiner dan de ruis. **Niet significant.**
- **Machine:** $F=50/13=3{,}85>F_{krit}=3{,}49$, $p=0{,}039$: **significant** op 5%.

**Conclusie in gewone taal.** De score hangt af van de **machine** (Milling is duidelijk zwakker, Turning en Cutting het best), maar niet aantoonbaar van de **operator**. Voordeel van tweeweg: door de operatoren als tweede factor mee te nemen, haal je hun variatie uit de foutterm; met een eenweg-ANOVA op enkel de machines zou de ruis groter zijn. Beperking: zonder herhaling kan je niet toetsen of sommige operatoren beter zijn op specifieke machines (interactie).

## ex:norep

**De situatie (fictief voorbeeld).** Vier machines (rij 1 tot 4) worden elk bediend door drie operatoren (Operator 1, 2, 3); per combinatie één meting van de opbrengst (bv. stuks per uur). Vragen: verschillen de machines? Verschillen de operatoren?

**Hoe staan de getallen in het grid?** Rij = machine, kolom = operator, cel = opbrengst van die operator op die machine.

**Eerst zelf kijken.** Machinegemiddelden 52,3 / 48,7 / 56,0 / 51,0; operatorgemiddelden 51,5 / 54,5 / 50,0. De patronen zijn heel regelmatig: op elke machine scoort operator 2 het hoogst en operator 3 het laagst, en machine 3 is voor elke operator de beste.

**De ANOVA-tabel gelezen.** $SS_{\text{machine}}=84{,}7$ (df 3), $SS_{\text{operator}}=42{,}0$ (df 2), $SS_E=1{,}33$ (df 6), $MS_E=0{,}22$: er blijft bijna geen onverklaarde variatie over. $F_{\text{machine}}=127$ ($p<0{,}0001$), $F_{\text{operator}}=94{,}5$ ($p<0{,}0001$).

**Conclusie in gewone taal.** Zowel de machine als de operator hebben een zeer significant effect. Omdat de ruis zo klein is, zijn zelfs verschillen van een paar stuks per uur duidelijk aantoonbaar.

## ex:plant

**De situatie.** Een experiment met planten: hoe beïnvloeden **water** en **zonlicht** de groei? Twee factoren:

- **Factor A (rijen): water geven**, 2 niveaus: dagelijks (Daily) of wekelijks (Weekly).
- **Factor B (kolommen): zonlicht**, 4 niveaus: geen (None), weinig (Low), middel (Medium), veel (High).
- **Respons:** groei van de plant (bv. in cm na de proefperiode).
- **Herhalingen:** 5 planten per combinatie, dus $2\times4\times5=40$ planten.

**Hoe staan de getallen in het grid (blokformaat)?** De kopregel bevat de zonniveaus. De rij met label "Daily" en de 4 rijen eronder (met lege eerste cel) zijn de 5 planten die dagelijks water kregen; elke kolom is een zonniveau. Dus de eerste kolom onder "None" bevat 4,8 - 4,4 - 3,2 - 3,9 - 4,4: de groei van de 5 planten zonder zon en met dagelijks water. Daarna volgt het blok "Weekly" op dezelfde manier. Dit is het formaat van Excel "Anova: twee factoren met herhaling".

**Eerst zelf kijken: de celgemiddelden.**

| | None | Low | Medium | High | rijgemiddelde |
|---|---|---|---|---|---|
| Daily | 4,14 | 4,98 | 5,72 | 5,78 | 5,16 |
| Weekly | 4,00 | 5,22 | 6,06 | 5,32 | 5,15 |
| kolomgemiddelde | 4,07 | 5,10 | 5,89 | 5,55 | 5,15 |

- Van links naar rechts (meer zon) stijgt de groei duidelijk, van ongeveer 4,1 naar 5,9; bij veel zon zakt het iets terug.
- Tussen dagelijks en wekelijks water is er nauwelijks verschil (5,16 tegen 5,15).
- In het interactieplot lopen de twee lijnen (Daily en Weekly) ongeveer evenwijdig: het effect van de zon is ongeveer hetzelfde bij beide waterregimes.

**De ANOVA-tabel gelezen.**

| Bron | SS | df | MS | F | p |
|---|---|---|---|---|---|
| Water (A) | 0,0003 | 1 | 0,0003 | 0,001 | 0,98 |
| Zon (B) | 18,76 | 3 | 6,25 | 23,05 | < 0,0001 |
| Interactie water x zon | 1,01 | 3 | 0,34 | 1,24 | 0,31 |
| Fout (binnen cellen) | 8,68 | 32 | 0,27 | | |
| Totaal | 28,46 | 39 | | | |

- **Fout:** de 5 planten in dezelfde cel kregen exact dezelfde behandeling; hun verschillen zijn dus zuivere ruis. $MS_E=0{,}27$, dus $\sigma\approx0{,}52$ cm. df $=2\cdot4\cdot(5-1)=32$.
- **Interactie** (lees je eerst): $F=1{,}24$, $p=0{,}31$: **niet significant**. Het effect van de zon hangt niet af van hoe vaak je water geeft. Daardoor mag je de hoofdeffecten apart interpreteren.
- **Zon:** $F=6{,}25/0{,}27=23{,}05$, $p<0{,}0001$: **zeer significant**. De kolomgemiddelden verschillen veel meer dan toeval verklaart.
- **Water:** $F=0{,}001$, $p=0{,}98$: **geen effect**; de twee rijgemiddelden zijn praktisch gelijk.

**Conclusie in gewone taal.** De hoeveelheid **zonlicht** bepaalt de groei (meest groei bij middel tot veel zon, weinig zonder zon). Of je dagelijks of wekelijks water geeft, maakt **geen verschil**, en dat geldt bij elk zonniveau (geen interactie). Praktisch: water geven kan wekelijks (goedkoper), investeer in licht.

## ex:rep

**De situatie (fictief voorbeeld).** Een chemisch proces: hoe beïnvloeden **temperatuur** (Laag, Hoog) en **druk** (P1, P2, P3) de **opbrengst** (bv. in %)? Per combinatie 3 herhaalde runs, dus $2\times3\times3=18$ runs.

**Hoe staan de getallen in het grid (lang formaat)?** Elke rij is één run: kolom 1 = temperatuur, kolom 2 = druk, kolom 3 = gemeten opbrengst. Bv. "Laag, P1, 20" is een run bij lage temperatuur en druk P1 met opbrengst 20.

**Eerst zelf kijken: de celgemiddelden.**

| | P1 | P2 | P3 |
|---|---|---|---|
| Laag | 21 | 25 | 28 |
| Hoog | 23 | 30 | 37 |

Bij lage temperatuur stijgt de opbrengst van 21 naar 28 als de druk stijgt (+7); bij hoge temperatuur van 23 naar 37 (+14). Het druk-effect is dus **twee keer zo groot** bij hoge temperatuur: de lijnen in het interactieplot lopen uit elkaar.

**De ANOVA-tabel gelezen.** Temperatuur $F=128$, druk $F=165{,}5$ en **interactie $F=18{,}5$ ($p=0{,}0002$)**, allemaal significant; $MS_E=1{,}0$.

**Conclusie in gewone taal.** Omdat de interactie significant is, kan je de effecten niet los van elkaar beschrijven: "hoe groot het effect van de druk is, **hangt af** van de temperatuur". Kijk naar de celgemiddelden: de beste instelling is **Hoog + P3** (37). Dit is het verschil met het plantenvoorbeeld, waar de interactie niet significant was en je elke factor apart mocht interpreteren.
