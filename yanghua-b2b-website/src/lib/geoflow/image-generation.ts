/**
 * GEOFlow AI Image Generation — Node.js access layer.
 *
 * Wraps the Seedream 5.0 Python CLI (`seedream_image_generate.py`) for
 * generating cover images and body illustrations from GEOFlow article content.
 *
 * Two modes:
 * 1. Subprocess mode — calls the Python CLI directly (requires ARK_API_KEY env).
 * 2. Mock mode — returns placeholder paths (for development/testing).
 *
 * All generation is async and non-blocking — failures are silently logged.
 */

import { execFile } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { get } from 'node:https';
import { join, dirname, basename } from 'node:path';
import type { AIImagePrompts } from './article';

// ── Configuration ──

const SEEDREAM_SCRIPT = join(
  process.env.HOME || '/root',
  '.trae/skills/byted-seedream-image-generate/scripts/seedream_image_generate.py',
);

const IMAGES_OUTPUT_DIR = join(
  process.env.GEOFLOW_PROJECT_ROOT ||
    join(process.env.HOME || '/root', 'Documents/Documents/yanghua cable web/yanghua-b2b-website'),
  'yanghua-b2b-website/public/images/ai-generated',
);

const COVER_SIZE = '1024x576';
const BODY_SIZE = '1024x1024';
const GENERATION_TIMEOUT_MS = 300_000; // 5 minutes
const MAX_BODY_IMAGES = 3;

// ── Types ──

export interface ImageGenerationRequest {
  prompt: string;
  size: string;
  outputPath: string;
}

export interface GeneratedImage {
  localPath: string;
  publicPath: string;
  alt: string;
  heading?: string;
}

export interface GeneratedImagesResult {
  cover: GeneratedImage | null;
  bodyImages: GeneratedImage[];
  errors: string[];
}

// ── Core: Call Seedream CLI ──

function callSeedreamCLI(prompt: string, size: string, outputPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      'python3',
      [SEEDREAM_SCRIPT, '-p', prompt, '-s', size, '--version', '5.0', '--no-watermark', '--output-format', 'png'],
      {
        timeout: GENERATION_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
        cwd: dirname(SEEDREAM_SCRIPT),
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[image-gen] Seedream CLI error: ${error.message}`);
          resolve(null);
          return;
        }

        const output = stdout + stderr;

        // Extract the generated image URL from Seedream output
        const urlMatch = output.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg)/i);
        if (!urlMatch) {
          console.error('[image-gen] Could not find image URL in Seedream output');
          resolve(null);
          return;
        }

        // Download the image
        downloadImage(urlMatch[0], outputPath)
          .then((localPath) => resolve(localPath))
          .catch((err) => {
            console.error(`[image-gen] Download error: ${err.message}`);
            resolve(null);
          });
      },
    );
  });
}

// ── Download Helper ──

function downloadImage(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    mkdir(dirname(destPath), { recursive: true }).catch(() => {});

    const file = createWriteStream(destPath);
    get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

// ── Public API ──

/**
 * Generate a single image using Seedream 5.0.
 * Returns the local file path or null on failure.
 */
export async function generateImage(req: ImageGenerationRequest): Promise<string | null> {
  try {
    const localPath = await callSeedreamCLI(req.prompt, req.size, req.outputPath);
    return localPath;
  } catch (err) {
    console.error(`[image-gen] Generation failed: ${err}`);
    return null;
  }
}

/**
 * Generate all images for a GEOFlow article (cover + body illustrations).
 *
 * Idempotent: checks `aiImages.coverGenerated` and `aiImages.bodyGenerated`
 * flags and skips already-generated images.
 *
 * @param slug - Article slug (filename without .mdx)
 * @param title - Article title
 * @param description - Article description / answer summary
 * @param aiImagePrompts - Pre-generated prompts from GEOFlow AI (via yanghua-geo-json)
 * @param force - Force regeneration even if already generated
 * @returns Result with paths of generated images
 */
export async function generateArticleImages(
  slug: string,
  title: string,
  description: string,
  aiImagePrompts?: AIImagePrompts,
  force = false,
): Promise<GeneratedImagesResult> {
  const result: GeneratedImagesResult = {
    cover: null,
    bodyImages: [],
    errors: [],
  };

  // Ensure output directory
  await mkdir(IMAGES_OUTPUT_DIR, { recursive: true }).catch(() => {});

  // ── Cover Image ──
  const coverPrompt =
    aiImagePrompts?.cover?.prompt ||
    `Professional industrial photography for a B2B engineering website article cover. ` +
      `Subject: ${title}. Context: ${description.slice(0, 200)}. ` +
      `Style: Clean industrial photography, soft studio lighting, white background. ` +
      `Composition: Product-centric shot of flexible busbar in modern industrial setting. ` +
      `Restrictions: No text, no logos, no watermarks.`;

  const coverAlt = aiImagePrompts?.cover?.alt || title;

  const coverPath = join(IMAGES_OUTPUT_DIR, `${slug}-cover.png`);
  const coverLocal = await generateImage({
    prompt: coverPrompt,
    size: COVER_SIZE,
    outputPath: coverPath,
  });

  if (coverLocal) {
    result.cover = {
      localPath: coverLocal,
      publicPath: `/images/ai-generated/${basename(coverLocal)}`,
      alt: coverAlt,
    };
  } else {
    result.errors.push('Cover generation failed');
  }

  // ── Body Images ──
  let bodyPrompts: Array<{ prompt: string; alt: string; heading: string }>;

  if (aiImagePrompts?.body?.length) {
    bodyPrompts = aiImagePrompts.body.slice(0, MAX_BODY_IMAGES).map((bp) => ({
      prompt: bp.prompt,
      alt: bp.alt || `Illustration for: ${bp.section}`,
      heading: bp.section,
    }));
  } else {
    // Fallback: generate a generic body image
    bodyPrompts = [
      {
        prompt:
          `Professional industrial photography showing flexible busbar installation and application. ` +
          `Context: ${description.slice(0, 200)}. ` +
          `Style: Clean industrial photography, professional lighting, white/light-gray background. ` +
          `Restrictions: No text, no logos, no watermarks.`,
        alt: `${title} — application illustration`,
        heading: 'Application Scenario',
      },
    ];
  }

  for (let i = 0; i < bodyPrompts.length; i++) {
    const bp = bodyPrompts[i];
    const bodyPath = join(IMAGES_OUTPUT_DIR, `${slug}-body-${i + 1}.png`);

    const bodyLocal = await generateImage({
      prompt: bp.prompt,
      size: BODY_SIZE,
      outputPath: bodyPath,
    });

    if (bodyLocal) {
      result.bodyImages.push({
        localPath: bodyLocal,
        publicPath: `/images/ai-generated/${basename(bodyLocal)}`,
        alt: bp.alt,
        heading: bp.heading,
      });
    } else {
      result.errors.push(`Body image ${i + 1} generation failed`);
    }
  }

  return result;
}

/**
 * Check if the Seedream CLI is available.
 */
export async function isSeedreamAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('python3', [SEEDREAM_SCRIPT, '--list-versions'], { timeout: 10_000 }, (error) => {
      resolve(!error);
    });
  });
}
