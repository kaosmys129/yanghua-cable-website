"use client";

import Image from "next/image";
import { useState } from "react";

interface SolutionsHeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function SolutionsHeroImage({ src, alt, className }: SolutionsHeroImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (imgSrc !== '/images/placeholder-image.png') {
      setImgSrc('/images/placeholder-image.png');
    }
  };

  return (
    <div className={className ?? "relative h-64 md:h-96 w-full"}>
      <Image
        src={imgSrc}
        alt={alt}
        layout="fill"
        objectFit="cover"
        onError={handleError}
      />
    </div>
  );
}