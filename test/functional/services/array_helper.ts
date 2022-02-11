/*
 * Wazuh app - Service to short array of objects
 * with visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */


export function ArrayHelperProvider( ) {

  class ArrayHelper {

    compareObjects(vizValues: object[], esValues: object[]): Boolean{
      let result = false;
      for (const value of vizValues) {
        for (const esValue of esValues) {
          if (JSON.stringify(value) === JSON.stringify(esValue)) {
            result = true;
            break;
          }
        }
        if(!result){
          break
        }
      }
      return result;
    }


    static dynamicSort(property: any) {
      let sortOrder = 1;
      if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function (a,b) {
        const convertIsNumber = (value) => {return (isNaN(Number(value))) ? value : Number(value);}
        const aPropery = convertIsNumber(a[property]);
        const bPropery = convertIsNumber(b[property]);
        const result = (aPropery < bPropery) ? -1 : (aPropery > bPropery) ? 1 : 0;
        return result * sortOrder;
      }
    }

    dynamicSortMultiple(props) {
      return function (obj1, obj2) {
        let i = 0;
        let result = 0;
        const numberOfProperties = props.length;
        
        while(result === 0 && i < numberOfProperties) {
            result = ArrayHelper.dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
      }
    }

    sortData (data, orderField) {
      const sortData = data.sort(this.dynamicSortMultiple(orderField));
      return sortData;
    }

  }
  return new ArrayHelper();
}
