import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { DOCKER_DOCS_PATH } from './docker-documentation';

describe('Docker documentation', () => {
  it('points to the guide on how to monitor Docker environments', () => {
    expect(webDocumentationLink(DOCKER_DOCS_PATH)).toMatch(
      /\/user-manual\/capabilities\/container-security\/monitoring-docker\.html$/,
    );
  });
});
