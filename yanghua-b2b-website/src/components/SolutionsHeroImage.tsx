"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SolutionsHeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  overlayContent?: React.ReactNode;
}

export default function SolutionsHeroImage({
  src,
  alt,
  className,
  overlay = false,
  overlayContent,
}: SolutionsHeroImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (imgSrc !== "/images/placeholder-image.png") {
      setImgSrc("/images/placeholder-image.png");
    }
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className ?? "h-64 md:h-96"
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="100vw"
        className={cn(
          "object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        priority
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
      {overlayContent && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
