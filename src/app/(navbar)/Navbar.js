"use client";

import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { openPhoneAuthModal } from "@/redux/slices/loginmodalSlice";
import { addSearch } from "@/redux/slices/searchSlice";
import { useRouter, usePathname } from "next/navigation";
import axiosHttp from "@/utils/axioshttp";

import NavbarDropdown from "@/components/navbar/NavbarDropdown";
import MobileNavbar from "@/components/navbar/MobileNavbar";
import NavbarSearchComponent from "@/components/homepage/NavbarSearchComponent";
import UserDropdown from "@/components/UserDrpdown";
import QuickModal from "@/components/QuickModal"; 

import usegetBrands from "@/hooks/useGetBrands";
import useGetCategoriesHierarchy from "@/hooks/useCategoriesHirerarchy";
import useBlog from "@/hooks/useBlog";
import useCartSync from "@/hooks/useCartSync";

// ---------- Menu Builder ----------
const getMenuData = (categories, brands ) => {
  const dynamicMenus =
    categories?.map((cat) => ({
      title: cat.name,
      sections: cat.children.map((child) => ({
        id: child.id,
        heading: child.name,
        items: child.children.map((sub) => ({
          id: sub.id,
          name: sub.name,
        })),
      })),
    })) || [];

    const brandSections = [{
      id:"all-brands",
      heading:"All Brands",
      items:
      brands?.map((brand)=>({
        id:brand.id,
        name:brand.name,
      }))||[],
    }];

  return [
    { title: "ALL BRANDS", sections: brandSections },
    ...dynamicMenus,
    { title: "BLOGS", sections: [] },
    { title: "NEWSLETTERS", sections: [] },
    { title: "TRACK ORDER", sections: [] },
  ];
};


const Navbar = () => {
  const user = useSelector((state) => state.user.userInfo);
  const cartTotal = useSelector((state) => state.cart.totalItems);
  const { brands } = usegetBrands();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // Sync cart with backend
  useCartSync();

  const categoriesHierarchy = useGetCategoriesHierarchy();
  const menuData = getMenuData(categoriesHierarchy,brands);

  const filteredMenuData = menuData.filter((menu) => {
    // Hide TRACK ORDER if user is not logged in
    if (menu.title === "TRACK ORDER" && !user) return false;
    return true;
  });

  const blogs = useBlog();
  const latestBlogs = blogs?.slice(0, 3);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Revalidate cart on route change (SPA navigation)
  useEffect(() => {
    if (user?.id) {
      // Trigger a cart refetch when pathname changes
      const refetchCart = async () => {
        try {
          const response = await axiosHttp.get(`/cart-items/${user.id}`);
          if (response.data.status === 200 && response.data.data) {
            const transformedData = response.data.data.map((item) => ({
              id: item.productId,
              cartItemId: item.id,
              productId: item.productId,
              variantId: item.variantId,
              title: item.product.title,
              quantity: item.quantity || 1,
              basePrice:
                item.pricing?.unitPrice ||
                item.product_variant?.price ||
                item.product.basePrice ||
                0,
              imageUrls: item.product.imageUrls || [],
              variants: item.product_variant
                ? [{ id: item.variantId, title: item.product_variant.title }]
                : [],
              selected: true,
            }));
            dispatch({ type: "cart/setCartItems", payload: transformedData });
          }
        } catch (error) {
          // Silent fail - cart will sync on next attempt
        }
      };
      refetchCart();
    }
  }, [pathname, user?.id, dispatch]);

  // Refetch cart when window gains focus (tab switching)
  useEffect(() => {
    if (!user?.id) return;

    const handleFocus = async () => {
      try {
        const response = await axiosHttp.get(`/cart-items/${user.id}`);
        if (response.data.status === 200 && response.data.data) {
          const transformedData = response.data.data.map((item) => ({
            id: item.productId,
            cartItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            title: item.product.title,
            quantity: item.quantity || 1,
            basePrice:
              item.pricing?.unitPrice ||
              item.product_variant?.price ||
              item.product.basePrice ||
              0,
            imageUrls: item.product.imageUrls || [],
            variants: item.product_variant
              ? [{ id: item.variantId, title: item.product_variant.title }]
              : [],
            selected: true,
          }));
          dispatch({ type: "cart/setCartItems", payload: transformedData });
        }
      } catch (error) {
        // Silent fail
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id, dispatch]);

  // Cross-tab cart sync via localStorage storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Listen for cart changes from other tabs
      if (e.key === "lafetch_cart_updated" && e.newValue) {
        try {
          const cartData = JSON.parse(e.newValue);
          dispatch({ type: "cart/setCartItems", payload: cartData });
        } catch (error) {
          // Invalid cart data, ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  const getMenuHref = (title = "") => {
    const t = title.toLowerCase().trim();

    if (t === "all brands" || t === "allbrands" || t === "all_brands")
      return "/brands";

    if (t === "blogs") return "/blogs";

    if (t.includes("women")) return "/shop/women";

    if (t.includes("men")) return "/shop/men";

    if (t.includes("essentials")) return "/shop/accessories";

    if (t === "track order") return "/account/orders";

    if (t === "newsletters") return "#newsletters";

    return "#";
  };

  const handleMenuClick = (e, href) => {
    if (href === "#newsletters") {
      e.preventDefault();
      const element = document.getElementById("newsletters");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="fixed top-10 inset-x-0 bg-white z-40 shadow-sm">
        <div className="max-w-full mx-auto px-4 md:px-16 py-6 md:py-7 h-10 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-1 md:gap-4">
            <button className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </button>

            <Link href="/" className="mt-[2px] md:mt-0">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={100}
                height={60}
              />
            </Link>

            {/* <Link href="/" className="md:hidden border-r border-black/50 pr-4">
              <Image
                src="/images/logo-black.svg"
                alt="Logo"
                width={100}
                height={40}
              />
            </Link> */}
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex gap-6">
            {filteredMenuData.map((menu, index) => {
              const menuHref = getMenuHref(menu.title);
              const isActive =
                pathname === menuHref ||
                (menuHref !== "/" && pathname.startsWith(menuHref));
              const shouldHighlight =
                hoveredMenu !== null ? hoveredMenu === index : isActive;

              return (
                <div
                  key={index}
                  className={`relative text-sm font-clash-display text-[#0F0F0F] uppercase leading-4
             after:absolute after:left-0 after:-bottom-2
             after:h-[1.5px] after:w-full after:transition-all
             ${
               shouldHighlight
                 ? "font-semibold after:bg-[#9c90ff]"
                 : "font-medium after:bg-transparent"
             }`}
                  onMouseEnter={() => {
                    clearTimeout(dropdownTimeout);
                    setHoveredMenu(index);
                    if (menu.sections.length) {
                      setActiveDropdown(index);
                    } else {
                      setActiveDropdown(null);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredMenu(null);
                    const timeout = setTimeout(
                      () => setActiveDropdown(null),
                      200,
                    );
                    setDropdownTimeout(timeout);
                  }}
                >
                  <Link
                    href={menuHref}
                    onClick={(e) => handleMenuClick(e, menuHref)}
                  >
                    {menu.title}
                  </Link>

                  {menu.sections.length > 0 && activeDropdown === index && (
                    <NavbarDropdown
                      menu={menu}
                      latestBlogs={latestBlogs}
                      onMouseEnter={() => clearTimeout(dropdownTimeout)}
                      onMouseLeave={() => {
                        const timeout = setTimeout(
                          () => setActiveDropdown(null),
                          200,
                        );
                        setDropdownTimeout(timeout);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT */}
          {/* <div className="flex items-center gap-1 md:gap-4">
            <div className="border-r border-black/50 w-28 h-8 flex items-center justify-center ">
            <NavbarMiniCarousel banners={fetchBanner}/>
              <button
                onClick={() => setIsQuickModalOpen(true)}
                className="relative overflow-hidden cursor-pointer"
              >
                <div className="md:block hidden pr-4">
                  <Image
                    src="/images/quick.png"
                    alt="Quick"
                    width={100}
                    height={30}
                  />
                </div>

                <div className="md:hidden  md:pr-4">
                  <Image
                    src="/images/quick.png"
                    alt="Logo"
                    width={80}
                    height={40}
                  />
                </div>
                <div className="absolute inset-0 shine-overlay"></div>
              </button>
            </div>
            <Search
              className="text-black cursor-pointer"
              onClick={() => setShowSearchDropdown(true)}
            />

            <Link href="/wishlist-boards">
              <Heart className="text-black" />
            </Link>

            <Link href="/checkout/bag" className="relative">
              <ShoppingBag className="text-black" />
              {cartTotal > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
                  {cartTotal}
                </span>
              )}
            </Link>

            {user ? (
              <UserDropdown user={user} />
            ) : (
              <User
                className="text-black"
                onClick={() => dispatch(openPhoneAuthModal("navbar"))}
              />
            )}
          </div> */}
          <div className="flex items-center gap-2 md:gap-4">
          {/* Mini Carousel Removed add drop down of current event and its product */}
          

          {/* Quick Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsQuickModalOpen(true)}
              className="relative overflow-hidden cursor-pointer"
            >
              <div className="md:block hidden pr-2">
                <Image
                  src="/images/quick.png"
                  alt="Quick"
                  width={100}
                  height={30}
                />
              </div>
              <div className="md:hidden pr-2">
                <Image
                  src="/images/quick.png"
                  alt="Quick"
                  width={80}
                  height={40}
                />
              </div>
              <div className="absolute inset-0 shine-overlay"></div>
            </button>
          </div>

          {/* Search */}
          <Search
            className="text-black cursor-pointer"
            onClick={() => setShowSearchDropdown(true)}
          />

          {/* Wishlist */}
          <Link href="/wishlist-boards">
            <Heart className="text-black" />
          </Link>

          {/* Cart */}
          <Link href="/checkout/bag" className="relative">
            <ShoppingBag className="text-black" />
            {cartTotal > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
                {cartTotal}
              </span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <User
              className="text-black"
              onClick={() => dispatch(openPhoneAuthModal("navbar"))}
            />
          )}
        </div>

         {/* Text Below Icons */}
            {/* Promo Strip */}
          {/* <div
            className="fixed top-[120px] md:top-[130px] inset-x-0 z-30 text-center hidden md:block"
          >
            <p className="text-[11px] md:text-xs font-bold uppercase text-[#7A6ECC] py-1 tracking-wide">
              Download The App Now & Get 10% Off
            </p>
          </div> */}

        </div>
      </div>

      {/* SEARCH */}
      <NavbarSearchComponent
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={showSearchDropdown}
        setIsOpen={setShowSearchDropdown}
      />

      {/* MOBILE NAVBAR */}
      <MobileNavbar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        menuData={filteredMenuData}
        getMenuHref={getMenuHref}
      />

      <QuickModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
