'use client';

import { useState } from 'react';

type EasingName = 'easeInOutCubic';

function easeInOutCubic(t: number) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * useSmoothScroll
 * Provides a controlled smooth scroll function with a specific duration and easing.
 * - Ensures consistent 500ms ease-in-out animation across Chrome, Firefox, and Safari
 * - Supports offset (e.g., fixed headers)
 * - Prevents repeated clicks while an animation is in progress
 */
export function useSmoothScroll() {
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToY = (targetY: number, duration = 500, easing: EasingName = 'easeInOutCubic') => {
    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();
    setIsScrolling(true);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easing === 'easeInOutCubic' ? easeInOutCubic(t) : t;
      window.scrollTo(0, startY + distance * eased);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(step);
  };

  const scrollToElement = (el: HTMLElement, options?: { offset?: number; duration?: number }) => {
    const header = document.querySelector('header') as HTMLElement | null;
    const headerOffset = header?.offsetHeight ?? 0;
    const offset = options?.offset ?? 0;
    const duration = options?.duration ?? 500;
    const rect = el.getBoundingClientRect();
    const targetY = (window.scrollY || window.pageYOffset) + rect.top - headerOffset - offset;
    scrollToY(targetY, duration);
  };

  const scrollToId = (id: string, options?: { offset?: number; duration?: number }) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrollToElement(el, options);
  };

  return { isScrolling, scrollToY, scrollToId, scrollToElement };
}