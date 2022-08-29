export const DEPLOY_NEW_AGENT_PAGE = {
  closeButton: "//span[contains(text(),'Close')]",
  title: "[name='RegisterAgent'] h2",
  deployNewAgentSections: "[name='RegisterAgent'] .euiStep",

  operatingSystemSubTitle: "[name='RegisterAgent'] .euiStep:nth-child(1) p",
  redhatButton: '[data-text="Red Hat / CentOS"]',
  debianUbuntuButton: '[data-text="Debian / Ubuntu"]',
  windowsButton: '[data-text="Windows"]',
  macOSButton: '[data-text="MacOS"]',

  operationSystemTitle: "[name='RegisterAgent'] .euiStep:nth-child(1) .euiTitle",
  operationSystemOption: "[name='RegisterAgent'] .euiStep:nth-child(1) fieldset .euiButton__text",

  serverAddressSubTitle: "[name='RegisterAgent'] .euiStep:nth-child(2) :nth-child(1) p.euiStep__title",
  serverMessage: "[name='RegisterAgent'] .euiStep:nth-child(2) .euiStep__content p",
  serverInputField: "[name='RegisterAgent'] .euiStep:nth-child(2) [placeholder='Server address']",

  agentToGroupSubTitle: "[name='RegisterAgent'] .euiStep:nth-child(3) .euiTitle",
  agentToGroupMessage: "//*[@name='RegisterAgent']//*[3][contains(@class,'euiStep')]//*[contains(@class,'euiText')]/p", //cambiar a xpath
  agentToGroupSelector: "[name='RegisterAgent'] .euiStep:nth-child(3) [data-test-subj='comboBoxInput']",

  installAndEnrollAgentSubTitle: "[name='RegisterAgent'] .euiStep:nth-child(4) .euiTitle",
  installAndEnrollAgentDefaultLabel: "[name='RegisterAgent'] .euiStep:nth-child(4) .euiCallOutHeader__title",
  // after selected these OS options
  installAndEnrollAgentCommand: "[name='RegisterAgent'] .euiStep:nth-child(5) .euiCodeBlock__line",
  installAndEnrollAgentCopyButton: "[name='RegisterAgent'] .euiStep:nth-child(5) .copy-codeblock-wrapper .copy-overlay",

  startTheAgentTitle: "[name='RegisterAgent'] .euiStep:nth-child(6) p",
  startTheAgentTabsLabels: "[name='RegisterAgent'] .euiStep:nth-child(6) .euiStep__content .euiTabs button",
  systemmdTabButton: "[name='RegisterAgent'] .euiStep:nth-child(6) .euiStep__content .euiTabs button:nth-child(1)",
  sysVTabButton: "[name='RegisterAgent'] .euiStep:nth-child(6) .euiStep__content .euiTabs button:nth-child(2)",
  startTheAgentCommandText: "[name='RegisterAgent'] .euiStep:nth-child(6) .euiStep__content [role='tabpanel'] .euiText pre",
  startTheAgentcopyButton: "[name='RegisterAgent'] .euiStep:nth-child(6) .euiStep__content [role='tabpanel'] .euiText .copy-overlay",
};
