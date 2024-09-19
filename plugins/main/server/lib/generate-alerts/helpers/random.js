class Random {
  static NUMBERS = '0123456789';
  static HEX_CHARACTERS = 'abcdef' + this.NUMBERS;
  static ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // 7 days in miliseconds
  static SEVEN_DAYS = 604800000;

  /**
   * @template T
   * The function `arrayItem` returns a random item from an input array.
   * @param {T[]} array - The `array` parameter is an array of elements of type
   * `T`.
   * @returns {T} A random item from the input array is being returned.
   */
  static arrayItem(array) {
    return array[Math.floor(array.length * Math.random())];
  }

  /**
   * The function `character` takes a string input and returns a random
   * character from that string.
   * @param {string} text - The `text` parameter in the `character` method is
   * a string that represents the input text from which a random character will
   * be selected.
   * @returns {string} A random character from the input text is being returned.
   */
  static character(text) {
    return Random.arrayItem(text.split(''));
  }

  /**
   * The function `createHash` generates a random hash of a specified length
   * using a set of characters.
   * @param {number} length - The `length` parameter in the `createHash`
   * function represents the desired length of the hash that will be generated.
   * This value determines how many characters will be included in the final
   * hash string.
   * @param {string} characters - The `characters` parameter in the `createHash` function
   * is a default parameter that is set to `Random.CHARACTERS` if no value is
   * provided when calling the function. This parameter likely represents the
   * set of characters from which the random hash is generated.
   * @returns {string} The `createHash` function is returning a randomly generated hash
   * string of the specified length using the characters provided.
   */
  static createHash(length, characters = Random.HEX_CHARACTERS) {
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
   * @returns {number} The `number` function returns a random integer between the
   * specified `min` and `max` values (inclusive).
   */
  static number(min, max) {
    if (!max) {
      max = min;
      min = 0;
    }
    return Math.floor(Math.random() * (max - (min - 1))) + min;
  }

  /**
   * The function returns a random date within the last 7 days from the current
   * date.
   * @returns {Date} A new Date object representing a date that is 7 days before the
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
   * @returns {boolean} The `probability` method is returning a boolean value based on
   * whether a randomly generated number between 0 and `maximum` is less than or
   * equal to the provided `probability` value.
   */
  static probability(probability, maximum = 100) {
    return Random.number(0, maximum) <= probability;
  }

  /**
   * @template T
   * The function `uniqueValues` generates an array of unique values from a
   * given array with a specified length.
   * @param {number} lenght - The `lenght` parameter represents the desired
   * length of the output array containing unique values.
   * @param {T[]} values - The `values` parameter in the `uniqueValues` function
   * represents an array of elements of type `T`. These elements are used to
   * generate a new array containing unique values up to a specified length.
   * @returns {T[]} The `uniqueValues` function returns an array of unique values from
   * the `values` array parameter. If the length of the `values` array is less
   * than or equal to the specified `length` parameter, the function simply
   * returns the `values` array as is. Otherwise, it creates a `Set` to store
   * unique values and keeps adding random items from the `values` array until
   * the set
   */
  static uniqueValues(lenght, values) {
    if (values.length <= lenght) {
      return values;
    }

    const result = new Set();

    while (result.size <= lenght) {
      result.add(Random.arrayItem(values));
    }

    return Array.from(result);
  }

  /**
   * @template T
   * This function generates a set of unique values from an array with an option to
   * sort them and control the maximum number of repetitions.
   * @param {T[]} array - The `array` parameter in the `uniqueValuesFromArray` function is
   * an array from which unique values will be selected.
   * @param {(a: T, b: T) => number} sort - The `sort` parameter in the `uniqueValuesFromArray` function is a
   * function that defines the sort order of the unique values in the resulting
   * array. If a `sort` function is provided, the unique values will be sorted based
   * on the criteria specified in that function. If no `sort` function
   * @param [randomMaxRepetitions=1] - The `randomMaxRepetitions` parameter in the
   * `uniqueValuesFromArray` function determines the maximum number of times a random
   * element from the input `array` will be added to the `Set`. This parameter allows
   * you to control the variability in the number of unique values returned by the
   * function.
   * @returns {T[]} The method `uniqueValuesFromArray` returns an array containing unique
   * values from the input `array`, with an optional sorting based on the `sort`
   * function provided.
   */
  static uniqueValuesFromArray(array, sort, randomMaxRepetitions = 1) {
    const repetitions = Random.number(1, randomMaxRepetitions);
    const set = new Set();
    for (let i = 0; i < repetitions; i++) {
      set.add(array[Random.number(0, array.length - 1)]);
    }
    return sort ? Array.from(set).sort(sort) : Array.from(set);
  }
}

module.exports.Random = Random;
