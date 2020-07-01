/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  field: string
  operator?: IOperator
  value?: string 
  conjuntion?: IConjuntions
}

export class QInterpreter {
  query: string;
  queryObjects: queryObject[];
  conjuntions = / and | AND | or | OR /;
  operators = /=|!=|<|>|~/;

  constructor(query:string) {
    this.query = query;
    this.queryObjects = this.descomposeQuery(query);
  }

  private descomposeQuery (query:string):queryObject[] {
    const descomposeRegex = new RegExp("((?<conjuntion>and |or )?(?<field>[\\w\\.\\-]+)?(?<operator>=|!=|<|>|~)?(?<value>[\\[\\]\\{\\}\\\\\\w\\.\\-\\:\\%\\/\\s]+)?)","i");
    const getQueryObjects = (query, queries=[]):queryObject[] => {
      const firstConjuntion = / and | or /i.exec(query);
      const currentQ = !!firstConjuntion ? query.slice(0,firstConjuntion.index) : query;
      currentQ && queries.push(descomposeRegex.exec(currentQ).groups);
      if (firstConjuntion) return getQueryObjects(query.slice(firstConjuntion.index+1), queries);
      return !!queries.length ? queries : [{field:''}];
    };
    return getQueryObjects(query);
  }

  private appendConjuntions(queryObjects, query) {
    for (const qObject of queryObjects) {
      const propertyLength = (property) => {return (qObject[property]) ? qObject[property].length : 0 };
      const conjuntion = query[0];
      if(conjuntion.match(this.conjuntions)){
        qObject['conjuntion'] = conjuntion;
        query = query.slice(1);
      }
      const queryLenght = propertyLength('field') + propertyLength('operator') + propertyLength('value');
      query = query.slice(queryLenght)
    }
  }

  private parseQueryObject(item:string):queryObject {
    const operator = item.match(this.operators);
    if (operator === null) {
      return {
        field: item,
      };
    } else {
      const {0: field, 1: value} = item.split(this.operators);
      return {
        field,
        operator: operator[0],
        value
      }
    }
  }

  qNumber():number {
    return this.queryObjects.length
  }


  getQuery(index:number):queryObject {
    return this.queryObjects[index];
  }

  
  setlastQuery(newInput: string, field):queryObject {
    const lastQuery = {
      ...this.lastQuery(),
      [field]:newInput
    };
    
    this.queryObjects[this.qNumber()-1] = lastQuery;
    return lastQuery;
  }

  lastQuery():queryObject {
    const lastQuery = this.queryObjects.length -1
    return this.queryObjects[lastQuery];
  }

  addNewQuery(conjuntion:IConjuntions, field='', operator=false, value=false) {
    const newQuery: queryObject = {
      conjuntion,
      field
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

  deleteByIndex(index:number) {
    this.queryObjects = this.queryObjects.filter((f, i) => index !== i)
    if (this.queryObjects.length && this.queryObjects[0].conjuntion){
      delete this.queryObjects[0].conjuntion;  
    }
  } 

  cleanQuery() {
    this.query = '';
    this.queryObjects = [];
  }

  toString():string { 
    let query = '';
    for (const qObject of this.queryObjects) {
      const { conjuntion='', field, operator='', value=''} = qObject;
      query += (!!conjuntion ? ` ${conjuntion}` : '') + field + operator + value;
    }
    this.query = query;
    return query
  }
}
