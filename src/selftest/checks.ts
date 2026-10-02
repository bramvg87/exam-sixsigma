// Golden-value checks shared by `npm test` and the in-browser Self-test page.
import * as D from '../stats/dist.ts';
import { mean, sdS, varS } from '../stats/desc.ts';
import * as H from '../calc/hypo.ts';
import { capability, dpmoFromSigma } from '../calc/capability.ts';
import { chartFromData, chartFromStats, shiftDetection, westernElectric } from '../calc/spc.ts';
import { regress, predict } from '../calc/regression.ts';
import { factorial } from '../calc/doe.ts';
import { oneWay } from '../calc/anova.ts';
import { singlePlan, variablesK, lotDefects, stratification } from '../calc/sampling.ts';
import { confusion, contingency, gofPoisson, mannWhitney, wilcoxonSigned, mm1k } from '../calc/misc.ts';

export interface Check { group: string; name: string; actual: number; expected: number; tol: number }

const REL = 1e-6;

export function buildChecks(G: any): Check[] {
  const out: Check[] = [];
  const add = (group: string, name: string, actual: number, expected: number, tol = REL) => out.push({ group, name, actual, expected, tol });
  const safe = (group: string, fn: () => void) => {
    try {
      fn();
    } catch (e: any) {
      out.push({ group, name: 'FOUT: ' + (e?.message ?? e), actual: NaN, expected: 0, tol: 0 });
    }
  };

  safe('t_test_mean', () => {
    const g = G.t_test_mean;
    const x = g.data as number[];
    const r = H.tMean(mean(x), sdS(x), x.length, g.mu0, g.alpha, 'left');
    add('t_test_mean', 'xbar', mean(x), g.xbar);
    add('t_test_mean', 's', sdS(x), g.s);
    add('t_test_mean', 't', r.stat, g.t);
    add('t_test_mean', 't_crit', r.crit[0], g.t_crit);
    add('t_test_mean', 'p', r.p, g.p);
    add('t_test_mean', 'ci98_upper', r.ci[1], g.ci98_upper);
  });

  safe('chi2_test_sigma', () => {
    const g = G.chi2_test_sigma;
    const x = g.data as number[];
    const r = H.chi2Var(sdS(x), x.length, g.sigma0, g.alpha, 'right');
    add('chi2_test_sigma', 's', sdS(x), g.s);
    add('chi2_test_sigma', 'chi2', r.stat, g.chi2);
    add('chi2_test_sigma', 'chi2_crit', r.crit[0], g.chi2_crit);
    add('chi2_test_sigma', 'p', r.p, g.p);
    add('chi2_test_sigma', 'ci98_lower_sigma', Math.sqrt(r.ci[0]), g.ci98_lower_sigma);
  });

  safe('exam_q2_f_ratio', () => {
    const g = G.exam_q2_f_ratio;
    add('exam_q2_f_ratio', 'F.INV(0,05;9;14)', D.fInv(0.05, 9, 14), g.F_inv_005_9_14);
    const ci = H.ratioCI(g.s2sq, g.n2, g.s1sq, g.n1, 0.05, 'lower');
    add('exam_q2_f_ratio', 'ondergrens sigma2^2/sigma1^2', ci[0], g.lower_bound);
  });

  safe('exam_q3_capability', () => {
    const g = G.exam_q3_capability;
    const c = capability(g.mu, g.sigma, g.LSL, g.USL);
    add('exam_q3_capability', 'Cp', c.Cp, g.Cp);
    add('exam_q3_capability', 'Cpk', c.Cpk, g.Cpk);
    add('exam_q3_capability', 'p_above', c.pAbove, g.p_above);
    add('exam_q3_capability', 'p_below', c.pBelow, g.p_below);
    add('exam_q3_capability', 'p_total', c.pTotal, g.p_total);
    add('exam_q3_capability', 'p_total_if_centred', c.centred!.pTotal, g.p_total_if_centred);
    add('exam_q3_capability', '6 sigma ppm LT', dpmoFromSigma(6), g.six_sigma_ppm_LT);
    add('exam_q3_capability', '6 sigma ppm ST gecentreerd', 2 * D.normSf(6) * 1e6, g.six_sigma_ppm_ST_centred);
  });

  safe('exam_q5_confusion', () => {
    for (const [k, m] of Object.entries<any>(G.exam_q5_confusion.models)) {
      add('exam_q5_confusion', `${k} acc train`, confusion(m.train).acc, m.acc_train);
      add('exam_q5_confusion', `${k} acc test`, confusion(m.test).acc, m.acc_test);
    }
  });

  safe('exam_q6', () => {
    const g = G.exam_q6;
    add('exam_q6', 'E[T] weken', 1 / 175.3, g.E_T_weeks);
    add('exam_q6', 'E[T] uren (168 h)', 168 / 175.3, g.E_T_hours);
    add('exam_q6', 'E[D]', 100 * 0.05, g.E_D);
    add('exam_q6', 'Var[D]', 100 * 0.05 * 0.95, g.Var_D);
    const sig = (820 - 720) / D.normInvRt(0.05) ;
    add('exam_q6', 'sigma_C', (820 - 720) / -D.normInv(0.05), g.sigma_C);
    add('exam_q6', 'Var_C', sig * sig, g.Var_C);
  });

  safe('proportion_ci', () => {
    const g = G.proportion_ci;
    for (const key of ['d0', 'd2', 'd4']) {
      const c = g[key];
      const cp = H.clopperPearson(c.d, c.n, 0.05);
      const wi = H.wilson(c.d, c.n, 0.05);
      add('proportion_ci', `${key} CP onder`, cp[0], c.clopper_pearson_95[0], c.d === 0 ? 0 : REL);
      add('proportion_ci', `${key} CP boven`, cp[1], c.clopper_pearson_95[1]);
      add('proportion_ci', `${key} Wilson onder`, wi[0], c.wilson_95[0], c.d === 0 ? 1e-12 : REL);
      add('proportion_ci', `${key} Wilson boven`, wi[1], c.wilson_95[1]);
      if (c.d > 0) {
        const wa = H.wald(c.d, c.n, 0.05, 'two', 1.96);
        add('proportion_ci', `${key} Wald onder`, wa[0], c.wald_95[0]);
        add('proportion_ci', `${key} Wald boven`, wa[1], c.wald_95[1]);
      }
      const slide = g.course_slide_values[key];
      // The slides use the exact hypergeometric interval with lot size N = 10000 (see DECISIONS.md)
      const hy = H.hyperCI(c.d, c.n, 10000, 0.05);
      const r1 = (v: number) => Math.round(v * 1000 + 1e-9) / 10;
      add('proportion_ci', `${key} slide (hypergeom. N=10000, 1 dec.) onder %`, r1(hy[0]), slide[0], 0);
      add('proportion_ci', `${key} slide (hypergeom. N=10000, 1 dec.) boven %`, r1(hy[1]), slide[1], 0);
    }
  });

  safe('acceptance_oc', () => {
    const g = G.acceptance_oc;
    const a = singlePlan(100, 4, 0.02, 0.08);
    add('acceptance_oc', '(100,4) Pacc 2%', a.PaAQL, g.plan_100_4.Pacc_2pct);
    add('acceptance_oc', '(100,4) Pacc 8%', a.beta, g.plan_100_4.Pacc_8pct);
    add('acceptance_oc', '(100,4) alpha', a.alpha, g.plan_100_4.alpha);
    add('acceptance_oc', '(100,4) hypergeom N=10000', singlePlan(100, 4, 0.02, 0.08, 'hyper', 10000).PaAQL, g.plan_100_4.Pacc_hypergeom_N10000_D200);
    const b = singlePlan(130, 5, 0.02, 0.08);
    add('acceptance_oc', '(130,5) alpha', b.alpha, g.plan_130_5.alpha);
    add('acceptance_oc', '(130,5) beta 8%', b.beta, g.plan_130_5.beta_8pct);
  });

  safe('lot_defects_cpk', () => {
    const g = G.lot_defects_cpk;
    const l = lotDefects(1, 10000);
    add('lot_defects_cpk', 'pi', l.pi, g.pi);
    add('lot_defects_cpk', 'E', l.E, g.E);
    add('lot_defects_cpk', 'P(<=12)', l.cdf(12), g.P_le_12);
    add('lot_defects_cpk', 'P(>=44)', l.sf(43), g.P_ge_44);
  });

  safe('spc_ex2', () => {
    const g = G.spc_ex2;
    const r = chartFromData(g.data, 'R');
    const s = chartFromData(g.data, 's');
    add('spc_ex2', 'Xbarbar', r.Xbarbar, g.Xbarbar);
    add('spc_ex2', 'Rbar', r.dispBar, g.Rbar);
    add('spc_ex2', 'sbar', s.dispBar, g.sbar);
    add('spc_ex2', 'Xbar UCL', r.xLim.UCL, g.xbar_UCL);
    add('spc_ex2', 'Xbar LCL', r.xLim.LCL, g.xbar_LCL);
    add('spc_ex2', 'R UCL', r.dLim.UCL, g.R_UCL);
    add('spc_ex2', 'R LCL', r.dLim.LCL, g.R_LCL, 0);
    add('spc_ex2', 's UCL', s.dLim.UCL, g.s_UCL);
    add('spc_ex2', 'Xbar-s UCL', s.xLim.UCL, g.xbar_s_UCL);
    add('spc_ex2', 'Xbar-s LCL', s.xLim.LCL, g.xbar_s_LCL);
    add('spc_ex2', 'sigma Rbar/d2', r.sigmaHat, g.sigma_hat_Rbar_d2);
    const cap = capability(r.Xbarbar, r.sigmaHat, g.LSL, g.USL);
    add('spc_ex2', 'Cp', cap.Cp, g.Cp);
    add('spc_ex2', 'Cpk', cap.Cpk, g.Cpk);
    add('spc_ex2', '% uitval', 100 * cap.pTotal, g.pct_out);
    const all = (g.data as number[][]).flat();
    add('spc_ex2', 'sigma overall', sdS(all), g.sigma_overall);
    const pp = capability(r.Xbarbar, sdS(all), g.LSL, g.USL);
    add('spc_ex2', 'Pp', pp.Cp, g.Pp);
    add('spc_ex2', 'Ppk', pp.Cpk, g.Ppk);
    const out = r.xbars.filter((x) => x > r.xLim.UCL || x < r.xLim.LCL).length + r.disp.filter((x) => x > r.dLim.UCL || x < r.dLim.LCL).length;
    add('spc_ex2', 'aantal punten buiten grenzen', out, g.out_of_control.length, 0);
  });

  safe('spc_ex3', () => {
    const g = G.spc_ex3;
    const r = chartFromStats(g.xbar, g.R, g.n, 'R');
    add('spc_ex3', 'Xbarbar', r.Xbarbar, g.Xbarbar);
    add('spc_ex3', 'Rbar', r.dispBar, g.Rbar);
    add('spc_ex3', 'Xbar UCL', r.xLim.UCL, g.xbar_UCL);
    add('spc_ex3', 'Xbar LCL', r.xLim.LCL, g.xbar_LCL);
    add('spc_ex3', 'R UCL', r.dLim.UCL, g.R_UCL);
    const rule1 = westernElectric(r.xbars, r.Xbarbar, (r.xLim.UCL - r.Xbarbar) / 3).filter((h) => h.rule === 1).length;
    add('spc_ex3', 'regel 1 overschrijdingen (subgroep 9 net binnen)', rule1, 0, 0);
  });

  safe('spc_ex4_shift_detection', () => {
    for (const n of [3, 5, 8]) {
      const g = G.spc_ex4_shift_detection['n' + n];
      const s = shiftDetection(2, n);
      add('spc_ex4_shift_detection', `n=${n} beta`, s.beta, g.beta);
      add('spc_ex4_shift_detection', `n=${n} P(detectie)`, s.pDetect, g.P_detect);
      add('spc_ex4_shift_detection', `n=${n} ARL1`, s.ARL, g.ARL1);
    }
  });

  safe('spc_capability_shaft', () => {
    const g = G.spc_capability_shaft;
    const c = capability(71.8, 0.2, 71.4, 72.8);
    add('spc_capability_shaft', 'Cp (sigma = sbar)', c.Cp, g.Cp_sigma_sbar);
    add('spc_capability_shaft', 'Cpk (sigma = sbar)', c.Cpk, g.Cpk_sigma_sbar);
    add('spc_capability_shaft', '% uitval', 100 * c.pTotal, g.pct_out);
    add('spc_capability_shaft', '% uitval gecentreerd', 100 * c.centred!.pTotal, g.pct_out_centred);
    add('spc_capability_shaft', 'sigma = sbar/c4', 0.2 / 0.94, g.sigma_sbar_c4);
  });

  safe('two_sample', () => {
    const g = G.two_sample;
    const r = H.twoSampleRaw(g.A, g.B, 0, 0.05, 'two');
    add('two_sample', 'pooled t', r.pooled.t, g.pooled_t);
    add('two_sample', 'pooled p', r.pooled.p, g.pooled_p);
    add('two_sample', 'df pooled', r.pooled.df, g.df_pooled, 0);
    add('two_sample', 'Welch t', r.welch.t, g.welch_t);
    add('two_sample', 'Welch p', r.welch.p, g.welch_p);
    add('two_sample', 'F s1^2/s2^2', varS(g.A) / varS(g.B), g.F_var_ratio);
    add('two_sample', 'F p tweezijdig', r.f.p, g.F_p_two_sided);
    const p = H.pairedT(g.paired_x1, g.paired_x2, 0, 0.05, 'two');
    add('two_sample', 'gepaarde t', p.stat, g.paired_t);
    add('two_sample', 'gepaarde p', p.p, g.paired_p);
    const mw = mannWhitney(g.A, g.B);
    add('two_sample', 'Mann-Whitney U1', mw.U1, g.mann_whitney_U);
    add('two_sample', 'Mann-Whitney p', mw.p, g.mann_whitney_p_normal_cc);
    const w = wilcoxonSigned(g.paired_x1, g.paired_x2);
    add('two_sample', 'Wilcoxon T', w.T, g.wilcoxon_signed_rank_stat);
    add('two_sample', 'Wilcoxon p', w.p, g.wilcoxon_p_normal_cc);
  });

  safe('chi2_contingency', () => {
    const g = G.chi2_contingency;
    const c = contingency(g.table);
    add('chi2_contingency', 'chi2', c.chi2, g.chi2);
    add('chi2_contingency', 'df', c.df, g.df, 0);
    add('chi2_contingency', 'p', c.p, g.p);
    add('chi2_contingency', 'E[0][2]', c.E[0][2], g.expected[0][2]);
    const y = contingency(G.chi2_2x2_yates.table, true);
    add('chi2_2x2_yates', 'chi2 (Yates)', y.chi2, G.chi2_2x2_yates.chi2);
    add('chi2_2x2_yates', 'p (Yates)', y.p, G.chi2_2x2_yates.p);
  });

  safe('chi2_gof_poisson', () => {
    const g = G.chi2_gof_poisson;
    const r = gofPoisson(g.observed);
    add('chi2_gof_poisson', 'lambda', r.lambda, g.lambda_hat);
    add('chi2_gof_poisson', 'E[5]', r.expected[5], g.expected[5]);
    add('chi2_gof_poisson', 'chi2', r.chi2, g.chi2);
    add('chi2_gof_poisson', 'df', r.df, g.df, 0);
    add('chi2_gof_poisson', 'p', r.p, g.p);
  });

  safe('regression_simple', () => {
    const g = G.regression_simple;
    const f = regress(g.y, [g.x]);
    add('regression_simple', 'b0', f.beta[0], g.b0);
    add('regression_simple', 'b1', f.beta[1], g.b1);
    add('regression_simple', 'R2', f.R2, g.R2);
    add('regression_simple', 'MSE', f.MSE, g.MSE);
    add('regression_simple', 'se b1', f.se[1], g.se_b1);
    add('regression_simple', 'F', f.F, g.F);
    add('regression_simple', 'p F', f.pF, g.p_F);
    const p = predict(f, [g.x0]);
    add('regression_simple', 'yhat(x0)', p.yhat, g.yhat0);
    add('regression_simple', 'CI gemiddelde onder', p.ci[0], g.CI_mean[0]);
    add('regression_simple', 'CI gemiddelde boven', p.ci[1], g.CI_mean[1]);
    add('regression_simple', 'PI onder', p.pi[0], g.PI_new[0]);
    add('regression_simple', 'PI boven', p.pi[1], g.PI_new[1]);
  });

  safe('regression_multiple', () => {
    const g = G.regression_multiple;
    const f = regress(g.y, [g.x1, g.x2]);
    f.beta.forEach((b, i) => add('regression_multiple', `b${i}`, b, g.coef[i]));
    add('regression_multiple', 'R2', f.R2, g.R2);
    add('regression_multiple', 'R2 adj', f.R2adj, g.R2_adj);
    add('regression_multiple', 'F', f.F, g.F);
    add('regression_multiple', 'p F', f.pF, g.p_F);
  });

  safe('doe_2x2', () => {
    const g = G.doe_2x2;
    const d = factorial(2, [g.runs['(1)'], g.runs.a, g.runs.b, g.runs.ab]);
    const e = Object.fromEntries(d.effects.map((x) => [x.name, x]));
    add('doe_2x2', 'effect A', e.A.effect, g.effect_A);
    add('doe_2x2', 'effect B', e.B.effect, g.effect_B);
    add('doe_2x2', 'effect AB', e.AB.effect, g.effect_AB);
    add('doe_2x2', 'SS A', e.A.SS, g.SS_A);
    add('doe_2x2', 'SS B', e.B.SS, g.SS_B);
    add('doe_2x2', 'SS AB', e.AB.SS, g.SS_AB);
    add('doe_2x2', 'SS E', d.SSE, g.SS_E);
    add('doe_2x2', 'MS E', d.MSE, g.MS_E);
    add('doe_2x2', 'F A', e.A.F!, g.F_A);
    add('doe_2x2', 'F B', e.B.F!, g.F_B);
    add('doe_2x2', 'F AB', e.AB.F!, g.F_AB);
    add('doe_2x2', 'p A', e.A.p!, g.p_A);
    add('doe_2x2', 'p B', e.B.p!, g.p_B);
    add('doe_2x2', 'p AB', e.AB.p!, g.p_AB);
    add('doe_2x2', 'se(effect)', d.seEffect, g.se_effect);
  });

  safe('anova_oneway', () => {
    const g = G.anova_oneway;
    const a = oneWay(g.groups);
    add('anova_oneway', 'F', a.F, g.F);
    add('anova_oneway', 'p', a.p, g.p);
    add('anova_oneway', 'df1', a.df[0], g.df[0], 0);
    add('anova_oneway', 'df2', a.df[1], g.df[1], 0);
  });

  safe('stratification', () => {
    const g = G.stratification;
    const s = stratification([g.WA, g.WB], [g.piA, g.piB], g.n);
    add('stratification', 'Var proportioneel', s.varProp, g.var_prop);
    add('stratification', 'Var SRS', s.varSrs, g.var_srs);
    add('stratification', 'Neyman nA', s.neyman[0], g.neyman_nA);
  });

  safe('mm1k', () => {
    const g = G.mm1k;
    const q = mm1k(g.lam, g.mu, g.K);
    q.pi.forEach((p, j) => add('mm1k', `pi_${j}`, p, g.pi[j]));
    add('mm1k', 'E[L]', q.EL, g.EL);
    add('mm1k', 'E[W]', q.EW, g.EW);
  });

  safe('variables_plan_k', () => {
    const g = G.variables_plan_k;
    const k = variablesK(g.n, g.p0, g.alpha);
    add('variables_plan_k', 'k exact (niet-centrale t)', k.exact, g.k_exact_nct);
    add('variables_plan_k', 'k Natrella', k.natrella, g.k_natrella);
  });

  safe('dpmo_table', () => {
    for (const [k, v] of Object.entries<number>(G.dpmo_table)) add('dpmo_table', `${k} sigma DPMO`, dpmoFromSigma(+k), v);
  });

  return out;
}

export function passes(c: Check): boolean {
  if (!isFinite(c.actual) && !isFinite(c.expected)) return c.actual === c.expected;
  if (!isFinite(c.actual)) return false;
  if (c.tol === 0) return Math.abs(c.actual - c.expected) < 1e-12;
  const scale = Math.max(Math.abs(c.expected), 1e-300);
  return Math.abs(c.actual - c.expected) / scale <= c.tol || Math.abs(c.actual - c.expected) <= 1e-15;
}
