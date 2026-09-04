import type { APIRoute } from 'astro';
import { handleGeoflowV2Request } from '../../../../lib/geoflow/v2-handler.mjs';

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleGeoflowV2Request(request);
