import path from 'path';
import { formatBytes } from './file-size';

export class SettingsValidator {
  /**
   * Create a function that is a composition of the input validations
   * @param functions SettingsValidator functions to compose
   * @returns composed validation
   */
  static compose(...functions) {
    return function composedValidation(value) {
      for (const fn of functions) {
        const result = fn(value);
        if (typeof result === 'string' && result.length > 0) {
          return result;
        };
      };
    };
  };

  /**
   * Check the value is a string
   * @param value
   * @returns
   */
  static isString(value: unknown): string | undefined {
    return typeof value === 'string' ? undefined : "Value is not a string.";
  };

  /**
   * Check the string has no spaces
   * @param value
   * @returns
   */
  static hasNoSpaces(value: string): string | undefined {
    return /^\S*$/.test(value) ? undefined : "No whitespaces allowed.";
  };

  /**
   * Check the string has no empty
   * @param value
   * @returns
   */
  static isNotEmptyString(value: string): string | undefined {
    if (typeof value === 'string') {
      if (value.length === 0) {
        return "Value can not be empty."
      } else {
        return undefined;
      }
    };
  };

  /**
   * Check the number of string lines is limited
   * @param options
   * @returns
   */
  static multipleLinesString(options: { minRows?: number, maxRows?: number, maxLength?: number } = {}) {
    return function (value: number) {
      const lines = value.split(/\r\n|\r|\n/).length;
      if (typeof options.maxLength !== 'undefined' && value.split('\n').some(line => line.length > options.maxLength)) {
        return `The maximum length of a line is ${options.maxLength} characters.`;
      };
      if (typeof options.minRows !== 'undefined' && lines < options.minRows) {
        return `The string should have more or ${options.minRows} line/s.`;
      };
      if (typeof options.maxRows !== 'undefined' && lines > options.maxRows) {
        return `The string should have less or equal to ${options.maxRows} line/s.`;
      };
    }
  };

  /**
   * Creates a function that checks the string does not contain some characters
   * @param invalidCharacters
   * @returns
   */
  static hasNotInvalidCharacters(...invalidCharacters: string[]) {
    return function (value: string): string | undefined {
      return invalidCharacters.some(invalidCharacter => value.includes(invalidCharacter))
        ? `It can't contain invalid characters: ${invalidCharacters.join(', ')}.`
        : undefined;
    };
  };

  /**
   * Creates a function that checks the string does not start with a substring
   * @param invalidStartingCharacters
   * @returns
   */
  static noStartsWithString(...invalidStartingCharacters: string[]) {
    return function (value: string): string | undefined {
      return invalidStartingCharacters.some(invalidStartingCharacter => value.startsWith(invalidStartingCharacter))
        ? `It can't start with: ${invalidStartingCharacters.join(', ')}.`
        : undefined;
    };
  };

  /**
   * Creates a function that checks the string is not equals to some values
   * @param invalidLiterals
   * @returns
   */
  static noLiteralString(...invalidLiterals: string[]) {
    return function (value: string): string | undefined {
      return invalidLiterals.some(invalidLiteral => value === invalidLiteral)
        ? `It can't be: ${invalidLiterals.join(', ')}.`
        : undefined;
    };
  };

  /**
   * Check the value is a boolean
   * @param value
   * @returns
   */
  static isBoolean(value: string): string | undefined {
    return typeof value === 'boolean'
      ? undefined
      : "It should be a boolean. Allowed values: true or false.";
  };

  /**
   * Check the value is a number between some optional limits
   * @param options
   * @returns
   */
  static number(options: { min?: number, max?: number, integer?: boolean } = {}) {
    return function (value: number) {
      if (options.integer
        && (
          (typeof value === 'string' ? ['.', ','].some(character => value.includes(character)) : false)
          || !Number.isInteger(Number(value))
        )
      ) {
        return 'Number should be an integer.'
      };

      const valueNumber = typeof value === 'string' ? Number(value) : value;

      if (typeof options.min !== 'undefined' && valueNumber < options.min) {
        return `Value should be greater or equal than ${options.min}.`;
      };
      if (typeof options.max !== 'undefined' && valueNumber > options.max) {
        return `Value should be lower or equal than ${options.max}.`;
      };
    };
  };

  /**
   * Creates a function that checks if the value is a json
   * @param validateParsed Optional parameter to validate the parsed object
   * @returns
   */
  static json(validateParsed: (object: any) => string | undefined) {
    return function (value: string) {
      let jsonObject;
      // Try to parse the string as JSON
      try {
        jsonObject = JSON.parse(value);
      } catch (error) {
        return "Value can't be parsed. There is some error.";
      };

      return validateParsed ? validateParsed(jsonObject) : undefined;
    };
  };

  /**
   * Creates a function that checks is the value is an array and optionally validates each element
   * @param validationElement Optional function to validate each element of the array
   * @returns
   */
  static array(validationElement: (json: any) => string | undefined) {
    return function (value: unknown[]) {
      // Check the JSON is an array
      if (!Array.isArray(value)) {
        return 'Value is not a valid list.';
      };

      return validationElement
        ? value.reduce((accum, elementValue) => {
          if (accum) {
            return accum;
          };

          const resultValidationElement = validationElement(elementValue);
          if (resultValidationElement) {
            return resultValidationElement;
          };

          return accum;
        }, undefined)
        : undefined;
    };
  };

  /**
   * Creates a function that checks if the value is equal to list of values
   * @param literals Array of values to compare
   * @returns
   */
  static literal(literals: unknown[]) {
    return function (value: any): string | undefined {
      return literals.includes(value) ? undefined : `Invalid value. Allowed values: ${literals.map(String).join(', ')}.`;
    };
  };

  // FilePicker
  static filePickerSupportedExtensions = (extensions: string[]) => (options: { name: string }) => {
    if (typeof options === 'undefined' || typeof options.name === 'undefined') {
      return;
    }
    if (!extensions.includes(path.extname(options.name))) {
      return `File extension is invalid. Allowed file extensions: ${extensions.join(', ')}.`;
    };
  };

  /**
   * filePickerFileSize
   * @param options
   */
  static filePickerFileSize = (options: { maxBytes?: number, minBytes?: number, meaningfulUnit?: boolean }) => (value: { size: number }) => {
    if (typeof value === 'undefined' || typeof value.size === 'undefined') {
      return;
    };
    if (typeof options.minBytes !== 'undefined' && value.size <= options.minBytes) {
      return `File size should be greater or equal than ${options.meaningfulUnit ? formatBytes(options.minBytes) : `${options.minBytes} bytes`}.`;
    };
    if (typeof options.maxBytes !== 'undefined' && value.size >= options.maxBytes) {
      return `File size should be lower or equal than ${options.meaningfulUnit ? formatBytes(options.maxBytes) : `${options.maxBytes} bytes`}.`;
    };
  };
};
