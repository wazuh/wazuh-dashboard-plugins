/**
 * @jest-environment node
 */
import * as path from 'path';
import { describeI18nStringsGate } from '../../wazuh-core/test/i18n/i18n-strings-gate';

/*
 * Model answers are unaffected by this gate: the assistant replies in the language of the user's
 * own question (see the language rule in `server/prompts.ts`), which is the model's doing, not
 * i18n's.
 */
describeI18nStringsGate({
  pluginRoot: path.resolve(__dirname, '..'),
  idPrefix: 'wazuhAiAssistant',
  minimumMessages: 300,
});
