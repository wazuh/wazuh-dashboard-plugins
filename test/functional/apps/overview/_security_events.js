import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const filterBar = getService('filterBar');
  const find = getService('find');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', 'toasts']);
  const testSubjects = getService('testSubjects');


  describe('security_events', () => {

    before(async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      await PageObjects.common.sleep(1000);
      const startDate = '2019-07-02 08:00:00.000';
      const endDate = '2019-07-02 10:00:00.000';
      await testSubjects.click('superDatePickerShowDatesButton');
      await PageObjects.timePicker.setAbsoluteRange(startDate, endDate);
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

    it('Activate a filter the filter should be working', async () => {
      await filterBar.addFilter('agent.name', 'is', 'master');
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
}