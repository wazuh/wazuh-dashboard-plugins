import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { fileIntegrityMonitoring } from '../../../utils/applications';
import {
  FIM_CONFIGURE_DOCS_PATH,
  FIM_DOCS_PATH,
  getFimModuleDescription,
} from './fim-documentation';

describe('File Integrity Monitoring documentation', () => {
  it('points to the capability and configuration pages', () => {
    expect(FIM_DOCS_PATH).toBe(
      'user-manual/capabilities/file-integrity/index.html',
    );
    expect(FIM_CONFIGURE_DOCS_PATH).toBe(
      'user-manual/capabilities/file-integrity/how-to-configure-fim.html',
    );
  });

  it('links the Help menu of the application to its own documentation', () => {
    expect(fileIntegrityMonitoring.docsUrl).toBe(
      webDocumentationLink(FIM_DOCS_PATH),
    );
  });

  it('describes the module in one sentence', () => {
    expect(getFimModuleDescription()).toBe(
      'Detects when files and registry entries in the monitored paths are added, modified or deleted, and records who changed them when who-data is enabled.',
    );
  });
});
