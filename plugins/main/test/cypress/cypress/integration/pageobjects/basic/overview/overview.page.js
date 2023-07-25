export const OVERVIEW_PAGE = {
  securityEvents: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Security events")]',
  integrityMonitoring: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Integrity monitoring")]',
  policyMonitoring: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Policy monitoring")]',
  systemAuditing: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"System auditing")]',
  securityInformationAssessment: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Security configuration assessment")]',
  vulnerabilities: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Vulnerabilities")]',
  mitre: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"MITRE ATT&CK")]',
  pciDSS: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"PCI DSS")]',
  nist: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"NIST")]',
  tsc: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"TSC")]',
  gdpr: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"GDPR")]',
  hipaa: '//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"HIPAA")]',
};
