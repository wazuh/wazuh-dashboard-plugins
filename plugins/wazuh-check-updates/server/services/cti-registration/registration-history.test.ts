/* eslint-disable camelcase -- saved object and status API fields use snake_case */
import { SAVED_OBJECT_CTI_REGISTRATION_HISTORY } from '../../../common/constants';
import type { CtiSubscriptionSnapshot } from '../../../common/cti-registration-status-api';
import { getSavedObject, setSavedObject } from '../saved-object';
import {
  nextRegistrationHistory,
  observeCtiRegistration,
  resetRegistrationHistoryCacheForTests,
  toRegistrationLost,
} from './registration-history';

jest.mock('../saved-object', () => ({
  getSavedObject: jest.fn(),
  setSavedObject: jest.fn(),
}));

const mockedGetSavedObject = getSavedObject as jest.Mock;
const mockedSetSavedObject = setSavedObject as jest.Mock;

const NOW = '2026-10-13T10:00:00.000Z';
const EARLIER = '2026-10-01T10:00:00.000Z';

const registered = (plan: string): CtiSubscriptionSnapshot => ({
  message: { is_registered: true, plan: { name: plan, is_public: false } },
  status: 200,
});
const unregistered: CtiSubscriptionSnapshot = {
  message: { is_registered: false, plan: { name: 'Open', is_public: true } },
  status: 200,
};
const unknown: CtiSubscriptionSnapshot = { message: null, status: 502 };

const registeredRecord = {
  last_plan: 'Professional',
  last_registered_at: EARLIER,
  lost_at: null,
  lost_plan: null,
};
const lostRecord = {
  ...registeredRecord,
  lost_at: EARLIER,
  lost_plan: 'Professional',
};

describe('nextRegistrationHistory', () => {
  test.each([
    ['never registered, unregistered read', {}, unregistered, null],
    ['any record, unknown read', registeredRecord, unknown, null],
    ['lost record, unknown read', lostRecord, unknown, null],
    [
      'registered, same plan',
      registeredRecord,
      registered('Professional'),
      null,
    ],
    ['lost, unregistered read again', lostRecord, unregistered, null],
  ])('%s: no change', (_, prev, subscription, expected) => {
    expect(nextRegistrationHistory(prev, subscription, NOW)).toBe(expected);
  });

  test('first registered read records the plan', () => {
    expect(
      nextRegistrationHistory({}, registered('Professional'), NOW),
    ).toEqual({
      last_plan: 'Professional',
      last_registered_at: NOW,
      lost_at: null,
      lost_plan: null,
    });
  });

  test('plan change while registered records the new plan', () => {
    expect(
      nextRegistrationHistory(registeredRecord, registered('Enterprise'), NOW),
    ).toMatchObject({ last_plan: 'Enterprise', lost_at: null });
  });

  test('registered then unregistered marks the loss with the last plan', () => {
    expect(
      nextRegistrationHistory(registeredRecord, unregistered, NOW),
    ).toEqual({ ...registeredRecord, lost_at: NOW, lost_plan: 'Professional' });
  });

  test('a new registration clears the loss', () => {
    expect(
      nextRegistrationHistory(lostRecord, registered('Professional'), NOW),
    ).toMatchObject({ lost_at: null, lost_plan: null });
  });
});

describe('toRegistrationLost', () => {
  test('maps a lost record and ignores a registered one', () => {
    expect(toRegistrationLost(lostRecord)).toEqual({
      detected_at: EARLIER,
      last_plan: 'Professional',
    });
    expect(toRegistrationLost(registeredRecord)).toBeUndefined();
    expect(toRegistrationLost({})).toBeUndefined();
  });
});

describe('observeCtiRegistration', () => {
  beforeEach(() => {
    resetRegistrationHistoryCacheForTests();
    // Behaves like the saved objects index: reads return the last write.
    const stored = new Map<string, unknown>();
    mockedGetSavedObject
      .mockReset()
      .mockImplementation((_type, id) => Promise.resolve(stored.get(id) ?? {}));
    mockedSetSavedObject.mockReset().mockImplementation((_type, value, id) => {
      stored.set(id, value);
      return Promise.resolve(value);
    });
  });

  test('writes the first registered read under the environment UUID', async () => {
    await expect(
      observeCtiRegistration('env-1', registered('Professional')),
    ).resolves.toBeUndefined();

    expect(mockedGetSavedObject).toHaveBeenCalledWith(
      SAVED_OBJECT_CTI_REGISTRATION_HISTORY,
      'env-1',
    );
    expect(mockedSetSavedObject).toHaveBeenCalledWith(
      SAVED_OBJECT_CTI_REGISTRATION_HISTORY,
      expect.objectContaining({ last_plan: 'Professional', lost_at: null }),
      'env-1',
    );
  });

  test('steady reads use the cache and write nothing', async () => {
    await observeCtiRegistration('env-1', registered('Professional'));
    mockedGetSavedObject.mockClear();
    mockedSetSavedObject.mockClear();

    await observeCtiRegistration('env-1', registered('Professional'));
    await observeCtiRegistration('env-1', unknown);

    expect(mockedGetSavedObject).not.toHaveBeenCalled();
    expect(mockedSetSavedObject).not.toHaveBeenCalled();
  });

  test('reports the loss after a registered read and keeps reporting it', async () => {
    await observeCtiRegistration('env-1', registered('Professional'));

    const lost = await observeCtiRegistration('env-1', unregistered);
    expect(lost).toEqual({
      detected_at: expect.any(String),
      last_plan: 'Professional',
    });
    await expect(
      observeCtiRegistration('env-1', unregistered),
    ).resolves.toEqual(lost);
  });

  test('a loss already stored by another node is reported, not rewritten', async () => {
    await observeCtiRegistration('env-1', registered('Professional'));
    mockedGetSavedObject.mockResolvedValue(lostRecord);
    mockedSetSavedObject.mockClear();

    await expect(
      observeCtiRegistration('env-1', unregistered),
    ).resolves.toEqual({ detected_at: EARLIER, last_plan: 'Professional' });
    expect(mockedSetSavedObject).not.toHaveBeenCalled();
  });

  test('a loss stored before a restart is reported from the saved object', async () => {
    mockedGetSavedObject.mockResolvedValue(lostRecord);

    await expect(
      observeCtiRegistration('env-1', unregistered),
    ).resolves.toEqual({ detected_at: EARLIER, last_plan: 'Professional' });
  });

  test('a saved object error rejects', async () => {
    mockedGetSavedObject.mockRejectedValue(new Error('boom'));

    await expect(observeCtiRegistration('env-1', unregistered)).rejects.toThrow(
      'boom',
    );
  });
});
