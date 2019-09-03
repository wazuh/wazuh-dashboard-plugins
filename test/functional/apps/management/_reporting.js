import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', 'toasts']);
  const testSubjects = getService('testSubjects');

  describe('reporting', () => {

    before(async () => {
        await testSubjects.click('managementWelcomeReporting');
    });

    it('should appear a card about "No items found"', async () => {
      const reportingTable = await testSubjects.find('reportingTable');
      const tbody = await reportingTable.findByCssSelector('table > tbody')
      expect(await tbody.getVisibleText()).to.equal('No items found');
    });

    // it('The `generate report` button should be disabled when there is no data', async () => {});

    it('should appear a toast when create a report', async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      await esArchiver.load('wazuh_alerts');      
      await PageObjects.common.sleep(1000);
      const startDate = '2019-07-02 08:00:00.000';
      const endDate = '2019-07-02 10:00:00.000';
      await testSubjects.click('superDatePickerShowDatesButton');
      await PageObjects.timePicker.setAbsoluteRange(startDate, endDate);
      await testSubjects.click('overviewGenerateReport');
      while(!await PageObjects.toasts.findMessageInToasts('Reporting. Success.')){
        await PageObjects.common.sleep(500);
      }
      const hasMessange = await PageObjects.toasts.findMessageInToasts('Reporting. Success. Go to Wazuh > Management > Reporting');
      expect(hasMessange).to.be.ok();
    });

    it('', async () => {});
  });
}