/**
 * @jest-environment node
 */
import * as path from 'path';
import { describeI18nStringsGate } from '../../wazuh-core/test/i18n/i18n-strings-gate';

describeI18nStringsGate({
  pluginRoot: path.resolve(__dirname, '..'),
  idPrefix: 'wazuh',
  minimumMessages: 150,
});
