const { Random } = require('./random');

describe('Random', () => {
  describe('arrayItem', () => {
    it('should_verify_random_item_is_in_array', () => {
      const actualArray = [1, 2, 3];
      expect(actualArray.includes(Random.arrayItem(actualArray))).toBe(true);
    });
  });
  describe('character', () => {
    it('should_verify_random_character_is_in_string', () => {
      const actualText = '123';
      expect(actualText.includes(Random.character(actualText))).toBe(true);
    });
  });
  describe('createHash', () => {
    it('should_return_empty_string_for_negative_length_hash', () => {
      expect(Random.createHash(-1)).toBe('');
    });
    it('should_return_empty_string_for_zero_length_hash', () => {
      expect(Random.createHash(0)).toBe('');
    });
    it('should_verify_random_hash_is_in_string', () => {
      const actualHash = Random.createHash(1);
      expect('abcdef0123456789'.includes(actualHash)).toBe(true);
    });
    it('should_verify_all_characters_in_random_hash_are_in_string', () => {
      const actualHash = Random.createHash(16);
      actualHash.split('').forEach((char) => {
        expect('abcdef0123456789'.includes(char)).toBe(true);
      });
    });
    it('should_verify_all_characters_in_random_hash_with_default_charset_are_in_string', () => {
      const actualHash = Random.createHash(16, undefined);
      actualHash.split('').forEach((char) => {
        expect('abcdef0123456789'.includes(char)).toBe(true);
      });
    });
  });
  describe('number', () => {
    it('should_return_zero_for_zero_range_number', () => {
      const actualNumber = Random.number(0);
      expect(actualNumber).toBe(0);
    });
    it('should_return_number_within_range_of_zero_and_one', () => {
      const actualNumber = Random.number(1);
      expect(actualNumber).toBeGreaterThanOrEqual(0);
      expect(actualNumber).toBeLessThanOrEqual(1);
    });
    it('should_return_number_within_range_of_zero_and_two', () => {
      const actualNumber = Random.number(2);
      expect(actualNumber).toBeGreaterThanOrEqual(0);
      expect(actualNumber).toBeLessThanOrEqual(2);
    });
    it('should_return_zero_for_negative_range_number', () => {
      const actualNumber = Random.number(-1);
      expect(actualNumber).toBe(0);
    });
    it('should_return_number_within_range_of_negative_two_and_zero', () => {
      const actualNumber = Random.number(-2);
      expect(actualNumber).toBeGreaterThanOrEqual(-2);
      expect(actualNumber).toBeLessThanOrEqual(0);
    });
    it('should_return_number_within_range_of_three_and_five', () => {
      const actualNumber = Random.number(3, 5);
      expect(actualNumber).toBeGreaterThanOrEqual(3);
      expect(actualNumber).toBeLessThanOrEqual(5);
    });
  });
  describe('date', () => {
    it('should_return_date_after_seven_days_ago', () => {
      for (let i = 0; i < 100; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(-7);
        expect(Random.date().getTime()).toBeGreaterThanOrEqual(expectedDate.getTime());
      }
    });
  });
  describe('uniqueValues', () => {
    it('', () => {
      for (let i = 0; i < 100; i++) {
        const actualLenght = 2;
        const actualValue = Random.uniqueValues(actualLenght, [1, 2, 3]);
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(actualLenght);
      }
    });
  });
});
