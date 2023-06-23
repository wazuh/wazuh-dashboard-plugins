export const FILTERS_PAGE = {
  addFilterButton: '[data-test-subj="addFilter"]',
  filterSuggestionList: '[data-test-subj="filterFieldSuggestionList"]',
  filterOperatorList: '[data-test-subj="filterOperatorList"] [data-test-subj="comboBoxToggleListButton"]',
  filterParams: '[data-test-subj="filterParams"]',
  saveFilterButton: '[data-test-subj="saveFilter"]',
  stablishedFilter: '[data-test-subj="filter filter-enabled filter-key-rule.level filter-value-7 filter-unpinned"',
  pinFilterAction: '[data-test-subj="pinFilter"]',
  selectedOperator: '.euiFilterSelectItem[title="is"]',
  pinnedFilter: '[data-test-subj="filter filter-enabled filter-key-rule.level filter-value-7 filter-pinned"]',
  eventsButton: '//*[contains(@class,"euiTabs")]//*[contains(text(),"Events")]',
  removeFilterButton: '//*[contains(@class,"euiContextMenuPanel")]//*[contains(text(),"Delete")]',
  operatorList: '.euiPanel[data-test-subj="comboBoxOptionsList filterOperatorList-optionsList"] .euiComboBoxOptionsList__rowWrap'
};
