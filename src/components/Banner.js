import React from "react";

const FashionVideoBackground = ({ videoUrl, heroText, loading }) => {
  return (
    <div className="relative w-full aspect-video overflow-hidden mt-[120px] md:mt-[128px]  ">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content - Right Side, Above Bottom */}
      <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-b from-black/0 to-black/70">
        <div className="text-left px-8 md:px-12 lg:px-16 pb-16 md:pb-20 lg:pb-24">
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : (
            <div
              className="text-sm md:text-[25px] font-[600] text-white tracking-[1px] uppercase leading-tight [&>strong]:font-[700] [&>strong]:md:text-[40px] [&>br]:block"
              dangerouslySetInnerHTML={{ __html: heroText }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FashionVideoBackground;
