"use client";
import React, { useState } from "react";
import Link from "next/link"; // ✅ Import Link
import Image from "next/image";

const BoardCard = ({ board, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(board.name);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEditClick = () => {
    localStorage.setItem("selectedBoardId", board.id);
    setIsEditing(true);
  };

  const handleShowDelete = () => {
    localStorage.setItem("selectedBoardId", board.id);
    setShowDelete(true);
  };

  const handleSave = async () => {
    if (!editedName.trim() || editedName === board.name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    await onUpdate(editedName);
    setLoading(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(board.id);
    setLoading(false);
    setShowDelete(false);
  };

  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-lg shadow-md">
        <div className="aspect-[4/5] relative">
          {/* ✅ Wrap image with Link */}
          <Link href={`/wishlist-board-products/${board.id}`}
          onClick={() => {
              // ✅ META PIXEL: Track viewing a specific wishlist board
              if (typeof window !== "undefined" && window.fbq) {
                window.fbq('trackCustom', 'ViewBoardDetails', {
                  board_name: board.name,
                  board_id: board.id,
                  content_count: board.productCount
                });
              }
            }}>
            <Image
              src={
                board.thumbnail ||
                "https://cdn.shopify.com/s/files/1/0553/6186/3863/products/0I1A7431copy-pichi.jpg?v=1617715629"
              }
              alt={board.name}
              fill
              className="w-full h-full object-fill cursor-pointer"
            />
          </Link>

          {/* Delete button */}
          <button
            onClick={handleShowDelete}
            className="absolute cursor-pointer top-4 right-4 bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 z-20"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          {/* Delete confirmation */}
          {showDelete && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 rounded-lg">
              <div className="text-center px-6">
                <h3 className="text-white text-lg font-semibold mb-2">
                  Delete This Board?
                </h3>
                <p className="text-white text-sm mb-6">
                  This board will be deleted permanently.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="px-6 py-2 cursor-pointer text-white hover:text-gray-200 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-6 py-2 border-2 border-white text-white rounded-md hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board Info */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black text-black"
                autoFocus
                required
                placeholder="Enter board name"
              />
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg text-black">{board.name}</h3>
              <p className="text-sm text-gray-600">
                {board.productCount} Items
              </p>
            </div>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="ml-2 p-2 cursor-pointer rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default BoardCard;
