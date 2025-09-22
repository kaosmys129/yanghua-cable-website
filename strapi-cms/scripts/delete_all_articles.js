const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.local'), 
  override: true 
});

const STRAPI_URL = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is not defined. Please check your .env.local file.');
  process.exit(1);
}

// Strapi client
const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function deleteAllArticles() {
  try {
    console.log('🗑️  Starting deletion process...');

    // 1. Fetch all articles to get their IDs
    console.log('🔍 Fetching all articles...');
    let allArticles = [];
    let page = 1;
    let pageCount = 1;

    do {
      const response = await strapi.get(`/articles?pagination[page]=${page}&pagination[pageSize]=100&fields[0]=id`);
      allArticles = allArticles.concat(response.data.data);
      pageCount = response.data.meta.pagination.pageCount;
      console.log(`- Fetched page ${page}/${pageCount}`);
      page++;
    } while (page <= pageCount);

    const totalArticles = allArticles.length;
    if (totalArticles === 0) {
      console.log('✅ No articles found to delete.');
      return;
    }

    console.log(`🔥 Found ${totalArticles} articles to delete.`);

    // 2. Delete all articles
    const deletePromises = allArticles.map(article => 
      strapi.delete(`/articles/${article.id}`)
    );

    await Promise.all(deletePromises);

    console.log(`✅ Successfully deleted ${totalArticles} articles.`);

  } catch (error) {
    console.error('❌ An error occurred during the deletion process:', error.response?.data || error.message);
    process.exit(1);
  }
}

deleteAllArticles();