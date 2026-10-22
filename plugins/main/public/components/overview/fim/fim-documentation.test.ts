import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { fileIntegrityMonitoring } from '../../../utils/applications';
import { FIM_CONFIGURE_DOCS_PATH, FIM_DOCS_PATH } from './fim-documentation';

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
});
