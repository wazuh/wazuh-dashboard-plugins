import { ITHygiene } from './applications';

jest.mock('../redux/store', () => ({ getState: () => ({}) }));
jest.mock('../kibana-services', () => ({ getWzCurrentAppID: jest.fn() }));
jest.mock('../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('applications', () => {
  it('links IT Hygiene to the System inventory docs from the Help menu', () => {
    expect(ITHygiene.docsUrl).toBe(
      'https://docs.example/user-manual/capabilities/system-inventory/index.html',
    );
  });
});
