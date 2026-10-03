### Wat is een betrouwbaarheidsinterval?

Een **betrouwbaarheidsinterval (BI, confidence interval)** is een reeks plausibele waarden voor een onbekende populatieparameter ($\mu$, $\sigma^2$, $\sigma_2^2/\sigma_1^2$, $\pi$), berekend uit een steekproef. Het geeft niet alleen een schatting, maar ook **hoe nauwkeurig** die schatting is.

**Correcte interpretatie van "95%":** als je de steekproef heel vaak zou herhalen en telkens op dezelfde manier een interval berekent, dan bevat ongeveer 95% van die intervallen de ware waarde. De 95% hoort bij de **methode**, niet bij dit ene interval: de ware $\mu$ ligt vast (ze is niet toevallig), het interval schommelt van steekproef tot steekproef. Op het examen mag je zeggen: "met 95% betrouwbaarheid ligt $\mu$ tussen ... en ...". Zeg niet "er is 95% kans dat $\mu$ in dit interval ligt".

### Opbouw: altijd hetzelfde recept

$$\text{BI} = \text{schatting} \pm \underbrace{\text{kritieke waarde}\times\text{standaardfout}}_{\text{foutenmarge } E}$$

- **Schatting:** $\bar x$ voor $\mu$, $s^2$ voor $\sigma^2$, $s_2^2/s_1^2$ voor de verhouding, $p=d/n$ voor $\pi$.
- **Standaardfout (SE):** hoeveel de schatting door toeval van steekproef tot steekproef schommelt, bv. $\sigma/\sqrt n$.
- **Kritieke waarde:** hoeveel standaardfouten je naar links en rechts gaat om de gekozen betrouwbaarheid te halen: $z_{0{,}975}=1{,}96$ voor 95% (normaal), $t_{0{,}975;\,n-1}$ als $\sigma$ geschat wordt.

Voor spreiding is het geen "$\pm$" maar een **verhouding** ($\chi^2$, $F$): die verdelingen zijn scheef, dus het interval ligt niet symmetrisch rond de schatting.

### Centrale limietstelling (CLT): waarom dit werkt

Het gemiddelde van $n$ onafhankelijke waarnemingen is (bij benadering, voor voldoende grote $n$) normaal verdeeld, **ook als de individuele waarden dat niet zijn**:
$$\bar X \sim N\!\left(\mu,\ \frac{\sigma^2}{n}\right),\qquad SE=\frac{\sigma}{\sqrt n}$$
Dus $\bar x$ ligt in 95% van de steekproeven binnen $\mu\pm1{,}96\,\sigma/\sqrt n$. Omkeren geeft het BI: $\mu$ ligt binnen $\bar x\pm1{,}96\,\sigma/\sqrt n$. Gevolg: 4 keer zoveel metingen halveert de foutenmarge ($\sqrt 4=2$). Dit is ook waarom regelkaarten met subgroepgemiddelden normaal mogen rekenen.

### Waarom is de standaardfout $SE=\sigma/\sqrt n$?

De standaardfout is de standaardafwijking van het **gemiddelde** $\bar X$, niet van de individuele metingen. Ze komt uit twee rekenregels voor onafhankelijke metingen $X_1,\dots,X_n$ met elk variantie $\sigma^2$:

1. **Varianties van onafhankelijke grootheden tellen op** (standaardafwijkingen niet): $Var(X_1+\dots+X_n)=n\,\sigma^2$, dus de som heeft standaardafwijking $\sqrt{n}\,\sigma$.
2. **Delen door $n$ deelt de standaardafwijking door $n$** (de variantie door $n^2$): $\bar X=\frac{1}{n}\sum X_i$.

$$Var(\bar X)=\frac{1}{n^2}\cdot n\,\sigma^2=\frac{\sigma^2}{n}\qquad\Rightarrow\qquad SE=\sqrt{Var(\bar X)}=\frac{\sigma}{\sqrt n}$$

**Intuïtie:** bij het middelen heffen toevallige afwijkingen naar boven en naar beneden elkaar deels op. Ze heffen elkaar niet volledig op (dan zou het $\sigma/n$ zijn), maar gedeeltelijk: de som van $n$ afwijkingen groeit maar met $\sqrt n$, niet met $n$.

**Voorbeeld met twee metingen.** Een vullijn met $\sigma=2$ g per pot. Twee potten: $Var(X_1+X_2)=4+4=8$, dus de som heeft $\sqrt8=2{,}83$ g spreiding (niet $2+2=4$ g, omdat de afwijkingen elkaar deels compenseren). Het gemiddelde van de twee: $2{,}83/2=1{,}41$ g $=2/\sqrt2$.

**Voorbeeld met meer metingen** ($\sigma=2$ g):

| $n$ | $SE=\sigma/\sqrt n$ | lezing |
|---|---|---|
| 1 | 2,00 g | een enkele pot |
| 4 | 1,00 g | 4x zoveel metingen = helft van de spreiding |
| 16 | 0,50 g | nog eens 4x = weer de helft |
| 100 | 0,20 g | 10x preciezer dan één pot |

Gevolg: om de foutenmarge te **halveren** heb je **4 keer** zoveel metingen nodig; 10 keer preciezer kost 100 keer zoveel metingen.

**Waar je het $\sqrt n$ overal terugziet:**
- **t- en z-toets:** $t=\frac{\bar x-\mu_0}{s/\sqrt n}$; bv. Ottoy $s=0{,}1079$, $n=20$: $SE=0{,}1079/\sqrt{20}=0{,}0241$, dus het verschil $9{,}928-10=-0{,}072$ is $-0{,}072/0{,}0241=-2{,}98$ standaardfouten.
- **Betrouwbaarheidsinterval:** marge $=z\cdot\sigma/\sqrt n$ of $t\cdot s/\sqrt n$.
- **Regelkaart $\bar X$:** grenzen $\mu\pm3\sigma/\sqrt n$ (zelfde reden: je plot gemiddelden van subgroepen), en de detectiekans van een verschuiving $k\sigma$ gebruikt $k\sqrt n$.
- **Steekproefgrootte:** uit $E=z\,\sigma/\sqrt n$ volgt $n=(z\sigma/E)^2$.
- **Fractie:** $SE(P)=\sqrt{\pi(1-\pi)/n}$: dezelfde regel, met $\sigma^2=\pi(1-\pi)$ van één ja/nee-waarneming.

**Let op:** $s$ (of $\sigma$) beschrijft de spreiding van **individuele** metingen en verandert niet met $n$; $SE$ beschrijft de onzekerheid op het **gemiddelde** en daalt met $\sqrt n$. Verwar ze niet in een formule.

### Welke formule?

| Parameter | Wanneer | Interval (tweezijdig, $1-\alpha$) | Verdeling |
|---|---|---|---|
| $\mu$ | $\sigma$ gekend | $\bar x\pm z_{1-\alpha/2}\,\frac{\sigma}{\sqrt n}$ | $N(0,1)$ |
| $\mu$ | $\sigma$ onbekend (geschat met $s$) | $\bar x\pm t_{1-\alpha/2;\,n-1}\,\frac{s}{\sqrt n}$ | $t(n-1)$ |
| $\sigma^2$ ($\sigma$: wortel) | normale data | $\left[\frac{(n-1)s^2}{\chi^2_{1-\alpha/2}};\ \frac{(n-1)s^2}{\chi^2_{\alpha/2}}\right]$ | $\chi^2(n-1)$ |
| $\sigma_2^2/\sigma_1^2$ | twee onafhankelijke normale steekproeven | $\frac{s_2^2}{s_1^2}\left[F_{\alpha/2};\ F_{1-\alpha/2}\right](n_1-1;n_2-1)$ | $F$ |
| $\pi$ | fractie defect | exact via `BETA.INV` (tab "BI fractie") | binomiaal |

**Waarom t in plaats van z?** Als $\sigma$ onbekend is en je $s$ gebruikt, komt er extra onzekerheid bij; de t-verdeling heeft dikkere staarten, dus een grotere kritieke waarde (bv. $t_{0{,}975;\,9}=2{,}262$ tegenover $z=1{,}96$). Voor grote $n$ wordt het verschil klein.

**Waarom staat de grote $\chi^2$-waarde bij de ondergrens?** Uit $\frac{(n-1)s^2}{\sigma^2}\sim\chi^2(n-1)$ volgt $\sigma^2=\frac{(n-1)s^2}{\chi^2}$: delen door een groot getal geeft een kleine $\sigma^2$.

### Waarvan hangt de breedte af?

- **Betrouwbaarheid:** 99% is breder dan 95% (grotere kritieke waarde). Meer zekerheid kost precisie.
- **Steekproefgrootte:** breedte $\propto 1/\sqrt n$.
- **Spreiding:** grotere $\sigma$ of $s$ geeft een breder interval.
- Halve breedte $E$ vooraf vastleggen geeft de nodige $n=\left(\frac{z\,\sigma}{E}\right)^2$ (tab Steekproefgrootte).

### Eenzijdige grenzen

Soms wil je enkel een **ondergrens** ("minstens") of een **bovengrens** ("hoogstens"). Dan zet je heel $\alpha$ in één staart: $z_{1-\alpha}$ of $t_{1-\alpha}$ in plaats van $z_{1-\alpha/2}$. Bv. een eenzijdige 95%-bovengrens gebruikt $z_{0{,}95}=1{,}645$. Een eenzijdige grens hoort bij een eenzijdige toets.

### BI en toets: dezelfde informatie

Een $(1-\alpha)$-BI bevat precies de hypothesewaarden die een toets op niveau $\alpha$ **niet** zou verwerpen. Ligt $\mu_0$ buiten het 95%-BI, dan verwerp je $H_0:\mu=\mu_0$ (tweezijdig, 5%). Het BI zegt bovendien hoe groot het effect is, wat de toets alleen niet doet.

### Voorbeelden

- **$\mu$, t (Ottoy):** 20 stukken, $\bar x=9{,}928$, $s=0{,}1079$. Eenzijdige 98%-bovengrens: $9{,}928+t_{0{,}98;\,19}\cdot0{,}1079/\sqrt{20}=9{,}928+2{,}205\cdot0{,}0241=9{,}981$. De norm 10 ligt erboven: het gemiddelde is significant kleiner dan 10.
- **$\sigma$, $\chi^2$ (Ottoy):** 20 stukken, $s=0{,}01165$. Eenzijdige 98%-ondergrens: $\sigma\ge\sqrt{19\cdot0{,}01165^2/\chi^2_{0{,}98;\,19}}=\sqrt{0{,}002581/33{,}69}=0{,}00875$. De norm 0,01 ligt binnen $[0{,}00875;\infty)$: geen bewijs dat $\sigma>0{,}01$.
- **$\sigma_2^2/\sigma_1^2$, F (examen vraag 2):** $s_1^2=0{,}004$ ($n_1=10$), $s_2^2=0{,}015$ ($n_2=15$). Eenzijdige 95%-ondergrens $3{,}75\cdot F_{0{,}05}(9;14)=3{,}75\cdot0{,}3305=1{,}24>1$: M1 is nauwkeuriger.
- **CLT:** elco's met $\mu=820$, $\sigma=60{,}8$ ($n=25$): $SE=12{,}16$, dus 95% van de steekproefgemiddelden ligt tussen 796,2 en 843,8, terwijl individuele elco's tussen 700,8 en 939,2 liggen.
