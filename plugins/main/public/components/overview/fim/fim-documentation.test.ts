import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { fileIntegrityMonitoring } from '../../../utils/applications';

describe('File Integrity Monitoring documentation', () => {
  it('links the Help menu of the application to its own documentation', () => {
    expect(fileIntegrityMonitoring.docsUrl).toBe(
      webDocumentationLink(
        'user-manual/capabilities/file-integrity/index.html',
      ),
    );
  });
});
