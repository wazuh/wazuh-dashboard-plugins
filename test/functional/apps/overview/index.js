export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');
  const esArchiver = getService('esArchiver');

  describe('overview', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
      await esArchiver.load('wazuh_alerts');
    });

    loadTestFile(require.resolve('./_welcome'));
    loadTestFile(require.resolve('./_security_events'));
    loadTestFile(require.resolve('./_security_events_search_bar'));
    loadTestFile(require.resolve('./_security_events_discover_subtab'));
  });
}