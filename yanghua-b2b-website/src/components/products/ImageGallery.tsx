'use client';
import React, { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const safeImages = images && images.length > 0 ? images : ['/images/no-image-available.webp'];
  return (
    <div>
      <div className="relative w-full h-80 rounded-xl overflow-hidden">
        <Image src={safeImages[active]} alt="product" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {safeImages.map((src, idx) => (
          <button key={`${src}-${idx}`} onClick={() => setActive(idx)} className={`relative h-20 rounded-md overflow-hidden border ${active === idx ? 'border-[#fdb827]' : 'border-gray-200'}`}>
            <Image src={src} alt={`thumb-${idx}`} fill className="object-cover" sizes="10rem" />
          </button>
        ))}
      </div>
    </div>
  );
}

