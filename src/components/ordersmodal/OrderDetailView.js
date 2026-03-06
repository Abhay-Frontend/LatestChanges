import React, { useState, useEffect } from "react";
import { ArrowLeft, Package, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import {
  openReturnModal,
  openCancelModal,
  openExchangeModal,
} from "@/redux/slices/loginmodalSlice";
import Link from "next/link";

const OrderDetailView = ({ orderId, onBack, axiosHttp }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosHttp.get(`/view-order-history/${orderId}`);
        if (response.data.status === 200) {
          setOrderData(response.data.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, axiosHttp]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusSteps = (status) => {
    const lower = status?.toLowerCase() || "";

    // Normal flow (for most orders)
    const steps = [
      { key: "confirmed", labels: ["order confirmed", "confirmed"] },
      {
        key: "shipped",
        labels: [
          "shipped",
          "in transit",
          "handover to courier",
          "shipment booked",
        ],
      },
      { key: "out_for_delivery", labels: ["out for delivery"] },
      { key: "delivered", labels: ["delivered", "partial_delivered"] },
    ];

    // Cancelled before dispatch
    if (
      [
        "cancelled",
        "canceled",
        "cancellation requested",
        "cancelled_before_dispatched",
      ].includes(lower)
    ) {
      return [
        {
          label: "Order Confirmed",
          date: orderData?.order?.orderedAt,
          active: true,
          completed: true,
        },
        {
          label: "Cancelled",
          date: orderData?.cancelledAt,
          active: true,
          completed: true,
          isCancelled: true,
        },
      ];
    }

    // RTO Flow
    if (
      [
        "rto initiated",
        "rto delivered",
        "rto_ofd",
        "rto_ndr",
        "rto in intransit",
      ].includes(lower)
    ) {
      return [
        {
          label: "Shipped",
          active: true,
          completed: true,
        },
        {
          label: "RTO Initiated",
          active: true,
          completed: ["rto delivered"].includes(lower),
        },
        {
          label: "Returned to Seller",
          active: ["rto delivered"].includes(lower),
          completed: ["rto delivered"].includes(lower),
        },
      ];
    }

    let finalSteps = [];

    steps.forEach((step, index) => {
      let isCompleted = step.labels.includes(lower);
      let isActive =
        step.labels.includes(lower) ||
        (index === 0 && !step.labels.includes(lower));

      finalSteps.push({
        label:
          step.key === "confirmed"
            ? "Order Confirmed"
            : step.key === "shipped"
              ? "Shipped"
              : step.key === "out_for_delivery"
                ? "Out For Delivery"
                : "Delivered",
        date: step.key === "delivered" ? orderData?.order?.deliveredAt : null,
        active: isActive,
        completed: isCompleted,
      });
    });

    return finalSteps;
  };

  const getActionButtons = (status) => {
    const lower = status?.toLowerCase() || "";

    if (lower === "delivered") {
      return [
        { label: "Return", action: "return" },
        { label: "Exchange", action: "exchange" },
      ];
    }

    if (
      lower === "confirmed" ||
      lower === "order confirmed" ||
      lower === "shipped"
    ) {
      return [{ label: "Cancel Item", action: "cancel" }];
    }

    if (lower === "cancelled") {
      return [
        {
          label: "Refund",
          action: "refund",
          info: orderData?.order?.deliveredAt,
        },
      ];
    }

    return [];
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-center text-gray-600">Order not found</p>
      </div>
    );
  }

  const { product, order, quantity, total, status } = orderData;
  const statusSteps = getStatusSteps(status);
  const actionButtons = getActionButtons(status);

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <p className="text-sm text-gray-600">
          Order ID:{" "}
          <span className="font-semibold text-gray-900">#{order?.id}</span>
        </p>
      </div>

      {/* Product Card */}
      <Link href={`/products/${product.slug || product.id}`} className="bg-white  p-4 mb-6">
        <div className="flex gap-4">
          <Image
            src={product?.imageUrls?.[0] || "/placeholder.jpg"}
            alt={product?.title}
            width={80}
            height={80}
            className=" object-cover rounded border "
          />
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 mb-1">
              {product?.title}
            </h2>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {product?.shortDescription ||
                product?.description?.substring(0, 100)}
            </p>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>
                Qty: <span className="font-medium">{quantity}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Delivery Estimate */}
      {/* Order Info */}
      <div className="bg-white p-2 mb-2">
        <p className="text-gray-900 font-medium mb-1">
          Ordered At {formatDate(orderData?.createdAt)}
        </p>
      </div>

      {/* Order Progress */}
      {/* Order Status & Tracking */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium capitalize text-gray-800">
              {status}
            </span>
          </div>

          {/* Tracking */}
          {orderData?.trackURL && orderData.trackURL.trim() !== "" ? (
            orderData.trackURL.startsWith("http://") ||
            orderData.trackURL.startsWith("https://") ? (
              <a
                href={orderData.trackURL}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Track Order
              </a>
            ) : (
              <span className="text-sm text-gray-700 font-medium">
                Estimated Delivery: {formatDate(orderData.trackURL)}
              </span>
            )
          ) : (
            <span className="text-sm text-orange-600 font-medium"></span>
          )}
        </div>

        {/* ✅ ACTION BUTTONS KEPT */}
        {actionButtons.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-3">
              {actionButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (button.action === "cancel") {
                      dispatch(openCancelModal(orderData));
                    }
                    if (button.action === "return") {
                      dispatch(openReturnModal(orderData));
                    }
                    if (button.action === "exchange") {
                      dispatch(openExchangeModal(orderData));
                    }
                  }}
                  className="flex-1 py-3 text-sm font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {button.label}
                  {button.info && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {formatDate(button.info)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">SUMMARY</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Details - Empty for now */}
          <div>
            <h4 className="font-medium text-gray-900  mb-3">
              DELIVERY DETAILS
            </h4>

            {order?.user_address ? (
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  {order.user_address.contactName}
                </p>
                <p>
                  {order.user_address.line1}
                  {order.user_address.line2 && `, ${order.user_address.line2}`}
                </p>
                <p>
                  {order.user_address.city}, {order.user_address.state} -{" "}
                  {order.user_address.postalCode}
                </p>
                <p>{order.user_address.country}</p>
                <p className="mt-2">
                  Phone:{" "}
                  <span className="font-medium">
                    {order.user_address.contactPhone}
                  </span>
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  Address Type: {order.user_address.type}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No address found</p>
            )}
          </div>

          {/* Price Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">PRICE DETAILS</h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total MRP</span>
                <span className="font-medium text-black">
                  - ₹{order?.totalMRP || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Item Total</span>
                <span className="font-medium text-gray-900">
                  ₹{orderData?.unitPrice || "0.00"}
                </span>
              </div>

              {orderData?.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-[#9c90ff]">
                    - ₹{orderData?.discount || "0.00"}
                  </span>
                </div>
              )}

              {/* <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">
                  ₹{orderData?.tax || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  ₹{orderData?.shippingCost || "0.00"}
                </span>
              </div> */}

              <div className="flex justify-between pt-3 mt-2 border-t border-gray-200 font-semibold text-base">
                <span className="text-gray-900">TOTAL PAYABLE</span>
                <span className="text-gray-900">₹{orderData?.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;
