import { DevToolsActions } from './dev-tools-actions';
import { MESSAGES } from '../constants/messages';
import type { EditorOutputLike, SendHooks } from '../types/editor';
import type { HttpClient } from '../types/http';
import { RequestBuilder } from '../services/request-builder';
import { ResponseHandler } from '../services/response-handler';

// Mock only the error adapter to control error string output
jest.mock('../adapters/error-adapter', () => ({
  parseErrorForOutput: jest.fn(() => 'PARSED_ERROR'),
}));

describe('DevToolsActions.send', () => {
  // Minimal editor output stub
  const createOutput = () => ({ setValue: jest.fn() }) as unknown as EditorOutputLike;

  // Common default stubs
  const createHttp = (impl?: any) => ({ request: jest.fn(impl) }) as unknown as HttpClient & {
    request: jest.Mock;
  };

  const createErrors = () => ({ log: jest.fn() });

  const createRequests = (built: any) => ({
    build: jest.fn(() => built),
  });

  const createResponses = (options?: {
    adminForbidden?: boolean;
    normalized?: any;
  }) => ({
    isAdminModeForbidden: jest.fn(() => !!options?.adminForbidden),
    normalize: jest.fn(() => options?.normalized ?? {}),
  });

  const createGrouping = (options?: {
    desiredGroup?: any;
    groups?: any[];
    jsonErrors?: string[];
  }) => ({
    parseGroups: jest.fn(() => options?.groups ?? []),
    selectActiveGroup: jest.fn(() => options?.desiredGroup ?? null),
    validateJson: jest.fn(() => options?.jsonErrors ?? []),
  });

  const group = (overrides?: Partial<{ requestText: string; requestTextJson: string }>) => ({
    requestText: 'GET /example',
    requestTextJson: '',
    start: 0,
    end: 0,
    ...(overrides || {}),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs happy path: builds request, calls HTTP, writes JSON, and notifies hooks', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    const desired = group({ requestText: 'GET /my/path' });
    const httpResponse = { status: 200, statusText: 'OK', data: { result: 'ok' } };

    const http = createHttp(() => Promise.resolve(httpResponse));
    const errors = createErrors();
    const requests = createRequests({ method: 'GET', path: '/my/path', body: { a: 1 } });
    const responses = createResponses({
      adminForbidden: false,
      normalized: { body: httpResponse.data, status: 200, statusText: 'OK', ok: true },
    });
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [] });

    // Freeze duration for deterministic assertions
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // start
      .mockReturnValueOnce(1100); // end

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests as any,
      responses as any,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, false, hooks);

    expect(grouping.parseGroups).toHaveBeenCalled();
    expect(grouping.selectActiveGroup).toHaveBeenCalled();
    expect(grouping.validateJson).toHaveBeenCalledWith(expect.anything(), [desired]);
    expect(requests.build).toHaveBeenCalledWith(desired);
    expect(hooks.onStart).toHaveBeenCalledTimes(1);
    expect(http.request).toHaveBeenCalledWith('GET', '/my/path', { a: 1 }, { returnOriginalResponse: true });
    expect(responses.isAdminModeForbidden).toHaveBeenCalledWith(httpResponse);
    expect(responses.normalize).toHaveBeenCalledWith(httpResponse);

    // Output should be pretty JSON and stable (snapshot)
    expect((editorOutput.setValue as any).mock.calls[0][0]).toMatchSnapshot('happy-path-output');

    expect(hooks.onEnd).toHaveBeenCalledWith({
      status: 200,
      statusText: 'OK',
      durationMs: 100,
      ok: true,
    });

    nowSpy.mockRestore();
  });

  it('stops early and shows JSON parse error when validation fails', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    const desired = group({ requestText: 'POST /broken' });
    const http = createHttp(() => Promise.resolve({}));
    const errors = createErrors();
    const requests = createRequests({ method: 'POST', path: '/broken', body: {} });
    const responses = createResponses();
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [desired.requestText] });

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests as any,
      responses as any,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, false, hooks);

    expect(editorOutput.setValue).toHaveBeenCalledWith(MESSAGES.ERROR_PARSING_JSON);
    expect(http.request).not.toHaveBeenCalled();
    expect(hooks.onStart).not.toHaveBeenCalled();
    expect(hooks.onEnd).not.toHaveBeenCalled();
    expect(requests.build).not.toHaveBeenCalled();
  });

  it('handles admin mode forbidden: shows message and calls onEnd with failure', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    const desired = group({ requestText: 'DELETE /secure' });
    const httpResponse = 'Forbidden: code 3029'; // ADMIN_MODE_FORBIDDEN_TOKEN present
    const http = createHttp(() => Promise.resolve(httpResponse));
    const errors = createErrors();
    const requests = createRequests({ method: 'DELETE', path: '/secure', body: {} });
    const responses = createResponses({ adminForbidden: true });
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [] });

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(2150);

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests as any,
      responses as any,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, false, hooks);

    expect(editorOutput.setValue).toHaveBeenCalledWith(MESSAGES.ADMIN_MODE_REQUIRED);
    // normalize should not be called when admin forbidden
    expect(responses.normalize).not.toHaveBeenCalled();
    expect(hooks.onEnd).toHaveBeenCalledWith({
      status: undefined,
      statusText: MESSAGES.ADMIN_MODE_REQUIRED_SHORT,
      durationMs: 150,
      ok: false,
    });

    nowSpy.mockRestore();
  });

  it('firstTime=true shows welcome and skips network even when a group is selected', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    const desired = group({ requestText: 'GET /ignored' });
    const http = createHttp(() => Promise.resolve({}));
    const errors = createErrors();
    const requests = createRequests({ method: 'GET', path: '/ignored', body: {} });
    const responses = createResponses();
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [] });

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests as any,
      responses as any,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, true, hooks);

    expect(editorOutput.setValue).toHaveBeenCalledWith(MESSAGES.WELCOME);
    expect(http.request).not.toHaveBeenCalled();
    expect(hooks.onStart).not.toHaveBeenCalled();
    expect(hooks.onEnd).not.toHaveBeenCalled();
  });

  it('handles thrown HTTP errors: logs, renders parsed error, and calls onEnd with error metadata', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    const desired = group({ requestText: 'GET /boom' });
    const boom = Object.assign(new Error('Boom'), {
      response: { status: 500, statusText: 'Internal' },
    });

    const http = createHttp(() => Promise.reject(boom));
    const errors = createErrors();
    const requests = createRequests({ method: 'GET', path: '/boom', body: {} });
    const responses = createResponses();
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [] });

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests as any,
      responses as any,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, false, hooks);

    expect(errors.log).toHaveBeenCalledWith({ context: 'send', error: boom });
    expect(editorOutput.setValue).toHaveBeenCalledWith('PARSED_ERROR');
    expect(hooks.onEnd).toHaveBeenCalledWith({
      status: 500,
      statusText: 'Internal',
      durationMs: 0,
      ok: false,
    });
  });

  it('integration: uses real RequestBuilder and ResponseHandler to shape request/response', async () => {
    const editorOutput = createOutput();
    const hooks: SendHooks = { onStart: jest.fn(), onEnd: jest.fn() };

    // Inline body + reserved flags in body/query => sanitized by RequestBuilder
    const desired = group({ requestText: 'POST agents?pretty=true {"pretty": true, "x": 1}' });

    let capturedArgs: any[] | null = null;
    const http = createHttp((method: any, path: any, body: any, options: any) => {
      capturedArgs = [method, path, body, options];
      return Promise.resolve({ status: 201, statusText: 'Created', data: { id: 'abc' } });
    });

    const errors = createErrors();
    const requests = new RequestBuilder();
    const responses = new ResponseHandler();
    const grouping = createGrouping({ desiredGroup: desired, groups: [desired], jsonErrors: [] });

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(3000)
      .mockReturnValueOnce(3200);

    const actions = new DevToolsActions(
      http,
      errors as any,
      requests,
      responses,
      grouping as any,
    );

    await actions.send({} as any, editorOutput, false, hooks);

    // RequestBuilder should purge reserved query and body flags, and mark devTools=true
    expect(capturedArgs).toEqual([
      'POST',
      '/agents',
      { x: 1, devTools: true },
      { returnOriginalResponse: true },
    ]);

    // ResponseHandler should pretty-print the response body
    expect(editorOutput.setValue).toHaveBeenCalledWith(JSON.stringify({ id: 'abc' }, null, 2));
    expect(hooks.onEnd).toHaveBeenCalledWith({
      status: 201,
      statusText: 'Created',
      durationMs: 200,
      ok: true,
    });

    nowSpy.mockRestore();
  });
});

