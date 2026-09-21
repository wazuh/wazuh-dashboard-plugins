import { homeOverviewI18n } from './i18n';

describe('homeOverviewI18n.severityRuleLevel', () => {
  it('maps each findings band to its rule-level range', () => {
    expect(homeOverviewI18n.severityRuleLevel('critical')).toBe(
      'Rule level 15 or above',
    );
    expect(homeOverviewI18n.severityRuleLevel('high')).toBe('Rule level 12–14');
    expect(homeOverviewI18n.severityRuleLevel('medium')).toBe(
      'Rule level 7–11',
    );
    expect(homeOverviewI18n.severityRuleLevel('low')).toBe('Rule level 0–6');
    expect(homeOverviewI18n.severityRuleLevel('informational')).toBe(
      'Informational rule level',
    );
  });
});
