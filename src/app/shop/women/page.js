import React from "react";
import WomenBanner from "./LandingWomenBanner";
import Navbar from "@/app/(navbar)/Navbar";
import NewInSection from "./NewIn";
import ShopCategories from "./ShopCategories";
import CollectionSection from "./Collections";
import Footer from "@/components/footer";
import WomenCarousel from "./WomenCarousel";
import TrendingBlog from "@/app/(newsletter)/Newsletter";
import ScrollButtons from "@/components/homepage/ScrollButton";
const page = () => {
  return (
    <div>
      <Navbar />
      <WomenBanner />
      <NewInSection />
      <ShopCategories />
      <WomenCarousel />
      <CollectionSection />
      <TrendingBlog />
      <Footer />
      <ScrollButtons/>
    </div>
  );
};

export default page;
