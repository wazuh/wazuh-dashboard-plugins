
import expect from '@kbn/expect';


export default function ({ getService, getPageObjects }) {
  const log = getService('log');
  const PageObjects = getPageObjects(['common', 'home', 'api']);
  const testSubjects = getService('testSubjects');

  describe('api settings', function describeIndexTests() {
    this.tags('smoke');

    it('adding the first api', async ()=> {
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.api.completeApiForm();
      expect(await testSubjects.isDisplayed('wzMenuTheresAPI')).to.be.ok();
    });
  });
}