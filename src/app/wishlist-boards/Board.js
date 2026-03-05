"use client";
import NewBoardModal from "@/components/BoardModal";
import BoardCard from "@/components/WishlistBoardCard";
import useGetBoard from "@/hooks/useGetBoard";
import useCreateBoard from "@/hooks/useCreateBoard"; // ✅ import the hook
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Image from "next/image";

const WishlistBoards = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;
  const query = userId;
  const getBoards = useGetBoard(query);

  const { createBoard, loading: creating } = useCreateBoard();

  const boards = getBoards?.data || [];
  const loading = !getBoards?.data;

  // ✅ call API from main component
  const handleCreateBoard = async (boardName) => {
    // Check if query (userId) exists
    if (!query) {
      toast.error("Please login to create a board");
      return;
    }
    try {
      await createBoard({ userId: query, name: boardName });

      // ✅ META PIXEL: Track Create Wishlist
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq('trackCustom', 'CreateWishlistBoard', {
          wishlist_name: boardName
        });
      }

      getBoards?.refetch(); // refresh list
      setIsModalOpen(false); // close modal
    } catch (error) {
      const apiMessage = error?.response?.data?.message;

      if (apiMessage === "Unauthorized!") {
        toast.error("Please login to create a board");
      } else {
        toast.error(apiMessage || "Something went wrong. Please try again.");
      }
    }
  };

  const handleUpdateBoard = async (newName) => {
    try {
      const selectedBoardId = localStorage.getItem("selectedBoardId");
      if (!selectedBoardId) return;

      await axiosHttp.patch(`${endPoints.editBoard}/${selectedBoardId}`, {
        name: newName,
      });
      getBoards?.refetch();
    } catch (error) {}
  };

  const handleDeleteBoard = async () => {
    try {
      const selectedBoardId = localStorage.getItem("selectedBoardId");
      if (!selectedBoardId) return;

      await axiosHttp.delete(`${endPoints.deleteBoard}/${selectedBoardId}`);
      getBoards?.refetch();
    } catch (error) {}
  };

  return (
    <div className="min-h-screen bg-white p-6 mt-[130px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black">WISHLIST</h1>
            <p className="text-gray-600">{boards.length} Boards</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black cursor-pointer transition-colors"
          >
            <span className="text-xl text-black">+</span>
            <span className="text-black">New Board</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            Loading boards...
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10">
            <div className="relative w-64 h-64 mb-4">
              <Image
                src="/images/emptywishlist.png"
                alt="No boards found"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-center text-gray-500">No boards found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onUpdate={handleUpdateBoard}
                onDelete={handleDeleteBoard}
              />
            ))}
          </div>
        )}
      </div>

      <NewBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateBoard={handleCreateBoard} // ✅ pass handler from main
        loading={creating} // show creating state
      />
    </div>
  );
};

export default WishlistBoards;
