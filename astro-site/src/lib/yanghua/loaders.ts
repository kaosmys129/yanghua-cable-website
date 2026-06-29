import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { legacyContentRoot, legacyMessagesRoot, legacyPublicDataRoot } from './paths';

export type Locale = 'en' | 'es';

async function readJsonFile<T>(absolutePath: string): Promise<T> {
  const raw = await readFile(absolutePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export async function loadPageJson<T>(locale: Locale, pageKey: string): Promise<T> {
  return readJsonFile<T>(join(legacyContentRoot, 'pages', locale, `${pageKey}.json`));
}

export async function loadSiteSettings<T>(): Promise<T> {
  return readJsonFile<T>(join(legacyContentRoot, 'settings', 'site.json'));
}

export async function loadMessages(locale: Locale): Promise<Record<string, any>> {
  return readJsonFile<Record<string, any>>(join(legacyMessagesRoot, `${locale}.json`));
}

export async function loadPublicData<T>(filename: string): Promise<T> {
  return readJsonFile<T>(join(legacyPublicDataRoot, filename));
}

