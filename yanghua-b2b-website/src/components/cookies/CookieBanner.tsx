"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import styles from './styles.module.css';
import PreferencesModal, { ConsentPreferences } from './PreferencesModal';

const COOKIE_KEY = 'cookie_consent';
const COOKIE_EXPIRES_DAYS = 365;

type Dict = {
  title: string;
  desc: string;
  acceptAll: string;
  rejectAll: string;
  manage: string;
  reopen: string;
};

const dict: Record<string, Dict> = {
  en: {
    title: 'We value your privacy',
    desc: 'We use cookies to provide essential functionality and to improve your experience. You can accept all, reject non-essential, or manage preferences.',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    manage: 'Manage Preferences',
    reopen: 'Cookie Settings'
  },
  es: {
    title: 'Valoramos su privacidad',
    desc: 'Usamos cookies para funciones esenciales y para mejorar su experiencia. Puede aceptar todo, rechazar no esenciales o gestionar preferencias.',
    acceptAll: 'Aceptar todo',
    rejectAll: 'Rechazar todo',
    manage: 'Gestionar preferencias',
    reopen: 'Ajustes de cookies'
  }
};

function detectLocale(): string {
  if (typeof document !== 'undefined') {
    const byLang = document.documentElement.lang?.slice(0,2).toLowerCase();
    const seg = (typeof window !== 'undefined') ? window.location.pathname.split('/')[1]?.toLowerCase() : undefined;
    const candidate = seg && ['en','es','de','ja','ar'].includes(seg) ? seg : (byLang || 'en');
    return candidate || 'en';
  }
  return 'en';
}

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

export default function CookieBanner() {
  const [locale, setLocale] = useState<string>('en');
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    setLocale(detectLocale());
    const c = readConsent();
    setConsent(c);
    setShowBanner(!c);
  }, []);

  const t = useMemo(() => dict[locale] || dict.en, [locale]);

  function setConsentCookie(prefs: ConsentPreferences) {
    const value = JSON.stringify({ ...prefs, essential: true, ts: Date.now() });
    Cookies.set(COOKIE_KEY, value, { expires: COOKIE_EXPIRES_DAYS, sameSite: 'Lax' });
    setConsent(prefs);
    // 将最新偏好同步给 AnalyticsProvider（Consent Mode）
    if (typeof window !== 'undefined' && typeof (window as any).updateAnalyticsConsent === 'function') {
      try {
        (window as any).updateAnalyticsConsent(prefs);
      } catch {}
    }
  }

  function handleAcceptAll() {
    setConsentCookie({ essential: true, analytics: true, marketing: true });
    setShowBanner(false);
    setShowModal(false);
  }

  function handleRejectAll() {
    setConsentCookie({ essential: true, analytics: false, marketing: false });
    setShowBanner(false);
    setShowModal(false);
  }

  function handleOpenPrefs() {
    setShowModal(true);
  }

  function handleSavePrefs(prefs: ConsentPreferences) {
    setConsentCookie(prefs);
    setShowBanner(false);
    setShowModal(false);
  }

  return (
    <>
      {/* Reopen settings button should only show before consent is set */}
      {showBanner && (
        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => setShowModal(true)}
          aria-label={t.reopen}
        >
          {t.reopen}
        </button>
      )}

      {showBanner && (
        <div className={styles.banner} role="region" aria-label="Cookie consent">
          <div className={styles.bannerInner}>
            <div className={styles.bannerText}>
              <strong style={{ fontWeight: 700 }}>{t.title}</strong>
              <div>{t.desc}</div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleRejectAll}>
                {t.rejectAll}
              </button>
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={handleAcceptAll}>
                {t.acceptAll}
              </button>
              <button type="button" className={`${styles.btn} ${styles.linkBtn}`} onClick={handleOpenPrefs}>
                {t.manage}
              </button>
            </div>
          </div>
        </div>
      )}

      <PreferencesModal
        isOpen={showModal}
        initial={consent || { essential: true, analytics: false, marketing: false }}
        locale={locale}
        onSave={handleSavePrefs}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}