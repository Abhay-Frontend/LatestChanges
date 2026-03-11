import React from "react";
import Footer from "@/components/footer";

import TrendingBlog from "@/app/(newsletter)/Newsletter";
import AccessoriesBanner from "./LandingAccessoriesBanner";
import AccessoriesNewInSection from "./AccessoriesNewIn";
import AccessoriesShopCategories from "./AccessoriesShopCategories";
import AccessoriesCarousel from "./AccessoriesCarousel";
import AccessoriesCollectionSection from "./AccessoriesCollections";
import Navbar from "@/app/(navbar)/Navbar";
import ScrollButtons from "@/components/homepage/ScrollButton";
const page = () => {
  return (
    <div>
      <Navbar />
      <AccessoriesBanner />
      <AccessoriesNewInSection />
      <AccessoriesShopCategories />
      <AccessoriesCarousel />
      <AccessoriesCollectionSection />
      <TrendingBlog />
      <Footer />
      <ScrollButtons/>
    </div>
  );
};

export default page;
