export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('Settings ', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
    });

    loadTestFile(require.resolve('./_api'));
  });
}