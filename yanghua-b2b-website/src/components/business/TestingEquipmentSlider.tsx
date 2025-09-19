'use client';

import { useTranslations } from 'next-intl';
import { InfiniteSlider } from '../ui/InfiniteSlider';
import { EquipmentCard } from '../ui/EquipmentCard';
import { testingEquipment } from '@/data/testing-equipment';
import { useEffect, useState } from 'react';

export default function TestingEquipmentSlider() {
  const t = useTranslations('about');
  const [sliderGap, setSliderGap] = useState(24);
  const [sliderDuration, setSliderDuration] = useState(40);
  
  // 响应式调整滑块间距和速度
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSliderGap(16);
        setSliderDuration(30);
      } else if (window.innerWidth < 1024) {
        setSliderGap(20);
        setSliderDuration(35);
      } else {
        setSliderGap(24);
        setSliderDuration(40);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {t('equipment.title')}
          </h2>
          <p className="text-lg md:text-xl text-[#6c757d] max-w-3xl mx-auto">
            {t('equipment.subtitle')}
          </p>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <InfiniteSlider 
          duration={sliderDuration} 
          durationOnHover={sliderDuration * 2}
          gap={sliderGap}
          className="py-4 px-2 sm:px-4"
        >
        {testingEquipment.map((equipment) => (
          <EquipmentCard
            key={equipment.id}
            name={equipment.name}
            image={equipment.image}
            description={equipment.description}
          />
        ))}
      </InfiniteSlider>
      </div>
    </div>
  );
}