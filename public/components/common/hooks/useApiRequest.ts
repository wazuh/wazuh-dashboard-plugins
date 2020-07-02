import { useState, useEffect } from 'react';
import { WzRequest } from '../../../react-services/wz-request';

export function useApiRequest(method,path, params, formatFunction) {
  const [items, setItems] = useState({}); 
  const [isLoading, setisLoading] = useState(true); 
  const [error, setError] = useState("");

  useEffect( () => {
      try{
        setisLoading(true);
        const fetchData = async() => {
          const newParams = {...params};
          if(!newParams.search) delete newParams["search"];
          const response = await WzRequest.apiReq(method, path, newParams);
          setItems(response);
          setisLoading(false);
        } 
        fetchData();

      }catch(err){
        setError(error);
        setisLoading(false);
      }
  }, [params.limit, params.offset, params.search, params.sort]);


  return {isLoading, data: formatFunction(items), error};
}
