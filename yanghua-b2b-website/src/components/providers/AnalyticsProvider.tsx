'use client';

import React, { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

// Consent cookie key must match CookieBanner
const COOKIE_KEY = "cookie_consent";

export type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

function readConsent(): ConsentPreferences | null {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: !!parsed.essential,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    updateAnalyticsConsent?: (input: any) => void;
    webVitals?: any;
  }
}

/**
 * AnalyticsProvider
 * - 与 Cookie 同意打通：仅在 analytics 同意后才加载 GA4 脚本
 * - 禁用默认 page_view，上报 SPA 路由变化的手动 page_view
 * - 兼容 CookieBanner 调用 window.updateAnalyticsConsent(prefs)
 */
export default function AnalyticsProvider() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allowed, setAllowed] = useState<boolean>(false);
  const [gaReady, setGaReady] = useState<boolean>(false);

  // 初始化：读取 cookie，同步全局更新方法
  useEffect(() => {
    const c = readConsent();
    const granted = !!c?.analytics;
    setAllowed(granted);

    // 提供给 CookieBanner / PreferencesModal 调用的全局方法
    window.updateAnalyticsConsent = (input: any) => {
      let isGranted = false;
      try {
        if (typeof input === "boolean") {
          isGranted = input;
        } else if (typeof input === "object" && input) {
          isGranted = !!input.analytics;
        } else if (typeof input === "string") {
          isGranted = input === "accept_all" || input === "allow";
        }
      } catch {}
      setAllowed(isGranted);
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: isGranted ? "granted" : "denied" });
      }
    };
  }, []);

  // 初始和每次路由变化时，手动上报 page_view（需 gtag 已加载）
  useEffect(() => {
    if (!measurementId || !allowed || typeof window.gtag !== "function") return;
    const q = searchParams?.toString();
    const page_path = q ? `${pathname}?${q}` : pathname;
    const page_location = typeof window !== "undefined" ? window.location.href : page_path;
    window.gtag("event", "page_view", {
      page_path,
      page_location,
    });
  }, [measurementId, allowed, pathname, searchParams]);

  // 脚本加载完成后，发送一次初始 page_view（避免在第一次加载时错过）
  useEffect(() => {
    if (!gaReady || !measurementId || !allowed || typeof window.gtag !== "function") return;
    const q = searchParams?.toString();
    const page_path = q ? `${pathname}?${q}` : pathname;
    const page_location = typeof window !== "undefined" ? window.location.href : page_path;
    window.gtag("event", "page_view", { page_path, page_location });
  }, [gaReady, measurementId, allowed]);

  // 脚本加载完成并且用户已同意后，启用 Web Vitals 并上报到 GA4（使用本地依赖而非 CDN）
  useEffect(() => {
    if (!gaReady || !allowed) return;

    let mounted = true;
    import('web-vitals')
      .then(({ onCLS, onLCP, onINP }) => {
        const sendToGA = ({ name, delta, id }: any) => {
          if (typeof window.gtag !== 'function') return;
          window.gtag('event', name, {
            value: Math.round(name === 'CLS' ? delta * 1000 : delta),
            event_category: 'Web Vitals',
            event_label: id,
            non_interaction: true,
          });
        };
        if (!mounted) return;
        onLCP(sendToGA);
        onCLS(sendToGA);
        onINP(sendToGA);
      })
      .catch(() => {/* ignore */});

    return () => { mounted = false; };
  }, [gaReady, allowed]);

  if (!measurementId) {
    // 未配置 GA4 测量 ID，不渲染任何脚本
    return null;
  }

  return (
    <>
      {allowed && (
        <>
          {/* 仅在用户同意后加载 GA4 */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
            onLoad={() => setGaReady(true)}
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);} 
            // 默认 denied，随后根据同意更新为 granted
            gtag('consent', 'default', { analytics_storage: 'denied' });
            gtag('js', new Date());
            gtag('config', '${measurementId}', { send_page_view: false });
            gtag('consent', 'update', { analytics_storage: 'granted' });
          `}</Script>

          {/* Web Vitals 已通过上方 useEffect 动态加载并上报，无需在 JSX 中引入脚本 */}
        </>
      )}
    </>
  );
}