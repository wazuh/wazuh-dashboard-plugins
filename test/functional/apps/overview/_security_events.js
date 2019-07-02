import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker']);
  const testSubjects = getService('testSubjects');
  const log = getService('log');

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

    
  });
}