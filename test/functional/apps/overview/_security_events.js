import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const filterBar = getService('filterBar');
  const queryBar = getService('queryBar');
  const find = getService('find');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', 'toasts']);
  const testSubjects = getService('testSubjects');


  describe('Security events', function describeIndexTests() {
    before(async function () {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      await PageObjects.common.sleep(1000);
      const startDate = '2019-07-02 08:00:00.000';
      const endDate = '2019-07-02 10:00:00.000';
      await testSubjects.click('superDatePickerShowDatesButton');
      await PageObjects.timePicker.setAbsoluteRange(startDate, endDate);
    });

    it('complete test check and load overview', async () => {
      expect(await browser.getCurrentUrl()).to.contain('tab=general');
    });

    it('when change date, total alerts should be 21', async () => {
      await PageObjects.common.sleep(1000);
      expect(await testSubjects.getVisibleText('alertStatsTotal')).to.equal('Total\n21');
    });

    it('should level 12 alerts be 0', async () => {
      expect(await testSubjects.getVisibleText('alertStatsLevel12OrAboveAlerts')).to.equal('Level 12 or above alerts\n0');
    });

    it('should authentication failure alerts be 0', async () => {
      expect(await testSubjects.getVisibleText('alertStatsAuthenticationFailure')).to.equal('Authentication failure\n0');
    });

    it('should authentication success alerts be 0', async () => {
      expect(await testSubjects.getVisibleText('alertStatsAuthenticationSuccess')).to.equal('Authentication success\n7');
    });

    it('should not toasts should appear of type danger', async () => {
      expect(await PageObjects.toasts.anyTypeToasts('danger')).to.not.be.ok();
    });

    it('There should be no toast with the message: Error in visualization.', async () => {
      expect(await PageObjects.toasts.findMessageInToasts('Error in visualization')).to.not.be.ok();
    });

    it('empty visualizations should not be shown', async () => {
      const visualizations = await find.allByCssSelector('div.visLib__chart');
      for (const visualization of visualizations) {
        const result = await visualization.parseDomContent(); 
        expect(result.html() != '').to.be.ok();        
      }
    });

    describe('Activate a filter', function describeIndexTests () {
      this.tags('smoke');

      before(async () => {
        await filterBar.addFilter('agent.name', 'is', 'master');
      });

      it('the filter should be working', async () => {
        expect(await filterBar.getFilterCount()).to.be.greaterThan(0);
      });

      it('The filter should be still working and appear as a chip in Discover', async () => {
        await testSubjects.click('overviewDiscoverButton');
        PageObjects.common.sleep(500);
        expect(await filterBar.getFilterCount()).to.be.greaterThan(0);
      });

      it('go back to Dashboard and remove the filter. The visualizations should reload properly after deleting the filter', async () => {
        await testSubjects.click('overviewDiscoverButton');
        await PageObjects.common.sleep(500);
        await filterBar.removeAllFilters();
        expect(await filterBar.getFilterCount()).to.equal(0);
      });

      it('Press F5 to reload the page. The filters should not keep applied unless they are pinned', async () => {
        await browser.refresh();
        expect(await filterBar.getFilterCount()).to.equal(0);
      });

      it('add and pinned filter', async () => {
        await filterBar.addFilter('agent.name', 'is', 'master');
        await filterBar.toggleFilterPinned('agent.name');
        expect(await filterBar.getFilterCount()).to.be.greaterThan(0);
      });

      it('Click several times the app buttons and tabs while you are on the same tab, filters should persist and not disappear', async () => {
        await testSubjects.click('overviewDiscoverButton');
        expect(await filterBar.getFilterCount()).to.be.greaterThan(0);
        await testSubjects.click('overviewDiscoverButton');
        expect(await filterBar.getFilterCount()).to.be.greaterThan(0);
      });
    
    });

    describe('click Overview/Agent -> Discover subtab: ', () => {
      this.tags('smoke');
    
      it('should appear selected the wazuh-alerts-3.x index pattern only', async () => {
        await testSubjects.click('overviewDiscoverButton');
        await PageObjects.common.waitUntilUrlIncludes('tabView=discover');

        const selectedIndex = await find.byCssSelector('#index_pattern_id');
        expect(await selectedIndex.getVisibleText()).to.equal('wazuh-alerts-3.x-*');
      });

      describe('Click on a rule ID on the Discover tab: ', () => {

        before(async () => {
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

    });

    describe('search bar', () => {
      before(async () => {
        await testSubjects.click('overviewDiscoverButton');
      });

      it('search something on the search bar', async () => {
        await queryBar.setQuery('rule.level:7');
        await queryBar.submitQuery();
        await PageObjects.common.sleep(750);
        expect(await queryBar.getQueryString()).to.equal('rule.level:7');
      });

      it('total alerts should be 3', async () => {
        expect(await testSubjects.getVisibleText('alertStatsTotal')).to.equal('Total\n3');
      });

      it('delete the content of the search bar', async () => {
        await queryBar.setQuery('');
        await queryBar.submitQuery();
        await PageObjects.common.sleep(750);
        expect(await queryBar.getQueryString()).to.equal('');
      });

      it('total alerts should be 21 again', async () => {
        expect(await testSubjects.getVisibleText('alertStatsTotal')).to.equal('Total\n21');
        await PageObjects.common.sleep(10000);
      });

    });

  });
}