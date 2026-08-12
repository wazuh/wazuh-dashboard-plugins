import { ProviderConfig } from '../../common/types';
import { trimTrailingSlash } from './types';

/**
 * Providers that have already told us, in THIS process, that they reject `temperature` for a
 * given base URL + model. Keyed by `baseUrl::model` rather than the whole `ProviderConfig` so two
 * settings entries pointing at the same endpoint/model share the finding, and a config with a
 * different model at the same base URL does not.
 *
 * Module-scope, not per-request: the whole point is that every call AFTER the first rejection —
 * crucially including every stage-1 router call, which unconditionally sends `temperature: 0` —
 * skips the doomed first attempt instead of re-discovering the same 400 on every turn. Resets on
 * process restart, which is acceptable: the cost of forgetting is at most one wasted round-trip
 * per restart, not a functional break.
 *
 * Two provider families are known to need this, which is why it lives here rather than inside one
 * adapter:
 *  - OpenAI-compatible gateways: observed live against a Bedrock `openai_compatible` gateway
 *    serving `openai.gpt-oss-120b` ("`temperature` is deprecated for this model", HTTP 400).
 *  - The native Anthropic Messages API: `temperature` was REMOVED on Claude Opus 4.7 and later
 *    (Opus 4.7/4.8, Opus 5, Sonnet 5, Fable 5) and is rejected with a 400. Since the stage-1
 *    router sends `temperature: 0` on every single turn, an Anthropic provider configured with any
 *    of those models could not complete even one turn before this shared fallback existed.
 */
const temperatureRejectedByProviderModel = new Map<string, boolean>();

/** Cache key for `temperatureRejectedByProviderModel` — see its doc comment. */
function temperatureCacheKey(config: ProviderConfig): string {
  return `${trimTrailingSlash(config.baseUrl)}::${config.model}`;
}

/**
 * Loosely matches a provider telling us, via an HTTP 4xx body, that it will not accept the
 * `temperature` parameter for this model. Deliberately loose (any 4xx + a case-insensitive
 * mention of "temperature" anywhere in the body) rather than matching one vendor's exact wording:
 * gateways phrase this differently ("is deprecated for this model", "is not supported",
 * "unsupported_parameter"), and Anthropic's own wording differs again
 * ("Extra inputs are not permitted" / "temperature: Extra inputs are not permitted"). The cost of
 * a false positive is one extra harmless retry without `temperature` — not a wrong answer or a
 * dropped turn.
 */
function looksLikeTemperatureRejection(
  status: number,
  bodyText: string,
): boolean {
  return status >= 400 && status < 500 && /temperature/i.test(bodyText);
}

/**
 * Logs the temperature-rejection discovery exactly once per provider/model — at the moment it is
 * first cached, which the caller only reaches once per `temperatureRejectedByProviderModel` key
 * (every later call for that key short-circuits before re-detecting anything). No `Logger` is
 * threaded down into `ProviderAdapter.chatStream` from any call site (chat.ts/anthropic.ts/
 * openai-compatible.ts all construct adapters directly), so this intentionally uses `console.debug`
 * rather than growing every adapter's signature just for one diagnostic line.
 */
function logTemperatureRejectionOnce(config: ProviderConfig): void {
  console.debug(
    `[wazuh-ai-assistant] Provider ${config.baseUrl} (model ${config.model}) rejected ` +
      '`temperature`; retrying once without it and caching the decision for this process.',
  );
}

/**
 * Runs one provider request with the `temperature`-rejection fallback applied, and returns the
 * `Response` for `fetchProviderWithRetry` to interpret. Shared by BOTH adapters: the wire formats
 * differ but the failure and the recovery are identical, and the cache is deliberately shared so a
 * rejection discovered by either adapter is honored by both for that base URL + model.
 *
 * `doFetch` receives whether to put `temperature` in the body, so the caller keeps ownership of its
 * own wire shape. It is re-consulted on every attempt (rather than being decided once by the
 * caller) so a rejection discovered mid-call by the first attempt is honored by the very next one,
 * without waiting for a fresh `chatStream()` call.
 *
 * `temperature` is the value the caller WOULD send; `undefined` means the caller is not sending one
 * at all, in which case no 400 can be a temperature rejection and this is a plain pass-through.
 */
export async function fetchWithTemperatureFallback(
  config: ProviderConfig,
  temperature: number | undefined,
  doFetch: (includeTemperature: boolean) => Promise<Response>,
): Promise<Response> {
  const cacheKey = temperatureCacheKey(config);
  const includeTemperature = !temperatureRejectedByProviderModel.get(cacheKey);
  const attemptResponse = await doFetch(includeTemperature);
  // A "temperature rejection" is only possible when temperature was actually in the request body:
  // without this gate, a 400 whose body merely mentions "temperature" on a temperature-free call
  // would trigger a pointless byte-identical retry AND cache a rejection for a parameter never
  // sent.
  const temperatureWasSent = includeTemperature && temperature !== undefined;
  if (!temperatureWasSent || attemptResponse.status !== 400) {
    return attemptResponse;
  }
  // Peek by reading the ORIGINAL body — `Response.clone()` is unavailable in some runtimes (the
  // OSD jest environment's Response polyfill lacks it entirely, throwing `clone is not a
  // function`), so the peek consumes the body and, when this turns out NOT to be a temperature
  // rejection, hands the caller a reconstructed equivalent Response whose body is intact for its
  // own error-reading path.
  const bodyText = await attemptResponse.text().catch(() => '');
  if (!looksLikeTemperatureRejection(attemptResponse.status, bodyText)) {
    return new Response(bodyText, {
      status: attemptResponse.status,
      statusText: attemptResponse.statusText,
      headers: attemptResponse.headers,
    });
  }
  temperatureRejectedByProviderModel.set(cacheKey, true);
  logTemperatureRejectionOnce(config);
  return doFetch(false);
}
