"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import AddressModal from "@/components/AddressModal";
import DeleteConfirmModal from "@/components/DeleteModal";
import axiosHttp from "@/utils/axioshttp";
import toast from "react-hot-toast";
import { Edit2, Trash2 } from "lucide-react";

const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;
  const router = useRouter();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!userId) {
      router.push("/"); // Redirect to home or login page
    }
  }, [userId, router]);

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
      }
    } catch (error) {}
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (addressId) => {
    setDeletingAddressId(addressId);
    setIsDeleteModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    try {
      if (editingAddress) {
        const response = await axiosHttp.put(`/profile/address/`, {
          ...formData,
          addressId: editingAddress.id,
        });
        if (response.data.status === 200) {
          fetchAddresses();
          setIsAddressModalOpen(false);
        }
      } else {
        const response = await axiosHttp.post(`/profile/address/`, formData);
        if (response.data.status === 200 || response.data.status === 201) {
          fetchAddresses();
          setIsAddressModalOpen(false);
        }
      }
    } catch (error) {
      toast.error("Failed to save address. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosHttp.delete(
        `/profile/address/${deletingAddressId}`,
      );
      if (response.data.status === 200) {
        fetchAddresses();
        setIsDeleteModalOpen(false);
        setDeletingAddressId(null);
        if (selectedAddressId === deletingAddressId) {
          setSelectedAddressId(null);
        }
      }
    } catch (error) {
      toast.error(
        "Failed to delete. This address is linked to an existing order.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white    p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-black">Saved Addresses</h2>
      </div>

      {/* Default Address Section */}
      {addresses.filter((addr) => addr.isDefaultAddress).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Default Address
          </h3>
          {addresses
            .filter((addr) => addr.isDefaultAddress)
            .map((address) => (
              <div
                key={address.id}
                className="border-b border-gray-300    p-6 mb-4"
              >
                <div className="flex items-start gap-4">
                  {/* Radio Button */}
                  <div className="mt-1">
                    <div className="w-5 h-5 rounded-full border-2 border-black bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Address Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-black text-lg mb-2">
                      {address.type || "Home"}
                    </h4>
                    <h4 className="font-semibold text-black text-lg mb-2">
                      {address.state || "Home"}
                    </h4>

                    <p className="text-gray-700 mb-3">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Mobile:</span>{" "}
                      {address.contactPhone}
                    </p>
                  </div>

                  {/* Edit and Remove Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="text-black hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={16} />
                      <span className="text-sm">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Other Address Section */}
      {addresses.filter((addr) => !addr.isDefaultAddress).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Other Address
          </h3>
          {addresses
            .filter((addr) => !addr.isDefaultAddress)
            .map((address) => (
              <div
                key={address.id}
                className="border-b border-gray-300 p-6 mb-4"
              >
                <div className="flex items-start gap-4">
                  {/* Removed the disc/radio button */}

                  {/* Address Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-black text-lg mb-2">
                      {address.type || "Home"}
                    </h4>
                    <h4 className="font-semibold text-black text-lg mb-2">
                      {address.state || "Home"}
                    </h4>

                    <p className="text-gray-700 mb-3">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Mobile:</span>{" "}
                      {address.contactPhone}
                    </p>
                  </div>

                  {/* Edit and Remove Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="text-black hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={16} />
                      <span className="text-sm">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* No Addresses Message */}
      {addresses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6 text-lg">No saved addresses found</p>
          <button
            onClick={handleAddNewAddress}
            className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 cursor-pointer"
          >
            + Add New Address
          </button>
        </div>
      )}

      {/* Add New Address Button (when addresses exist) */}
      {addresses.length > 0 && (
        <button
          onClick={handleAddNewAddress}
          className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-600    hover:border-gray-400 hover:text-gray-800 font-medium cursor-pointer"
        >
          + Add New Address
        </button>
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAddressId(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SavedAddresses;
