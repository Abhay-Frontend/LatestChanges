import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import { useEffect, useState } from "react";

const useCollection = (query) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        let endPoint;
        if (query) {
          endPoint = `${endPoints.getCollection}?${query}&limit=true`;
        } else {
          endPoint = `${endPoints.getCollection}?limit=true`;
        }
        const result = await axiosHttp.get(endPoint);

        if (result?.status === 200) {
          setProducts(result?.data?.data);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getCollection();
  }, [query]);
  return { data: products, loading, error };
};

export default useCollection;