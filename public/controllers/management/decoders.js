/*
 * Wazuh app - Ruleset controllers
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import * as FileSaver from '../../services/file-saver';

const colors = [
  '#004A65',
  '#00665F',
  '#BF4B45',
  '#BF9037',
  '#1D8C2E',
  'BB3ABF',
  '#00B1F1',
  '#00F2E2',
  '#7F322E',
  '#7F6025',
  '#104C19',
  '7C267F',
  '#0079A5',
  '#00A69B',
  '#FF645C',
  '#FFC04A',
  '#2ACC43',
  'F94DFF',
  '#0082B2',
  '#00B3A7',
  '#401917',
  '#403012',
  '#2DD947',
  '3E1340',
  '#00668B',
  '#008C83',
  '#E55A53',
  '#E5AD43',
  '#25B23B',
  'E045E5'
];

const app = uiModules.get('app/wazuh', []);

class DecodersController {
  constructor(
    $scope,
    $sce,
    errorHandler,
    appState,
    csvReq,
    wzTableFilter
  ) {
    this.$scope = $scope;
    this.$sce = $sce;
    this.errorHandler = errorHandler;
    this.appState = appState;
    this.csvReq = csvReq;
    this.wzTableFilter = wzTableFilter;
  }

  $onInit() {
    this.appliedFilters = [];

    //Initialization
    this.searchTerm = '';
    this.viewingDetail = false;
    this.typeFilter = 'all';
    this.isArray = Array.isArray;
    
    // Reloading event listener
    this.$scope.$on('rulesetIsReloaded', () => {
      this.viewingDetail = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    });

    this.$scope.$on('wazuhShowDecoder', (event, parameters) => {
      this.currentDecoder = parameters.decoder;
      this.viewingDetail = true;
      if (!this.$scope.$$phase) this.$scope.$digest();
    });
  }

  includesFilter(filterName) {
    return this.appliedFilters.map(item => item.name).includes(filterName);
  }

  getFilter(filterName) {
    const filtered = this.appliedFilters.filter(
      item => item.name === filterName
    );
    return filtered.length ? filtered[0].value : '';
  }

  removeFilter(filterName) {
    this.appliedFilters = this.appliedFilters.filter(
      item => item.name !== filterName
    );
    return this.$scope.$broadcast('wazuhRemoveFilter', { filterName });
  }

  colorRegex(regex) {
    regex = regex.toString();
    let valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gim);
    let coloredString = regex;
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      coloredString = coloredString.replace(
        /\(((?!<\/span>).)*?\)(?!<\/span>)/im,
        '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>'
      );
    }
    return this.$sce.trustAsHtml(coloredString);
  }

  colorOrder(order) {
    order = order.toString();
    let valuesArray = order.split(',');
    let coloredString = order;
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      coloredString = coloredString.replace(
        valuesArray[i],
        '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>'
      );
    }
    return this.$sce.trustAsHtml(coloredString);
  }

  search(term) {
    if (term && term.startsWith('path:') && term.split('path:')[1].trim()) {
      this.custom_search = '';
      const filter = { name: 'path', value: term.split('path:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'path'
      );
      this.appliedFilters.push(filter);
      this.$scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('file:') &&
      term.split('file:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'file', value: term.split('file:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'file'
      );
      this.appliedFilters.push(filter);
      this.$scope.$broadcast('wazuhFilter', { filter });
    } else {
      this.$scope.$broadcast('wazuhSearch', { term, removeFilters: true });
    }
  }

  onlyParents(typeFilter) {
    this.appliedFilters = [];
    if (typeFilter === 'all')
      this.$scope.$broadcast('wazuhUpdateInstancePath', { path: '/decoders' });
    else
      this.$scope.$broadcast('wazuhUpdateInstancePath', {
        path: '/decoders/parents'
      });
  }

  async downloadCsv() {
    try {
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        '/decoders',
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'decoders.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
   * This function takes back to the list but adding a filter from the detail view
   */
  addDetailFilter(name, value) {
    this.appliedFilters.push({ name, value });
    // Clear the autocomplete component
    this.searchTerm = '';
    // Go back to the list
    this.closeDetailView();
  }

  /**
   * This function changes to the decoders list view
   */
  closeDetailView(clear) {
    if (clear)
      this.appliedFilters = this.appliedFilters.slice(
        0,
        this.appliedFilters.length - 1
      );
    this.viewingDetail = false;
    this.currentDecoder = false;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }
}

app.controller('decodersController', DecodersController);
