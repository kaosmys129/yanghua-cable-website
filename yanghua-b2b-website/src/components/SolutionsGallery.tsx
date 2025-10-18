"use client";

import Image from "next/image";
import { useState } from "react";

interface SolutionsGalleryProps {
  solutionId: string;
  solutionTitle: string;
  count?: number;
  captions?: { title: string; description: string }[];
}

function GalleryCard({ initialSrc, solutionTitle, captionTitle, captionDescription, index }: { initialSrc: string; solutionTitle: string; captionTitle?: string; captionDescription?: string; index: number }) {
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const handleError = () => {
    if (imgSrc !== '/images/placeholder-image.png') {
      setImgSrc('/images/placeholder-image.png');
    }
  };

  const displayTitle = captionTitle || `图片标题占位 ${index}`;
  const displayDesc = captionDescription || '这里是图片描述占位文本，后续开发时替换为具体内容。';

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={imgSrc}
          alt={`${solutionTitle} - ${displayTitle}`}
          layout="fill"
          objectFit="cover"
          onError={handleError}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
        <p className="text-gray-600 text-sm">{displayDesc}</p>
      </div>
    </div>
  );
}

export default function SolutionsGallery({ solutionId, solutionTitle, count = 4, captions }: SolutionsGalleryProps) {
  const length = captions && captions.length > 0 ? captions.length : count;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length }).map((_, idx) => (
        <GalleryCard
          key={idx}
          initialSrc={`/images/solutions/${solutionId}/gallery/${idx + 1}.webp`}
          solutionTitle={solutionTitle}
          captionTitle={captions?.[idx]?.title}
          captionDescription={captions?.[idx]?.description}
          index={idx + 1}
        />
      ))}
    </div>
  );
}