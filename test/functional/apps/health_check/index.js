export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('Health check', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
    });
    
    loadTestFile(require.resolve('./_health_check'));
  });
}