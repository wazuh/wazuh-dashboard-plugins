class NumberFormatter {
  /**
   * The function `pads` pads a number with zeros to a specified length.
   * @param {number} number - The `number` parameter is a number that you want
   * to format as a string with leading zeros.
   * @param [zeros=0] - The `zeros` parameter in the `number` function specifies
   * the number of zeros to add before the `number` parameter. If `zeros` is
   * provided, the function pads the `number` with zeros to ensure it has at
   * least that many digits.
   * @returns {string} The `number` function is returning a string with the input number
   * padded with zeros to the left based on the `zeros` parameter.
   */
  static pads(number, zeros = 0) {
    return ('0'.repeat(zeros) + `${number}`).slice(-zeros);
  }
}

module.exports.NumberFormatter = NumberFormatter;
