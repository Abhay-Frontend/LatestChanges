import { useEffect, useState } from "react";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";

const useProductById = (slug) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!slug) return;
      const endPoint = `${endPoints.productdetialsbyid}/${slug}`;
      const result = await axiosHttp.get(endPoint);

      if (result?.status === 200) {
        setProduct(result?.data?.data);
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "Failed to load product";
      const errorStatus = err?.response?.data?.status || err?.response?.status;
      setError({ message: errorMessage, status: errorStatus });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductDetails();
  }, [slug]);

  return { product, loading, error };
};

export default useProductById;
