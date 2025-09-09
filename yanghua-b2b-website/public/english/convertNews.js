const fs = require('fs');
const path = require('path');

// Read Markdown file
const mdPath = path.join(__dirname, 'yanghuasti_news_formatted.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Optimized regular expression
const articleRegex = /## Article (\d+):([\s\S]*?)\*\*Date:\*\* (\d{4}-\d{2}-\d{2})[\s\S]*?\*\*URL:\*\* (https?:\/\/[^\s]+)[\s\S]*?### Content:\n\n([\s\S]*?)(?=\n---|## Article|$)/g;

const articles = [];
let match;

while ((match = articleRegex.exec(mdContent)) !== null) {
  // Add detailed logs after regex matching
  if (match) {
    console.log('Match details:', {
      title: match[2]?.trim()?.substring(0, 50),
      date: match[3],
      URL: match[4],
      contentLength: match[5]?.length
    });
  }
  articles.push({
    title: match[2].trim(),
    date: match[3],
    url: match[4],
    content: match[5].trim()
  });
}

// Conversion processing... (keep previous conversion logic unchanged)