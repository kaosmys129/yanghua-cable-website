"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface LightboxImageProps {
  src: string;
  alt: string;
}

export default function LightboxImage({ src, alt }: LightboxImageProps) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (imgSrc !== '/images/placeholder-image.png') {
      setImgSrc('/images/placeholder-image.png');
    }
  };

  return (
    <>
      <div className="relative h-64 w-full rounded-lg overflow-hidden cursor-pointer" onClick={() => setOpen(true)}>
        <Image
          src={imgSrc}
          alt={alt}
          layout="fill"
          objectFit="cover"
          onError={handleError}
        />
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: imgSrc }]}
        plugins={[Zoom]}
      />
    </>
  );
}