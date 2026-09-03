import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from '../../lib/yanghua/loaders';
import { route } from '../../lib/yanghua/routes';

interface SlideImage {
  src: string;
  mobileSrc?: string;
  alt: string;
}

interface HeroCarouselProps {
  topper?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  phone?: string;
  phoneHref?: string;
  /** 4 张轮播图片 */
  slides: SlideImage[];
  /** 自动轮播间隔（毫秒），默认 5000 */
  interval?: number;
  /** 过渡动画时长（毫秒），默认 800 */
  transitionDuration?: number;
  locale?: Locale;
}

export default function HeroCarousel({
  topper,
  heading = 'Flexible busbar and cable solutions',
  description = 'Flexible busbar and cable solutions for industrial electrification, energy storage, photovoltaics, EV charging, and power distribution projects.',
  ctaLabel = 'View Products',
  ctaHref,
  secondaryLabel = 'About Us',
  secondaryHref,
  phone = '+86-769-3893-9888',
  phoneHref = 'tel:+86-769-3893-9888',
  slides,
  interval = 5000,
  transitionDuration = 800,
  locale = 'en',
}: HeroCarouselProps) {
  const resolvedCtaHref = ctaHref ?? route('products', locale);
  const resolvedSecondaryHref = secondaryHref ?? route('about', locale);

  const totalSlides = slides.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number>(0);

  // 切换到指定 slide
  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      // 标记该图片已加载
      setLoadedImages((prev) => new Set(prev).add(index));
      // 预加载下一张
      const next = (index + 1) % totalSlides;
      setLoadedImages((prev) => new Set(prev).add(next));
      setTimeout(() => setIsTransitioning(false), transitionDuration);
    },
    [currentIndex, isTransitioning, totalSlides, transitionDuration],
  );

  const goToPrev = useCallback(() => {
    const prev = (currentIndex - 1 + totalSlides) % totalSlides;
    goToSlide(prev);
  }, [currentIndex, totalSlides, goToSlide]);

  const goToNext = useCallback(() => {
    const next = (currentIndex + 1) % totalSlides;
    goToSlide(next);
  }, [currentIndex, totalSlides, goToSlide]);

  // 自动轮播
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const next = (currentIndex + 1) % totalSlides;
      goToSlide(next);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, totalSlides, interval, goToSlide]);

  // 重置自动轮播计时器
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // 使用函数式更新避免闭包过期
      setCurrentIndex((prev) => {
        const next = (prev + 1) % totalSlides;
        setLoadedImages((l) => new Set(l).add(next));
        return next;
      });
    }, interval);
  }, [totalSlides, interval]);

  // 预加载第 2、3 张（首屏之后延迟加载）
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      setLoadedImages((prev) => {
        const next = new Set(prev);
        for (let i = 1; i < Math.min(4, totalSlides); i++) {
          next.add(i);
        }
        return next;
      });
    }, 2000);
    return () => clearTimeout(preloadTimer);
  }, [totalSlides]);

  // 触摸滑动支持
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 轮播图片层 */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 z-0"
          style={{
            opacity: i === currentIndex ? 1 : 0,
            transition: `opacity ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: 'opacity',
          }}
        >
          {loadedImages.has(i) && (
            <picture>
              {slide.mobileSrc && <source media="(max-width: 640px)" srcSet={slide.mobileSrc} />}
              <img
                src={slide.src}
                alt={slide.alt}
                width="1920"
                height="911"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding={i === 0 ? 'sync' : 'async'}
                className="size-full object-cover"
              />
            </picture>
          )}
          {/* 深色遮罩 */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"
            aria-hidden="true"
          />
        </div>
      ))}

      {/* 左右箭头 */}
      <button
        onClick={() => { goToPrev(); resetTimer(); }}
        className="absolute left-4 sm:left-6 z-20 flex size-10 sm:size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-5 sm:size-6" />
      </button>
      <button
        onClick={() => { goToNext(); resetTimer(); }}
        className="absolute right-4 sm:right-6 z-20 flex size-10 sm:size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Next slide"
      >
        <ChevronRight className="size-5 sm:size-6" />
      </button>

      {/* 底部指示点 */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { goToSlide(i); resetTimer(); }}
            className={`rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white ${
              i === currentIndex
                ? 'h-2 w-8 bg-white'
                : 'h-2 w-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === currentIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {/* 内容遮罩层 */}
      <div className="relative z-10 mx-auto w-full max-w-site px-4 py-section sm:px-6">
        <div className="max-w-xl space-y-5 lg:space-y-6">
          {topper && (
            <Badge
              variant="secondary"
              className="bg-[hsl(var(--accent-shadcn))/0.85] px-4 py-1.5 text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))] border-none"
            >
              {topper}
            </Badge>
          )}

          <h1
            className="font-heading text-display font-bold uppercase leading-none tracking-tight text-white"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            {heading}
          </h1>

          <p className="max-w-lg text-lead leading-relaxed text-white/80">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
            <Button
              asChild
              size="lg"
              className="min-h-[44px] bg-[hsl(var(--accent-shadcn))] text-[hsl(var(--accent-shadcn-foreground))] font-bold hover:bg-[hsl(var(--accent-shadcn))]/90"
            >
              <a href={resolvedCtaHref}>
                {ctaLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] border-2 border-white/60 font-bold text-white hover:bg-white hover:text-black"
            >
              <a href={resolvedSecondaryHref}>{secondaryLabel}</a>
            </Button>
          </div>

          {/* Phone Contact */}
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            Call {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
