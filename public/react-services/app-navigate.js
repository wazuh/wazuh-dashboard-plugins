/*
 * Wazuh app - APP state service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import Cookies from '../utils/js-cookie';
import store from '../redux/store';
import {} from '../redux/actions/appStateActions';
import { getIndexPattern } from '../components/overview/mitre/lib';
import { esFilters } from '../../../../src/plugins/data/common';
import rison from 'rison-node';


export class AppNavigate {


  static getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  static buildFilter_w(filters, indexPattern){
    const filtersArray = [];
      Object.keys(filters).forEach(currentFilter => {
        filtersArray.push(
          {
            ...esFilters.buildPhraseFilter({ name: currentFilter, type: 'text' }, filters[currentFilter], indexPattern),
            "$state": { "isImplicit": false, "store": "appState" },
          }
        )
      });
    return rison.encode({ filters: filtersArray});
  }

  static navigateToModule(e, section, params) {
    e.persist(); // needed to access this event asynchronously
    getIndexPattern().then(indexPattern => {
      const urlParams = {};

      if(Object.keys(params).length){
        Object.keys(params).forEach(key => {
          if(key === "filters"){ 
            urlParams["_w"] = this.buildFilter_w(params[key], indexPattern);
          }else{
            urlParams[key] = params[key];
          }
        })
      }
      const url = Object.entries(urlParams).map(e => e.join('=')).join('&');
      const currentUrl = window.location.href.split("#/")[0];
      const newUrl = currentUrl+ `#/${section}?` + url;

      if (e && (e.which == 2 || e.button == 1 )) { // middlebutton clicked
        var win = window.open(newUrl, '_blank');
      }else if(e.button == 0){ // left button clicked
        window.location.href = newUrl;
      }
    })
  }
}
