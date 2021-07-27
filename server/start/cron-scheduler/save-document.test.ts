import { SaveDocument } from './index';
import elasticsearch from 'elasticsearch';

describe('SaveDocument', () => {
  const fakeServer = {
    core: {
      elasticsearch: {
        client: { asInternalUser: '' },
        getCluster: (data) => {
          return {
            clusterClient: { client: new elasticsearch.Client({}) },
            callWithRequest: Function,
            callWithInternalUser: Function,
          };
        },
      },
    },
  };
  let savedDocument: SaveDocument;
  beforeEach(() => {
    savedDocument = new SaveDocument(fakeServer);
  });

  it('should be create the object SavedDocument', () => {
    expect(savedDocument).toBeInstanceOf(SaveDocument);
  });
});
