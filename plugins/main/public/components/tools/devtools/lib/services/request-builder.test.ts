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

  it('construye método, path y body desde inline JSON (happy path)', () => {
    const group = makeGroup({
      requestText: 'POST /alerts/_search { "foo": 1, "pretty": true }',
      requestTextJson: '{"bar":2}', // no debe usarse porque hay inline
    });

    const built = builder.build(group);

    expect(built).toMatchSnapshot('inline-body');
    expect(built.method).toBe('POST');
    expect(built.path).toBe('/alerts/_search'); // sin query y normalizado
    expect(built.body).toEqual({ foo: 1, devTools: true }); // pretty se elimina
  });

  it('usa requestTextJson cuando no hay inline body', () => {
    const group = makeGroup({
      requestText: 'PUT alerts/_settings', // path sin slash inicial
      requestTextJson: '{"refresh_interval":"1s","pretty": false}',
    });

    const built = builder.build(group);

    expect(built.method).toBe('PUT');
    expect(built.path).toBe('/alerts/_settings'); // normaliza con slash
    expect(built.body).toEqual({ refresh_interval: '1s', devTools: true });
  });

  it('elimina query params reservados del path', () => {
    const group = makeGroup({
      requestText: 'GET /index/_search?pretty=true&size=10 {"q":"*"}',
    });

    const built = builder.build(group);
    expect(built.path).toBe('/index/_search?size=10');
  });

  it('parsea JSON anidado en inline body (query/match_all)', () => {
    const group = makeGroup({
      requestText: 'POST /index/_search { "query": { "match_all": {} } }',
    });
    const built = builder.build(group);
    expect(built.method).toBe('POST');
    expect(built.path).toBe('/index/_search');
    expect(built.body).toEqual({ query: { match_all: {} }, devTools: true });
  });

  it('cuando el JSON es inválido, devuelve cuerpo vacío con flag devTools', () => {
    const group = makeGroup({
      requestText: 'POST /path { invalid json }',
    });

    const built = builder.build(group);
    expect(built.body).toEqual({ devTools: true });
  });

  it('cuando no detecta método, usa el DEFAULT_HTTP_METHOD y path raíz', () => {
    const group = makeGroup({ requestText: '' });
    const built = builder.build(group);
    expect(built.method).toBe(DEFAULT_HTTP_METHOD);
    expect(built.path).toBe('/');
    expect(built.body).toEqual({ devTools: true });
  });
});
