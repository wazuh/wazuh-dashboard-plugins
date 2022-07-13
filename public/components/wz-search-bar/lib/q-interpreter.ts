/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export type IConjuntions = ' and ' | ' or ' | ' AND ' | ' OR ';
export type IOperator = '=' | '!=' | '<' | '>' | '~';
export interface queryObject {
  field: string;
  operator?: IOperator;
  value?: string;
  conjuntion?: IConjuntions;
}
export class QInterpreter {
  query: string;
  queryObjects: queryObject[];
  conjuntions = / and | or |^and |^or | and$| or$/gi;
  operators = /=|!=|<|>|~/;

  constructor(query: string) {
    this.query = query;
    this.queryObjects = this.descomposeQuery(query);
  }

  /**
   * Receives a query string and return a boolean indicating if the conjuntion (AND | OR) is valid.
   * A conjuntion is valid when is followed by a field and an operator.
   *
   * @param index: number - index of position of the conjuntion in the query string
   * @param query: string - the entire query string
   * @returns boolean
   */
  private isValidConjuntion(index, query) {
    // if conjuntion is placed at the end of the query, it is valid
    if (index === query.length) return true;
    // get the string after the conjuntion
    const currentQuery = query.slice(index, query.length);
    // get next operator
    const nextOperator = /=|!=|<|>|~/.exec(currentQuery);
    if (!nextOperator) return false;
    // cut the string to get the content between the operator and the conjuntion
    const AllBeforeNextOperator = nextOperator.input.slice(0, nextOperator.index);
    // is valid conjuntion when dont have whitespace and is a field
    const dontHaveWhitespace = /\s/.exec(AllBeforeNextOperator) === null;
    const isField = /[\w\.\-]+/.exec(AllBeforeNextOperator) !== null;
    return dontHaveWhitespace && isField;
  }

  /**
   * Parse the query string to queryObject. Receive a string with conjuntion, field, operator and value and return a query with queryObject format.
   * The parsing is done by regexp.
   * @param query: string
   * @returns queryObject
   */
  getQueryObject(query): queryObject {
    const descomposeRegex = new RegExp(
      '((?<conjuntion>and |or |^and$|^or$| and$| or$| and | or )?(?<field>[\\w\\.\\-]+)?(?<operator>=|!=|<|>|~)?(?<value>[\\[\\]\\(\\)\\{\\}\\\\\\w\\.\\-\\:\\%\\/\\s]+)?)',
      'i'
    );
    const queryWithoutSpaces = query;
    const descomposeQuery = query && descomposeRegex.exec(queryWithoutSpaces);
    let { conjuntion = undefined, field = '', operator = undefined, value = undefined } =
      descomposeQuery.groups || [];
    // maybe remove wrapper spaces from conjuntion, field, operator and value
    return { conjuntion, field, operator, value } as queryObject;
  }

  /**
   *  Loop through the query string and seek for conjuntions. Then divide the query string for each conjuntion.
   *  Finally transform all elements to queryObjects and return it.
   * @param query: string
   * @returns queryObject[]
   */
  private descomposeQuery(query: string): queryObject[] {
    let resultQuery;
    let queries: queryObject[] = [];
    // search query for conjuntions one by one, validating if is a valid conjuntion
    while ((resultQuery = this.conjuntions.exec(query))) {
      if (this.isValidConjuntion(this.conjuntions.lastIndex, resultQuery.input)) {
        // if is a valid conjuntion, get the query fragment and parse it to query object
        const currentQuery = query.slice(0, this.conjuntions.lastIndex - resultQuery[0].length);
        if (currentQuery.length > 0 || currentQuery === '') {
          queries.push(this.getQueryObject(currentQuery) as queryObject);
        }
        // finally cut the current query to continue the search
        query = query.slice(this.conjuntions.lastIndex - resultQuery[0].length);
      }
    }

    // if exists a query without conjuntion, add it to the array
    if (query) {
      queries.push(this.getQueryObject(query) as queryObject);
    }

    return queries;
  }

  /**
   * Parse all queries to string remplacing the conjuntions with ; or ,
   * @returns string - the query string
   */
  queriesToString(): string | null {
    if (!this.queriesAreValid) return null;
    const oQueries = this.queryObjects
      .map((q: queryObject) => {
        return `${QInterpreter.translateConjuntion(q.conjuntion)}${q.field}${q.operator}${q.value}`;
      })
      .join('');
    return oQueries;
  }

  /**
   * Translate the conjuntion received to ; or ,
   * @param conjuntion
   * @returns string
   */
  static translateConjuntion(conjuntion) {
    if (/and/i.test(conjuntion)) {
      return ';';
    }
    if (/or/i.test(conjuntion)) {
      return ',';
    }
    return '';
  }

  /***
   * Define if all query objects are complete and valid.
   * A query object is valid when have a value defined.
   */
  get queriesAreValid(): boolean {
    if (this.queryObjects.length === 0) return true;
    return !this.queryObjects.some((q) => !q.value);
  }

  qNumber(): number {
    return this.queryObjects.length;
  }

  getQuery(index: number): queryObject {
    return this.queryObjects[index];
  }

  setlastQuery(newInput: string, field): queryObject {
    const lastQuery = {
      ...this.lastQuery(),
      [field]: newInput,
    };

    const qIndex = Math.max(0, this.qNumber() - 1);
    this.queryObjects[qIndex] = lastQuery;
    return lastQuery;
  }

  lastQuery(): queryObject {
    const lastQuery = this.queryObjects.length - 1;
    return this.queryObjects[lastQuery];
  }

  addNewQuery(conjuntion: IConjuntions, field = '', operator = false, value = false) {
    const newQuery: queryObject = {
      conjuntion,
      field,
    };
    if (operator !== false) {
      // @ts-ignore
      newQuery['operator'] = operator;
    }
    if (value !== false) {
      // @ts-ignore
      newQuery['value'] = value;
    }
    this.queryObjects.push(newQuery);
  }

  editByIndex(index: number, newQuery: queryObject) {
    this.queryObjects[index] = newQuery;
  }

  deleteByIndex(index: number) {
    this.queryObjects = this.queryObjects.filter((f, i) => index !== i);
    if (this.queryObjects.length && this.queryObjects[0].conjuntion) {
      delete this.queryObjects[0].conjuntion;
    }
  }

  cleanQuery() {
    this.query = '';
    this.queryObjects = [];
  }

  toString(): string {
    let query = '';
    for (const qObject of this.queryObjects) {
      const { conjuntion = '', field, operator = '', value = '' } = qObject;
      query += (!!conjuntion ? `${conjuntion}` : '') + field + operator + value;
    }
    this.query = query;
    return query;
  }
}
