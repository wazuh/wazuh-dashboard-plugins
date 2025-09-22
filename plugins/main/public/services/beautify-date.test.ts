// @ts-nocheck
import { beautifyDate } from './beautify-date';

jest.mock('../react-services/time-service', () => ({
  formatUIDate: jest.fn(),
}));

const {
  formatUIDate: mockFormatUIDate,
} = require('../react-services/time-service');

describe('beautifyDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatUIDate.mockImplementation((date: any) => {
      if (!date || date === '-') return '-';
      // Mock the expected format: "Sep 22, 2025 @ 13:29:44.360"
      return 'Sep 22, 2025 @ 13:29:44.360';
    });
  });

  describe('when date is undefined, null or invalid type', () => {
    it('should return "-" for undefined', () => {
      const result = beautifyDate(undefined);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for null', () => {
      const result = beautifyDate(null as any);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for number', () => {
      const result = beautifyDate(123456789 as any);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for object', () => {
      const result = beautifyDate({ date: '2023-01-01' } as any);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for array', () => {
      const result = beautifyDate(['2023-01-01'] as any);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });
  });

  describe('when date is "-"', () => {
    it('should return "-" without calling formatUIDate', () => {
      const result = beautifyDate('-');

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });
  });

  describe('when date starts with "1970" (epoch dates)', () => {
    it('should return "-" for epoch date "1970-01-01T00:00:00.000Z"', () => {
      const epochDate = '1970-01-01T00:00:00.000Z';
      const result = beautifyDate(epochDate);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for any date starting with "1970"', () => {
      const epochDate = '1970-12-31T23:59:59.999Z';
      const result = beautifyDate(epochDate);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should return "-" for Unix epoch timestamp as string', () => {
      const epochDate = '1970-01-01';
      const result = beautifyDate(epochDate);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });
  });

  describe('when date is valid and not epoch', () => {
    it('should call formatUIDate and return formatted date', () => {
      const validDate = '2025-09-22T13:29:44.360Z';
      const expectedFormat = 'Sep 22, 2025 @ 13:29:44.360';

      const result = beautifyDate(validDate);

      expect(mockFormatUIDate).toHaveBeenCalledWith(validDate);
      expect(result).toBe(expectedFormat);
    });

    it('should handle different valid date formats', () => {
      const validDate = '2024-12-25T10:30:15.123Z';
      const result = beautifyDate(validDate);

      expect(mockFormatUIDate).toHaveBeenCalledWith(validDate);
      expect(result).toBe('Sep 22, 2025 @ 13:29:44.360');
    });

    it('should handle dates from year 1971 onwards', () => {
      const validDate = '1971-01-01T00:00:00.000Z';
      const result = beautifyDate(validDate);

      expect(mockFormatUIDate).toHaveBeenCalledWith(validDate);
      expect(result).toBe('Sep 22, 2025 @ 13:29:44.360');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = beautifyDate('');

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only string', () => {
      const result = beautifyDate('   ');

      expect(mockFormatUIDate).toHaveBeenCalledWith('   ');
      expect(result).toBe('Sep 22, 2025 @ 13:29:44.360');
    });

    it('should handle date that starts with "1970" but has additional characters', () => {
      const dateWith1970 = '1970-something-invalid';
      const result = beautifyDate(dateWith1970);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });
  });

  describe('Wazuh API specific cases', () => {
    it('should handle dates returned by Wazuh API when vulnerability module is not configured', () => {
      // According to the comment in the original function, Wazuh API returns 1970 dates
      // when the vulnerability module is not configured
      const wazuhEpochDate = '1970-01-01T00:00:00.000Z';
      const result = beautifyDate(wazuhEpochDate);

      expect(result).toBe('-');
      expect(mockFormatUIDate).not.toHaveBeenCalled();
    });
  });
});
