export function WazuhCommonProvider({ getService, getPageObjects }) {
  const appsMenu = getService('appsMenu');
  const log = getService('log');
  const PageObjects = getPageObjects(['common']);
  const testSubjects = getService('testSubjects');

  /**
   * Special functions needed in the tests.
   *
   * @class WazuhCommonPage
   */
  class WazuhCommonPage {
    
    /**
     * Navigate to `Security events` without the timestamp parameter in the URL
     *
     * @memberof WazuhCommonPage
     */
    async OpenSecurityEvents () {
      log.debug('Open Security events')
      await PageObjects.common.navigateToApp('settings');
      await appsMenu.clickLink('Wazuh');
      await appsMenu.clickLink('Wazuh');
      await testSubjects.click('overviewWelcomeGeneral');
    }
  }
  return new WazuhCommonPage;
}