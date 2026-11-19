import {
  getDataPlugin,
  getWazuhCheckUpdatesPlugin,
} from '../../../../../kibana-services';
import { formatHomeNumber, formatHomePercent } from './format-number';

jest.mock('../../../../../kibana-services', () => ({
  getDataPlugin: jest.fn(),
  getWazuhCheckUpdatesPlugin: jest.fn(),
}));
jest.mock('../../utils/helpers', () => ({
  decimalFormat: () => ({ convert: (ratio: number) => `${ratio * 100}% (ui)` }),
}));

const asMock = (fn: unknown) => fn as jest.Mock;
const notSet = () => {
  throw new Error('not set');
};
const withFieldFormats = (convert: (value: number) => unknown) =>
  asMock(getDataPlugin).mockReturnValue({
    fieldFormats: { getInstance: jest.fn(() => ({ convert })) },
  });

beforeEach(() => {
  jest.resetAllMocks();
  asMock(getDataPlugin).mockImplementation(notSet);
  asMock(getWazuhCheckUpdatesPlugin).mockImplementation(notSet);
});

describe('formatHomeNumber', () => {
  it('uses the formatter published by wazuh-check-updates', () => {
    asMock(getWazuhCheckUpdatesPlugin).mockReturnValue({
      formatNumber: (value: number) => `${value} (published)`,
    });
    withFieldFormats(() => 'field format');
    expect(formatHomeNumber(1234)).toBe('1234 (published)');
  });

  it('falls back to the number format of the data plugin, which reads the settings', () => {
    asMock(getWazuhCheckUpdatesPlugin).mockReturnValue({});
    withFieldFormats(() => '1.234');
    expect(formatHomeNumber(1234)).toBe('1.234');
    expect(
      asMock(getDataPlugin)().fieldFormats.getInstance,
    ).toHaveBeenCalledWith('number');
  });

  it('falls back to the en-US format when no settings can be read', () => {
    expect(formatHomeNumber(35682)).toBe('35,682');
  });

  it('ignores an empty conversion', () => {
    withFieldFormats(() => '');
    expect(formatHomeNumber(35682)).toBe('35,682');
  });
});

describe('formatHomePercent', () => {
  it('uses the percent format of the data plugin', () => {
    withFieldFormats(() => '46,8 %');
    expect(formatHomePercent(0.468)).toBe('46,8 %');
    expect(
      asMock(getDataPlugin)().fieldFormats.getInstance,
    ).toHaveBeenCalledWith('percent');
  });

  it('falls back to the shared percent formatter', () => {
    expect(formatHomePercent(0.5)).toBe('50% (ui)');
  });
});
