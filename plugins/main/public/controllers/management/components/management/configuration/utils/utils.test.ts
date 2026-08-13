import { reportedEnabled } from './utils';

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
});
