"use client";
import React, { useMemo, useState, useEffect, use } from "react";
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

// --- HELPERS (Kept outside to avoid re-allocation on render) ---

const extractSizesFromVariants = (variants) => {
  if (!variants || !Array.isArray(variants)) return [];
  const sizesMap = new Map();
  const normalizeSize = (size = "") => {
    const map = {
      Small: "S", Medium: "M", Large: "L",
      "X-Large": "XL", "XX-Large": "XXL", "XXX-Large": "3XL",
    };
    return map[size] || size;
  };

  variants.forEach((variant) => {
    const selectedOptions = getParsedSelectedOptions(variant.selectedOptions);
    const sizeOption = selectedOptions.find((o) => o.name === "Size");
    const colorOptions = selectedOptions.filter((o) => o.name === "Color");
    // const availableStock = variant.inventory?.availableStock ?? 0;
    const availableStock = variant.inventories?.[0]?.availableStock ?? 0;
    const rawSize = sizeOption?.value ?? "";
    const sizeValue = normalizeSize(rawSize);

    if (!sizesMap.has(sizeValue)) {
      sizesMap.set(sizeValue, {
        label: sizeValue || "",
        value: sizeValue || "",
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
          label: colorVal, value: colorVal,
          variantId: variant.id, shopifyVariantId: variant.shopifyVariantId,
          available: availableStock > 0, price: variant.price,
        });
      } else {
        existing.available = existing.available || availableStock > 0;
      }
    });
  });

  const sizeOrder = ["XXS", "XS", "S", "M", "M/L", "L", "XL", "XXL", "2XL", "3XL"];
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
    // const availableStock = variant.inventory?.availableStock ?? 0;
    const availableStock = variant.inventories?.[0]?.availableStock ?? 0;
    colorOptions.forEach((colorOption) => {
      const colorValue = colorOption?.value;
      if (!colorValue) return;
      if (!colorsMap.has(colorValue)) {
        colorsMap.set(colorValue, {
          label: colorValue, value: colorValue,
          variantId: variant.id, shopifyVariantId: variant.shopifyVariantId,
          available: availableStock > 0, price: variant.price,
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

// --- MAIN COMPONENT ---

export default function ProductPage({ params: paramsPromise }) {
  // 1. Unwrap params (Next.js 15 requirement)
  const resolvedParams = use(paramsPromise);
  const productId = resolvedParams.id;

  // 2. Data Fetching
  const { product: data, loading, error } = useProductsById(productId);

  // 3. State Hooks (ALL HOOKS MUST BE AT THE TOP)
  const [deliveryInfo, setDeliveryInfo] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);

  // 4. Memos
  const sizes = useMemo(() => (data?.variants ? extractSizesFromVariants(data.variants) : []), [data?.variants]);
  const colors = useMemo(() => (data?.variants ? extractColorsFromVariants(data.variants) : []), [data?.variants]);
  const variantPrice = selectedVariant?.price ?? data?.variants?.[0]?.price ?? 0;

  const galleryImages = useMemo(() => {
    const base = Array.isArray(data?.imageUrls) ? data.imageUrls : [];
    const variantImg = selectedVariant?.imageSrc || selectedVariant?.image || null;
    if (variantImg) {
      const rest = base.filter((u) => u !== variantImg);
      return [variantImg, ...rest];
    }
    return base;
  }, [selectedVariant, data?.imageUrls]);

  const discount = useMemo(() => {
    if (data?.mrp && variantPrice) {
      const mrp = parseFloat(data.mrp);
      const price = parseFloat(variantPrice);
      if (mrp > price) return Math.round(((mrp - price) / mrp) * 100);
    }
    return 0;
  }, [data?.mrp, variantPrice]);

  const hasColorVariants = useMemo(() => {
    if (!data?.variants) return false;
    const uniqueColors = new Set();
    let hasSize = false;
    data.variants.forEach((v) => {
      const opts = getParsedSelectedOptions(v.selectedOptions);
      if (opts.find((o) => o.name === "Size")) hasSize = true;
      const c = opts.find((o) => o.name === "Color")?.value;
      if (c) uniqueColors.add(c);
    });
    return hasSize && uniqueColors.size > 1;
  }, [data?.variants]);

  // 5. Side Effects
  useEffect(() => {
    if (data?.id) localStorage.removeItem("selectedVariantId");
  }, [data?.id]);

  useEffect(() => {
    if (data?.variants?.length) {
      const storedVariantId = localStorage.getItem("selectedVariantId");
      const foundVariant = data.variants.find((v) => v.id === Number(storedVariantId));
      setSelectedVariant(foundVariant || data.variants[0]);
    }
  }, [data]);

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

  useEffect(() => {
    fetchReviews();
  }, [data?.id]);

  useEffect(() => {
    if (!data?.id) return;
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [data.id.toString()],
        content_name: data.title,
        content_type: 'product',
        value: parseFloat(data?.variants?.[0]?.price) || 0,
        currency: 'INR',
      });
    }
  }, [data?.id]);

  // 6. Action Handlers
  const handleMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCheckPincode = async (pin) => {
    try {
      const variantId = selectedVariant?.id || sizes?.[0]?.variantId;
      if (!variantId || pin?.length !== 6) return;
      const response = await axiosHttp.post("/check-serviceability", { variantId, deliveryPostalCode: pin });
      if (response?.data?.status === 200 && response?.data?.data) {
        const { estimatedDate, estimatedDays } = response.data.data;
        setDeliveryInfo([{ icon: "truck", title: "Delivery Details", description: `Date: ${estimatedDate}\nDays: ${estimatedDays}` }]);
      } else {
        setDeliveryInfo([{ icon: "truck", title: "Info", description: response?.data?.message || "Not available" }]);
      }
    } catch (e) {
      setDeliveryInfo([{ icon: "truck", title: "Error", description: "Could not fetch info" }]);
    }
  };

  const handleAddToBag = () => {
    if (typeof window !== "undefined" && window.fbq && selectedVariant) {
      window.fbq('track', 'AddToCart', {
        content_ids: [selectedVariant.id.toString()],
        content_name: data.title,
        content_type: 'product',
        value: parseFloat(variantPrice),
        currency: 'INR',
      });
    }
  };

  const handleAddToWishlist = () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq('track', 'AddToWishlist', {  
        content_ids: [data.id.toString()],
        content_name: data.title,
        value: parseFloat(variantPrice),
        currency: 'INR'
      });
    }
  };

  // 7. Conditional Early Returns (MUST BE AFTER ALL HOOKS)
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-130px)] mt-[130px]">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <button onClick={() => window.location.href = "/"} className="px-6 py-2 bg-black text-white rounded">Shop Now</button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 mt-[130px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProductImageGallery images={galleryImages} hasColorVariants={hasColorVariants} />
          
          <div className="space-y-6">
            <ProductInfo 
              title={data.title} brand={data.brand?.name || ""}
              rating={4.5} reviews={data.variants?.length || 0} price={variantPrice}
              variants={data.variants} mrp={data.mrp} discount={discount}
              sizes={sizes} colors={colors} variantId={selectedVariant?.id || sizes?.[0]?.variantId}
              brandId={data.brand?.id} superCatId={data.superCatId} catId={data.catId} subcatId={data.subCatId}
              onVariantChange={setSelectedVariant}
            />

            {selectedVariant && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">Quantity</label>
                <div className="flex items-center border border-gray-300 rounded w-fit">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50" disabled={quantity <= 1}>−</button>
                  <span className="px-6 py-2 font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-gray-100">+</button>
                </div>
              </div>
            )}

            {message && <div className="p-3 rounded text-md font-medium text-[#9c90ff]">{message.text}</div>}

            <ProductActions 
              onAddToBag={handleAddToBag} onAddToWishlist={handleAddToWishlist}
              productData={data} productId={data?.id} quantity={quantity}
              //isInStock={selectedVariant ? (selectedVariant.available ?? selectedVariant.inventory?.availableStock > 0) : data?.variants?.some(v => v.inventory?.availableStock > 0)}
              isInStock={
                selectedVariant
                  ? (selectedVariant.inventories?.[0]?.availableStock > 0)
                  : data?.variants?.some(v => v.inventories?.[0]?.availableStock > 0)
              }
              onMessage={handleMessage} selectedVariant={selectedVariant} sizes={sizes}
            />

            <ProductDelivery pincode="" deliveryInfo={deliveryInfo} onCheckPincode={handleCheckPincode} />
            <ProductDetails type={data.type} title={data.title} brand={data.description} />
          </div>
        </div>

        <div className="pt-[50px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div />
            <div>
              <div className="flex items-center justify-between mb-6">
                {reviews.length > 0 && <h2 className="text-lg font-semibold text-black">Reviews</h2>}
                <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-black text-white text-sm rounded cursor-pointer">Write a Review</button>
              </div>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {reviews.length > 0 ? reviews.map((r) => (
                  <ReviewCard 
                    key={r.id || `${r.userId}-${r.createdAt}`} name={r.user?.fullName || "Guest"}
                    rating={r.rating} timeAgo="Recently" comment={r.comment} 
                  />
                )) : <div className="text-gray-500 p-[50px]">No reviews yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {showReviewModal && <WriteReviewModal product={data} onClose={() => setShowReviewModal(false)} onSuccess={() => { setShowReviewModal(false); fetchReviews(); }} />}
    </div>
  );
}