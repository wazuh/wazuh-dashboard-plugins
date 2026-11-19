import {
  AnsweredFindings,
  SeriousFindings,
  SeriousLevel,
  SeriousRule,
} from '../interfaces/types';

/** A rule with critical/high findings left without an active response. */
export interface RuleGap extends SeriousRule {
  unanswered: number;
}

export interface ResponseCoverage {
  /** Critical/high findings. */
  total: number;
  /** Those an active response answered. */
  answered: number;
  unanswered: number;
  /** answered / total; undefined when there is no critical/high finding. */
  ratio?: number;
  /** Rules with unanswered findings: critical first, then most unanswered. */
  gaps: RuleGap[];
  /** More rules exist than the findings search returned, so `gaps` may be partial. */
  gapsPartial: boolean;
}

const LEVEL_RANK: Record<SeriousLevel, number> = { critical: 2, high: 1 };

/**
 * Joins the critical/high findings with those of them an active response answered. Both come from
 * the same window; the caps only guard against the two searches seeing different data.
 */
export function computeResponseCoverage(
  findings: SeriousFindings,
  answered: AnsweredFindings,
): ResponseCoverage {
  const levels = Object.keys(findings.byLevel) as SeriousLevel[];
  const total = levels.reduce((sum, l) => sum + (findings.byLevel[l] ?? 0), 0);
  const answeredTotal = levels.reduce(
    (sum, l) =>
      sum + Math.min(answered.byLevel[l] ?? 0, findings.byLevel[l] ?? 0),
    0,
  );
  const gaps = findings.rules
    .map(rule => ({
      ...rule,
      unanswered:
        rule.count - Math.min(answered.byRule[rule.id] ?? 0, rule.count),
    }))
    .filter(rule => rule.unanswered > 0)
    .sort(
      (a, b) =>
        LEVEL_RANK[b.level] - LEVEL_RANK[a.level] ||
        b.unanswered - a.unanswered,
    );
  return {
    total,
    answered: answeredTotal,
    unanswered: total - answeredTotal,
    ratio: total ? answeredTotal / total : undefined,
    gaps,
    gapsPartial: findings.partial,
  };
}
