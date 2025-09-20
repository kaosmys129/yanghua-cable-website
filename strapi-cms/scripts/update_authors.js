const fs = require('fs');
const path = require('path');

// Read the processed_articles.json file
const filePath = path.join(__dirname, '../data/processed_articles.json');
const articlesData = fs.readFileSync(filePath, 'utf8');

// Parse the JSON
let data;
try {
  data = JSON.parse(articlesData);
} catch (error) {
  console.error('Error parsing JSON:', error);
  process.exit(1);
}

// Check if data is an object with a data array
let articles;
if (data.data && Array.isArray(data.data)) {
  articles = data.data;
} else if (Array.isArray(data)) {
  articles = data;
} else {
  console.error('Unexpected JSON structure. Expected an array or object with data array.');
  process.exit(1);
}

// Update all articles' author fields
let updatedCount = 0;
articles.forEach((article, index) => {
  if (article.author) {
    // Update the author fields
    article.author.name = "David Doe";
    article.author.email = "daviddoe@strapi.io";
    updatedCount++;
    console.log(`Updated author for article ${index + 1}: ${article.title || 'Untitled'}`);
  } else {
    console.log(`Article ${index + 1} has no author field: ${article.title || 'Untitled'}`);
  }
});

// Write the updated data back to the file
// Preserve the original structure
if (data.data && Array.isArray(data.data)) {
  data.data = articles;
} else {
  data = articles;
}
const updatedData = JSON.stringify(data, null, 2);
fs.writeFileSync(filePath, updatedData, 'utf8');

console.log(`\nUpdated ${updatedCount} articles with new author information.`);
console.log('Author fields updated to: name="David Doe", email="daviddoe@strapi.io"');