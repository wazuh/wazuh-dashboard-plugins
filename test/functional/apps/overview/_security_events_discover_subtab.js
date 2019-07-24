import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const find = getService('find');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker']);
  const testSubjects = getService('testSubjects');
  
  describe('Discover subtab', () => {
  
    before(async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      await PageObjects.common.sleep(1000);
      const startDate = '2019-07-02 08:00:00.000';
      const endDate = '2019-07-02 10:00:00.000';
      await testSubjects.click('superDatePickerShowDatesButton');
      await PageObjects.timePicker.setAbsoluteRange(startDate, endDate);
      await testSubjects.click('overviewDiscoverButton');
    });

    it('should appear selected the wazuh-alerts-3.x index pattern only', async () => {
      await PageObjects.common.waitUntilUrlIncludes('tabView=discover');

      const selectedIndex = await find.byCssSelector('#index_pattern_id');
      expect(await selectedIndex.getVisibleText()).to.equal('wazuh-alerts-3.x-*');
    });

    it('Click on a rule ID on the Discover tab: ', async () => {
      await find.clickByCssSelector('li[attr-field="id"]');
    });

    it('It should have the class `active`', async () => {
      const idRule = await find.byCssSelector('li[attr-field="id"]');
      expect(await idRule.getAttribute('class')).to.contain('active');
    });
    
    it('It should open the Ruleset detail tab for that rule ID', async () => {
      const idRule = await find.byCssSelector('li[attr-field="id"]');
      try {
        const text = await idRule.findByCssSelector('div.dscFieldDetails');

        expect(await text.getVisibleText()).to.match(/Top \d+ values in \d+ \/ \d+ records/);
      } catch (error) {
        console.log("Error: " + error);
        expect(false).to.be.ok();
      }
    });

  });

}