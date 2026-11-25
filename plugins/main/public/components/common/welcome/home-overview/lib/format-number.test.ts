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

beforeEach(() => {
  jest.resetAllMocks();
  asMock(getDataPlugin).mockImplementation(notSet);
  asMock(getWazuhCheckUpdatesPlugin).mockImplementation(notSet);
});

describe('formatHomeNumber', () => {
  it('uses the formatter published by wazuh-check-updates', () => {
    asMock(getWazuhCheckUpdatesPlugin).mockReturnValue({
      formatNumber: (value: number) => `${value} (settings)`,
    });
    expect(formatHomeNumber(1234)).toBe('1234 (settings)');
  });

  it('falls back to the en-US format while the plugin is not set', () => {
    expect(formatHomeNumber(35682)).toBe('35,682');
  });
});

describe('formatHomePercent', () => {
  it('uses the percent format of the data plugin', () => {
    const getInstance = jest.fn(() => ({ convert: () => '46,8 %' }));
    asMock(getDataPlugin).mockReturnValue({ fieldFormats: { getInstance } });
    expect(formatHomePercent(0.468)).toBe('46,8 %');
    expect(getInstance).toHaveBeenCalledWith('percent');
  });

  it('falls back to the shared percent formatter while the data plugin is not set', () => {
    expect(formatHomePercent(0.5)).toBe('50% (ui)');
  });

  it('ignores an empty conversion', () => {
    asMock(getDataPlugin).mockReturnValue({
      fieldFormats: { getInstance: () => ({ convert: () => '' }) },
    });
    expect(formatHomePercent(0.5)).toBe('50% (ui)');
  });
});
