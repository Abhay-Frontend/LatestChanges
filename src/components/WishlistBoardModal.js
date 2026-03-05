"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import useAddProductToBoard from "@/hooks/useAddProductToBoard";
import useCreateBoard from "@/hooks/useCreateBoard";
import useGetBoard from "@/hooks/useGetBoard";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import Image from "next/image";
import { closeWishlistModal } from "@/redux/slices/loginmodalSlice";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";

const CreateBoardModal = ({ productData, onClose }) => {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Static suggestions
  const BOARD_SUGGESTIONS = ["tshirt", "jacket", "sweatshirt"];

  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.modal.wishlistModal); // Update selector to match slice

  useEffect(() => {
    if (isOpen && productData && typeof window !== "undefined" && window.fbq) {
      window.fbq('trackCustom', 'WishlistModalOpen', {
        product_name: productData.title,
        product_id: productData.id
      });
    }
  }, [isOpen]);
  const handleClose = () => {
    dispatch(closeWishlistModal());
    onClose(); // Call the onClose prop to reset the card's state
  };
  const user = useSelector((state) => state.user.userInfo);

  const {
    addProductToBoard,
    loading: addProductLoading,
    error: addProductError,
  } = useAddProductToBoard();
  const {
    createBoard,
    loading: createBoardLoading,
    error: createBoardError,
  } = useCreateBoard();

  const query = user?.id;
  const { data: getBoards, refetch: fetchBoards } = useGetBoard(query);

  const handleCreateBoard = async () => {
    //  Check if user exists BEFORE creating payload
    if (!user?.id) {
      toast.error("Please login to create a board");
      return; 
    }
    if (!newBoardName.trim()) return;

    setIsCreating(true);
    try {
      const userId = user?.id;
      const payload = {
        userId: parseInt(userId, 10),
        name: newBoardName.trim(),
      };

      const response = await createBoard(payload);
      setNewBoardName("");
      toast.success(response?.data?.message || "Board created successfully!");

      // refresh list
      fetchBoards();
    } catch (error) {
      const apiMessage = error?.response?.data?.message;

      if (apiMessage === "Unauthorized!" || error?.response?.status === 401) {
        toast.error("Please login to create a board");
      } else {
        toast.error(apiMessage || "Something went wrong. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = async () => {
    if (!user?.id) {
      toast.error("Please login to save to wishlist");
      return;
    }
    if ((!selectedBoard && !selectedSuggestion) || !productData) return;

    setIsAddingProduct(true);
    try {
      let boardId;

      // If a suggestion is selected, create the board first
      if (selectedSuggestion) {
        const userId = user?.id;
        const createPayload = {
          userId: parseInt(userId, 10),
          name: selectedSuggestion,
        };

        const createResponse = await createBoard(createPayload);

        if (createResponse?.status !== 201 && createResponse?.status !== 200) {
          toast.error("Failed to create board");
          setIsAddingProduct(false);
          return;
        }

        // Refetch boards directly to get the newly created board with ID
        try {
          const endPoint = `${endPoints.getBoards}/${userId}`;
          const result = await axiosHttp.get(endPoint);

          if (result?.status === 200 && result?.data?.data) {
            // Find the newly created board by name
            const newBoard = result.data.data.find(
              (board) =>
                board.name.toLowerCase() === selectedSuggestion.toLowerCase(),
            );

            if (newBoard?.id) {
              boardId = newBoard.id;
              fetchBoards(); // Update the local state for UI
            } else {
              toast.error("Failed to find created board");
              setIsAddingProduct(false);
              return;
            }
          } else {
            toast.error("Failed to fetch updated boards");
            setIsAddingProduct(false);
            return;
          }
        } catch (err) {
          toast.error("Failed to fetch updated boards");
          setIsAddingProduct(false);
          return;
        }
      } else {
        // Use existing selected board
        boardId = selectedBoard.id;
      }

      // Add product to board
      const response = await addProductToBoard(boardId, productData);

      if (response?.success) {
        // ✅ META PIXEL: Track successful addition to Wishlist
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq('track', 'AddToWishlist', {
            content_ids: [productData.id ? productData.id.toString() : ""],
            content_name: productData.title,
            content_category: typeof productData.brand === 'object' ? productData.brand?.name : productData.brand,
            value: parseFloat(productData.basePrice) || 0,
            currency: 'INR'
          });
        }
        toast.success(response.message || "Added to board successfully");
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        toast.error(response?.message || "Failed to add product to board");
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to add product to board");
      setTimeout(() => {
        handleClose();
      }, 2000);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleBoardSelect = (board) => {
    setSelectedBoard((prev) => (prev?.id === board.id ? null : board));
    setSelectedSuggestion(null); // Clear suggestion selection
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion((prev) => (prev === suggestion ? null : suggestion));
    setSelectedBoard(null); // Clear board selection
  };

  // Filter suggestions that don't already exist as boards
  const availableSuggestions = BOARD_SUGGESTIONS.filter((suggestion) => {
    return !getBoards?.some(
      (board) => board.name.toLowerCase() === suggestion.toLowerCase(),
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px] flex items-center justify-center min-h-screen p-4">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-3xl mx-auto flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[500px]">
        {/* Left Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                CREATE BOARD
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                Create your own collection
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Create New Board Section */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3">
              Create New Board
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Write Name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400 text-black"
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              />
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim() || isCreating}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={16} />
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>

          {/* Or Divider */}
          <div className="flex items-start justify-start mb-1 md:mb-2">
            <span className="text-xs md:text-sm text-black font-medium">
              OR
            </span>
          </div>
          {/* Existing Boards */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3">
              Select Existing Board
            </h3>
            <div className="space-y-2">
              {!getBoards ? (
                <div className="text-center py-4 text-gray-500">
                  Loading boards...
                </div>
              ) : getBoards.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No boards found
                </div>
              ) : (
                getBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => handleBoardSelect(board)}
                    className={`flex items-center gap-2 p-[8px] border cursor-pointer transition-colors ${
                      selectedBoard?.id === board.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="text-xs md:text-sm font-medium text-gray-900">
                        {board.name}
                      </h4>
                    </div>
                    <span className="text-xs md:text-sm text-gray-400">
                      {board.productCount || 0}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suggestions */}
          {availableSuggestions.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3">
                Suggestions
              </h3>
              <div className="space-y-2">
                {availableSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`flex items-center gap-2 p-[8px] border cursor-pointer transition-colors ${
                      selectedSuggestion === suggestion
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="text-xs md:text-sm font-medium text-gray-900 capitalize">
                        {suggestion}
                      </h4>
                    </div>
                    <span className="text-xs md:text-sm text-gray-400">0</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={
              (!selectedBoard && !selectedSuggestion) ||
              isAddingProduct ||
              addProductLoading
            }
            className="w-full bg-gray-900 text-white py-2 md:py-3 text-sm md:text-base font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAddingProduct || addProductLoading
              ? "Adding Product..."
              : "Continue"}
          </button>
        </div>

        {/* Right Panel - Product Preview */}
        <div className="w-full md:w-80 bg-gray-50 p-4 flex flex-col border-t md:border-t-0 md:border-l border-gray-200">
          {productData ? (
            <div className="flex flex-col max-h-full">
              <div className="flex-shrink-0 mb-3 md:mb-4 flex items-center justify-center">
                {productData.imageUrls?.[0] ? (
                  <Image
                    src={productData.imageUrls[0]}
                    alt={productData.title || "Product Image"}
                    width={250}
                    height={250}
                    className="object-contain max-w-full max-h-[180px] md:max-h-[350px]"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                    No image available
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                {productData.rating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs md:text-sm font-medium text-black">
                        {productData.rating}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < Math.floor(productData.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {productData.reviewCount > 0 && (
                      <span className="text-xs text-gray-500">
                        | {productData.reviewCount}
                      </span>
                    )}
                  </div>
                )}

                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                  {typeof productData.brand === "object"
                    ? productData.brand?.name ||
                      productData.brand?.businessName ||
                      ""
                    : productData.brand}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                  {productData.title}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      Rs. {productData.basePrice}
                    </span>
                    {(() => {
                      const basePrice = Number(productData.basePrice);
                      const mrp = Number(productData.mrp);

                      const showDiscount = mrp > 0 && basePrice < mrp;

                      const discountPercentage = showDiscount
                        ? Math.round(((mrp - basePrice) / mrp) * 100)
                        : 0;

                      return showDiscount ? (
                        <>
                          <span className="text-xs md:text-sm text-gray-500 line-through">
                            Rs. {mrp}
                          </span>
                          <span className="text-xs md:text-sm text-green-600 font-medium">
                            ({discountPercentage}% OFF)
                          </span>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No product selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBoardModal;
