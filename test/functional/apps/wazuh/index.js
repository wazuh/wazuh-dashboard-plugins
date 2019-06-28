import expect from '@kbn/expect';


export default function ({ getService, getPageObjects }) {
  const appsMenu = getService('appsMenu');
  const PageObjects = getPageObjects(['common', 'home']);

  describe('Wazuh plugin', function describeIndexTests() {
    this.tags('smoke');

    it('check if exist in the kibana menu', async ()=> {
        await PageObjects.common.navigateToApp('settings');
        expect(await appsMenu.linkExists('Wazuh')).to.be.ok();
    });
  });
}