/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface queryObject {
  field: string
  operator?: string
  value?: string 
  conjuntion?: string 
}

export class QInterpreter {
  query: string;
  queryObjects: queryObject[];
  conjuntions = /,|;/;
  operators = /=|!=|<|>|~/;

  constructor(query:string) {
    this.query = query;
    this.queryObjects = this.descomposeQuery(query);
  }

  private descomposeQuery (query:string):queryObject[] {
    const queries:string[] = query.split(this.conjuntions);
    const queryObjects:queryObject[] = queries.map(this.parseQueryObject.bind(this));
    if (queryObjects.length > 1) {
      this.appendConjuntions(queryObjects, query);
    }
    return queryObjects
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


  getQuery():queryObject {return {
    field: 'string',
    operator: 'string',
    value: 'string'
  }}

  
  setlastQuery(newInput: string):queryObject {
    const lastQuery = this.queryObjects[this.qNumber()-1];
    const { operator=false, value= false } = lastQuery;
    if (value !== false) {
      lastQuery.value = newInput;
    } else if (operator !== false || newInput.match(this.operators)) {
      lastQuery.operator = newInput;
    } else {
      lastQuery.field = newInput
    }
    
    this.queryObjects[this.qNumber()-1] = lastQuery;
    return lastQuery;
  }

  lastQuery():queryObject {
    const lastQuery = this.queryObjects.length -1
    return this.queryObjects[lastQuery];
  }

  addNewQuery(conjuntion:string, field='', operator=false, value=false) {
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

  toString():string { 
    let query = '';
    for (const qObject of this.queryObjects) {
      query += qObject.conjuntion ? qObject.conjuntion : '';
      query += qObject.field;
      query += qObject.operator ? qObject.operator : '';
      query += qObject.value ? qObject.value : '';
    }
    this.query = query;
    return query
  }
}
