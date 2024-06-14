import { useState, useEffect } from 'react';
import { SavedObject } from '../../../../../react-services';

interface UseCheckIndexFieldsResult {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  resultIndexData: any;
}

const useCheckIndexFields = (indexPatternId: string, indexType: string) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (indexPatternId) {
      const checkIndexFields = async () => {
        try {
          // Check that the index exists
          await SavedObject.getIndicesFields(indexPatternId, indexType);
          setIsSuccess(true);
          setIsLoading(false);
        } catch (error) {
          setError(error);
          setIsError(true);
          setIsSuccess(false);
          setIsLoading(false);
        }
      };

      checkIndexFields();
    }
  }, [indexPatternId, indexType]);

  return {
    isError,
    error,
    isSuccess,
    isLoading,
  } as UseCheckIndexFieldsResult;
};

export default useCheckIndexFields;
