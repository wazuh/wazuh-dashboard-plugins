/**
 * @jest-environment node
 */
import * as path from 'path';
import { describeI18nStringsGate } from '../../wazuh-core/common/i18n-strings-gate';

describeI18nStringsGate({
  pluginRoot: path.resolve(__dirname, '..'),
  idPrefix: 'wazuh',
  minimumMessages: 150,
});
