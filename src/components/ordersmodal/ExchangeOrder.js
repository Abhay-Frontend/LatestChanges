"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { X, ChevronDown } from "lucide-react";
import axiosHttp from "@/utils/axioshttp";
import { toast } from "react-hot-toast";
import SuccessExchangeModal from "./SuccessExchangeModal";
import Image from "next/image";
import { getParsedSelectedOptions } from "@/utils/variantUtils";

const EXCHANGE_REASONS = {
  25: "Other",
  26: "Changed my mind",
  27: "Does not fit",
  28: "Size not as expected",
  29: "Item is damaged",
  30: "Received wrong item",
  31: "Parcel damaged on arrival",
  32: "Quality not as expected",
  33: "Missing item or accessories",
  34: "Performance not adequate",
  35: "Not as described",
  36: "Arrived too late",
};

const ExchangeOrderModal = ({
  order,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [selectedReasonText, setSelectedReasonText] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  if (!order) return null;

  const orderItem = order;
  const product = orderItem.product || {};
  const orderDetails = orderItem.order || {};

  // Fetch addresses
  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  // Fetch product variants
  useEffect(() => {
    if (product?.id) {
      fetchProductVariants();
    }
  }, [product?.id]);

  const fetchAddresses = async () => {
    try {
      const response = await axiosHttp.get(`/profile/addresses/${userId}`);
      if (response.data.status === 200 && response.data.data) {
        setAddresses(response.data.data);
        const defaultAddress = response.data.data.find(
          (addr) => addr.isDefaultAddress
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {}
  };

  const fetchProductVariants = async () => {
    try {
      setLoadingVariants(true);
      const response = await axiosHttp.get(`/product/${product.id}`);
      if (response.data.status === 200 && response.data.data) {
        const rawVariants = response.data.data.variants || [];

        // Map variants with proper structure including stock status
        const mappedVariants = rawVariants.map((variant) => {
          const selectedOptions = getParsedSelectedOptions(
            variant.selectedOptions
          );

          const sizeOption = selectedOptions.find((o) => o.name === "Size");
          const colorOption = selectedOptions.find((o) => o.name === "Color");

          const stock = variant.inventory?.availableStock ?? 0;

          return {
            id: variant.id,
            title: variant.title,
            size: sizeOption?.value || "N/A",
            color: colorOption?.value || "N/A",
            price: variant.price,
            stock: stock,
            hasStock: stock > 0,
            imageSrc: variant.imageSrc,
          };
        });

        setVariants(mappedVariants);
      }
    } catch (error) {
      toast.error("Failed to fetch available variants");
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      toast.error("Please select an exchange reason");
      return;
    }

    if (selectedReasonId === "44" && !customReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    if (!selectedVariantId) {
      toast.error("Please select a variant");
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select a pickup address");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderItemId: orderItem.id,
        userId: userId,
        newVariantId: parseInt(selectedVariantId),
        reason: selectedReasonId,
      };

      const response = await axiosHttp.post(`/request-exchange`, payload);

      if (response.data.status === 200 || response.data.status === 201) {
        setShowSuccessModal(true);
      } else {
        toast.error(response.data.message || "Failed to exchange order");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to exchange order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  );

  const currentVariant = orderItem.variant || {};
  const currentVariantDisplay = `${currentVariant.color || "N/A"} - ${
    currentVariant.size || "N/A"
  }`;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-black">
            {order?.product?.title || "Exchange Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <Image
              src={order?.product?.imageUrls?.[0] || "/placeholder/80/120"}
              alt={order?.product?.title}
              width={80}
              height={112}
              className="w-20 h-28 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1 text-black">
                {order?.product?.title}
              </h3>
              <p className="text-xs text-gray-500 mb-2 text-black">
                {order?.product?.subtitle}
              </p>
              <div className="flex gap-4 text-xs text-black">
                <span>Variant: {currentVariantDisplay}</span>
                <span>Qty: {order?.quantity || 1}</span>
              </div>
              <p className="font-semibold mt-2 text-black">
                ₹{parseFloat(order?.total || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Variant Selection */}
          {/* Variant Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-black">
              CHOOSE NEW VARIANT
            </label>

            {loadingVariants ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : variants.length > 0 ? (
              <div className="space-y-4">
                {/* Size Selection */}
                <div>
                  <label className="block text-xs font-medium mb-2 text-black">
                    SELECT SIZE
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(variants.map((v) => v.size))].map((size) => {
                      const sizeVariants = variants.filter(
                        (v) => v.size === size
                      );
                      const hasAnyStock = sizeVariants.some((v) => v.hasStock);
                      const selectedVariant = variants.find(
                        (v) => v.id.toString() === selectedVariantId
                      );
                      const isSelected = selectedVariant?.size === size;
                      const isCurrent = orderItem.variant?.size === size;

                      return (
                        <button
                          key={size}
                          onClick={() => {
                            if (hasAnyStock) {
                              const availableVariant = sizeVariants.find(
                                (v) => v.hasStock
                              );
                              if (availableVariant) {
                                setSelectedVariantId(
                                  availableVariant.id.toString()
                                );
                              }
                            }
                          }}
                          disabled={!hasAnyStock}
                          className={`
                            px-4 py-2 border-2 rounded font-medium text-sm transition-all
                            ${
                              isSelected
                                ? "bg-pink-500 text-white border-pink-500"
                                : !hasAnyStock
                                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                : "border-black text-black hover:bg-black hover:text-white"
                            }
                          `}
                        >
                          {size}
                          {isCurrent && (
                            <span className="ml-1 text-xs">(Current)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-medium mb-2 text-black">
                    SELECT COLOR
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(variants.map((v) => v.color))].map((color) => {
                      const colorVariants = variants.filter(
                        (v) => v.color === color
                      );
                      const selectedVariant = variants.find(
                        (v) => v.id.toString() === selectedVariantId
                      );
                      const selectedSize = selectedVariant?.size;
                      const matchingVariant = colorVariants.find(
                        (v) => v.size === selectedSize
                      );
                      const hasStock = matchingVariant?.hasStock || false;
                      const isSelected = selectedVariant?.color === color;
                      const isCurrent = orderItem.variant?.color === color;

                      return (
                        <button
                          key={color}
                          onClick={() => {
                            if (selectedSize && matchingVariant && hasStock) {
                              setSelectedVariantId(
                                matchingVariant.id.toString()
                              );
                            }
                          }}
                          disabled={!selectedSize || !hasStock}
                          className={`
                            px-4 py-2 border-2 rounded-full font-medium text-sm transition-all
                            ${
                              isSelected
                                ? "bg-black text-white border-black"
                                : !selectedSize || !hasStock
                                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                : "border-gray-400 text-black hover:border-black"
                            }
                          `}
                        >
                          {color}
                          {isCurrent && (
                            <span className="ml-1 text-xs">(Current)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Variant Info */}
                {selectedVariantId && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">
                      Selected Variant:
                    </div>
                    <div className="font-medium text-sm text-black">
                      {
                        variants.find(
                          (v) => v.id.toString() === selectedVariantId
                        )?.color
                      }{" "}
                      -{" "}
                      {
                        variants.find(
                          (v) => v.id.toString() === selectedVariantId
                        )?.size
                      }
                    </div>
                    <div className="text-sm text-black mt-1">
                      ₹
                      {
                        variants.find(
                          (v) => v.id.toString() === selectedVariantId
                        )?.price
                      }
                    </div>
                    {variants.find((v) => v.id.toString() === selectedVariantId)
                      ?.stock < 5 && (
                      <div className="text-xs text-red-500 font-semibold mt-1">
                        Only{" "}
                        {
                          variants.find(
                            (v) => v.id.toString() === selectedVariantId
                          )?.stock
                        }{" "}
                        left
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No variants available
              </div>
            )}
          </div>

          {/* Reason for Exchange */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              REASON FOR EXCHANGE
            </label>
            <div className="relative">
              <button
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded text-left flex items-center justify-between hover:border-gray-400 text-black"
                disabled={isSubmitting}
              >
                <span className="text-black">
                  {selectedReasonText || "Select a reason"}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${
                    isReasonDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isReasonDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-10">
                  {Object.entries(EXCHANGE_REASONS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedReasonId(key);
                        setSelectedReasonText(value);
                        setIsReasonDropdownOpen(false);
                        if (key !== "44") {
                          setCustomReason("");
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-black"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Reason Input */}
            {selectedReasonId === "44" && (
              <div className="mt-3">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe your reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black text-black"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Pickup Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-black">
                PICKUP ADDRESS
              </label>
              <button
                onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                className="text-xs text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>

            {/* Address Dropdown */}
            {isAddressDropdownOpen && (
              <div className="mb-3 border border-gray-300 rounded max-h-48 overflow-y-auto">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => {
                      setSelectedAddressId(address.id);
                      setIsAddressDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-black hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedAddressId === address.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium text-black text-sm">
                      {address.contactName}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {address.line1}, {address.line2}
                    </div>
                    <div className="text-xs text-black">
                      {address.city}, {address.state} {address.postalCode}
                    </div>
                    <div className="text-xs text-black">
                      {address.contactPhone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Address Display */}
            {selectedAddress && !isAddressDropdownOpen && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-sm capitalize text-black">
                  {selectedAddress.type}
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  {selectedAddress.line1},{" "}
                  {selectedAddress.line2 && `${selectedAddress.line2}, `}
                  close to landmark
                </div>
                <div className="text-xs text-gray-700">
                  {selectedAddress.city}, {selectedAddress.state},{" "}
                  {selectedAddress.country}
                </div>
              </div>
            )}

            {/* Info Text */}
            <div className="flex items-start gap-2 mt-3">
              <div className="w-4 h-4 border border-gray-400 rounded-full flex-shrink-0 mt-0.5"></div>
              <p className="text-xs text-black">
                Your replacement will be shipped once the item passes quality
                check. This typically takes 2-3 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-gray-300 rounded font-medium hover:bg-gray-50 text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !selectedReasonId ||
              !selectedVariantId ||
              !selectedAddressId ||
              isSubmitting ||
              (selectedReasonId === "44" && !customReason.trim())
            }
            className="flex-1 py-3 bg-black text-white rounded font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Exchange Item"}
          </button>
        </div>

        {showSuccessModal && (
          <SuccessExchangeModal
            product={product}
            orderItem={orderItem}
            onClose={() => {
              setShowSuccessModal(false);
              onClose();
              onSuccess();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExchangeOrderModal;
