import {
  reportedEnabled,
  normalizeConfigBoolean,
  renderValueNoThenEnabled,
  renderValueYesThenEnabled,
  renderValueBooleanYesNo,
} from './utils';

describe('reportedEnabled', () => {
  it('is enabled when the module reported it is not disabled', () => {
    expect(reportedEnabled('no', 'no')).toBe(true);
  });

  it('is disabled when the module reported it is disabled', () => {
    expect(reportedEnabled('yes', 'no')).toBe(false);
  });

  it('reads the other convention too', () => {
    expect(reportedEnabled('yes', 'yes')).toBe(true);
    expect(reportedEnabled('no', 'yes')).toBe(false);
  });

  /* A report assembled while the agent is starting can leave a module out, or
  carry it without this setting. Saying "disabled" there would be a claim the
  report does not make. */
  it('says nothing when the setting was not reported', () => {
    expect(reportedEnabled(undefined, 'no')).toBeUndefined();
    expect(reportedEnabled(null, 'no')).toBeUndefined();
  });

  /* The manager now reports this field as a native boolean instead of the
  legacy 'yes'/'no' strings. A silent mislabel here (rendering 'disabled' for
  an active module) must not happen. */
  it('reads a native boolean using the same enabled/disabled convention', () => {
    expect(reportedEnabled(false, 'no')).toBe(true);
    expect(reportedEnabled(true, 'no')).toBe(false);
    expect(reportedEnabled(true, 'yes')).toBe(true);
    expect(reportedEnabled(false, 'yes')).toBe(false);
  });
});

describe('normalizeConfigBoolean', () => {
  it('passes booleans through unchanged', () => {
    expect(normalizeConfigBoolean(true)).toBe(true);
    expect(normalizeConfigBoolean(false)).toBe(false);
  });

  it('maps the legacy yes/no dialect to booleans', () => {
    expect(normalizeConfigBoolean('yes')).toBe(true);
    expect(normalizeConfigBoolean('no')).toBe(false);
  });

  it('returns undefined for anything else', () => {
    expect(normalizeConfigBoolean(undefined)).toBeUndefined();
    expect(normalizeConfigBoolean(null)).toBeUndefined();
    expect(normalizeConfigBoolean(0)).toBeUndefined();
    expect(normalizeConfigBoolean('other')).toBeUndefined();
  });
});

describe('renderValueNoThenEnabled', () => {
  it('keeps the legacy string behavior', () => {
    expect(renderValueNoThenEnabled('no')).toBe('enabled');
    expect(renderValueNoThenEnabled('yes')).toBe('disabled');
  });

  it('accepts a native boolean', () => {
    expect(renderValueNoThenEnabled(false)).toBe('enabled');
    expect(renderValueNoThenEnabled(true)).toBe('disabled');
  });

  /* This is the spec's explicit silent-mislabel regression case: a native
  `false` (the service is not disabled, i.e. enabled) must render 'enabled',
  not the legacy fallback. */
  it('does not silently mislabel a native false as disabled', () => {
    expect(renderValueNoThenEnabled(false)).toBe('enabled');
  });

  it('keeps every legacy fallback for wrong-type or missing values', () => {
    expect(renderValueNoThenEnabled(undefined)).toBe('disabled');
    expect(renderValueNoThenEnabled(null)).toBe('disabled');
    expect(renderValueNoThenEnabled(0)).toBe('disabled');
    expect(renderValueNoThenEnabled('other')).toBe('disabled');
  });
});

describe('renderValueYesThenEnabled', () => {
  it('keeps the legacy string behavior', () => {
    expect(renderValueYesThenEnabled('yes')).toBe('enabled');
    expect(renderValueYesThenEnabled('no')).toBe('disabled');
  });

  it('accepts a native boolean', () => {
    expect(renderValueYesThenEnabled(true)).toBe('enabled');
    expect(renderValueYesThenEnabled(false)).toBe('disabled');
  });

  it('keeps every legacy fallback for wrong-type or missing values', () => {
    expect(renderValueYesThenEnabled(undefined)).toBe('disabled');
    expect(renderValueYesThenEnabled(null)).toBe('disabled');
    expect(renderValueYesThenEnabled(0)).toBe('disabled');
    expect(renderValueYesThenEnabled('other')).toBe('disabled');
  });
});

describe('renderValueBooleanYesNo', () => {
  it('renders a native boolean as yes/no', () => {
    expect(renderValueBooleanYesNo(true)).toBe('yes');
    expect(renderValueBooleanYesNo(false)).toBe('no');
  });

  it('renders the legacy yes/no dialect unchanged', () => {
    expect(renderValueBooleanYesNo('yes')).toBe('yes');
    expect(renderValueBooleanYesNo('no')).toBe('no');
  });

  it('falls back to the default "-" placeholder for a missing value', () => {
    expect(renderValueBooleanYesNo(undefined)).toBe('-');
  });

  it('delegates to the existing renderValueOrNoValue fallback for anything else', () => {
    // renderValueOrNoValue only substitutes '-' for `undefined`; a present
    // non-boolean value (including `null`) passes through unchanged, exactly
    // as it does today for every other field using that fallback.
    expect(renderValueBooleanYesNo(null)).toBeNull();
    expect(renderValueBooleanYesNo('other')).toBe('other');
  });
});
