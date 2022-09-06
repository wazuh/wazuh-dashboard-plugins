export const RULES_PAGE = {
  rulesButtonSelector: '[class="euiSideNavItem euiSideNavItem--trunk"]',
  titleSelector: '[class="euiTitle euiTitle--medium"]',
  tableSelector: '[class="euiTableRow customRowClass euiTableRow-isClickable"]',
  dropdownPaginationSelector: '[data-test-subj="tablePaginationPopoverButton"]',
  listPagesSelector: 'nav[class="euiPagination"]',
  customRulesButtonSelector: '.euiButtonGroupButton.euiButtonGroupButton--text',
  firstCustomRule: '[data-test-subj="row-100001"]',
  xmlRuleFile:'.euiBasicTable .euiTable :nth-child(6) :nth-child(2) .euiToolTipAnchor',
  codeEditorSelector: '.euiFlexItem [data-test-subj="codeEditorContainer"]',
  backButtonSelector: '.euiFlexGroup .euiFlexItem .euiToolTipAnchor .euiButtonIcon',
  confirmModalSelector: '[data-test-subj="confirmModalTitleText"]',
  createNewRulesSelector: '.euiFlexGroup .euiFlexItem .euiButtonEmpty .euiButtonContent .euiButtonEmpty__text:contains("Add new rules file")',
  rulesTitleSelector:'.euiFlexItem .euiFlexGroup .euiFormControlLayout input.euiFieldText',
  saveRulesButtonSelector: '.euiFlexGroup .euiFlexItem button.euiButton span.euiButtonContent span.euiButton__text:contains("Save")',
  saveRulesMessage: '.euiText span:contains("Changes will not take effect until a restart is performed.")'
};
