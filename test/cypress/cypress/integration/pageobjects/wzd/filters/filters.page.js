export const FILTERS_PAGE = {
  addFilterButton: '[data-test-subj="addFilter"]',
  filterSuggestionList: '[data-test-subj="filterFieldSuggestionList"]',
  filterOperatorList: '.euiFormRow__fieldWrapper [data-test-subj="filterOperatorList"] div div button.euiFormControlLayoutCustomIcon',
  filterParams: '[data-test-subj="filterParams"] .euiFieldNumber',
  saveFilterButton: '[data-test-subj="saveFilter"]',
  stablishedFilter: '[data-test-subj="filter filter-enabled filter-key-rule.level filter-value-7 filter-unpinned "]',
  pinFilterAction: '[data-test-subj="pinFilter"]',
  selectedOperator: '.euiPanel[data-test-subj="comboBoxOptionsList filterOperatorList-optionsList"] .euiComboBoxOptionsList__rowWrap button.euiFilterSelectItem[title="is"]',
  pinnedFilter: '[data-test-subj="filter filter-enabled filter-key-rule.level filter-value-7 filter-pinned "]',
  eventsButton: '//*[contains(@class,"euiTabs")]//*[contains(text(),"Events")]',
  removeFilterButton: '//*[contains(@class,"euiContextMenuPanel")]//*[contains(text(),"Delete")]',
  operatorList: '.euiPanel[data-test-subj="comboBoxOptionsList filterOperatorList-optionsList"] .euiComboBoxOptionsList__rowWrap'
};
