import { SEVERITY_PRESENTATION } from './severity-presentation';
import { HOME_OVERVIEW_COLOR, HOME_OVERVIEW_TEXT_COLOR } from './theme-colors';

describe('SEVERITY_PRESENTATION', () => {
  it('gives every band a theme-aware CSS custom property, not a frozen hex literal', () => {
    for (const presentation of SEVERITY_PRESENTATION) {
      expect(presentation.color).toMatch(/^var\(--wz-ho-.+\)$/);
    }
  });

  it('maps each severity band to the matching status role', () => {
    expect(
      SEVERITY_PRESENTATION.find(({ band }) => band === 'critical')?.color,
    ).toBe(HOME_OVERVIEW_COLOR.danger);
    expect(
      SEVERITY_PRESENTATION.find(({ band }) => band === 'high')?.color,
    ).toBe(HOME_OVERVIEW_COLOR.warning);
    expect(
      SEVERITY_PRESENTATION.find(({ band }) => band === 'medium')?.color,
    ).toBe(HOME_OVERVIEW_COLOR.info);
    expect(
      SEVERITY_PRESENTATION.find(({ band }) => band === 'low')?.color,
    ).toBe(HOME_OVERVIEW_COLOR.success);
    expect(
      SEVERITY_PRESENTATION.find(({ band }) => band === 'informational')?.color,
    ).toBe(HOME_OVERVIEW_TEXT_COLOR.text);
  });
});
