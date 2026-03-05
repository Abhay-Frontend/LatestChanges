import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import { useState } from "react";
import { useSelector } from "react-redux";

const useAddProductToCart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user.userInfo);
  const userId = user?.id;

  const addProductToCart = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) {
        setLoading(false);
        return { success: true, message: "Item added to cart" };
      }

      // ✅ Fetch variantId from localStorage
      const variantId = localStorage.getItem("selectedVariantId");

      if (!productId || !variantId) {
        throw new Error("Please select a size ");
      }

      // ✅ Final payload
      const payload = {
        userId: parseInt(userId, 10),
        productId: parseInt(productId, 10),
        variantId: parseInt(variantId, 10),
        quantity: parseInt(quantity, 10),
        cartType: "ECOM",
      };
      const result = await axiosHttp.post(endPoints.addProductToCart, payload);

      setLoading(false);

      if (result.status === 200 || result.status === 201) {
        return {
          success: true,
          message: result.data?.message || "Added to bag successfully",
        };
      }

      return {
        success: false,
        message: result.data?.message || "Something went wrong",
      };
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong");

      if (err.response) {
        return {
          success: false,
          message: err.response.data?.message || err.message,
          status: err.response.status,
        };
      }

      return { success: false, message: err.message || "Something went wrong" };
    }
  };

  return { addProductToCart, loading, error };
};

export default useAddProductToCart;
