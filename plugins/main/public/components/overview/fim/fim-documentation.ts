import { i18n } from '@osd/i18n';

/** Documentation page of the File Integrity Monitoring capability. */
export const FIM_DOCS_PATH =
  'user-manual/capabilities/file-integrity/index.html';

/** Documentation page that explains how to add the files and directories to monitor. */
export const FIM_CONFIGURE_DOCS_PATH =
  'user-manual/capabilities/file-integrity/how-to-configure-fim.html';

/** One-line explanation shown under the module title, above its tabs. */
export const getFimModuleDescription = () =>
  i18n.translate('wazuh.fileIntegrityMonitoring.module.description', {
    defaultMessage:
      'Detects when files and registry entries in the monitored paths are added, modified or deleted, and records who changed them when who-data is enabled.',
  });
