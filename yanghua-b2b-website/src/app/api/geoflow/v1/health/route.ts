import { NextResponse } from 'next/server';
import packageJson from '../../../../../../package.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      site: 'Yanghua Cable',
      version: packageJson.version || '0.1.0',
      supportedLocales: ['en', 'es'],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
