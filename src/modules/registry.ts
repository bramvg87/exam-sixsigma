import type { ModuleDef } from './types.ts';
import { start, wizard, formulariumMod, examen, selftest } from './pages.ts';
import { verdelingen } from './verdelingen.ts';
import { hypothese } from './hypothese.ts';
import { capabiliteit } from './capabiliteit.ts';
import { spc } from './spc.ts';
import { anova } from './anova.ts';
import { msa } from './msa.ts';
import { regressie } from './regressie.ts';
import { doe } from './doe.ts';
import { steekproeven } from './steekproeven.ts';
import { ml } from './ml.ts';
import { nonparam } from './nonparam.ts';
import { wachtrij } from './wachtrij.ts';

export const MODULES: ModuleDef[] = [
  start, wizard, selftest,
  verdelingen, hypothese, capabiliteit, formulariumMod, examen,
  spc, anova, msa, regressie, doe, steekproeven, ml,
  nonparam, wachtrij,
];
