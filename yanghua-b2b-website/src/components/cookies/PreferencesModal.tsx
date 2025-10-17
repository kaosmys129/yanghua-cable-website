"use client";
import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';

export type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

type Props = {
  isOpen: boolean;
  initial: ConsentPreferences;
  locale?: string;
  onSave: (prefs: ConsentPreferences) => void;
  onClose: () => void;
};

const dict = {
  en: {
    title: 'Cookie Preferences',
    desc: 'We use cookies to ensure essential site functionality and improve your experience. You can manage your preferences below.',
    essential: 'Essential',
    essentialDesc: 'Required for basic site features (security, language, forms).',
    analytics: 'Analytics',
    analyticsDesc: 'Helps us understand usage to improve site performance.',
    marketing: 'Marketing',
    marketingDesc: 'Used for tailored content and remarketing.',
    cancel: 'Cancel',
    save: 'Save Preferences'
  },
  es: {
    title: 'Preferencias de Cookies',
    desc: 'Usamos cookies para funciones esenciales del sitio y para mejorar su experiencia. Puede gestionar sus preferencias a continuación.',
    essential: 'Esenciales',
    essentialDesc: 'Necesarias para funciones básicas del sitio (seguridad, idioma, formularios).',
    analytics: 'Analíticas',
    analyticsDesc: 'Nos ayudan a entender el uso para mejorar el rendimiento del sitio.',
    marketing: 'Marketing',
    marketingDesc: 'Se usan para contenido personalizado y remarketing.',
    cancel: 'Cancelar',
    save: 'Guardar preferencias'
  }
} as const;
type LocaleKey = keyof typeof dict;

export default function PreferencesModal({ isOpen, initial, locale = 'en', onSave, onClose }: Props) {
  const localeKey: LocaleKey = (locale && locale in dict) ? (locale as LocaleKey) : 'en';
  const t = dict[localeKey];
  const [prefs, setPrefs] = useState<ConsentPreferences>(initial);

  useEffect(() => {
    if (isOpen) {
      setPrefs(initial);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="cookie-pref-title" className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 id="cookie-pref-title" className={styles.modalTitle}>{t.title}</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label={t.cancel}>
            ✕
          </button>
        </div>
        <p className={styles.groupDesc} style={{ marginBottom: 12 }}>{t.desc}</p>

        <div className={styles.group}>
          <div className={styles.toggleLine}>
            <div>
              <div className={styles.groupTitle}>{t.essential}</div>
              <div className={styles.groupDesc}>{t.essentialDesc}</div>
            </div>
            <input type="checkbox" checked={true} readOnly aria-label={`${t.essential} enabled`} />
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.toggleLine}>
            <div>
              <div className={styles.groupTitle}>{t.analytics}</div>
              <div className={styles.groupDesc}>{t.analyticsDesc}</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs(prev => ({ ...prev, analytics: e.target.checked }))}
              aria-label={`${t.analytics} toggle`}
            />
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.toggleLine}>
            <div>
              <div className={styles.groupTitle}>{t.marketing}</div>
              <div className={styles.groupDesc}>{t.marketingDesc}</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs(prev => ({ ...prev, marketing: e.target.checked }))}
              aria-label={`${t.marketing} toggle`}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>{t.cancel}</button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => onSave({ ...prefs, essential: true })}
          >
            {t.save}
          </button>
        </div>
      </div>
    </>
  );
}