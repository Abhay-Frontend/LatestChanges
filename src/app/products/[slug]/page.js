"use client";

import React, { useMemo, useState, useEffect, use } from "react";
import Head from "next/head";

import useProductsById from "@/hooks/useProductById";
import ProductImageGallery from "@/components/ProductImages";
import ProductInfo from "@/components/ProductHeader";
import ProductActions from "@/components/ProductActions";
import Navbar from "@/app/(navbar)/Navbar";
import ProductDetails from "@/components/ProductDetails";
import ReviewCard from "@/components/ReviewCard";
import ProductDelivery from "@/components/ProductDelivery";
import axiosHttp from "@/utils/axioshttp";
import Footer from "@/components/footer";
import { getParsedSelectedOptions } from "@/utils/variantUtils";
import WriteReviewModal from "@/components/WriteReviewModal";
import { shouldRedirect, redirectToSlug } from "@/utils/redirectHandler";
import { generateProductSchema, injectSchemaTag } from "@/utils/seoSchema";



/* -----------------------------------------------------
   HELPERS
----------------------------------------------------- */

const extractSizesFromVariants = (variants) => {
  if (!variants || !Array.isArray(variants)) return [];

  const sizesMap = new Map();

  const normalizeSize = (size = "") => {
    const map = {
      Small: "S",
      Medium: "M",
      Large: "L",
      "X-Large": "XL",
      "XX-Large": "XXL",
      "XXX-Large": "3XL",
    };
    return map[size] || size;
  };

  variants.forEach((variant) => {
    const selectedOptions = getParsedSelectedOptions(variant.selectedOptions);
    const sizeOption = selectedOptions.find((o) => o.name === "Size");
    const colorOptions = selectedOptions.filter((o) => o.name === "Color");

    const availableStock = variant.inventory?.availableStock ?? 0;
    const rawSize = sizeOption?.value ?? "";
    const sizeValue = normalizeSize(rawSize);

    if (!sizesMap.has(sizeValue)) {
      sizesMap.set(sizeValue, {
        label: sizeValue,
        value: sizeValue,
        variantId: variant.id,
        shopifyVariantId: variant.shopifyVariantId,
        available: availableStock > 0,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        colors: [],
      });
    }

    const sizeEntry = sizesMap.get(sizeValue);

    colorOptions.forEach((c) => {
      const colorVal = c.value;
      if (!colorVal) return;

      const existing = sizeEntry.colors.find((x) => x.value === colorVal);

      if (!existing) {
        sizeEntry.colors.push({
          label: colorVal,
          value: colorVal,
          variantId: variant.id,
          shopifyVariantId: variant.shopifyVariantId,
          available: availableStock > 0,
          price: variant.price,
        });
      } else {
        existing.available = existing.available || availableStock > 0;
      }
    });
  });

  const sizeOrder = ["XXS","XS","S","M","M/L","L","XL","XXL","2XL","3XL"];

  return Array.from(sizesMap.values()).sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.value);
    const indexB = sizeOrder.indexOf(b.value);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
};

const extractColorsFromVariants = (variants) => {
  if (!variants || !Array.isArray(variants)) return [];

  const colorsMap = new Map();

  variants.forEach((variant) => {
    const selectedOptions = getParsedSelectedOptions(variant.selectedOptions);
    const colorOptions = selectedOptions.filter((o) => o.name === "Color");

    const availableStock = variant.inventory?.availableStock ?? 0;

    colorOptions.forEach((colorOption) => {
      const colorValue = colorOption?.value;
      if (!colorValue) return;

      if (!colorsMap.has(colorValue)) {
        colorsMap.set(colorValue, {
          label: colorValue,
          value: colorValue,
          variantId: variant.id,
          shopifyVariantId: variant.shopifyVariantId,
          available: availableStock > 0,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
        });
      } else {
        const existing = colorsMap.get(colorValue);
        existing.available = existing.available || availableStock > 0;
      }
    });
  });

  return Array.from(colorsMap.values());
};



/* -----------------------------------------------------
   PRODUCT PAGE
----------------------------------------------------- */

export default function ProductPage({ params: paramsPromise }) {

  const params = use(paramsPromise);

  if (!params?.slug) return null;

  const { product: data, loading, error } = useProductsById(params.slug);



  /* -----------------------------------------------------
     STATE
  ----------------------------------------------------- */

  const [deliveryInfo, setDeliveryInfo] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);



  /* -----------------------------------------------------
     FUNCTIONS
  ----------------------------------------------------- */

  const handleMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };



  const fetchReviews = async () => {
    if (!data?.id) return;

    try {
      const response = await axiosHttp.get(`/reviews?productId=${data.id}`);

      if (response?.data?.status === 200) {
        const payload = response.data.data;

        setReviews(
          Array.isArray(payload)
            ? payload
            : payload
            ? [payload]
            : response.data.reviews || []
        );
      }
    } catch (e) {
      console.error("Review fetch error", e);
    }
  };



  /* -----------------------------------------------------
     MEMOS
  ----------------------------------------------------- */

  const sizes = useMemo(
    () => (data?.variants ? extractSizesFromVariants(data.variants) : []),
    [data?.variants]
  );

  const colors = useMemo(
    () => (data?.variants ? extractColorsFromVariants(data.variants) : []),
    [data?.variants]
  );

  const variantPrice =
    selectedVariant?.price ?? data?.variants?.[0]?.price ?? 0;



  const galleryImages = useMemo(() => {
    const base = Array.isArray(data?.imageUrls) ? data.imageUrls : [];

    const variantImg =
      selectedVariant?.imageSrc || selectedVariant?.image || null;

    if (variantImg) {
      const rest = base.filter((u) => u !== variantImg);
      return [variantImg, ...rest];
    }

    return base;
  }, [selectedVariant, data?.imageUrls]);



  /* -----------------------------------------------------
     EFFECTS
  ----------------------------------------------------- */

  useEffect(() => {
    if (data?.slug && shouldRedirect(params.slug, data.slug)) {
      redirectToSlug(params.slug, data.slug);
    }
  }, [data?.slug, params.slug]);



  useEffect(() => {
    if (data?.id) localStorage.removeItem("selectedVariantId");
  }, [data?.id]);



  useEffect(() => {
    if (data?.variants?.length) {
      const storedVariantId = localStorage.getItem("selectedVariantId");

      const foundVariant = data.variants.find(
        (v) => v.id === Number(storedVariantId)
      );

      setSelectedVariant(foundVariant || data.variants[0]);
    }
  }, [data]);



  useEffect(() => {
    fetchReviews();
  }, [data?.id]);



  useEffect(() => {
    if (!data) return;

    const origin = window.location.origin;

    const schema = generateProductSchema(data, origin);

    if (schema) injectSchemaTag(schema);

  }, [data]);



  /* -----------------------------------------------------
     LOADING
  ----------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }



  if (error || !data) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-130px)] mt-[130px]">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2 bg-black text-white rounded"
          >
            Shop Now
          </button>
        </div>
        <Footer />
      </div>
    );
  }



  /* -----------------------------------------------------
     UI
  ----------------------------------------------------- */

  return (
    <div className="bg-white">

      <Head>
        <meta name="description" content={data?.description?.substring(0,160) || ""} />
      </Head>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 mt-[130px]">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <ProductImageGallery
            images={galleryImages}
            hasColorVariants={true}
          />

          <div className="space-y-6">

            <ProductInfo
              title={data.title}
              brand={data.brand?.name || ""}
              rating={4.5}
              reviews={reviews.length}
              price={variantPrice}
              variants={data.variants}
              mrp={data.mrp}
              sizes={sizes}
              colors={colors}
              onVariantChange={setSelectedVariant}
            />



            {message && (
              <div className="p-3 rounded text-md font-medium text-[#9c90ff]">
                {message.text}
              </div>
            )}



            <ProductActions
              productData={data}
              productId={data?.id}
              quantity={quantity}
              onMessage={handleMessage}
              selectedVariant={selectedVariant}
              sizes={sizes}
            />



            <ProductDelivery
              pincode=""
              deliveryInfo={deliveryInfo}
            />

            <ProductDetails
              type={data.type}
              title={data.title}
              brand={data.description}
            />

          </div>
        </div>



        <div className="pt-[50px]">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-lg font-semibold text-black">
              Reviews
            </h2>

            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-black text-white text-sm rounded"
            >
              Write a Review
            </button>

          </div>



          <div className="space-y-4">

            {reviews.length > 0 ? (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  name={r.user?.fullName || "Guest"}
                  rating={r.rating}
                  comment={r.comment}
                />
              ))
            ) : (
              <div className="text-gray-500">
                No reviews yet.
              </div>
            )}

          </div>

        </div>

      </div>



      <Footer />



      {showReviewModal && (
        <WriteReviewModal
          product={data}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            fetchReviews();
          }}
        />
      )}

    </div>
  );
}