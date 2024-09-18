export class Random {
  public static readonly NUMBERS = '0123456789';
  public static readonly HEX_CHARACTERS = 'abcdef' + this.NUMBERS;

  // 7 days in miliseconds
  public static readonly SEVEN_DAYS = 604800000;

  /**
   * The function `arrayItem` returns a random item from an input array.
   * @param {T[]} array - The `array` parameter is an array of elements of type
   * `T`.
   * @returns A random item from the input array is being returned.
   */
  static arrayItem<T = unknown>(array: T[]): T {
    return array[Math.floor(array.length * Math.random())];
  }

  /**
   * The function `character` takes a string input and returns a random
   * character from that string.
   * @param {string} text - The `text` parameter in the `character` method is
   * a string that represents the input text from which a random character will
   * be selected.
   * @returns A random character from the input text is being returned.
   */
  static character(text: string): string {
    return Random.arrayItem(text.split(''));
  }

  /**
   * The function `createHash` generates a random hash of a specified length
   * using a set of characters.
   * @param {number} length - The `length` parameter in the `createHash`
   * function represents the desired length of the hash that will be generated.
   * This value determines how many characters will be included in the final
   * hash string.
   * @param characters - The `characters` parameter in the `createHash` function
   * is a default parameter that is set to `Random.CHARACTERS` if no value is
   * provided when calling the function. This parameter likely represents the
   * set of characters from which the random hash is generated.
   * @returns The `createHash` function is returning a randomly generated hash
   * string of the specified length using the characters provided.
   */
  static createHash(
    length: number,
    characters = Random.HEX_CHARACTERS,
  ): string {
    let hash = '';

    for (let i = 0; i < length; i++) {
      hash += Random.character(characters);
    }

    return hash;
  }

  /**
   * The function generates a random number within a specified range, with the
   * option to provide a minimum and maximum value.
   * @param {number} min - The `min` parameter in the `number` function
   * represents the minimum value that can be generated randomly.
   * @param {number} [max] - The `max` parameter in the `number` function
   * represents the maximum value that can be generated randomly. If the `max`
   * parameter is not provided when calling the function, it defaults to the
   * value of the `min` parameter.
   * @returns The `number` function returns a random integer between the
   * specified `min` and `max` values (inclusive).
   */
  static number(min: number, max?: number): number {
    if (!max) {
      max = min;
      min = 0;
    }
    return Math.floor(Math.random() * (max - (min - 1))) + min;
  }

  /**
   * The function returns a random date within the last 7 days from the current
   * date.
   * @returns A new Date object representing a date that is 7 days before the
   * current date and time.
   */
  static date() {
    // Last 7 days from now
    const unixTimestamp = Date.now() - Random.number(Random.SEVEN_DAYS);

    return new Date(unixTimestamp);
  }

  /**
   * The function `probability` returns true with a given probability based on
   * the input parameters.
   * @param {number} probability - The `probability` parameter represents the
   * likelihood of an event occurring, expressed as a number between 0 and 100.
   * @param [maximum=100] - The `maximum` parameter in the `probability`
   * function represents the upper limit for generating a random number. The
   * function will return `true` if the randomly generated number is less than
   * or equal to the `probability` parameter. The `maximum` parameter is
   * optional and defaults to 100 if not provided
   * @returns The `probability` method is returning a boolean value based on
   * whether a randomly generated number between 0 and `maximum` is less than or
   * equal to the provided `probability` value.
   */
  static probability(probability: number, maximum = 100) {
    return Random.number(0, maximum) <= probability;
  }

  /**
   * The function `uniqueValues` generates an array of unique values from a
   * given array with a specified length.
   * @param {number} lenght - The `lenght` parameter represents the desired
   * length of the output array containing unique values.
   * @param {T[]} values - The `values` parameter in the `uniqueValues` function
   * represents an array of elements of type `T`. These elements are used to
   * generate a new array containing unique values up to a specified length.
   * @returns The `uniqueValues` function returns an array of unique values from
   * the `values` array parameter. If the length of the `values` array is less
   * than or equal to the specified `length` parameter, the function simply
   * returns the `values` array as is. Otherwise, it creates a `Set` to store
   * unique values and keeps adding random items from the `values` array until
   * the set
   */
  static uniqueValues<T = unknown>(lenght: number, values: T[]): T[] {
    if (values.length <= lenght) {
      return values;
    }

    const result = new Set<T>();

    while (result.size <= lenght) {
      result.add(Random.arrayItem(values));
    }

    return Array.from(result);
  }

  static uniqueValuesFromArray(
    array: [],
    sort: (a: unknown, b: unknown) => number,
    randomMaxRepetitions = 1,
  ) {
    const repetitions = Random.number(1, randomMaxRepetitions);
    const set = new Set();
    for (let i = 0; i < repetitions; i++) {
      set.add(array[Random.number(0, array.length - 1)]);
    }
    return sort ? Array.from(set).sort(sort) : Array.from(set);
  }
}
