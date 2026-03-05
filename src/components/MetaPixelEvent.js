'use client'; // This must be a client component

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function MetaPixelEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Grab user info from your userSlice
  const userInfo = useSelector((state) => state.user.userInfo);

useEffect(() => {
    if (!window.fbq) return;

    // Advanced Matching: If userInfo exists, send hashed data to Meta
    if (userInfo && userInfo.email) {
      window.fbq('init', process.env.NEXT_PUBLIC_META_PIXEL_ID,
      {
        em: userInfo.email.toLowerCase().trim(),
        fn: userInfo.fullName?.split(' ')[0].toLowerCase().trim(), // First Name
        ph: userInfo.phone?.replace(/\D/g, ''), // Numbers only
      });
    } else {
      // Standard init for guests
      window.fbq('init', process.env.NEXT_PUBLIC_META_PIXEL_ID);
    }

    window.fbq('track', 'PageView');
  }, [pathname, searchParams, userInfo]); // Runs when page OR user changes


  return null;
}