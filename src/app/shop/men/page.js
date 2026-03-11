import React from "react";

import Footer from "@/components/footer";
import FashionGrid from "@/app/(newsletter)/Newsletter";
import MenBanner from "./LandingMenBanner";
import MenNewInSection from "./MenNewIn";
import MenShopCategories from "./MenShopCategories";
import MenCollectionSection from "./MenCollections";
import Navbar from "@/app/(navbar)/Navbar";
import MenCarousel from "./MenCarousel";
import TrendingBlog from "@/app/(newsletter)/Newsletter";
import ScrollButtons from "@/components/homepage/ScrollButton";
const page = () => {
  return (
    <div>
      <Navbar />
      <MenBanner />
      <MenNewInSection />
      <MenShopCategories />
      <MenCarousel />
      <MenCollectionSection />
      <TrendingBlog />
      <Footer />
      <ScrollButtons/>
    </div>
  );
};

export default page;
