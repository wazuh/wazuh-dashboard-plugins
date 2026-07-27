/**
 * jest-environment-node (at the version pinned by the OSD build tree) does not
 * inject some Web-standard globals into its vm sandbox even though the host
 * Node 22 runtime provides them natively. The plugin's provider layer uses
 * these at runtime (SSE streaming via ReadableStream, AbortError via
 * DOMException), so the unit tests need them present. Every assignment below
 * is a no-op the day the pinned Jest starts providing the global itself.
 */
const {
  ReadableStream,
  WritableStream,
  TransformStream,
} = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

globalThis.ReadableStream ??= ReadableStream;
globalThis.WritableStream ??= WritableStream;
globalThis.TransformStream ??= TransformStream;
globalThis.TextEncoder ??= TextEncoder;
globalThis.TextDecoder ??= TextDecoder;

if (typeof globalThis.Response === 'undefined') {
  // Minimal fetch-API Response for the sandbox, sufficient for what the
  // provider adapters consume (ok / status / headers.get / text() / body as a
  // one-shot ReadableStream). Tests mock `fetch` itself, so this class is
  // only ever constructed by test code. Remove when the pinned Jest
  // environment provides the real one.
  globalThis.Response = class Response {
    constructor(body = null, init = {}) {
      this.status = init.status ?? 200;
      this.headers = new Map(
        Object.entries(init.headers ?? {}).map(([key, value]) => [
          key.toLowerCase(),
          String(value),
        ]),
      );
      const originalGet = this.headers.get.bind(this.headers);
      this.headers.get = name => originalGet(String(name).toLowerCase());
      this._bodyText = body == null ? '' : String(body);
      this._bodyStream = null;
    }
    get ok() {
      return this.status >= 200 && this.status < 300;
    }
    get body() {
      if (!this._bodyStream) {
        const chunk = new TextEncoder().encode(this._bodyText);
        this._bodyStream = new ReadableStream({
          start(controller) {
            if (chunk.length > 0) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        });
      }
      return this._bodyStream;
    }
    text() {
      return Promise.resolve(this._bodyText);
    }
    json() {
      return Promise.resolve(JSON.parse(this._bodyText));
    }
  };
}

if (typeof globalThis.DOMException === 'undefined') {
  // DOMException is a Node global with no module export; inside the Jest
  // sandbox, harvest the constructor from a real instance by forcing a
  // DataCloneError.
  const { MessageChannel } = require('node:worker_threads');
  const channel = new MessageChannel();
  try {
    channel.port1.postMessage(Symbol('probe'));
  } catch (error) {
    globalThis.DOMException = error.constructor;
  } finally {
    channel.port1.close();
    channel.port2.close();
  }
}
