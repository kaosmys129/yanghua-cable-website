#!/usr/bin/env tsx

import { getAllArticles } from '../src/lib/strapi-client';

async function getSlugs() {
  try {
    const articles = await getAllArticles();
    const slugs = articles.data.map(article => article.slug);
    console.log(JSON.stringify(slugs, null, 2));
  } catch (error) {
    console.error("Failed to get article slugs:", error);
    process.exit(1);
  }
}

getSlugs();