"""Golden-value generator for the Six Sigma exam toolkit.
Run: python make_golden.py  -> writes golden_values.json
All expected values come from scipy (Excel-equivalent functions noted)."""
import json, numpy as np
from scipy import stats as st

G = {}
def put(k, v): G[k] = v

# ---------- Ottoy t-test example (20 parts, H0 mu=10, HA mu<10, alpha=0.02)
t_data = [10.06,9.89,9.90,9.99,9.87,9.88,9.93,9.98,10.12,9.86,9.89,9.81,9.95,9.92,10.07,9.98,10.02,9.62,9.96,9.86]
x = np.array(t_data); n = len(x); m = x.mean(); s = x.std(ddof=1)
t = (m-10)/(s/np.sqrt(n))
put("t_test_mean", dict(data=t_data, mu0=10, alpha=0.02, side="left",
    xbar=m, s=s, t=t, t_crit=st.t.ppf(0.02, n-1), p=st.t.cdf(t, n-1),
    ci98_upper=m + st.t.ppf(0.98, n-1)*s/np.sqrt(n),
    excel="=T.INV(0,02;19) ; =T.DIST(t;19;WAAR)"))

# ---------- Ottoy chi2 example (20 parts, sigma0=0.01, HA sigma>0.01, alpha=0.02)
c_data = [9.997,10.004,10.010,9.991,10.008,9.981,9.984,9.993,9.990,9.997,9.996,9.977,9.999,9.981,10.000,10.010,10.005,10.011,9.997,10.022]
y = np.array(c_data); n2 = len(y); s2 = y.std(ddof=1)
chi = (n2-1)*s2**2/0.01**2
put("chi2_test_sigma", dict(data=c_data, sigma0=0.01, alpha=0.02, side="right",
    s=s2, chi2=chi, chi2_crit=st.chi2.ppf(0.98, n2-1), p=st.chi2.sf(chi, n2-1),
    ci98_lower_sigma=np.sqrt((n2-1)*s2**2/st.chi2.ppf(0.98, n2-1)),
    excel="=CHISQ.INV.RT(0,02;19) ; =CHISQ.DIST.RT(chi2;19)"))

# ---------- Exam Q2: one-sided 95% CI for sigma2^2/sigma1^2 (example variances)
F05 = st.f.ppf(0.05, 9, 14)
put("exam_q2_f_ratio", dict(n1=10, n2=15, s1sq=0.004, s2sq=0.015, F_inv_005_9_14=F05,
    lower_bound=(0.015/0.004)*F05, excel="=F.INV(0,05;9;14)",
    note="Bound for sigma2^2/sigma1^2 >= (s2^2/s1^2)*F.INV(alpha;n1-1;n2-1). Two-sided upper = (s2^2/s1^2)*F.INV(1-alpha/2;n1-1;n2-1)"))

# ---------- Exam Q3 capability
mu, sg, LSL, USL = 1440, 10, 1400, 1460
put("exam_q3_capability", dict(mu=mu, sigma=sg, LSL=LSL, USL=USL,
    Cp=(USL-LSL)/(6*sg), Cpk=min(USL-mu, mu-LSL)/(3*sg),
    p_above=st.norm.sf(USL, mu, sg), p_below=st.norm.cdf(LSL, mu, sg),
    p_total=st.norm.sf(USL, mu, sg)+st.norm.cdf(LSL, mu, sg),
    p_total_if_centred=2*st.norm.sf(3), six_sigma_ppm_LT=st.norm.sf(4.5)*1e6, six_sigma_ppm_ST_centred=2*st.norm.sf(6)*1e6))

# ---------- Exam Q5 confusion matrices (rows actual Goed/Slecht, cols predicted Goed/Slecht)
cms = {"A": ([[480,20],[15,485]], [[180,120],[110,190]]),
       "B": ([[380,120],[140,360]], [[190,110],[120,180]]),
       "C": ([[420,80],[70,430]], [[200,100],[85,215]])}
out = {}
for k, (tr, te) in cms.items():
    acc = lambda c: (c[0][0]+c[1][1])/sum(map(sum, c))
    out[k] = dict(train=tr, test=te, acc_train=acc(tr), acc_test=acc(te))
put("exam_q5_confusion", dict(models=out, answer="A=high variance, B=high bias, C=optimal"))

# ---------- Exam Q6 distributions
sigC = 100/st.norm.ppf(0.95)
put("exam_q6", dict(E_B=175.3, E_T_weeks=1/175.3, E_T_hours=168/175.3, E_C=820, E_X_conform=0.95,
    E_D=100*0.05, Var_D=100*0.05*0.95, sigma_C=sigC, Var_C=sigC**2))

# ---------- Proportion CIs (course: n=100, d=4 -> 95% CI [1.1%, 9.9%])
def cp(d, n, a):
    lo = 0.0 if d == 0 else st.beta.ppf(a/2, d, n-d+1)
    hi = 1.0 if d == n else st.beta.ppf(1-a/2, d+1, n-d)
    return lo, hi
def wilson(d, n, a, z=None):
    p = d/n; z = z or st.norm.ppf(1-a/2)
    c = (p + z*z/(2*n)); r = z*np.sqrt(p*(1-p)/n + z*z/(4*n*n)); den = 1+z*z/n
    return (c-r)/den, (c+r)/den
props = {}
for d in [0, 2, 4]:
    props[f"d{d}"] = dict(n=100, d=d, clopper_pearson_95=cp(d, 100, 0.05), wilson_95=wilson(d, 100, 0.05),
                          wald_95=(d/100-1.96*np.sqrt(d/100*(1-d/100)/100), d/100+1.96*np.sqrt(d/100*(1-d/100)/100)))
props["course_slide_values"] = {"d0": [0.0, 3.6], "d2": [0.3, 7.0], "d4": [1.1, 9.9]}
props["excel_clopper_pearson"] = "lower =BETA.INV(alpha/2;d;n-d+1) ; upper =BETA.INV(1-alpha/2;d+1;n-d)"
put("proportion_ci", props)

# ---------- Acceptance sampling OC (course: (100,4) AQL 2%, (130,5))
put("acceptance_oc", dict(
    plan_100_4=dict(Pacc_2pct=st.binom.cdf(4,100,0.02), Pacc_8pct=st.binom.cdf(4,100,0.08),
                    alpha=1-st.binom.cdf(4,100,0.02), Pacc_hypergeom_N10000_D200=st.hypergeom.cdf(4,10000,200,100)),
    plan_130_5=dict(alpha=1-st.binom.cdf(5,130,0.02), beta_8pct=st.binom.cdf(5,130,0.08)),
    excel="=BINOM.DIST(c;n;pi;WAAR)"))

# ---------- Lot defects given Cpk (course: Cpk=1 -> pi=0.27%, N=10000 -> E=27)
pi1 = 2*st.norm.sf(3)
put("lot_defects_cpk", dict(Cpk=1, pi=pi1, N=10000, E=10000*pi1,
    P_le_12=st.binom.cdf(12,10000,pi1), P_ge_44=st.binom.sf(43,10000,pi1)))

# ---------- SPC exercise 2 (n=5, 20 subgroups, specs 16.2 +/- 0.5)
spc2 = [[15.8,16.3,16.2,16.1,16.6],[16.3,15.9,15.9,16.2,16.4],[16.1,16.2,16.5,16.4,16.3],[16.3,16.2,15.9,16.5,16],[16.1,16.1,16.4,16.6,16.4],[16.1,15.8,16.7,16.1,16.5],[16.2,16.3,16.5,16.1,16.3],[16.3,16.1,16.2,16.3,16.5],[16.6,16.2,16.4,16.1,16.5],[16.2,16.3,16.4,16.3,16.4],[15.9,16.4,15.9,16.2,16.5],[16.4,16.6,16.7,16.4,16.1],[16.5,16.1,16.6,16.3,16.4],[16.4,16.3,16.2,16.2,16.2],[16,16.1,16.3,16.3,16.2],[16.4,16.2,16.3,16.3,16.2],[16,16.2,16.4,16.3,16.2],[16,16.2,16.4,16.5,16.1],[16.4,16,16.3,16.4,16.4],[16.4,16.4,16.5,16,15.8]]
a = np.array(spc2); xb = a.mean(1); R = np.ptp(a, 1); sd = a.std(1, ddof=1)
X, Rb, sb = xb.mean(), R.mean(), sd.mean(); sig = Rb/2.326
put("spc_ex2", dict(data=spc2, n=5, USL=16.7, LSL=15.7, Xbarbar=X, Rbar=Rb, sbar=sb,
    xbar_UCL=X+0.577*Rb, xbar_LCL=X-0.577*Rb, R_UCL=2.114*Rb, R_LCL=0.0,
    s_UCL=2.089*sb, xbar_s_UCL=X+1.427*sb, xbar_s_LCL=X-1.427*sb,
    sigma_hat_Rbar_d2=sig, Cp=(1.0)/(6*sig), Cpk=min(16.7-X, X-15.7)/(3*sig),
    sigma_overall=a.std(ddof=1), Pp=1.0/(6*a.std(ddof=1)), Ppk=min(16.7-X, X-15.7)/(3*a.std(ddof=1)),
    pct_out=100*(st.norm.cdf(15.7, X, sig)+st.norm.sf(16.7, X, sig)),
    out_of_control=[], note="The class spreadsheet shows UCL 16.9 / LCL 15.7, which are NOT Xbar-chart limits."))

# ---------- SPC exercise 3 (24 subgroups Xbar and R, n=5)
xb3 = [34.2,34.2,33.7,34.2,34.1,33.9,33.3,34.2,35.0,34.2,33.5,34.4,33.9,33.9,33.8,33.7,33.9,33.3,34.0,33.8,34.4,33.8,34.4,34.2]
R3 = [1.5,0.8,2.1,1.5,2.9,1.7,1.1,2.6,2.2,3.5,2.7,1.1,2,1.1,1.3,1.8,1.5,0.8,1.8,1.2,1,1.4,2.3,2.5]
X3, Rb3 = np.mean(xb3), np.mean(R3)
put("spc_ex3", dict(xbar=xb3, R=R3, n=5, Xbarbar=X3, Rbar=Rb3, xbar_UCL=X3+0.577*Rb3, xbar_LCL=X3-0.577*Rb3,
    R_UCL=2.114*Rb3, note="Subgroup 9 (35.0) sits right at the UCL 35.02: inside, but discuss."))

# ---------- SPC exercise 4: detection of a 2-sigma mean shift, 3-sigma limits
det = {}
for nn in [3,5,8]:
    beta = st.norm.cdf(3-2*np.sqrt(nn)) - st.norm.cdf(-3-2*np.sqrt(nn))
    det[f"n{nn}"] = dict(beta=beta, P_detect=1-beta, ARL1=1/(1-beta))
put("spc_ex4_shift_detection", det)

# ---------- SPC slide exercise "as" (71.4-72.8, Xbar 71.8, sbar 0.2, n=5)
put("spc_capability_shaft", dict(Cp_sigma_sbar=1.4/1.2, Cpk_sigma_sbar=0.4/0.6,
    pct_out=100*(st.norm.cdf(71.4,71.8,0.2)+st.norm.sf(72.8,71.8,0.2)),
    pct_out_centred=100*2*st.norm.sf(3.5), sigma_sbar_c4=0.2/0.94,
    note="Slide states ~5%/2.5%; correct value is 2.28%. Strictly sigma = sbar/c4 = 0.2128."))

# ---------- Two-sample tests (synthetic, check against scipy)
rng = np.random.default_rng(7)
A = np.round(rng.normal(10, 0.5, 12), 3).tolist(); B = np.round(rng.normal(10.4, 0.5, 15), 3).tolist()
tp = st.ttest_ind(A, B, equal_var=True); tw = st.ttest_ind(A, B, equal_var=False)
P1 = np.round(rng.normal(50, 2, 10), 2); P2 = np.round(P1 + rng.normal(0.8, 0.6, 10), 2)
tpair = st.ttest_rel(P1, P2)
mw = st.mannwhitneyu(A, B, alternative="two-sided", method="asymptotic", use_continuity=True)
wsr = st.wilcoxon(P1, P2, correction=True, method="approx")
put("two_sample", dict(A=A, B=B, pooled_t=tp.statistic, pooled_p=tp.pvalue, df_pooled=len(A)+len(B)-2,
    welch_t=tw.statistic, welch_p=tw.pvalue, F_var_ratio=np.var(A, ddof=1)/np.var(B, ddof=1),
    F_p_two_sided=2*min(st.f.cdf(np.var(A,ddof=1)/np.var(B,ddof=1), len(A)-1, len(B)-1), st.f.sf(np.var(A,ddof=1)/np.var(B,ddof=1), len(A)-1, len(B)-1)),
    paired_x1=P1.tolist(), paired_x2=P2.tolist(), paired_t=tpair.statistic, paired_p=tpair.pvalue,
    mann_whitney_U=mw.statistic, mann_whitney_p_normal_cc=mw.pvalue,
    wilcoxon_signed_rank_stat=wsr.statistic, wilcoxon_p_normal_cc=wsr.pvalue))

# ---------- Chi2 contingency (formularium example: line x quality)
tab = [[200,50,20],[150,40,40]]
c2, pc, dfc, exp = st.chi2_contingency(tab, correction=False)
put("chi2_contingency", dict(table=tab, chi2=c2, df=dfc, p=pc, expected=exp.tolist()))
tab22 = [[30,10],[20,25]]
c2y, py_, _, _ = st.chi2_contingency(tab22, correction=True)
put("chi2_2x2_yates", dict(table=tab22, chi2=c2y, p=py_))

# ---------- Chi2 goodness of fit Poisson (synthetic counts)
obs = [12, 25, 28, 18, 10, 7]  # counts of 0,1,2,3,4,>=5
nobs = sum(obs); lam = (0*12+1*25+2*28+3*18+4*10+5*7)/nobs  # crude mean, >=5 treated as 5
probs = [st.poisson.pmf(k, lam) for k in range(5)] + [st.poisson.sf(4, lam)]
expv = [nobs*p for p in probs]
chig = sum((o-e)**2/e for o, e in zip(obs, expv))
put("chi2_gof_poisson", dict(observed=obs, lambda_hat=lam, expected=expv, chi2=chig, df=len(obs)-1-1, p=st.chi2.sf(chig, len(obs)-2)))

# ---------- Simple regression (synthetic)
xr = np.arange(1, 13, dtype=float); yr = np.round(2.5 + 1.8*xr + rng.normal(0, 1.2, 12), 2)
lr = st.linregress(xr, yr); yhat = lr.intercept + lr.slope*xr
SSE = ((yr-yhat)**2).sum(); SST = ((yr-yr.mean())**2).sum(); MSE = SSE/10; Sxx = ((xr-xr.mean())**2).sum()
x0 = 7.5; t975 = st.t.ppf(0.975, 10)
y0 = lr.intercept + lr.slope*x0
put("regression_simple", dict(x=xr.tolist(), y=yr.tolist(), b0=lr.intercept, b1=lr.slope, R2=lr.rvalue**2,
    MSE=MSE, se_b1=lr.stderr, F=(SST-SSE)/MSE, p_F=st.f.sf((SST-SSE)/MSE, 1, 10),
    x0=x0, yhat0=y0, CI_mean=(y0-t975*np.sqrt(MSE*(1/12+(x0-xr.mean())**2/Sxx)), y0+t975*np.sqrt(MSE*(1/12+(x0-xr.mean())**2/Sxx))),
    PI_new=(y0-t975*np.sqrt(MSE*(1+1/12+(x0-xr.mean())**2/Sxx)), y0+t975*np.sqrt(MSE*(1+1/12+(x0-xr.mean())**2/Sxx)))))

# ---------- Multiple regression (synthetic, k=2)
X1 = rng.uniform(0, 10, 15); X2 = rng.uniform(0, 5, 15); Y = 3 + 1.2*X1 - 0.8*X2 + rng.normal(0, 0.7, 15)
Xm = np.column_stack([np.ones(15), X1, X2]); beta, *_ = np.linalg.lstsq(Xm, Y, rcond=None)
res = Y - Xm@beta; SSE2 = (res**2).sum(); SST2 = ((Y-Y.mean())**2).sum(); R2 = 1-SSE2/SST2
put("regression_multiple", dict(x1=np.round(X1,3).tolist(), x2=np.round(X2,3).tolist(), y=np.round(Y,3).tolist(),
    note="recompute with rounded data", ))
Xm = np.column_stack([np.ones(15), np.round(X1,3), np.round(X2,3)]); Yr = np.round(Y,3)
beta, *_ = np.linalg.lstsq(Xm, Yr, rcond=None); res = Yr-Xm@beta; SSE2=(res**2).sum(); SST2=((Yr-Yr.mean())**2).sum(); R2=1-SSE2/SST2
G["regression_multiple"].update(dict(coef=beta.tolist(), R2=R2, R2_adj=1-(1-R2)*(14)/(12), F=((SST2-SSE2)/2)/(SSE2/12), p_F=st.f.sf(((SST2-SSE2)/2)/(SSE2/12), 2, 12)))

# ---------- 2^2 DOE with n=2 replicates (lot totals (1), a, b, ab)
runs = {"(1)": [28, 25], "a": [36, 32], "b": [18, 19], "ab": [31, 30]}
T = {k: sum(v) for k, v in runs.items()}; nrep = 2
CA = T["a"]+T["ab"]-T["b"]-T["(1)"]; CB = T["b"]+T["ab"]-T["a"]-T["(1)"]; CAB = T["ab"]+T["(1)"]-T["a"]-T["b"]
allv = sum(runs.values(), []); SST3 = sum((v-np.mean(allv))**2 for v in allv)
SSA, SSB, SSAB = CA**2/(4*nrep), CB**2/(4*nrep), CAB**2/(4*nrep); SSE3 = SST3-SSA-SSB-SSAB; MSE3 = SSE3/(4*(nrep-1))
put("doe_2x2", dict(runs=runs, effect_A=CA/(2*nrep), effect_B=CB/(2*nrep), effect_AB=CAB/(2*nrep),
    SS_A=SSA, SS_B=SSB, SS_AB=SSAB, SS_E=SSE3, MS_E=MSE3,
    F_A=SSA/MSE3, F_B=SSB/MSE3, F_AB=SSAB/MSE3, p_A=st.f.sf(SSA/MSE3,1,4), p_B=st.f.sf(SSB/MSE3,1,4), p_AB=st.f.sf(SSAB/MSE3,1,4),
    se_effect=np.sqrt(MSE3/(nrep*2**(2-2)))))

# ---------- One-way ANOVA (synthetic)
g1, g2, g3 = [12.1, 11.8, 12.5, 12.0], [13.0, 12.7, 13.4, 13.1], [12.2, 12.6, 12.4, 12.0]
fo = st.f_oneway(g1, g2, g3)
put("anova_oneway", dict(groups=[g1, g2, g3], F=fo.statistic, p=fo.pvalue, df=(2, 9)))

# ---------- Stratification example (formularium)
put("stratification", dict(WA=0.6, WB=0.4, piA=0.03, piB=0.005, n=100,
    var_prop=(0.6*0.03*0.97+0.4*0.005*0.995)/100, var_srs=0.02*0.98/100,
    neyman_nA=100*0.6*np.sqrt(0.0291)/(0.6*np.sqrt(0.0291)+0.4*np.sqrt(0.004975))))

# ---------- M/M/1/K
lam_, mu_, K = 4.0, 5.0, 6; rho = lam_/mu_
pij = [rho**j*(1-rho)/(1-rho**(K+1)) for j in range(K+1)]; EL = sum(j*p for j, p in enumerate(pij))
put("mm1k", dict(lam=lam_, mu=mu_, K=K, pi=pij, EL=EL, EW=EL/(lam_*(1-pij[-1]))))

# ---------- Variables sampling plan k (one-sided tolerance factor, exact via noncentral t)
def k_exact(n, p0, alpha):
    zp = st.norm.ppf(1-p0); return st.nct.ppf(1-alpha, n-1, zp*np.sqrt(n))/np.sqrt(n)
def k_natrella(n, p0, alpha):
    zp, za = st.norm.ppf(1-p0), st.norm.ppf(1-alpha); a = 1-za**2/(2*(n-1)); b = zp**2-za**2/n
    return (zp+np.sqrt(zp**2-a*b))/a
put("variables_plan_k", dict(n=20, p0=0.02, alpha=0.05, k_exact_nct=k_exact(20, 0.02, 0.05), k_natrella=k_natrella(20, 0.02, 0.05)))

# ---------- Normal / DPMO table
put("dpmo_table", {str(k): (1-st.norm.cdf(k-1.5))*1e6 for k in range(1, 7)})

def conv(o):
    if isinstance(o, (np.floating,)): return float(o)
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, np.ndarray): return o.tolist()
    if isinstance(o, tuple): return [conv(i) for i in o]
    raise TypeError(type(o))
json.dump(G, open("golden_values.json", "w"), indent=1, default=conv)
print("ok", len(G), "cases")
