const axios = require('axios');
const fs = require('fs').promises;
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

async function verifyUpload() {
  try {
    console.log('🔍 Starting verification process...');

    // 1. Read the upload report
    console.log('📄 Reading upload report...');
    const reportPath = '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/strapi-cms/data/upload_all_articles_report.json';
    const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    const reportSummary = reportData.summary;

    console.log('\n--- Upload Report Summary ---');
    console.log(`Total Articles in JSON: ${reportSummary.totalArticles}`);
    console.log(`Successfully Uploaded: ${reportSummary.successfulUploads}`);
    console.log(`Failed Uploads: ${reportSummary.failedUploads}`);
    console.log('---------------------------\n');

    // 2. Count articles currently in Strapi
    console.log('🔄 Counting articles in Strapi...');
    const strapiArticlesResponse = await strapi.get('/articles?pagination[pageSize]=1');
    const totalArticlesInStrapi = strapiArticlesResponse.data.meta.pagination.total;
    console.log(`Total Articles in Strapi: ${totalArticlesInStrapi}`);

    // 3. Compare and conclude
    console.log('\n--- Verification Result ---');
    if (reportSummary.totalArticles === totalArticlesInStrapi) {
      console.log('✅ SUCCESS: The number of articles in Strapi matches the total number of articles processed.');
    } else {
      console.log('❌ FAILURE: Mismatch in article count.');
      console.log(`- Expected (from JSON): ${reportSummary.totalArticles}`);
      console.log(`- Found (in Strapi): ${totalArticlesInStrapi}`);
    }
    console.log('---------------------------\n');

  } catch (error) {
    console.error('❌ An error occurred during verification:', error.message);
    if (error.code === 'ENOENT') {
        console.error('Could not find the report file. Please ensure the upload script has been run successfully.');
    }
    process.exit(1);
  }
}

verifyUpload();