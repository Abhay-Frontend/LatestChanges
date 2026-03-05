import { useState, useMemo, useEffect } from "react";
import { X, Heart, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { closeProductViewModal } from "@/redux/slices/loginmodalSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import { addToCart } from "@/redux/slices/cartSlice";
import { getParsedSelectedOptions } from "@/utils/variantUtils";

const ProductModal = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const isOpen = useSelector((state) => state.modal.productViewModal);
  const product = useSelector((state) => state.modal.selectedProduct);
  const user = useSelector((state) => state.user.userInfo);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSizeColorOptions, setShowSizeColorOptions] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Helper function to extract sizes from variants
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

      // If no size option or "Default Title", treat as ONE SIZE
      const finalSize = sizeValue || "ONE SIZE";

      if (!sizesMap.has(finalSize)) {
        sizesMap.set(finalSize, {
          label: finalSize,
          value: finalSize,
          variantId: variant.id,
          available: availableStock > 0,
          price: variant.price,
          colors: [],
        });
      }

      const sizeEntry = sizesMap.get(finalSize);

      colorOptions.forEach((c) => {
        const colorVal = c.value;
        if (!colorVal) return;
        const existing = sizeEntry.colors.find((x) => x.value === colorVal);
        if (!existing) {
          sizeEntry.colors.push({
            label: colorVal,
            value: colorVal,
            variantId: variant.id,
            available: availableStock > 0,
            price: variant.price,
          });
        } else {
          existing.available = existing.available || availableStock > 0;
        }
      });
    });

    const sizeOrder = [
      "XXS",
      "XS",
      "S",
      "M",
      "M/L",
      "L",
      "XL",
      "XXL",
      "2XL",
      "3XL",
      "ONE SIZE",
    ];

    const sizesArray = Array.from(sizesMap.values());

    return sizesArray.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a.value);
      const indexB = sizeOrder.indexOf(b.value);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  };

  // Helper function to extract colors from variants
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
            available: availableStock > 0,
            price: variant.price,
          });
        } else {
          const existing = colorsMap.get(colorValue);
          existing.available = existing.available || availableStock > 0;
        }
      });
    });

    return Array.from(colorsMap.values());
  };

  // Memoized sizes and colors
  const sizes = useMemo(() => {
    if (!product?.variants) return [];
    return extractSizesFromVariants(product.variants);
  }, [product?.variants]);

  const colors = useMemo(() => {
    if (!product?.variants) return [];
    return extractColorsFromVariants(product.variants);
  }, [product?.variants]);

  // Get colors for selected size
  const colorsForSelectedSize = useMemo(() => {
    if (!selectedSize) return colors;
    const sizeEntry = sizes.find((s) => s.value === selectedSize);
    return sizeEntry?.colors || [];
  }, [selectedSize, sizes, colors]);

  // Get all available images from product
  const productImages = product?.imageUrls || [];
  const hasMultipleImages = productImages.length > 1;

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(null);
      setSelectedColor(null);
      setShowSizeColorOptions(false);
      setLoading(false);
      setMessage(null);
      setMessageType(null);
      setCurrentImageIndex(0);
      setIsHovering(false);
    }
  }, [product?.id]);

  // Auto-change image on hover with 2 second interval
  useEffect(() => {
    let interval;
    if (isHovering && productImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, productImages.length]);

  // Auto-dismiss message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Helper function to show message
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  // Handle share functionality
  const handleShare = async () => {
    const productUrl = `${window.location.origin}/products/${product.slug || product.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title}`,
          url: productUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          copyToClipboard(productUrl);
        }
      }
    } else {
      copyToClipboard(productUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showMessage("Link copied to clipboard", "success");
      })
      .catch(() => {
        showMessage("Failed to copy link", "error");
      });
  };

  // Navigate to previous image
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  };

  // Navigate to next image
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  // Auto-select size when there's only one size or if no sizes available (ONE SIZE)
  useEffect(() => {
    if (isOpen && product) {
      if (sizes.length > 0) {
        // Auto-select the first size (could be ONE SIZE or a regular size)
        setSelectedSize(sizes[0].value);
        setSelectedColor(null);
      }
    }
  }, [sizes, isOpen, product]);

  // Determine selected variant ID
  const getSelectedVariantId = () => {
    if (selectedColor && selectedSize && selectedSize !== "ONE SIZE") {
      const sizeEntry = sizes.find((s) => s.value === selectedSize);
      const colorEntry = sizeEntry?.colors.find(
        (c) => c.value === selectedColor,
      );
      return colorEntry?.variantId;
    } else if (selectedSize && selectedSize !== "ONE SIZE") {
      const sizeEntry = sizes.find((s) => s.value === selectedSize);
      return sizeEntry?.variantId;
    } else if (selectedSize === "ONE SIZE" && product?.variants?.[0]) {
      // If ONE SIZE, use the first variant
      return product.variants[0].id;
    }
    return null;
  };

  // Replace onClose prop with dispatch
  const handleClose = () => {
    dispatch(closeProductViewModal());
  };

  // Debug: Log brand data to verify brandId
  useEffect(() => {
    if (product) {
      console.log("Product brand data:", {
        brand: product.brand,
        brandId: product.brandId,
      });
    }
  }, [product]);

  useEffect(() => {
    if (isOpen && product && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.id.toString()],
        content_name: product.title,
        content_type: 'product',
        value: product.basePrice,
        currency: 'INR',
      });
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const currentImage = productImages[currentImageIndex];

  const trackMetaAddToCart = (variantId) => {
    if (typeof window!=='undefined'&& window.fbq) {
      // Explicitly call track to override the automatic "SubscribedButtonClick
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id.toString()],
        content_name: product.title,
        content_type: 'product',
        value: product.basePrice,
        currency: 'INR',
       // content_category: product.brand?.name || product.brand || 'General',
        // Adding the variant ID helps with Dynamic Ads
        external_id: variantId?.toString()
      });
    }
  };
  const trackMetaAddToBag = (variantId) => {
    if (typeof window !== 'undefined' && window.fbq) {
      // We use 'trackCustom' for non-standard event names
      window.fbq('trackCustom', 'AddToBag', {
        content_ids: [product.id.toString()],
        content_name: product.title,
        content_type: 'product',
        value: product.basePrice,
        currency: 'INR',
        variant_id: variantId?.toString()
      });
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    // If ONE SIZE product, add to cart directly
    if (selectedSize === "ONE SIZE") {
      setLoading(true);

      try {
        const variantId = getSelectedVariantId();
        trackMetaAddToBag(variantId);

        if (!variantId) {
          showMessage("Unable to select variant", "error");
          setLoading(false);
          return;
        }

        // Get the available stock from the selected variant
        const selectedVariant = product.variants.find(
          (v) => v.id === variantId,
        );
        const availableQuantity =
          selectedVariant?.inventory?.availableStock ?? 1;

        // If user is not logged in, store in localStorage, dispatch to Redux, and show message
        if (!user?.id) {
          localStorage.setItem("ProductId", product.id);
          localStorage.setItem("selectedVariantId", variantId);
          trackMetaAddToCart(variantId);

          // Add to Redux cart state for cart sync
          dispatch(addToCart({ product, variantId, quantity: 1 }));

          if (isBuyNow) {
            // Store buyNow flag with variant ID for cart page
            localStorage.setItem("buyNowVariantId", variantId.toString());
            // Close modal instantly before redirect
            handleClose();
            // Small delay to ensure modal closes before navigation
            setTimeout(() => {
              router.push("/checkout/bag");
            }, 50);
            return;
          }

          showMessage("Item added to cart", "success");
          // Keep modal open for 4 seconds to show message, then close
          setTimeout(() => {
            handleClose();
          }, 2000);
          setLoading(false);
          return;
        }

        // API call for logged-in users
        const payload = {
          userId: parseInt(user.id, 10),
          productId: parseInt(product.id, 10),
          variantId: parseInt(variantId, 10),
          quantity: 1,
        };

        const result = await axiosHttp.post(
          endPoints.addProductToCart,
          payload,
        );

        if (result.status === 200 || result.status === 201) {
          // Add to Redux cart state
          dispatch(addToCart({ product, variantId }));
          trackMetaAddToCart(variantId);

          if (isBuyNow) {
            // Store buyNow flag with variant ID for cart page
            localStorage.setItem("buyNowVariantId", variantId.toString());
            // Close modal before redirect
            handleClose();
            // Small delay to ensure modal closes before navigation
            setTimeout(() => {
              router.push("/checkout/bag");
            }, 100);
            return;
          }

          showMessage(
            result.data?.message || "Added to bag successfully",
            "success",
          );

          // Keep modal open for 4 seconds to show message, then close
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          showMessage(result.data?.message || "Something went wrong", "error");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";
        showMessage(errorMessage, "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // If size/color options are not shown yet, show them
    if (!showSizeColorOptions) {
      setShowSizeColorOptions(true);
      return;
    }

    if (!selectedSize) {
      showMessage("Please select a size", "error");
      return;
    }

    if (colorsForSelectedSize.length > 0 && !selectedColor) {
      showMessage("Please select a color", "error");
      return;
    }

    setLoading(true);

    try {
      const variantId = getSelectedVariantId();
      trackMetaAddToBag(variantId);

      if (!variantId) {
        showMessage("Unable to select variant", "error");
        setLoading(false);
        return;
      }

      // Get the available stock from the selected variant
      const selectedVariant = product.variants.find((v) => v.id === variantId);
      const availableQuantity = selectedVariant?.inventory?.availableStock ?? 1;

      // If user is not logged in, store in localStorage, dispatch to Redux, and show message
      if (!user?.id) {
        localStorage.setItem("ProductId", product.id);
        localStorage.setItem("selectedVariantId", variantId);

        // Add to Redux cart state for cart sync
        dispatch(addToCart({ product, variantId, quantity: 1 }));
        trackMetaAddToCart(variantId);

        if (isBuyNow) {
          // Store buyNow flag with variant ID for cart page
          localStorage.setItem("buyNowVariantId", variantId.toString());
          // Close modal instantly before redirect
          handleClose();
          // Redirect to cart immediately
          setTimeout(() => {
            router.push("/checkout/bag");
          }, 50);
          return;
        }

        showMessage("Item added to cart", "success");
        // Keep modal open for 4 seconds to show message, then close
        setTimeout(() => {
          handleClose();
        }, 2000);
        setLoading(false);
        return;
      }

      // API call for logged-in users
      const payload = {
        userId: parseInt(user.id, 10),
        productId: parseInt(product.id, 10),
        variantId: parseInt(variantId, 10),
        quantity: 1,
        city: "Delhi"
      };

      const result = await axiosHttp.post(endPoints.addProductToCart, payload);

      if (result.status === 200 || result.status === 201) {
        // Add to Redux cart state
        dispatch(addToCart({ product, variantId }));
        trackMetaAddToCart(variantId);

        if (isBuyNow) {
          // Store buyNow flag with variant ID for cart page
          localStorage.setItem("buyNowVariantId", variantId.toString());
          // Close modal instantly before redirect
          handleClose();
          // Redirect to cart immediately
          setTimeout(() => {
            router.push("/checkout/bag");
          }, 50);
          return;
        }

        showMessage(
          result.data?.message || "Added to bag successfully",
          "success",
        );

        // Keep modal open for 4 seconds to show message, then close
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        showMessage(result.data?.message || "Something went wrong", "error");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart(true);
  };

  return (
    <div className="fixed inset-0  bg-black/10 backdrop-blur-[4px]  flex items-center justify-center z-50 p-4 overflow-auto ">
      <div className="bg-white w-full max-w-3xl  overflow-hidden rounded-lg">
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div
            className="md:w-1/2 w-full relative bg-gray-50 flex items-center justify-center"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setCurrentImageIndex(0);
            }}
          >
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
            <div className="relative w-full h-[320px] md:h-[400px]">
              <Image
                src={currentImage}
                alt={product?.title || "product-img"}
                fill
                className="object-contain"
              />
            </div>
            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md z-10  transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md z-10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Product Details */}
          <div className="md:w-1/2 w-full p-6 flex flex-col justify-between overflow-y-auto max-h-[420px]">
            {/* Header with Close Button */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {product.title.split(" ").slice(0, 5).join(" ")}
                </h2>
                {product.brand && (
                  <Link
                    href={`/brands/${product.brandId}`}
                    onClick={() => {
                      handleClose();
                    }}
                  >
                    <p className="text-md font-semibold text-gray-600 uppercase mb-2">
                      {typeof product.brand === "object"
                        ? product.brand.name
                        : product.brand}
                    </p>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xl text-gray-900 font-semibold">
                    Rs. {product.basePrice}
                  </p>
                  {product.mrp && product.mrp > product.basePrice && (
                    <>
                      <p className="text-md text-gray-500 line-through">
                        Rs. {product.mrp}
                      </p>
                      {product.discountPercentage > 0 && (
                        <p className="text-sm text-[#ac9ffc] font-medium">
                          ({product.discountPercentage}% OFF)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8   flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-gray-600 mb-1 text-sm leading-snug">
                {product.description?.split(" ").slice(0, 10).join(" ") +
                  (product.description?.split(" ").length > 10 ? "..." : "")}
              </p>
              <Link
                href={`/products/${product.slug || product.id}`}
                //target="_blank"
                //rel="noopener noreferrer"
                onClick={() => {
                  localStorage.setItem("ProductId", product.id);
                  handleClose();
                }}
                className="text-sm text-[#ac9ffc] underline font-[500] inline-block mt-1"
              >
                VIEW DETAILS
              </Link>
            </div>

            {/* Size Selection */}
            {showSizeColorOptions && sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-black font-medium mb-2 text-sm">
                  Size: {selectedSize || "Select a size"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => {
                        setSelectedSize(size.value);
                        setSelectedColor(null); // Reset color when size changes
                      }}
                      disabled={!size.available}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-all ${
                        selectedSize === size.value
                          ? "bg-black text-white border-black"
                          : size.available
                            ? "bg-white text-black border-gray-300 hover:border-black"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {showSizeColorOptions && colorsForSelectedSize.length > 0 && (
              <div className="mb-4">
                <label className="block text-black font-medium mb-2 text-sm">
                  Color: {selectedColor || "Select a color"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorsForSelectedSize.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      disabled={!color.available}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-all ${
                        selectedColor === color.value
                          ? "bg-black text-white border-black"
                          : color.available
                            ? "bg-white text-black border-gray-300 hover:border-black"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Message Display */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-md text-sm font-medium text-center ${
                  messageType === "success"
                    ? "text-[#ac9ffc]"
                    : "text-[#ac9ffc]"
                }`}
              >
                {message}
              </div>
            )}

            {/* Buttons in one row */}
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={loading}
                className="flex-1 bg-black border border-black text-white py-2 px-5 rounded-md hover:bg-gray-800 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Adding..."
                  : showSizeColorOptions
                    ? "Add to Bag"
                    : "Add to Cart"} 
              </button>

              <button
                onClick={handleBuyNow}
                disabled={loading}
                className="flex-1 bg-white border border-black text-black py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
