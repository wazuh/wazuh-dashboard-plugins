export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');
  const esArchiver = getService('esArchiver');

  describe('Overview ', function () {
    this.tags(['ciGroup6', 'smoke']);

    before(async function () {
      await browser.setWindowSize(1200, 800);
      await esArchiver.load('wazuh_alerts');
    });
    
    loadTestFile(require.resolve('./_security_events'));
    loadTestFile(require.resolve('./_welcome'));
  });
}