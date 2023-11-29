import { useState, useEffect } from 'react';
import { search } from '../../dashboards/inventory/inventory_service';
import {
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
  indexPattern: IndexPattern,
  indexType: string,
  filters?: Filter[],
  query?: any,
) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [resultIndexData, setResultIndexData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (indexPatternId) {
      const checkIndexFields = async () => {
        try {
          // Check that the index exists
          await SavedObject.getIndicesFields(indexPatternId, indexType);
          setIsSuccess(true);

          // Check that the index has data
          search({
            indexPattern: indexPattern,
            filters,
            query,
          })
            .then((results: any) => {
              setResultIndexData(results);
              setIsLoading(true);
            })
            .catch((error: any) => {
              const searchError = ErrorFactory.create(HttpError, {
                error,
                message: 'Error fetching vulnerabilities',
              });
              setError(searchError);
              setIsError(true);
              setIsLoading(true);
            });
        } catch (error) {
          setError(error);
          setIsError(true);
          setIsSuccess(false);
        }
      };

      checkIndexFields();
    }
  }, [indexPatternId]);

  return {
    isError,
    error,
    isSuccess,
    resultIndexData,
    isLoading,
  } as UseCheckIndexFieldsResult;
};

export default useCheckIndexFields;
