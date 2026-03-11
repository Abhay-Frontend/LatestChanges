"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosHttp from "@/utils/axioshttp";
import { toast } from "react-hot-toast";
import { X, ChevronDown } from "lucide-react";
import Image from "next/image";

const ReturnModal = ({ order, onClose = () => {}, onSuccess = () => {} }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReason, setCustomReason] = useState("");

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  const returnReasons = {
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

  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

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

  const handleReturnItem = async () => {
    if (!selectedReason || !selectedAddressId) {
      toast.error("Please select a reason and pickup address");
      return;
    }

    // ✅ Validation for "Other" reason
    if (selectedReason === "Other" && !customReason.trim()) {
      toast.error("Please enter your reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderItemId: order.id,
        userId: userId,
        reason: selectedReason === "Other" ? customReason : selectedReason,
        addressId: selectedAddressId,
        shipRocketId: order.shiprocketOrderId || "",
      };

      const response = await axiosHttp.post("/request-return", payload);

      if (response.data.status === 201) {
        toast.success(response?.data?.message || "Return request submitted!");
        onSuccess();
        onClose();
      } else {
        toast.error(response?.data?.message || "Something went wrong!");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again later.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  );

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-black">
            {order?.product?.title || "Return Item"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
                <span>Size: {order?.size || "N/A"}</span>
                <span>Qty: {order?.quantity || 1}</span>
              </div>
              <p className="font-semibold mt-2 text-black">
                ₹{parseFloat(order?.total || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Reason for Return */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              REASON FOR RETURN
            </label>
            <div className="relative">
              <button
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded text-left flex items-center justify-between hover:border-gray-400 text-black"
              >
                <span className={selectedReason ? "text-black" : "text-black"}>
                  {selectedReason || "Select a reason"}
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
                  {Object.entries(returnReasons).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedReason(value);
                        if (value !== "Other") {
                          setCustomReason("");
                        }
                        setIsReasonDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-black"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}

              {selectedReason === "Other" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1 text-black">
                    Please specify your reason
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Write your reason here..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:border-black"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-black">
                PICKUP ADDRESS
              </label>
              <button
                onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                className="text-xs text-blue-600 hover:underline text-black"
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
                <div className="font-medium text-sm capitalize">
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
                Once the item is picked up and we've reviewed your item, the
                refund will be processed to your original payment method within
                24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded font-medium hover:bg-gray-50 text-black"
          >
            Back
          </button>
          <button
            onClick={handleReturnItem}
            disabled={!selectedReason || !selectedAddressId || isSubmitting}
            className="flex-1 py-3 bg-black text-white rounded font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Return Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
