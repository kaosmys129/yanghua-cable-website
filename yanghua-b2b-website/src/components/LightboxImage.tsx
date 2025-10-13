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

  return (
    <>
      <div className="relative h-64 w-full rounded-lg overflow-hidden cursor-pointer" onClick={() => setOpen(true)}>
        <Image
          src={src}
          alt={alt}
          layout="fill"
          objectFit="cover"
        />
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        plugins={[Zoom]}
      />
    </>
  );
}