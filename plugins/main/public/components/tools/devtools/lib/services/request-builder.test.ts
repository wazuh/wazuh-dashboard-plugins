import { RequestBuilder } from './request-builder';
import { DEFAULT_HTTP_METHOD } from '../constants/http';

const makeGroup = (overrides: Partial<any> = {}) => ({
  requestText: '',
  requestTextJson: '',
  start: 0,
  end: 0,
  ...overrides,
});

describe('RequestBuilder', () => {
  const builder = new RequestBuilder();

  it('builds method, path and body from inline JSON (happy path)', () => {
    const group = makeGroup({
      requestText: 'POST /alerts/_search { "foo": 1, "pretty": true }',
      requestTextJson: '{"bar":2}', // should not be used because there is inline body
    });

    const built = builder.build(group);

    expect(built).toMatchSnapshot('inline-body');
    expect(built.method).toBe('POST');
    expect(built.path).toBe('/alerts/_search'); // without query and normalized
    expect(built.body).toEqual({ foo: 1, devTools: true }); // 'pretty' is removed
  });

  it('uses requestTextJson when there is no inline body', () => {
    const group = makeGroup({
      requestText: 'PUT alerts/_settings', // path without leading slash
      requestTextJson: '{"refresh_interval":"1s","pretty": false}',
    });

    const built = builder.build(group);

    expect(built.method).toBe('PUT');
    expect(built.path).toBe('/alerts/_settings'); // normalizes with leading slash
    expect(built.body).toEqual({ refresh_interval: '1s', devTools: true });
  });

  it('removes reserved query params from path', () => {
    const group = makeGroup({
      requestText: 'GET /index/_search?pretty=true&size=10 {"q":"*"}',
    });

    const built = builder.build(group);
    expect(built.path).toBe('/index/_search?size=10');
  });

  it('parses nested JSON in inline body (query/match_all)', () => {
    const group = makeGroup({
      requestText: 'POST /index/_search { "query": { "match_all": {} } }',
    });
    const built = builder.build(group);
    expect(built.method).toBe('POST');
    expect(built.path).toBe('/index/_search');
    expect(built.body).toEqual({ query: { match_all: {} }, devTools: true });
  });

  it('when JSON is invalid, returns empty body with devTools flag', () => {
    const group = makeGroup({
      requestText: 'POST /path { invalid json }',
    });

    const built = builder.build(group);
    expect(built.body).toEqual({ devTools: true });
  });

  it('when no method is detected, uses DEFAULT_HTTP_METHOD and root path', () => {
    const group = makeGroup({ requestText: '' });
    const built = builder.build(group);
    expect(built.method).toBe(DEFAULT_HTTP_METHOD);
    expect(built.path).toBe('/');
    expect(built.body).toEqual({ devTools: true });
  });
});
