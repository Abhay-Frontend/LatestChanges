"use client";
import FashionVideoBackground from "@/components/Banner";
import useHeroText from "@/hooks/useHeroText";

export default function HomePage() {
  const { heroText, loading } = useHeroText(null);

  return (
    <div className="mt-[120px] md:mt-[128px]">
      <FashionVideoBackground
        videoUrl="/videos/homepage_video.mp4"
        heroText={heroText?.text}
        loading={loading}
      />
    </div>
  );
}
