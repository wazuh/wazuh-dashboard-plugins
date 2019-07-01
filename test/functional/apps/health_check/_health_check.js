import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common']);

  describe('Health check', function describeIndexTests() {

    it('complete test check and load overview', async ()=> {
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.common.waitUntilUrlIncludes('app/wazuh#/overview/');
      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/overview/');
    })
  })
}