"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import OrderSummary from "@/components/OrderSummary";
import AddressCard from "@/components/AddressCard";
import AddressModal from "@/components/AddressModal";
import DeleteConfirmModal from "@/components/DeleteModal";
import PaymentStatusModal from "@/components/ordersmodal/PayementConfirmationModal";
import axiosHttp from "@/utils/axioshttp";
import Link from "next/link";
import Footer from "@/components/footer";
import toast from "react-hot-toast";

const CheckOutAddress = () => {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [orderTotal, setOrderTotal] = useState(0);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState({});

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  const checkoutSessionId =
    typeof window !== "undefined"
      ? localStorage.getItem("checkoutSessionId")
      : null;

  /* -------------------- Razorpay Script -------------------- */

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  /* -------------------- Session Guard -------------------- */

  useEffect(() => {
    if (!checkoutSessionId) {
      toast.error("Checkout session expired.");
      router.push("/checkout/bag");
    }
  }, []);

  /* -------------------- Fetch Addresses -------------------- */

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const res = await axiosHttp.get(`/profile/addresses/${userId}`);

      if (res.data.status === 200) {
        setAddresses(res.data.data);

        const defaultAddress = res.data.data.find(
          (addr) => addr.isDefaultAddress
        );

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchCheckoutSession = async () => {
    try {
      const res = await axiosHttp.get(`/checkout/session/${checkoutSessionId}`);

      if (res.data?.data?.items) {
        setProducts(res.data.data.items);
        setOrderTotal(res.data.data.totalPayable);
      }
    } catch (error) {
      if (error?.response?.status === 410) {
        toast.error("Checkout session expired");
        localStorage.removeItem("checkoutSessionId");
        router.push("/checkout/bag");
      }
    }
  };

  if (checkoutSessionId) fetchCheckoutSession();
}, []);

  /* -------------------- Meta Pixel: InitiateCheckout -------------------- */

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq && products.length) {
      window.fbq("track", "InitiateCheckout", {
        content_ids: products.map((p) => p.productId?.toString()),
        content_type: "product",
        value: orderTotal,
        currency: "INR",
        num_items: products.reduce((s, p) => s + (p.quantity || 1), 0),
      });
    }
  }, [products, orderTotal]);

  /* -------------------- Address CRUD -------------------- */

  const handleSaveAddress = async (formData) => {
    try {
      if (editingAddress) {
        await axiosHttp.put(`/profile/address/`, {
          ...formData,
          addressId: editingAddress.id,
        });
      } else {
        await axiosHttp.post(`/profile/address/`, formData);
      }

      fetchAddresses();
      setIsAddressModalOpen(false);
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);

      await axiosHttp.delete(`/profile/address/${deletingAddressId}`);

      fetchAddresses();

      setIsDeleteModalOpen(false);
      setDeletingAddressId(null);
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* -------------------- Bind Checkout Address -------------------- */

  const bindCheckoutAddress = async () => {
    try {
      if (!selectedAddressId) {
        toast.error("Please select address");
        return false;
      }

      const res = await axiosHttp.post("/checkout/address", {
        checkoutSessionId,
        addressId: selectedAddressId,
      });

      // Return the full data object which includes final total and providerOrderId
      return res.data?.success ? res.data.data:null;
    } catch (error) {
      if (error?.response?.status === 410) {
        toast.error("Checkout session expired.");
        localStorage.removeItem("checkoutSessionId");
        router.push("/checkout/bag");
      }

      return false;
    }
  };

  /* -------------------- Razorpay Payment -------------------- */

  const handleRazorpayPayment = async () => {
  // Step 2: Bind Address and get Session Data (Final Price + Order ID)
  // I updated bindCheckoutAddress to return the full 'data' object from backend
  const sessionData = await bindCheckoutAddress(); 
  
  if (!sessionData) return;

  // Destructure the values returned by /checkout/address
  const { totalPayable, providerOrderId } = sessionData;

  if (!razorpayLoaded || !window.Razorpay) {
    toast.error("Payment gateway loading...");
    return;
  }

  /* -------- Meta Pixel AddPaymentInfo -------- */
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddPaymentInfo", {
      content_ids: products.map((p) => p.productId?.toString()),
      content_type: "product",
      value: totalPayable, // Use backend total
      currency: "INR",
    });
  }

  try {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID;

    const options = {
      key: razorpayKey,
      amount: Math.round(totalPayable * 100), // Final amount from backend (in paise)
      currency: "INR",
      name: "LaFetch",
      description: "Order Payment",
      order_id: providerOrderId, // CRITICAL: Use the order_id generated by backend
      image: "/logo.png",
      prefill: {
        name: userInfo?.fullName || "",
        email: userInfo?.email || "",
        contact: userInfo?.phone || "",
      },
      handler: async function (response) {
        try {
          // Step 3: Confirm Order with Session ID
          const confirmResp = await axiosHttp.post(
            "/checkout/confirm",
            {
              checkoutSessionId,
              paymentInfo: {
                method: "razorpay",
                providerPaymentId: response.razorpay_payment_id,
                providerOrderId: response.razorpay_order_id,
              },
            }
          );

          if (confirmResp.data?.success) {
            /* -------- Meta Pixel Purchase -------- */
            if (typeof window !== "undefined" && window.fbq) {
              window.fbq("track", "Purchase", {
                content_ids: products.map((p) => p.productId?.toString()),
                contents: products.map((p) => ({
                  id: p.productId?.toString(),
                  quantity: p.quantity || 1,
                  item_price: p.price,
                })),
                value: totalPayable,
                currency: "INR",
                num_items: products.reduce((sum, p) => sum + (p.quantity || 1), 0),
                transaction_id: response.razorpay_payment_id,
              });
            }

            localStorage.removeItem("checkoutSessionId");

            setPaymentModalData({
              status: "success",
              transactionId: response.razorpay_payment_id,
              paymentMethod: "Razorpay",
              dateTime: new Date().toLocaleString(),
              amountPaid: totalPayable,
            });

            setIsPaymentModalOpen(true);
          }
        } catch (error) {
          toast.error("Payment successful but order confirmation failed. Please contact support.");
        }
      },
      modal: {
        ondismiss: function () {
          toast.error("Payment cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      setPaymentModalData({
        status: "failed",
        transactionId: "N/A",
        paymentMethod: "Razorpay",
        dateTime: new Date().toLocaleString(),
        amountPaid: 0,
      });
      setIsPaymentModalOpen(true);
    });

    rzp.open();
  } catch (error) {
    toast.error("Could not start payment");
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[130px] py-8">
      <div className="max-w-7xl mx-auto px-4">

        <div className="mb-8 flex justify-center gap-2 text-sm">
          <Link href="/checkout/bag">BAG</Link>
          <span>----</span>
          <span className="font-bold underline">ADDRESS</span>
          <span>----</span>
          <span>PAYMENT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">SELECT ADDRESS</h2>

              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="border px-4 py-2"
              >
                + Add Address
              </button>
            </div>

            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddressId === address.id}
                onSelect={() => setSelectedAddressId(address.id)}
                onEdit={() => {
                  setEditingAddress(address);
                  setIsAddressModalOpen(true);
                }}
                onDelete={() => {
                  setDeletingAddressId(address.id);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}

          </div>

          <div>

            <OrderSummary
              products={products}
              session={{
                subtotal: orderTotal,
                totalPayable: orderTotal,
                totalMrp: orderTotal,
                discount: 0
              }}
              onAmountChange={(amount) => setOrderTotal(amount)}
            />

            <button
              onClick={handleRazorpayPayment}
              disabled={!razorpayLoaded}
              className="mt-6 w-full bg-black text-white py-3"
            >
              {razorpayLoaded
                ? "Proceed to Pay"
                : "Loading Payment Gateway"}
            </button>

          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      <PaymentStatusModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        {...paymentModalData}
        onTrackOrder={() => router.push("/account/orders")}
        onContinueShopping={() => router.push("/products")}
      />

      <Footer />
    </div>
  );
};

export default CheckOutAddress;
