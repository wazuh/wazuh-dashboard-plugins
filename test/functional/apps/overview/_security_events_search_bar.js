import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const filterBar = getService('filterBar');
  const queryBar = getService('queryBar');
  const find = getService('find');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', 'toasts']);
  const testSubjects = getService('testSubjects');

  describe('search bar', () => {

    before(async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      await PageObjects.common.sleep(1000);
      const startDate = '2019-07-02 08:00:00.000';
      const endDate = '2019-07-02 10:00:00.000';
      await testSubjects.click('superDatePickerShowDatesButton');
      await PageObjects.timePicker.setAbsoluteRange(startDate, endDate);
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
}
