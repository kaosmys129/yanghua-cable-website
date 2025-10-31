import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

// Preview API route for Strapi Cloud integration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get parameters from Strapi preview URL
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale') || 'en';
  
  // Check the secret token (support both STRAPI_PREVIEW_SECRET and PREVIEW_SECRET for compatibility)
  const expectedSecret = process.env.STRAPI_PREVIEW_SECRET || process.env.PREVIEW_SECRET;
  if (secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  
  // Check if slug is provided
  if (!slug) {
    return NextResponse.json({ message: 'Missing slug parameter' }, { status: 400 });
  }
  
  try {
    // Verify that the article exists in Strapi (including drafts)
    const strapiUrl = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
    const response = await fetch(
      `${strapiUrl}/api/articles?filters[slug][$eq]=${slug}&locale=${locale}&publicationState=preview&populate=*`,
      {
        headers: {
          // API token is required to access draft content in Strapi Cloud
          ...(process.env.STRAPI_API_TOKEN ? { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    
    // Enable Draft Mode
    const draft = await draftMode();
    draft.enable();
    
    // Redirect to the article page with preview mode enabled
    return NextResponse.redirect(new URL(`/${locale}/articles/${slug}`, request.url));
    
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Exit preview mode
export async function DELETE() {
  const draft = await draftMode();
  draft.disable();
  
  return NextResponse.json({ message: 'Preview mode disabled' });
}