export const DECODERS_PAGE = {
  titleSelector: '[class="euiTitle euiTitle--medium"]',
  tableSelector: '[class="euiTableRow customRowClass euiTableRow-isClickable"]',
  dropdownPaginationSelector: '[data-test-subj="tablePaginationPopoverButton"]',
  listPages: 'nav[class="euiPagination"]',
  customDecodersButtonSelector: '[data-test-subj="Custom decoders"]',
  manageDecodersFilesButtonSelector: ':nth-child(3) > .euiButtonEmpty > .euiButtonContent',
  editDecoderButtonSelector: '.euiTableCellContent > div > :nth-child(1) > .euiButtonIcon',
  saveDecoderButtonSelector: '.euiFlexItem--flexGrowZero > .euiButton > .euiButtonContent',
  messageConfirmSaveSelector: '.euiText > span',
  buttonRestartSelector: '.euiCallOut.euiCallOut--primary .euiButton.euiButton--primary',
  firstCustomDecoder: '[data-test-subj="row-local_decoder_example"]',
  xmlDecoderFile:':nth-child(4) .euiTableCellContent .euiToolTipAnchor .euiLink',
  codeEditorSelector: '[data-test-subj="codeEditorContainer"]',
  backButtonSelector: '.euiFlexGroup .euiFlexItem .euiToolTipAnchor .euiButtonIcon',
  confirmModalSelector: '[data-test-subj="confirmModalTitleText"]',
  createNewDecoderSelector:'.euiFlexGroup .euiFlexItem .euiButtonEmpty .euiButtonContent .euiButtonEmpty__text:contains("Add new decoders file")',
    // cy.contains('react-component[name="WzManagement"] button','Add new decoders file').should('exist').should('be.visible').click();
  decoderTitleSelector: '.euiFlexItem .euiFlexGroup .euiFormControlLayout input.euiFieldText',
  saveDecoderMessage: '.euiText span:contains("Changes will not take effect until a restart is performed.")'
};
