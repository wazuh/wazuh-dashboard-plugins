import { SaveDocument } from './index';
import elasticsearch from 'elasticsearch';
jest.mock('elasticsearch');

describe('SaveDocument', () => {
  const fakeServer = {
    plugins:{
      elasticsearch:{
        getCluster: data => {
          return {
            clusterClient:{client: new elasticsearch.Client({})},
            callWithRequest: Function,
            callWithInternalUser: Function,
          }
        }
      }
    }
  }
  let savedDocument: SaveDocument;
  beforeEach(() => {
    savedDocument = new SaveDocument(fakeServer)
  });

  test('should be create the object SavedDocument', () => {
    expect(savedDocument).toBeInstanceOf(SaveDocument);
  });

});