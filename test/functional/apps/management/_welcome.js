import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const PageObjects = getPageObjects([ 'common' ]);
  const testSubjects = getService('testSubjects');
  const find = getService('find');

  describe('welcome', () => {
    before(async function () {
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.common.waitUntilUrlIncludes('tab=welcome');
      await testSubjects.click('wzMenuManagement');
    });

    it('should have `Ruleset` link', async () => {
      const RulesetSelector = '#kibana-body > div > div > div > div.application.ng-scope.tab-manager > div > div.ng-scope.layout-align-start-stretch.layout-column > div > react-component > div > div > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(1) > button'
      const RulesetButton = await find.byCssSelector(RulesetSelector);
      expect(await RulesetButton.getVisibleText()).to.contain('Ruleset');
    });

  });
}