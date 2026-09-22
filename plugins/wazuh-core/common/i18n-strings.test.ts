/**
 * @jest-environment node
 */
import * as path from 'path';
import { describeI18nStringsGate } from './i18n-strings-gate';

describeI18nStringsGate({
  pluginRoot: path.resolve(__dirname, '..'),
  idPrefix: 'wazuhCore',
  minimumMessages: 40,
});
