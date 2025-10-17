'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

type EquipmentCardProps = {
  name: {
    en: string;
    es?: string;
  };
  image: string;
  description: {
    en: string;
    es?: string;
  };
  className?: string;
};

export function EquipmentCard({ name, image, description, className }: EquipmentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const t = useTranslations('common');
  const locale = (useLocale() as 'en' | 'es') || 'en';
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div 
      ref={ref}
      className={`flex flex-col bg-white rounded-lg shadow-md overflow-hidden w-[280px] h-[320px] transform transition-all duration-300 ${inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
    >
      <div className="relative h-[180px] w-full bg-gray-100 overflow-hidden">
        {inView && (
          <>
            <div className={`absolute inset-0 bg-gray-200 animate-pulse ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
            <Image
              src={imageError ? '/images/equipment/equipment-placeholder.svg' : image}
              alt={name[locale] || name.en}
              fill
              className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImageError(true)}
              onLoad={() => setIsLoaded(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 280px"
              priority={false}
              loading="lazy"
            />
          </>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{name[locale] || name.en}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">{description[locale] || description.en}</p>
      </div>
    </div>
  );
}