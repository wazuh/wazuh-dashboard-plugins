import { DictionaryHintProvider } from './hint-provider';
import type { HintProviderDeps } from './hint-provider';
import {
  BodyHintStrategy,
  FallbackHintStrategy,
  RequestLineHintStrategy,
} from './strategies';

/**
 * Create a DictionaryHintProvider with default strategies.
 * Allows centralizing dependency injection for better testability.
 */
export function createDictionaryHintProvider(deps: HintProviderDeps) {
  return new DictionaryHintProvider(deps, [
    new RequestLineHintStrategy(),
    new BodyHintStrategy(),
    new FallbackHintStrategy(),
  ]);
}
