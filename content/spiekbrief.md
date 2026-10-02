# Spiekbrief - beslistabellen

## Welke toets?

| Vraag | Toets | Toetsgrootheid | Verdeling | Excel |
|---|---|---|---|---|
| Gemiddelde vs norm, $\sigma$ gekend | Z-toets | $\frac{\bar x-\mu_0}{\sigma/\sqrt n}$ | $N(0,1)$ | `NORM.S.DIST`, `NORM.S.INV` |
| Gemiddelde vs norm, $\sigma$ onbekend | t-toets | $\frac{\bar x-\mu_0}{s/\sqrt n}$ | $t(n-1)$ | `T.DIST`, `T.INV` |
| Spreiding vs norm | $\chi^2$-toets | $\frac{(n-1)s^2}{\sigma_0^2}$ | $\chi^2(n-1)$ | `CHISQ.DIST.RT`, `CHISQ.INV.RT` |
| Twee spreidingen (nauwkeuriger?) | F-toets / BI verhouding | $\frac{s_1^2}{s_2^2}$ | $F(n_1-1;n_2-1)$ | `F.DIST`, `F.INV` |
| Fractie vs norm | Z-toets $\pi$ (cc $\pm\frac1{2n}$) of exact | $\frac{p-\pi_0}{\sqrt{\pi_0(1-\pi_0)/n}}$ | $N(0,1)$ / binomiaal | `BINOM.DIST` |
| Twee gemiddelden, onafhankelijk | pooled t (cursus) / Welch | $\frac{\bar x_1-\bar x_2}{s_p\sqrt{1/n_1+1/n_2}}$ | $t(n_1+n_2-2)$ | `T.TEST(r1;r2;z;2)` |
| Twee gemiddelden, gepaard | gepaarde t | $\frac{\bar v}{s_v/\sqrt n}$ | $t(n-1)$ | `T.TEST(r1;r2;z;1)` |
| 3+ gemiddelden | eenweg-ANOVA | $\frac{MS_B}{MS_W}$ | $F(k-1;N-k)$ | `F.DIST.RT` |
| Verband 2 categorische var. | $\chi^2$ contingentie | $\sum\frac{(n-e)^2}{e}$ | $\chi^2((r-1)(s-1))$ | `CHISQ.TEST` |
| Past een verdeling? | $\chi^2$ goodness of fit | $\sum\frac{(n_k-e_k)^2}{e_k}$ | $\chi^2(r-g-1)$ | `CHISQ.DIST.RT` |
| Mediaan 2 groepen (niet normaal) | Wilcoxon-Mann-Whitney | rangsom $W$ | Z-benadering | - |
| Random volgorde? | runs-toets | aantal runs $R$ | Z-benadering | - |

Beslissing: verwerp $H_0$ als p $<\alpha$ (of toetsgrootheid in kritiek gebied, of $\theta_0$ buiten het BI). Eenzijdige toets hoort bij een eenzijdige grens.

## Welk betrouwbaarheidsinterval?

| Parameter | Interval | Voorwaarde |
|---|---|---|
| $\mu$ ($\sigma$ gekend) | $\bar x\pm z_{1-\alpha/2}\,\sigma/\sqrt n$ | normaal of n groot |
| $\mu$ | $\bar x\pm t_{1-\alpha/2;n-1}\,s/\sqrt n$ | normaal |
| $\sigma^2$ | $\left[\frac{(n-1)s^2}{\chi^2_{1-\alpha/2}};\frac{(n-1)s^2}{\chi^2_{\alpha/2}}\right]$ | normaal, niet robuust |
| $\sigma_2^2/\sigma_1^2$ | $\frac{s_2^2}{s_1^2}\left[F_{\alpha/2}(n_1{-}1;n_2{-}1);F_{1-\alpha/2}(n_1{-}1;n_2{-}1)\right]$ | normaal; eenzijdig: $\ge\frac{s_2^2}{s_1^2}F_\alpha$ |
| $\pi$ | exact: `BETA.INV(α/2;d;n-d+1)` ; `BETA.INV(1-α/2;d+1;n-d)` | Wald enkel bij $\ge 5$ defecten |
| $\mu_1-\mu_2$ | $\bar x_1-\bar x_2\pm t\,s_p\sqrt{1/n_1+1/n_2}$ | gelijke varianties |

## Welke verdeling?

| Situatie | Verdeling | $E[X]$ | $Var[X]$ |
|---|---|---|---|
| ja/nee voor 1 stuk | Bernoulli($\pi$) | $\pi$ | $\pi(1-\pi)$ |
| # defecten in n stuks | binomiaal($n,\pi$) | $n\pi$ | $n\pi(1-\pi)$ |
| # defecten, klein lot zonder teruglegging | hypergeometrisch | $nK/N$ | $n\frac KN(1-\frac KN)\frac{N-n}{N-1}$ |
| # gebeurtenissen per periode | Poisson($\lambda$) | $\lambda$ | $\lambda$ |
| tijd tussen gebeurtenissen | exponentieel($\lambda$) | $1/\lambda$ | $1/\lambda^2$ |
| afmeting, gewicht, capaciteit | normaal($\mu,\sigma$) | $\mu$ | $\sigma^2$ |
| gelijk waarschijnlijk op $[a,b]$ | uniform | $\frac{a+b}2$ | $\frac{(b-a)^2}{12}$ |

$\sigma$ uit staartkans: $P(X<c)=p\Rightarrow\sigma=\frac{c-\mu}{z_p}$ (vraag 6: $\frac{720-820}{-1{,}645}=60{,}80$).

## Welke regelkaart?

| Data | Kaart | Grenzen |
|---|---|---|
| subgroepen $n\le 10$ | $\bar X$-R | $\bar{\bar X}\pm A_2\bar R$; $D_3\bar R$, $D_4\bar R$; $\hat\sigma=\bar R/d_2$ |
| subgroepen $n>10$ of variabel | $\bar X$-s | $\bar{\bar X}\pm A_3\bar s$; $B_3\bar s$, $B_4\bar s$; $\hat\sigma=\bar s/c_4$ |
| individuele waarden | I-MR | $\bar x\pm 2{,}66\,\overline{MR}$ |
| fractie defect | p-kaart | $\bar p\pm3\sqrt{\bar p(1-\bar p)/n}$ |

$n=5$: $A_2=0{,}577$, $D_4=2{,}114$, $d_2=2{,}326$, $A_3=1{,}427$, $B_4=2{,}089$, $c_4=0{,}940$. Western Electric: (1) 1 punt buiten $3\sigma$; (2) 2 van 3 voorbij $2\sigma$; (3) 4 van 5 voorbij $1\sigma$; (4) 8 op rij aan dezelfde kant. Detectie $k\sigma$-shift: $\beta=\Phi(3-k\sqrt n)-\Phi(-3-k\sqrt n)$, $ARL=1/(1-\beta)$, $ARL_0=370$.

## Capabiliteit en MSA

| Grootheid | Formule | Norm |
|---|---|---|
| $C_p$ | $\frac{USL-LSL}{6\sigma}$ | $\ge1{,}33$ |
| $C_{pk}$ | $\min\left(\frac{USL-\mu}{3\sigma},\frac{\mu-LSL}{3\sigma}\right)$ | $\ge1{,}33$ |
| 6 sigma | 3,4 ppm LT (1,5$\sigma$-shift), 0,002 ppm ST gecentreerd | $C_p=2$, $C_{pk}=1{,}5$ |
| %GRR | $100\,GRR/TV$ of $100\cdot6\,GRR/TOL$ | $\le10\%$ ok, 10-30% voorwaardelijk, $>30\%$ slecht |
| ndc | $\lfloor1{,}41\,PV/GRR\rfloor$ | $\ge5$ |
| $C_p$ geobserveerd | $\frac1{C_{p,o}^2}=\frac1{C_{p,a}^2}+\%GRR^2$ | |

## Aanvaardingssteekproeven

$P_{acc}(\pi)$ = `BINOM.DIST(c;n;π;WAAR)`; $\alpha=1-P_{acc}(AQL)$ (producent), $\beta=P_{acc}(LQL)$ (consument). (100,4): $P_{acc}(2\%)=0{,}949$, $P_{acc}(8\%)=0{,}090$. Variabelenplan: aanvaard als $(\bar x-\xi)/s\ge k$.
