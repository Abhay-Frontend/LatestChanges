"use client";
import WishlistCard from "@/components/WishlistCard";
import useGetBoardProduct from "@/hooks/useGetBoardProduct";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";

const WishlistProductCard = () => {
  const { id: boardId } = useParams(); // board id from URL
  const getBoards = useGetBoardProduct(boardId); // your custom hook
  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  // ✅ Local state to manage displayed products
  const [products, setProducts] = useState([]);

  // ✅ When hook data loads, set it to local state
  useEffect(() => {
    if (getBoards?.data) {
      setProducts(getBoards.data);
    }
  }, [getBoards?.data]);

  // ✅ META PIXEL: Track Board View
  useEffect(() => {
    if (products.length > 0 && typeof window !== "undefined" && window.fbq) {
      window.fbq('trackCustom', 'ViewWishlistBoard', {
        content_name: products[0]?.wishlist_board?.name,
        content_ids: products.map(item => item.product?.id.toString()),
        content_type: 'product_group',
        value: products.reduce((acc, item) => acc + (item.product?.basePrice || 0), 0),
        currency: 'INR'
      });
    }
  }, [products]);

  if (getBoards?.error) return <div>Error loading products</div>;

  const handleDelete = async (productId) => {
    // Find product before deleting for tracking
    const deletedProduct = products.find(p => p.product?.id === productId);

    try {
      if (!userId || !boardId || !productId) return;

      // ✅ META PIXEL: Track Remove from Wishlist (Optional)
      if (typeof window !== "undefined" && window.fbq && deletedProduct) {
        window.fbq('trackCustom', 'RemoveFromWishlist', {
          content_ids: [productId.toString()],
          content_name: deletedProduct.product?.title
        });
      }

      const payload = {
        userId,
        productId,
        boardId: Number(boardId),
      };

      // Delete API (no id in URL)
      await axiosHttp.delete(endPoints.deleteBoardProduct, {
        data: payload,
      });

      // Remove item locally (instant UI update)
      setProducts((prev) =>
        prev.filter((item) => item.product?.id !== productId),
      );

      // Optional: Save last deleted product id
      localStorage.setItem("wishlistProductId", productId);

      //  Re-fetch latest data from server (to stay in sync)
      // If your hook doesn't have refetch, call getBoards.fetch again
      if (getBoards?.refetch) {
        await getBoards.refetch();
      } else if (getBoards?.fetchData) {
        await getBoards.fetchData(); // In case your hook exposes fetchData
      }
    } catch (error) {}
  };

  return (
    <div className="bg-white p-6 min-h-screen flex md:items-center md:justify-center mt-[100px] md:mt-[70px] ">
      <div className="w-full  md:py-0  px-4 md:px-[50px] p-8 mb-4 ">
        {products.length > 0 && products[0]?.wishlist_board?.name && (
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 capitalize">
            {products[0].wishlist_board.name}
          </h1>
        )}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-gray-500 mb-6">
              Looks like this board is empty. Start adding some products!
            </p>
            <a
              href="/wishlist-boards"
              className="inline-block bg-black text-white px-6 py-3  transition"
            >
              Back to Boards
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {products.map((item) => {
              const { product } = item;
              const fallbackImage = "";

              return (
                <WishlistCard
                  key={item.id}
                  id={product?.id}
                  imageSrc={product?.imageUrls?.[0] || fallbackImage}
                  imageAlt={product?.title || "Product Image"}
                  rating={product?.rating}
                  reviewCount={product?.numReviews}
                  brandName={product?.brand?.name}
                  productName={product?.title}
                  currentPrice={product?.basePrice || 0}
                  originalPrice={product?.mrp || 0}
                  onDelete={handleDelete}
slug={product?.slug}
shopifyHandles={product?.shopifyHandles}

onAddToBag={() => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id.toString()],
      content_name: product.title,
      value: product.basePrice,
      currency: 'INR'
    });
  }
}}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistProductCard;
