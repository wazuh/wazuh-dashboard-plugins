import { useState, useEffect } from 'react';
import { GenericRequest } from '../../../react-services/generic-request';

export function useGenericRequest(method, path, params, formatFunction) {
  const [items, setItems] = useState({}); 
  const [isLoading, setisLoading] = useState(true); 
  const [error, setError] = useState(""); 

  useEffect( () => {
    try{
      setisLoading(true);
      const fetchData = async() => {
          const response = await GenericRequest.request(method, path, params);
          setItems(response);
          setisLoading(false);
        } 
        fetchData();
    }catch(err){
      setError(error);
      setisLoading(false);
    }
  }, [params]);

  return {isLoading, data: formatFunction(items), error};
}