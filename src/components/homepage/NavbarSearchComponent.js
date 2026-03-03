"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axiosHttp from "@/utils/axioshttp";
import { addSearch } from "@/redux/slices/searchSlice";
import useCollection from "@/hooks/useCollection";

export default function NavbarSearchComponent({
  searchQuery,
  setSearchQuery,
  isOpen,
  setIsOpen,
}) {
  const searchDropdownRef = useRef(null);
  const recentSearches = useSelector((state) => state.search.recentSearches);
  const dispatch = useDispatch();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const trendingSearches = ["Valentines fits", "For Office", "Vacation Wear"];
  const { data: collections } = useCollection("displayFor=homepage");

  const trendingCollection = collections?.find(
    (col) => col.name === "Trending Now"
  );

  const trendingProducts = trendingCollection?.products?.slice(0, 4) || [];


  // Fetch suggestions on search query change
  useEffect(() => {
    if (!searchQuery.trim()) return setSuggestions([]);

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await axiosHttp.post(
          `product-suggestion?key=${searchQuery}`,
        );
        setSuggestions(res.data.data || []);
      } catch (error) {
        setSuggestions([]);
      }
      setIsLoadingSuggestions(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const anchorRef = useRef(null);
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsOpen(false);
      dispatch(addSearch(searchQuery.trim()));
      // Programmatically click the anchor to navigate
      if (anchorRef.current) {
        anchorRef.current.click();
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const trimmedSuggestion = suggestion.trim();
    setIsOpen(false);
    dispatch(addSearch(trimmedSuggestion));
    // Navigation is now handled by anchor tag, so no router.push
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-h-screen bg-white z-[1000] fixed top-12 left-0">
      {/* Search Input Area */}
      <div className="w-full h-auto min-h-20 md:h-24 px-4 sm:px-8 md:px-12 lg:px-16 py-4 md:py-7 bg-white inline-flex justify-between items-center">
        <div className="flex-1 flex justify-start items-center gap-4 md:gap-8 lg:gap-32">
          <div className="hidden sm:flex justify-start items-center gap-4 md:gap-14">
            <div className="w-16 sm:w-20 h-6 sm:h-8 relative">
              <Image
                src="/images/Lafetch Logo.svg"
                alt="Logo"
                width={100}
                height={40}
              />
            </div>
          </div>
          <div className="flex-1 py-0.5 border-b border-stone-950 flex justify-between items-center gap-2">
            <div className="flex-1 flex justify-start items-center gap-1 sm:gap-2">
              <div className="flex justify-start items-center gap-2 sm:gap-5">
                <div className="flex justify-start items-center gap-2 sm:gap-4">
                  <div className="w-6 h-6 sm:w-9 sm:h-9 relative rounded">
                    <Search className="w-4 h-4 sm:w-6 sm:h-6 text-stone-950" />
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search To Explore More"
                className="text-left justify-start text-stone-950 text-xs sm:text-sm font-medium leading-4 border-none outline-none bg-transparent flex-1 min-w-0"
                autoFocus
              />
              {/* Hidden anchor for Enter key navigation */}
              <a
                href={
                  searchQuery.trim()
                    ? `/products?key=${searchQuery.trim()}`
                    : "#"
                }
                ref={anchorRef}
                style={{ display: "none" }}
                tabIndex={-1}
                aria-hidden="true"
              >
                Go
              </a>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-center justify-start text-stone-950 text-xs sm:text-sm font-semibold uppercase leading-4 cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Area */}
      <div
        ref={searchDropdownRef}
        className="w-full px-4 sm:px-8 md:px-16 lg:px-32 xl:px-44 pt-4 sm:pt-7 pb-8 sm:pb-14 bg-stone-50 inline-flex justify-center items-start gap-6 md:gap-10"
      >
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-3.5 max-w-4xl">
          <div className="self-stretch flex flex-col md:inline-flex md:flex-row justify-start items-start gap-6 md:gap-0">
            {/* Recent Searches */}
            <div className="w-full md:w-auto md:pr-8 inline-flex flex-col justify-start items-start gap-3.5">
              <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                {suggestions.length > 0 ? "Suggestions" : "Recent Searches"}
              </div>
              <div className="w-full md:max-w-[500px] inline-flex justify-start items-start gap-2 sm:gap-3.5 flex-wrap content-start">
                {isLoadingSuggestions ? (
                  <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                    Loading...
                  </div>
                ) : suggestions.length > 0 ? (
                  // suggestions.map((suggestion, index) => (
                  //   <a
                  //     key={index}
                  //     href={`/products?key=${suggestion.keyword.trim()}`}
                  //     onClick={() => handleSuggestionClick(suggestion.keyword)}
                  //     className="h-auto sm:h-7 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-zinc-100 rounded flex justify-between items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors min-w-fit"
                  //   >
                  //     <div className="flex justify-center items-start gap-2.5">
                  //       <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                  //         {suggestion.keyword}
                  //       </div>
                  //     </div>
                  //     {/* <div className="text-neutral-500 text-xs sm:text-sm font-normal">
                  //       {suggestion.count}
                  //     </div> */}
                  //   </a>
                  // ))
                  suggestions
                    .filter((s) => s.keyword) // Only keep suggestions with a keyword
                    .map((suggestion, index) => (
                      <a
                        key={index}
                        href={`/products?key=${suggestion.keyword.trim()}`}
                        onClick={() => handleSuggestionClick(suggestion.keyword)}
                        className="h-auto sm:h-7 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-zinc-100 rounded flex justify-between items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors min-w-fit"
                      >
                        <div className="flex justify-center items-start gap-2.5">
                          <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                            {suggestion.keyword}
                          </div>
                        </div>
                        {/* Optional: display count
                      <div className="text-neutral-500 text-xs sm:text-sm font-normal">
                        {suggestion.count}
                      </div> */}
                      </a>
                    ))
                ) : recentSearches.length > 0 ? (
                  recentSearches.map((search, index) => (
                    <a
                      key={index}
                      href={`/products?key=${search.trim()}`}
                      onClick={() => handleSuggestionClick(search)}
                      className="h-auto sm:h-7 px-2 sm:px-2.5 py-1 sm:px-2.5 bg-zinc-100 rounded flex justify-center items-center gap-1 cursor-pointer hover:bg-zinc-200 transition-colors"
                    >
                      <div className="flex justify-center items-start gap-2.5">
                        <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                          {search}
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                    No recent searches
                  </div>
                )}
              </div>
            </div>

            {/* Trending Searches */}
            <div className="w-full md:w-auto md:pl-8 md:border-l-[0.50px] border-stone-950 inline-flex flex-col justify-start items-start gap-3.5">
              <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                Trending Searches
              </div>
              <div className="inline-flex justify-start items-start gap-1">
                <div className="w-full sm:w-56 self-stretch px-3 sm:px-4 py-2.5 sm:py-3.5 bg-zinc-100 flex justify-start items-start gap-2.5">
                  <div className="flex-1 inline-flex flex-col justify-start items-start gap-3.5">
                    <div className="flex flex-col justify-start items-start gap-1.5">
                      {trendingSearches.map((item, index) => (
                        <a
                          key={index}
                          href={`/products?key=${item.trim()}`}
                          onClick={() => handleSuggestionClick(item)}
                          className="inline-flex justify-center items-center gap-2.5 cursor-pointer hover:opacity-70 transition-opacity"
                        >
                          <div className="justify-start text-neutral-700 text-xs sm:text-sm font-normal">
                            {item}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Now Collections Preview */}
        {!searchQuery && trendingCollection && (
          <Link
            href={`/products?collectionId=${trendingCollection.id}`}
            onClick={() => setIsOpen(false)}
            className="hidden lg:flex justify-start items-center gap-3 group"
          >
            {trendingProducts.map((product) => (
              <div
                key={product.id}
                className="w-[110px] h-[130px] relative rounded-xl overflow-hidden"
              >
                <Image
                  src={
                    product.imageUrls?.[0] ||
                    product.image
                  }
                  alt={product.title || product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}

            <div className="absolute bottom-2 left-2 text-white text-xs font-semibold">
              POPULAR CHOICES
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
