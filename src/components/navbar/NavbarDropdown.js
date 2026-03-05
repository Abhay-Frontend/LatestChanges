"use client";

import Link from "next/link";
import Image from "next/image";

const NavbarDropdown = ({ menu, latestBlogs, onMouseEnter, onMouseLeave }) => {
  const isBrandsMenu = menu.title.toLowerCase() === "all brands";

  // Determine which images to show based on menu title
  const getCategoryImages = () => {
    const title = menu.title.toLowerCase();

    if (title.includes("women")) {
      return [
        { src: "/images/women-nav-top.png", alt: "Women Category 1" },
        { src: "/images/women-nav1.png", alt: "Women Category 2" },
        { src: "/images/women-nav2.png", alt: "Women Category 3" },
      ];
    } else if (title.includes("men")) {
      return [
        { src: "/images/men-top.png", alt: "Men Category 1" },
        { src: "/images/men-nav2.png", alt: "Men Category 2" },
        { src: "/images/men-nav3.png", alt: "Men Category 3" },
      ];
    } else if (title.includes("essentials")) {
      return [
        { src: "/images/access-nav-top.png", alt: "Accessories Category 1" },
        { src: "/images/access-1.png", alt: "Accessories Category 2" },
        { src: "/images/access-2.png", alt: "Accessories Category 3" },
      ];
    }else if (isBrandsMenu){
      return [
        {src:"/images/brands/brand1.webp", alt:"Sam&Marshal"},
        {src:"/images/brands/brand2.webp", alt:"TheClothingFactory"},
        {src:"/images/brands/brand3.webp", alt:"BrawnyMellow"},
        {src:"/images/brands/brand4.webp", alt:"Vaire"},
        {src:"/images/brands/brand5.webp", alt:"MyClo"},
        {src:"/images/brands/brand6.webp", alt:"Beegle"},
        {src:"/images/brands/brand7.webp", alt:"Sazo"},
        {src:"/images/brands/brand8.webp", alt:"Ruheite"},
      ];
    }
    

    return null;
  };

  const categoryImages = getCategoryImages();

  // ------------------ For Brands Alphabetical Columns ------------------
  let groupedBrands = {};
  let brandColumns = [];

  if (isBrandsMenu && menu.sections.length) {
    const brands = menu.sections[0].items;

    // Group brands by first letter
    brands.forEach((brand) => {
      const firstLetter = brand.name[0].toUpperCase();
      if (!groupedBrands[firstLetter]) groupedBrands[firstLetter] = [];
      groupedBrands[firstLetter].push(brand);
    });

    // Split letters into 4 roughly equal columns
    const letters = Object.keys(groupedBrands).sort();
    const perCol = Math.ceil(letters.length / 4);
    for (let i = 0; i < 4; i++) {
      brandColumns.push(letters.slice(i * perCol, (i + 1) * perCol));
    }
  }

  return (
    <div
      className="fixed left-0 right-0 top-22 z-40 max-h-[75vh] overflow-y-auto"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-[#F8F8F8] shadow-lg border-t border-gray-200">
        <div className="max-w-full mx-auto px-16">
          <div className="grid grid-cols-[1fr_420px] gap-8 items-start">
            {/* Left Side - Categories Grid */}
            <div
              className={`flex-1 ${
                isBrandsMenu
                  ? "grid grid-cols-4 gap-4 pr-4"
                  : "grid grid-cols-4 gap-x-5"
              }`}
            >
              {isBrandsMenu
                ? // Render Brands Alphabetically
                  brandColumns.map((lettersInCol, colIdx) => (
                    <div key={colIdx} className="space-y-4">
                      {lettersInCol.map((letter, letterIdx) => {
                        const bgClass =
                          letterIdx % 2 === 0 ? "bg-[#F2F2F2]" : "bg-[#F8F8F8]";
                        return (
                          <div key={letter} className={`${bgClass} p-4 rounded`}>
                            <h3 className="text-[10px] font-[600] text-[#0F0F0F] mb-1 font-clash-display uppercase">
                              {letter}
                            </h3>
                            <ul className="space-y-2">
                              {groupedBrands[letter].map((brand) => (
                                <li key={brand.id}>
                                  <Link
                                    href={`/brands/${brand.id}`}
                                    className="text-[10px] font-normal text-[#404040] hover:text-black transition-colors break-words"
                                  >
                                    {brand.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ))
                : // Render Men/Women/Essentials
                  menu.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={
                        index % 2 === 0 ? "bg-[#F2F2F2] p-4" : "bg-[#F8F8F8] p-4"
                      }
                    >
                      <a href={`/categories?catId=${section.id}`}>
                        <h3 className="text-[10px] font-[600] text-[#0F0F0F] mb-1 font-clash-display uppercase break-words">
                          {section.heading}
                        </h3>
                      </a>
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <a
                              href={`/products?subCatId=${item.id}`}
                              className="text-[10px] font-normal text-[#404040] hover:text-black transition-colors"
                            >
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
            </div>

            {/* Right Side - Brand Logos */}
            {isBrandsMenu && categoryImages && categoryImages.length > 0 && (
              <div className="w-[420px] flex-shrink-0 max-h-[550px] mt-[10px]">
                <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
                  {categoryImages.slice(0, 8).map((img, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden h-[150px] flex items-center justify-center  p-2"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-contain hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Side - Image Gallery */}
            {!isBrandsMenu && categoryImages && (
              <div className="w-[420px] flex-shrink-0 max-h-[550px] mt-[10px]">
                <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
                  {categoryImages[0] && (
                    <div className="col-span-2 row-span-1 relative rounded-lg overflow-hidden h-[240px]">
                      <Image
                        src={categoryImages[0].src}
                        alt={categoryImages[0].alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {categoryImages[1] && (
                    <div className="relative rounded-lg overflow-hidden h-[200px]">
                      <Image
                        src={categoryImages[1].src}
                        alt={categoryImages[1].alt}
                        fill
                        className="object-fill hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {categoryImages[2] && (
                    <div className="relative rounded-lg overflow-hidden h-[200px]">
                      <Image
                        src={categoryImages[2].src}
                        alt={categoryImages[2].alt}
                        fill
                        className="object-fill hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarDropdown;


