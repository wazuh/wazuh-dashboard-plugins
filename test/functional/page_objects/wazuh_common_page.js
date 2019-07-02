export function WazuhCommonProvider({ getService, getPageObjects }) {
  const log = getService('log');
  const PageObjects = getPageObjects(['common']);
  const testSubjects = getService('testSubjects');
  const appsMenu = getService('appsMenu');

  class WazuhCommonPage {
    async OpenSecurityEvents () {
      log.debug('Open Security events')
      await PageObjects.common.navigateToApp('settings');
      await appsMenu.clickLink('Wazuh');
      await testSubjects.click('overviewWelcomeGeneral');
    }
  }
  return new WazuhCommonPage;
}