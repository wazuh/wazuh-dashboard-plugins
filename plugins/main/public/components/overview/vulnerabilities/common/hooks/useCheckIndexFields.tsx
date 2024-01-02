import { useState, useEffect } from 'react';
import { search } from '../../dashboards/inventory/inventory_service';
import {
  IIndexPattern,
  IndexPattern,
  Filter,
} from '../../../../../../../../src/plugins/data/public';
import {
  ErrorFactory,
  HttpError,
} from '../../../../../react-services/error-management';
import { SavedObject } from '../../../../../react-services';

interface UseCheckIndexFieldsResult {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  resultIndexData: any;
}

const useCheckIndexFields = (
  indexPatternId: string,
  indexPattern: IIndexPattern | undefined,
  indexType: string,
  filters?: Filter[],
  query?: any,
) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [resultIndexData, setResultIndexData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (indexPatternId) {
      const checkIndexFields = async () => {
        try {
          // Check that the index exists
          await SavedObject.getIndicesFields(indexPatternId, indexType);
          setIsSuccess(true);

          // Check that the index has data
          search({
            indexPattern: indexPattern as IndexPattern,
            filters,
            query,
          })
            .then((results: any) => {
              setResultIndexData(results);
              setIsLoading(false);
            })
            .catch((error: any) => {
              const searchError = ErrorFactory.create(HttpError, {
                error,
                message: 'Error fetching vulnerabilities',
              });
              setError(searchError);
              setIsError(true);
              setIsLoading(false);
            });
        } catch (error) {
          setError(error);
          setIsError(true);
          setIsSuccess(false);
          setIsLoading(false);
        }
      };

      checkIndexFields();
    }
  }, [indexPatternId, query, indexPattern]);

  return {
    isError,
    error,
    isSuccess,
    resultIndexData,
    isLoading,
  } as UseCheckIndexFieldsResult;
};

export default useCheckIndexFields;
