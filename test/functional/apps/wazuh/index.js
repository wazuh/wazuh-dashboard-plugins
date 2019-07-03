import expect from '@kbn/expect';
import { pageObjects } from '../../page_objects';


export default function ({ getService, getPageObjects }) {
  const appsMenu = getService('appsMenu');
  const PageObjects = getPageObjects(['common', 'home']);
  const testSubjects = getService('testSubjects');
  const find = getService('find');
  const log = getService('log');

  describe('Wazuh plugin', function describeIndexTests() {
    this.tags('smoke');

    it('should exist the app in the kibana menu', async ()=> {
      await PageObjects.common.navigateToApp('settings');
      expect(await appsMenu.linkExists('Wazuh')).to.be.ok();
    });

    it('should exist wazuh-alert index', async () => {
      await testSubjects.click('index_patterns');
      const table = await find.byCssSelector('div.euiBasicTable > div:nth-child(1) > table');
      expect(await table.getVisibleText()).to.contain('wazuh-alerts-3.x-*');
    });

    it('should exist wazuh-monitoring index', async () => {
      const table = await find.byCssSelector('div.euiBasicTable > div:nth-child(1) > table');
      expect(await table.getVisibleText()).to.contain('wazuh-alerts-3.x-*');
    });

    it('None of the index-patterns should be the default', async () => {
      const table = await find.byCssSelector('div.euiBasicTable > div:nth-child(1) > table');
      expect(await table.getVisibleText()).to.not.contain('Default');
    });
  });
}