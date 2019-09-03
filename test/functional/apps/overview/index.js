export default function ({ getService }) {
  const browser = getService('browser');

  describe('overview', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
    });

  });
}