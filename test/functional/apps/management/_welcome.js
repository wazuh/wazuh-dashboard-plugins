import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const find = getService('find');

  describe('welcome', () => {

    it('should have `Ruleset` link', async () => {
      const RulesetSelector = '#kibana-body > div > div > div > div.application.ng-scope.tab-manager > div > div.ng-scope.layout-align-start-stretch.layout-column > div > react-component > div > div > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(1) > button'
      const RulesetButton = await find.byCssSelector(RulesetSelector);
      expect(await RulesetButton.getVisibleText()).to.contain('Ruleset');
    });

  });
}