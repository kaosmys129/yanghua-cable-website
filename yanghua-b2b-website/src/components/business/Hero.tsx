'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { slides } from './slides';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';

export interface SlideData {
  id: number;
  image: string;
  showContent: boolean;
}

export default function Hero({ onScrollToQuote }: { onScrollToQuote?: () => void }) {
  const t = useTranslations('hero');
  const locale = useLocale() as Locale;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      className="relative bg-gradient-to-r from-[#212529] to-[#343a40] text-white overflow-hidden min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] xl:min-h-[90vh]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 背景图片轮播 */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* 只在第一张轮播图添加蒙版，确保文字可读性 */}
            {slide.showContent && <div className="absolute inset-0 bg-black/20 z-10"></div>}
            <div className={`absolute inset-0 ${slide.showContent ? 'opacity-60' : 'opacity-100'}`}>
              <Image 
                src={slide.image}
                alt={`Yanghua Cable Slide ${slide.id}`}
                fill
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                quality={90}
                style={{
                  objectPosition: 'center center',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* 内容区域 */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 z-20">
        <div className="max-w-3xl">
          {/* 第一张轮播图显示完整内容，其他只显示按钮 */}
          {currentSlideData.showContent ? (
            <>
              {/* Attention: Strong headline to grab attention */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 transition-all duration-500">
                {t('title')}
              </h1>
              
              {/* Interest: Key value propositions */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-3 sm:mb-4 transition-all duration-500">
                {t('subtitle')}
              </p>
              
              <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 transition-all duration-500 leading-relaxed">
                {t('description')}
              </p>
              
              {/* Desire: Social proof */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 transition-all duration-500">
                <div className="flex -space-x-1 sm:-space-x-2 justify-center sm:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fdb827] flex items-center justify-center text-xs font-bold text-[#212529]">H</div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fdb827] flex items-center justify-center text-xs font-bold text-[#212529]">B</div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fdb827] flex items-center justify-center text-xs font-bold text-[#212529]">C</div>
                </div>
                <p className="sm:ml-3 text-xs sm:text-sm text-gray-300 text-center sm:text-left">
                  Trusted by 500+ companies worldwide
                </p>
              </div>
            </>
          ) : (
            <div className="h-48 sm:h-56 md:h-64 lg:h-72">
              {/* 第二张和第三张轮播图不显示任何文字内容 */}
            </div>
          )}
          
          {/* Action: Clear CTAs - 只在第一张轮播图显示 */}
          {currentSlideData.showContent && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Link
                href={buildLocalizedUrl('contact', locale)}
                className="btn-primary inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                onClick={(e) => {
                  if (onScrollToQuote) {
                    e.preventDefault();
                    onScrollToQuote();
                  }
                }}
              >
                Get Quote Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              
              <Link
                href={buildLocalizedUrl('products', locale)}
                className="btn-secondary inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                onClick={(e) => {
                  if (onScrollToQuote) {
                    e.preventDefault();
                    onScrollToQuote();
                  }
                }}
              >
                {t('cta')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 轮播控制按钮 */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110 z-30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110 z-30"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* 圆点指示器 */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}